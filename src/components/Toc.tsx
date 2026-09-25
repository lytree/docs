import { defineComponent, onMounted, onUnmounted, ref } from 'vue'
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
          for (const e of entries) {
            if (e.isIntersecting) activeId.value = `#${e.target.id}`
          }
        },
        { rootMargin: '-80px 0px -70% 0px' },
      )
      for (const item of props.toc) {
        const el = document.getElementById(item.url.slice(1))
        if (el) observer.observe(el)
      }
    }

    onMounted(observe)
    onUnmounted(() => observer?.disconnect())

    return () => (
      <div class={s.toc}>
        <p class={s.tocTitle}>本页目录</p>
        <nav class={s.tocNav}>
          {props.toc.map((item) => (
            <a
              key={item.url}
              href={item.url}
              class={[
                s.tocLink,
                item.depth === 3 && s.tocLinkL3,
                activeId.value === item.url && s.tocLinkActive,
              ]}
            >
              {item.title}
            </a>
          ))}
        </nav>
      </div>
    )
  },
})
