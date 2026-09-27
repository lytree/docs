/**
 * Vue equivalents of fumadocs-ui MDX components.
 * Registered globally through the jsx-runtime adapter (`setMDXComponents`),
 * so `.mdx` content can use them without imports — same as fumadocs.
 */
import {
  defineComponent,
  ref,
  h,
  Fragment,
  computed,
  onMounted,
  onUnmounted,
  watch,
  Teleport,
  type VNode,
  type PropType,
} from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import type { TocItem } from '../lib/Source'
import s from './MdxComponents.module.scss'

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function flattenChildren(children: unknown): VNode[] {
  if (children == null) return []
  if (Array.isArray(children)) return children.flatMap(flattenChildren)
  if (typeof children === 'object' && 'type' in (children as VNode)) return [children as VNode]
  return []
}

function isVnodeType(v: VNode, comp: unknown): boolean {
  return v && v.type === comp
}

function renderChildren(children: unknown) {
  if (Array.isArray(children)) return h(Fragment, children as never)
  if (
    children &&
    typeof children === 'object' &&
    'default' in (children as Record<string, unknown>)
  ) {
    return h(Fragment, (children as { default: () => VNode[] }).default())
  }
  return children as never
}

function extractText(node: unknown): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object' && 'children' in (node as VNode))
    return extractText((node as VNode).children)
  return ''
}

/** extract component vnodes from a (possibly slot-wrapped) children payload */
function slotVnodes(raw: unknown): VNode[] {
  if (raw == null || typeof raw === 'boolean' || typeof raw === 'string') return []
  if (Array.isArray(raw)) return raw.flatMap(slotVnodes)
  const obj = raw as Record<string, unknown>
  if (typeof obj.default === 'function') return slotVnodes(obj.default())
  if ('type' in obj) return [obj as unknown as VNode]
  return []
}

// ---------------------------------------------------------------------------
// Link — internal links go through the router
// ---------------------------------------------------------------------------

export const Link = defineComponent({
  name: 'FdLink',
  setup(props, { slots }) {
    return () => {
      const href = props.href ?? ''
      const internal = href.startsWith('/') && !href.startsWith('//')
      if (internal) {
        return h(RouterLink, { to: href }, { default: () => slots.default?.() })
      }
      return h('a', { href, target: '_blank', rel: 'noreferrer' }, slots.default?.())
    }
  },
  props: { href: String },
})

// ---------------------------------------------------------------------------
// Heading with anchor
// ---------------------------------------------------------------------------

export function makeHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Tag = `h${level}`
  return defineComponent({
    name: `FdH${level}`,
    inheritAttrs: false,
    setup(_props, { slots, attrs }) {
      return () => {
        const id = (attrs.id as string) ?? ''
        return h(
          Tag,
          { class: 'fd-heading', ...attrs },
          {
            default: () => [
              ...flattenChildren(slots.default?.()).map((v) => v),
              id
                ? h('a', { href: `#${id}`, class: 'fd-anchor', 'aria-label': 'Anchor' }, '#')
                : null,
            ],
          },
        )
      }
    },
  })
}

// ---------------------------------------------------------------------------
// Code block (pre) — fumadocs-style: title bar + icon copy button
// ---------------------------------------------------------------------------

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
)

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

const IconFile = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
  </svg>
)

