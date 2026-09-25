import { defineComponent, ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { sidebarRoot, type PageTreeNode } from '../lib/Source'
import s from './Sidebar.module.scss'

interface Props {
  node: PageTreeNode
  depth?: number
  /** paths that should be auto-expanded (set by Sidebar root from current route) */
  openSet: Set<string>
}

const TreeItem = defineComponent({
  name: 'FdTreeItem',
  props: {
    node: { type: Object as () => PageTreeNode, required: true },
    depth: { type: Number, default: 0 },
    openSet: { type: Object as () => Set<string>, required: true },
  },
  setup(props) {
    const route = useRoute()
    // user-controlled open state (collapsed/expanded)
    const userOpen = ref<boolean | null>(null)

    const isActive = (url?: string) => url !== undefined && url === route.path
    const containsActive = (n: PageTreeNode): boolean => {
      if (n.type === 'page') return isActive(n.url)
      if (n.type === 'folder') return (n.children ?? []).some(containsActive)
      return false
    }

    // root folders (depth 0) and folders containing the active page are always open
    const autoExpanded = props.depth === 0 || containsActive(props.node)
    const isOpen = computed(() => {
      if (userOpen.value !== null) return userOpen.value
      return props.openSet.has(props.node.url ?? props.node.name) || autoExpanded || (props.node.defaultOpen ?? false)
    })

    const toggle = () => {
      userOpen.value = !isOpen.value
    }

    return () => {
      const node = props.node

      if (node.type === 'separator') {
        return node.name ? (
          <p class={s.sepLabel}>{node.name}</p>
        ) : (
          <hr class={s.sep} />
        )
      }

      if (node.type === 'folder') {
        const open = isOpen.value
        return (
          <div class={s.folder}>
            <button
              type="button"
              class={[s.folderBtn, open && s.folderBtnOpen]}
              onClick={toggle}
              aria-expanded={open}
            >
              <span class={[s.caret, open && s.caretOpen]}>
                <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M3 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
              {node.icon && <span class={s.icon}>{node.icon}</span>}
              <span class={s.label}>{node.title ?? node.name}</span>
            </button>
            {open && (
              <div class={s.children}>
                {(node.children ?? []).map((child) => (
                  <TreeItem
                    key={child.url ?? child.name}
                    node={child}
                    depth={(props.depth ?? 0) + 1}
                    openSet={props.openSet}
                  />
                ))}
              </div>
            )}
          </div>
        )
      }

      // page
      const active = isActive(node.url)
      return (
        <RouterLink
          to={node.url ?? '#'}
          class={[s.link, active && s.linkActive]}
          aria-current={active ? 'page' : undefined}
        >
          <span class={s.caretPlaceholder} />
          {node.icon && <span class={s.icon}>{node.icon}</span>}
          <span class={s.label}>{node.title ?? node.name}</span>
        </RouterLink>
      )
    }
  },
})

/** Build the set of folder URLs whose ancestor chain contains the current route. */
function buildOpenSet(nodes: PageTreeNode[], currentUrl: string): Set<string> {
  const set = new Set<string>()
  const walk = (list: PageTreeNode[]): boolean => {
    for (const n of list) {
      if (n.type === 'folder') {
        if (n.url) set.add(n.url)
        if (n.children && walk(n.children)) {
          if (n.url) set.add(n.url)
          return true
        }
      } else if (n.type === 'page') {
        if (n.url === currentUrl) return true
      }
    }
    return false
  }
  walk(nodes)
  return set
}

export const Sidebar = defineComponent({
  name: 'FdSidebar',
  setup() {
    const route = useRoute()

    const slug = computed(() =>
      route.path.startsWith('/docs/')
        ? route.path.slice('/docs/'.length).replace(/\/$/, '')
        : route.path === '/docs'
          ? ''
          : null,
    )

    // top-level root folders (always rendered at the sidebar top — fumadocs style)
    const rootFolders = computed(() => {
      const nodes = sidebarRoot(slug.value ?? '')
      if (nodes.length === 1 && nodes[0].type === 'folder') {
        return nodes[0].children ?? []
      }
      return nodes
    })

    const currentUrl = computed(() => `/docs${slug.value ? `/${slug.value}` : ''}`)

    const openSet = computed(() => buildOpenSet(rootFolders.value, currentUrl.value))

    return () => (
      <nav class={s.sidebar} aria-label="文档导航">
        {rootFolders.value.length === 0 ? (
          <p class={s.empty}>暂无目录</p>
        ) : (
          rootFolders.value.map((node) => (
            <TreeItem
              key={node.url ?? node.name}
              node={node}
              depth={0}
              openSet={openSet.value}
            />
          ))
        )}
      </nav>
    )
  },
})
