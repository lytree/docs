import { defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import type { TocItem } from '../lib/Source'
import s from './Toc.module.scss'

export const Toc = defineComponent({
  name: 'FdToc',
  props: { toc: { type: Array as () => TocItem[], required: true }, path: String },
  setup(props) {
    const activeId = ref('')
    let observer: IntersectionObserver | null = null

    const observe = () => {
      observer?.disconnect()
      observer = new IntersectionObserver(
        (entries) => {
          // pick the first entry that's currently visible
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible[0]) {
            activeId.value = `#${visible[0].target.id}`
          }
        },
        { rootMargin: '-80px 0px -65% 0px' },
      )
      for (const item of props.toc) {
        const el = document.getElementById(item.url.slice(1))
        if (el) observer.observe(el)
      }
    }

    onMounted(observe)
    // re-bind when the route (toc contents) changes
    watch(
      () => props.path,
      () => {
        activeId.value = ''
        // wait for next frame so MDX content is rendered
        requestAnimationFrame(observe)
      },
    )
    onUnmounted(() => observer?.disconnect())

    return () => (
      <div class={s.toc}>
        <p class={s.title}>本页目录</p>
        {props.toc.length === 0 ? (
          <p class={s.empty}>暂无章节</p>
        ) : (
          <nav class={s.nav} aria-label="On this page">
            {props.toc.map((item) => (
              <a
                key={item.url}
                href={item.url}
                class={[
                  s.link,
                  item.depth >= 3 && s.linkL3,
                  activeId.value === item.url && s.linkActive,
                ]}
              >
                {item.title}
              </a>
            ))}
          </nav>
        )}
      </div>
    )
  },
})