export const Pre = defineComponent({
  name: 'FdPre',
  inheritAttrs: false,
  setup(_props, { slots, attrs }) {
    const copied = ref(false)

    const copy = async () => {
      const text = extractText(flattenChildren(slots.default?.()))
      try {
        await navigator.clipboard.writeText(text)
        copied.value = true
        setTimeout(() => (copied.value = false), 1500)
      } catch {
        /* clipboard unavailable */
      }
    }

    const CopyBtn = (extraClass: string) => (
      <button
        type="button"
        class={[s.codeblockCopy, extraClass]}
        onClick={copy}
        aria-label={copied.value ? '已复制' : '复制代码'}
        title={copied.value ? '已复制' : '复制代码'}
      >
        {copied.value ? <IconCheck /> : <IconCopy />}
      </button>
    )

    return () => {
      const attrMap = attrs as Record<string, unknown>
      const dataTitle = (attrMap['data-title'] ?? attrMap.title) as string | undefined
      const firstChild = flattenChildren(slots.default?.())[0]
      const codeProps = (firstChild?.props ?? {}) as Record<string, unknown>
      const lang =
        ((codeProps.class as string) ?? '').match(/language-([\w-]+)/)?.[1] ?? ''
      const header = dataTitle ?? lang

      return (
        <div class={s.codeblock}>
          {header && (
            <div class={s.codeblockHead}>
              <span class={s.codeblockTitle}>
                {dataTitle ? <IconFile /> : null}
                <span>{header}</span>
              </span>
              {CopyBtn('')}
            </div>
          )}
          <div class={s.codeblockBody}>
            {/* keep the original <pre> (shiki classes / CSS vars live here) */}
            <pre {...attrs}>{slots.default?.()}</pre>
            {!header && CopyBtn(s.codeblockFloatCopy)}
          </div>
        </div>
      )
    }
  },
})

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

const CALLOUT_TITLE: Record<string, string> = {
  info: 'Info',
  note: 'Note',
  tip: 'Tip',
  warn: 'Warning',
  warning: 'Warning',
  error: 'Error',
  danger: 'Danger',
}

const CALLOUT_ICON: Record<string, string> = {
  info: 'ℹ',
  note: '📝',
  tip: '💡',
  warn: '⚠',
  warning: '⚠',
  error: '✕',
  danger: '✕',
}

export const Callout = defineComponent({
  name: 'FdCallout',
  setup(props, { slots }) {
    return () => (
      <div class={[s.callout, s[`callout_${props.type}`] ?? s.callout_info]}>
        <p class={s.calloutTitle}>
          <span class={s.calloutIcon}>{props.icon ?? CALLOUT_ICON[props.type] ?? 'ℹ'}</span>
          <span>{props.title ?? CALLOUT_TITLE[props.type] ?? props.type}</span>
        </p>
        <div class={s.calloutBody}>{renderChildren(slots.default?.())}</div>
      </div>
    )
  },
  props: {
    type: { type: String, default: 'info' },
    title: String,
    icon: String,
  },
})

// ---------------------------------------------------------------------------
// Cards / Card
// ---------------------------------------------------------------------------

export const Cards = defineComponent({
  name: 'FdCards',
  setup(_props, { slots }) {
    return () => <div class={s.cards}>{flattenChildren(slots.default?.())}</div>
  },
})

export const Card = defineComponent({
  name: 'FdCard',
  setup(props, { slots }) {
    return () => {
      const inner = (
        <div class={s.cardInner}>
          <p class={s.cardTitle}>
            {props.icon && <span class={s.cardIcon}>{props.icon}</span>}
            <span>{props.title}</span>
          </p>
          <div class={s.cardDesc}>{renderChildren(slots.default?.())}</div>
        </div>
      )
      return props.href ? (
        <RouterLink to={props.href} class={s.cardLink}>
          {inner}
        </RouterLink>
      ) : (
        <div class={s.cardStatic}>{inner}</div>
      )
    }
  },
  props: { title: String, description: String, icon: String, href: String },
})

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

export const Tab = defineComponent({
  name: 'FdTab',
  setup(_props, { slots }) {
    return () => renderChildren(slots.default?.())
  },
  props: { value: String, label: String, title: String },
})

