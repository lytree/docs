import { defineComponent, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { sidebarRoot, type PageTreeNode } from '../lib/Source'
import s from './Sidebar.module.scss'

const TreeItem = defineComponent({
  name: 'FdTreeItem',
  props: { node: { type: Object as () => PageTreeNode, required: true }, depth: Number },
  setup(props) {
    const route = useRoute()
    const open = ref(props.node.defaultOpen ?? (props.depth ?? 0) === 0)

    const isActive = (url?: string) => url === route.path
    const containsActive = (n: PageTreeNode): boolean => {
      if (n.type === 'page') return isActive(n.url)
      if (n.type === 'folder') return (n.children ?? []).some(containsActive)
      return false
    }

    return () => {
      const node = props.node

      if (node.type === 'separator') {
        return node.name ? (
          <p class={s.treeSepLabel}>{node.name}</p>
        ) : (
          <hr class={s.treeSep} />
        )
      }

      if (node.type === 'folder') {
        const expanded = open.value || containsActive(node)
        return (
          <div>
            <button class={s.treeBtn} onClick={() => (open.value = !open.value)}>
              {node.icon && <span class={s.treeIcon}>{node.icon}</span>}
              {node.title ?? node.name}
              <span class={s.treeCaret}>{expanded ? '▾' : '▸'}</span>
            </button>
            {expanded && (
              <div class={s.treeChildren}>
                {(node.children ?? []).map((child) => (
                  <TreeItem key={child.name} node={child} depth={(props.depth ?? 0) + 1} />
                ))}
              </div>
            )}
          </div>
        )
      }

      return (
        <a
          href={node.url}
          class={[s.treeLink, isActive(node.url) && s.treeLinkActive]}
        >
          {node.icon && <span class={s.treeIcon}>{node.icon}</span>}
          {node.title ?? node.name}
        </a>
      )
    }
  },
})

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
    const nodes = computed(() => sidebarRoot(slug.value ?? ''))
    // if sidebar root is a single root-folder, render its children at top level
    const top = computed(() =>
      nodes.value.length === 1 && nodes.value[0].type === 'folder'
        ? (nodes.value[0].children ?? [])
        : nodes.value,
    )

    return () => (
      <nav class={s.tree}>
        {top.value.map((node) => (
          <TreeItem key={node.name} node={node} depth={0} />
        ))}
      </nav>
    )
  },
})
