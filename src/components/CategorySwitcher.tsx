import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { rootFoldersOf } from '../lib/Source'
import s from './CategorySwitcher.module.scss'

/**
 * 分类切换下拉框 —— 顶栏的 root folder 标签搬到了侧边栏顶部。
 * 一击即跳到对应分类的首页，侧边栏树随之切换。
 */
export const CategorySwitcher = defineComponent({
  name: 'FdCategorySwitcher',
  emits: ['navigate'],
  setup(_props, { emit }) {
    const route = useRoute()
    const open = ref(false)
    const wrapRef = ref<HTMLElement | null>(null)

    const slug = computed(() =>
      route.path.startsWith('/docs/')
        ? route.path.slice('/docs/'.length).replace(/\/$/, '')
        : route.path === '/docs'
          ? ''
          : '',
    )

    const state = computed(() => rootFoldersOf(slug.value))
    const folders = computed(() => state.value.folders)
    const active = computed(() => state.value.active)

    const onDocPointer = (e: MouseEvent) => {
      if (!open.value) return
      if (wrapRef.value && e.target instanceof Node && wrapRef.value.contains(e.target)) return
      open.value = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') open.value = false
    }

    onMounted(() => {
      document.addEventListener('click', onDocPointer)
      document.addEventListener('keydown', onKey)
    })
    onUnmounted(() => {
      document.removeEventListener('click', onDocPointer)
      document.removeEventListener('keydown', onKey)
    })

    const pick = () => {
      open.value = false
      emit('navigate')
    }

    return () => {
      if (folders.value.length === 0) return null

      return (
        <div class={s.switcher} ref={wrapRef}>
          <button
            type="button"
            class={s.trigger}
            onClick={() => (open.value = !open.value)}
            aria-haspopup="listbox"
            aria-expanded={open.value}
            aria-label="切换文档分类"
          >
            <span class={s.triggerIcon}>{active.value?.icon ?? '📚'}</span>
            <span class={s.triggerLabel}>{active.value?.title ?? '选择分类'}</span>
            <span class={[s.chevron, open.value && s.chevronOpen]}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </button>

          {open.value && (
            <ul class={s.menu} role="listbox" aria-label="文档分类">
              {folders.value.map(({ node: f, href }) => (
                <li key={f.name}>
                  <RouterLink
                    to={href}
                    role="option"
                    aria-selected={f.name === active.value?.name}
                    class={[s.item, f.name === active.value?.name && s.itemActive]}
                    onClick={pick}
                  >
                    <span class={s.itemIcon}>{f.icon ?? '📄'}</span>
                    <span class={s.itemText}>
                      <span class={s.itemTitle}>{f.title ?? f.name}</span>
                      {f.description && <span class={s.itemDesc}>{f.description}</span>}
                    </span>
                    {f.name === active.value?.name && (
                      <svg
                        class={s.check}
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </RouterLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )
    }
  },
})

export default CategorySwitcher