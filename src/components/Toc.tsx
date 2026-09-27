import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
  computed,
} from 'vue'
import { useRoute } from 'vue-router'
import type { TocItem } from '../lib/Source'
import s from './Toc.module.scss'

const POPOVER_BREAKPOINT = 1280

function useIsDesktop(): { value: import('vue').Ref<boolean> } {
  const value = ref(
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia(`(min-width: ${POPOVER_BREAKPOINT}px)`).matches
      : true,
  )
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia(`(min-width: ${POPOVER_BREAKPOINT}px)`)
    const onChange = () => (value.value = mq.matches)
    mq.addEventListener('change', onChange)
    onUnmounted(() => mq.removeEventListener('change', onChange))
  }
  return { value: value as import('vue').Ref<boolean> }
}

export const Toc = defineComponent({
  name: 'FdToc',
  props: { toc: { type: Array as () => TocItem[], required: true }, path: String },
  setup(props) {
    const route = useRoute()
    const activeId = ref('')
    const popoverOpen = ref(false)
    const isDesktop = useIsDesktop().value

    const activeTitle = computed(
      () => props.toc.find((i) => i.url === activeId.value)?.title ?? '本页目录',
    )

    let observer: IntersectionObserver | null = null

    const observe = () => {
      observer?.disconnect()
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          if (visible[0]) activeId.value = `#${visible[0].target.id}`
        },
        { rootMargin: '-80px 0px -65% 0px' },
      )
      for (const item of props.toc) {
        const el = document.getElementById(item.url.slice(1))
        if (el) observer.observe(el)
      }
    }

    onMounted(observe)
    watch(
      () => props.path,
      () => {
        activeId.value = ''
        popoverOpen.value = false
        requestAnimationFrame(observe)
      },
    )
    watch(isDesktop, () => {
      // closing the popover when crossing to desktop avoids stale open state
      popoverOpen.value = false
    })
    onUnmounted(() => observer?.disconnect())

    const onPopoverKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && popoverOpen.value) {
        e.preventDefault()
        popoverOpen.value = false
      }
    }
    onMounted(() => window.addEventListener('keydown', onPopoverKey))
    onUnmounted(() => window.removeEventListener('keydown', onPopoverKey))

    type AnchorClick = (e: MouseEvent) => void

    const renderLinks = (onItemClick?: AnchorClick) =>
      props.toc.length === 0 ? (
        <p class={s.empty}>暂无章节</p>
      ) : (
        <nav class={s.nav} aria-label="On this page">
          {props.toc.map((item) => {
            const itemClick: ((e: MouseEvent) => void) | undefined = onItemClick
            return (
              <a
                key={item.url}
                href={item.url}
                class={[
                  s.link,
                  item.depth >= 3 && s.linkL3,
                  activeId.value === item.url && s.linkActive,
                ]}
                onClick={itemClick as never}
              >
                {item.title}
              </a>
            )
          })}
        </nav>
      )

    return () => {
      if (!props.toc.length) return null

      // desktop: sticky right column
      if (isDesktop.value) {
        return (
          <div class={s.toc}>
            <p class={s.title}>本页目录</p>
            {renderLinks()}
          </div>
        )
      }

      // mobile / tablet: popover trigger + collapsible panel
      const onItemClick = (e: MouseEvent) => {
        // only intercept plain primary clicks (let modifier/new-tab gestures through)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
          return
        }
        e.stopPropagation()
        popoverOpen.value = false
      }

      return (
        <div class={s.popover}>
          <button
            type="button"
            class={[s.popoverTrigger, popoverOpen.value && s.popoverTriggerOpen]}
            onClick={() => (popoverOpen.value = !popoverOpen.value)}
            aria-expanded={popoverOpen.value}
            aria-controls="fd-toc-popover"
          >
            <span class={s.popoverLabel}>本页目录</span>
            <span class={s.popoverActive}>{activeTitle.value}</span>
            <span class={[s.popoverChevron, popoverOpen.value && s.popoverChevronOpen]}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>

          {popoverOpen.value && (
            <div class={s.popoverPanel} id="fd-toc-popover">
              {renderLinks(onItemClick)}
            </div>
          )}
        </div>
      )
    }
  },
})