export const Tabs = defineComponent({
  name: 'FdTabs',
  props: {
    items: Array as PropType<string[]>,
    /** persist active tab in the url query (?tab=value) — fumadocs default */
    persist: { type: Boolean, default: true },
    /** query param name, defaults to "tab" (use to disambiguate multiple tab groups) */
    id: String,
    /** initial active tab (label), ignored when the query param is present */
    default: String,
  },
  setup(props, { slots }) {
    const route = useRoute()
    const router = useRouter()
    const active = ref(0)

    const tabVnodes = computed(() => slotVnodes(slots.default?.()))
    const labels = computed(
      () =>
        props.items ??
        tabVnodes.value.map(
          (v) =>
            ((v.props?.title ?? v.props?.value ?? v.props?.label) as string | undefined) ?? '',
        ),
    )

    const param = computed(() => props.id ?? 'tab')

    const syncFromQuery = () => {
      if (!props.persist) return
      const q = route.query[param.value]
      if (typeof q === 'string' && q) {
        const i = labels.value.indexOf(q)
        if (i >= 0) active.value = i
      }
    }

    onMounted(() => {
      syncFromQuery()
      if (active.value === 0 && props.default) {
        const i = labels.value.indexOf(props.default)
        if (i > 0) active.value = i
      }
    })
    watch(() => route.query[param.value as never], syncFromQuery)

    const select = (i: number) => {
      active.value = i
      if (!props.persist) return
      const label = labels.value[i]
      const query: Record<string, string> = {}
      for (const [k, v] of Object.entries(route.query)) {
        if (typeof v === 'string') query[k] = v
      }
      if (label) query[param.value] = label
      else delete query[param.value]
      router.replace({ query })
    }

    return () => {
      const current = tabVnodes.value[active.value]
      return (
        <div class={s.tabs}>
          <div class={s.tabsBar} role="tablist">
            {labels.value.map((label, i) => (
              <button
                type="button"
                key={`${label}-${i}`}
                role="tab"
                aria-selected={i === active.value}
                class={[s.tab, i === active.value && s.tabActive]}
                onClick={() => select(i)}
              >
                {label}
              </button>
            ))}
          </div>
          <div class={s.tabsPanel} role="tabpanel">
            {current ? renderChildren(current.children) : null}
          </div>
        </div>
      )
    }
  },
})

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

export const AccordionItem = defineComponent({
  name: 'FdAccordionItem',
  setup(_props, { slots }) {
    return () => renderChildren(slots.default?.())
  },
  props: { title: String, value: String, id: String, defaultOpen: Boolean },
})

export const Accordion = defineComponent({
  name: 'FdAccordion',
  props: {
    /** 'single' (default) — one open at a time; 'multiple' — independent items */
    type: { type: String as PropType<'single' | 'multiple'>, default: 'single' },
  },
  setup(props, { slots }) {
    const singleOpen = ref<number | null>(null)
    // multiple mode: explicit per-item state; absent → defaultOpen
    const multiOpen = ref<Map<number, boolean>>(new Map())

    const isExpanded = (i: number, defaultOpen: boolean) => {
      if (props.type === 'multiple') {
        if (multiOpen.value.has(i)) return multiOpen.value.get(i) === true
        return defaultOpen
      }
      return singleOpen.value === i
    }

    const toggle = (i: number, defaultOpen: boolean) => {
      if (props.type === 'multiple') {
        const map = new Map(multiOpen.value)
        map.set(i, !isExpanded(i, defaultOpen))
        multiOpen.value = map
      } else {
        singleOpen.value = singleOpen.value === i ? null : i
      }
    }

    return () => {
      const items = flattenChildren(slots.default?.()).filter((v) =>
        isVnodeType(v, AccordionItem),
      )
      return (
        <div class={s.accordion}>
          {items.map((item, i) => {
            const defaultOpen = item.props?.defaultOpen === true
            const expanded = isExpanded(i, defaultOpen)
            const anchorId = (item.props?.id as string | undefined) ?? undefined
            return (
              <div
                key={i}
                id={anchorId}
                class={[s.accordionItem, expanded && s.accordionItemOpen]}
              >
                <button
                  type="button"
                  class={s.accordionHead}
                  aria-expanded={expanded}
                  onClick={() => toggle(i, defaultOpen)}
                >
                  <span>{(item.props?.title as string) ?? `Item ${i + 1}`}</span>
                  <span class={[s.accordionIcon, expanded && s.accordionIconOpen]}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </button>
                {expanded && <div class={s.accordionBody}>{renderChildren(item.children)}</div>}
              </div>
            )
          })}
        </div>
      )
    }
  },
})

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

export const Step = defineComponent({
  name: 'FdStep',
  setup(_props, { slots }) {
    return () => renderChildren(slots.default?.())
  },
  props: { title: String },
})

