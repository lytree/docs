/**
 * Vue equivalents of fumadocs-ui MDX components.
 * Registered globally through the jsx-runtime adapter (`setMDXComponents`),
 * so `.mdx` content can use them without imports — same as fumadocs.
 */
import { defineComponent, ref, h, Fragment, type VNode, type PropType } from 'vue'
import { RouterLink } from 'vue-router'
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
// Code block (pre) — title + copy button
// ---------------------------------------------------------------------------

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

    return () => {
      const dataTitle = (attrs as Record<string, unknown>)['data-title'] as string | undefined
      const firstChild = flattenChildren(slots.default?.())[0]
      const codeProps = (firstChild?.props ?? {}) as Record<string, unknown>
      const lang =
        ((codeProps.class as string) ?? '').match(/language-([\w-]+)/)?.[1] ?? ''

      return (
        <div class={s.codeblock}>
          {(dataTitle || lang) && (
            <div class={s.codeblockHead}>
              <span class={s.codeblockLang}>{dataTitle ?? lang}</span>
              <button type="button" class={s.codeblockCopy} onClick={copy}>
                {copied.value ? '✓ 已复制' : '复制'}
              </button>
            </div>
          )}
          <div class={s.codeblockBody}>{slots.default?.()}</div>
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
  props: { value: String, label: String },
})

export const Tabs = defineComponent({
  name: 'FdTabs',
  setup(props, { slots }) {
    const active = ref(0)
    return () => {
      const tabVnodes = flattenChildren(slots.default?.())
      const labels = props.items ?? tabVnodes.map((v) => (v.props?.value as string) ?? '')
      const current = tabVnodes[active.value]
      return (
        <div class={s.tabs}>
          <div class={s.tabsBar} role="tablist">
            {labels.map((label, i) => (
              <button
                type="button"
                key={`${label}-${i}`}
                role="tab"
                aria-selected={i === active.value}
                class={[s.tab, i === active.value && s.tabActive]}
                onClick={() => (active.value = i)}
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
  props: { items: Array as PropType<string[]> },
})

// ---------------------------------------------------------------------------
// Accordion
// ---------------------------------------------------------------------------

export const AccordionItem = defineComponent({
  name: 'FdAccordionItem',
  setup(_props, { slots }) {
    return () => renderChildren(slots.default?.())
  },
  props: { title: String, value: String },
})

export const Accordion = defineComponent({
  name: 'FdAccordion',
  setup(_props, { slots }) {
    const open = ref<number | null>(null)
    return () => {
      const items = flattenChildren(slots.default?.()).filter((v) =>
        isVnodeType(v, AccordionItem),
      )
      return (
        <div class={s.accordion}>
          {items.map((item, i) => {
            const expanded = open.value === i
            return (
              <div key={i} class={[s.accordionItem, expanded && s.accordionItemOpen]}>
                <button
                  type="button"
                  class={s.accordionHead}
                  aria-expanded={expanded}
                  onClick={() => (open.value = expanded ? null : i)}
                >
                  <span>{(item.props?.title as string) ?? `Item ${i + 1}`}</span>
                  <span class={s.accordionIcon}>{expanded ? '−' : '+'}</span>
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
// registry
// ---------------------------------------------------------------------------

export const mdxComponents: Record<string, unknown> = {
  a: Link,
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
}

export default mdxComponents