export const Steps = defineComponent({
  name: 'FdSteps',
  setup(_props, { slots }) {
    return () => {
      const items = flattenChildren(slots.default?.()).filter((v) => isVnodeType(v, Step))
      return (
        <div class={s.steps}>
          {items.map((item, i) => (
            <div key={i} class={s.step}>
              <span class={s.stepBadge}>{i + 1}</span>
              <div class={s.stepBody}>{renderChildren(item.children)}</div>
            </div>
          ))}
        </div>
      )
    }
  },
})

// ---------------------------------------------------------------------------
// FileTree — fumadocs "Files": <Files><Folder name><File name/></Folder></Files>
// ---------------------------------------------------------------------------

const IconFolder = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  </svg>
)

const IconCaret = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

interface TreeEntry {
  name: string
  folder: boolean
  defaultOpen: boolean
  children: TreeEntry[]
}

export const File = defineComponent({
  name: 'FdFile',
  props: { name: { type: String, required: true } },
  setup() {
    return () => null
  },
})

export const Folder = defineComponent({
  name: 'FdFolder',
  props: {
    name: { type: String, required: true },
    defaultOpen: { type: Boolean, default: true },
  },
  setup() {
    return () => null
  },
})

function toTree(vnodes: VNode[]): TreeEntry[] {
  const out: TreeEntry[] = []
  for (const v of vnodes) {
    if (!v || typeof v !== 'object' || !('type' in v)) continue
    const props = (v as VNode).props as Record<string, unknown> | null
    if (v.type === Folder) {
      out.push({
        name: (props?.name as string) ?? 'folder',
        folder: true,
        defaultOpen: props?.defaultOpen !== false,
        children: toTree(slotVnodes((v as VNode).children)),
      })
    } else if (v.type === File) {
      out.push({
        name: (props?.name as string) ?? 'file',
        folder: false,
        defaultOpen: false,
        children: [],
      })
    }
  }
  return out
}

export const Files = defineComponent({
  name: 'FdFiles',
  setup(_props, { slots }) {
    // explicit per-folder state (path -> open); absent → defaultOpen
    const state = ref<Map<string, boolean>>(new Map())

    const tree = computed(() => toTree(slotVnodes(slots.default?.())))

    const isOpen = (e: TreeEntry, path: string) =>
      state.value.has(path) ? state.value.get(path) === true : e.defaultOpen

    const toggle = (e: TreeEntry, path: string) => {
      const map = new Map(state.value)
      map.set(path, !isOpen(e, path))
      state.value = map
    }

    const renderTree = (entries: TreeEntry[], parentPath: string) =>
      entries.map((e) => {
        const path = parentPath ? `${parentPath}/${e.name}` : e.name
        if (!e.folder) {
          return (
            <div class={[s.treeRow, s.treeFile]} key={path}>
              <span class={s.treeCaretSpacer} />
              <span class={s.treeIcon}>
                <IconFile />
              </span>
              <span class={s.treeName}>{e.name}</span>
            </div>
          )
        }
        const open = isOpen(e, path)
        return (
          <div class={s.treeGroup} key={path}>
            <button
              type="button"
              class={[s.treeRow, s.treeFolder]}
              onClick={() => toggle(e, path)}
              aria-expanded={open}
            >
              <span class={[s.treeCaret, open && s.treeCaretOpen]}>
                <IconCaret />
              </span>
              <span class={s.treeIcon}>
                <IconFolder />
              </span>
              <span class={s.treeName}>{e.name}</span>
            </button>
            {open && <div class={s.treeChildren}>{renderTree(e.children, path)}</div>}
          </div>
        )
      })

    return () =>
      tree.value.length === 0 ? null : (
        <div class={s.tree} role="tree">
          {renderTree(tree.value, '')}
        </div>
      )
  },
})

// ---------------------------------------------------------------------------
// TypeTable — document props/types (fumadocs type-table)
// ---------------------------------------------------------------------------

interface TypeNode {
  type?: string
  description?: string
  typeDescription?: string
  typeDescriptionLink?: string
  default?: string
}

export const TypeTable = defineComponent({
  name: 'FdTypeTable',
  props: {
    type: { type: Object as PropType<Record<string, TypeNode | string>>, required: true },
  },
  setup(props) {
    const rows = computed(() =>
      Object.entries(props.type ?? {}).map(([name, v]) => ({
        name,
        ...(typeof v === 'string' ? { type: v } : v),
      })),
    )
    const hasDefault = computed(() => rows.value.some((r) => r.default != null))

    return () => (
      <div class={s.typeTableWrap}>
        <table class={s.typeTable}>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              {hasDefault.value && <th>Default</th>}
            </tr>
          </thead>
          <tbody>
            {rows.value.map((r) => (
              <tr key={r.name}>
                <td class={s.typeProp}>
                  <code>{r.name}</code>
                </td>
                <td>
                  {r.typeDescriptionLink ? (
                    <a class={s.typeLink} href={r.typeDescriptionLink} target="_blank" rel="noreferrer">
                      <code>{r.type}</code>
                    </a>
                  ) : (
                    <code>{r.type}</code>
                  )}
                  {r.typeDescription && (
                    <pre class={s.typeFull}>
                      <code>{r.typeDescription}</code>
                    </pre>
                  )}
                  {r.description && <p class={s.typeDesc}>{r.description}</p>}
                </td>
                {hasDefault.value && (
                  <td class={s.typeDefault}>
                    {r.default != null ? <code>{r.default}</code> : <span aria-hidden="true">—</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
})

// ---------------------------------------------------------------------------
// InlineToc — in-body table of contents (fumadocs inline-toc)
// ---------------------------------------------------------------------------

export const InlineToc = defineComponent({
  name: 'FdInlineToc',
  setup() {
    const route = useRoute()
    const toc = computed(() => {
      const meta = route.meta as { toc?: TocItem[] }
      return (meta.toc ?? []).filter((t) => t.depth >= 2 && t.depth <= 3)
    })
    return () =>
      toc.value.length === 0 ? null : (
        <div class={s.inlineToc}>
          <p class={s.inlineTocTitle}>On this page</p>
          <ul class={s.inlineTocList}>
            {toc.value.map((t) => (
              <li key={t.url} class={t.depth >= 3 ? s.inlineTocL3 : undefined}>
                <a href={t.url}>{t.title}</a>
              </li>
            ))}
          </ul>
        </div>
      )
  },
})

// ---------------------------------------------------------------------------
// ImageZoom — zoomable images (fumadocs image-zoom / medium-zoom style)
// ---------------------------------------------------------------------------

export const ImgZoom = defineComponent({
  name: 'FdImg',
  inheritAttrs: false,
  setup(_props, { attrs }) {
    const zoomed = ref(false)

    const open = () => {
      zoomed.value = true
    }
    const close = () => {
      zoomed.value = false
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && zoomed.value) {
        e.preventDefault()
        close()
      }
    }
    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))
    watch(zoomed, (v) => {
      document.body.style.overflow = v ? 'hidden' : ''
    })
    onUnmounted(() => {
      document.body.style.overflow = ''
    })

    return () => (
      <>
        <img
          {...attrs}
          class={[s.zoomImg, zoomed.value && s.zoomImgHidden]}
          onClick={open}
          aria-zoomable="true"
        />
        {zoomed.value && (
          <Teleport to="body">
            <div
              class={s.zoomOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="图片预览"
              onClick={close}
            >
              <img class={s.zoomOverlayImg} src={attrs.src as string} alt={(attrs.alt as string) ?? ''} />
            </div>
          </Teleport>
        )}
      </>
    )
  },
})

// ---------------------------------------------------------------------------
// registry
// ---------------------------------------------------------------------------

export const mdxComponents: Record<string, unknown> = {
  a: Link,
  img: ImgZoom,
  h1: makeHeading(1),
  h2: makeHeading(2),
  h3: makeHeading(3),
  h4: makeHeading(4),
  h5: makeHeading(5),
  h6: makeHeading(6),
  pre: Pre,
  Cards,
  Card,
  Tabs,
  Tab,
  Accordion,
  AccordionItem,
  Steps,
  Step,
  Callout,
  Files,
  File,
  Folder,
  TypeTable,
  InlineToc,
}

export default mdxComponents