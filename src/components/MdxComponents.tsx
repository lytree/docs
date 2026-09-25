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
                ? h('a', { href: `#${id}`, class: 'fd-anchor', 'aria-label': 'Link' }, '#')
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
          <div class={s.codeblockHead}>
            <span class={s.codeblockLang}>{dataTitle ?? lang}</span>
            <button class={s.codeblockCopy} onClick={copy}>
              {copied.value ? '✓ 已复制' : '复制'}
            </button>
          </div>
          <div>{slots.default?.()}</div>
        </div>
      )
    }
  },
})

// ---------------------------------------------------------------------------
// Callout
// ---------------------------------------------------------------------------

const CALLOUT_CLASS: Record<string, string> = {
  info: s.calloutInfo,
  note: s.calloutNote,
  tip: s.calloutTip,
  warn: s.calloutWarn,
  error: s.calloutError,
}

export const Callout = defineComponent({
  name: 'FdCallout',
  setup(props, { slots }) {
    return () => (
      <div class={[s.callout, CALLOUT_CLASS[props.type] ?? s.calloutInfo]}>
        <p class={s.calloutTitle}>{`${props.icon ?? 'ℹ️'} ${props.title ?? props.type}`}</p>
        <div class={s.calloutBody}>{renderChildren(slots.default?.())}</div>
      </div>
    )
  },
  props: { type: { type: String, default: 'info' }, title: String, icon: String },
})

// ---------------------------------------------------------------------------
// Cards
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
      const body = (
        <div class={s.card}>
          <p class={s.cardTitle}>{[props.icon ? `${props.icon} ` : '', props.title]}</p>
          <div class={s.cardDesc}>{renderChildren(slots.default?.())}</div>
        </div>
      )
      return props.href ? (
        <RouterLink to={props.href} style={{ display: 'contents' }}>
          {body}
        </RouterLink>
      ) : (
        body
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
  props: { value: String },
})

export const Tabs = defineComponent({
  name: 'FdTabs',
  setup(props, { slots }) {
    const active = ref(0)
    return () => {
      const tabVnodes = flattenChildren(slots.default?.())
      const values = props.items ?? tabVnodes.map((v) => (v.props?.value as string) ?? '')
      const current = tabVnodes[active.value]
      return (
        <div class={s.tabs}>
          <div class={s.tabsBar} role="tablist">
            {values.map((label, i) => (
              <button
                key={`${label}-${i}`}
                role="tab"
                class={[s.tab, i === active.value && s.tabActive]}
                onClick={() => (active.value = i)}
              >
                {label}
              </button>
            ))}
          </div>
          <div class={s.tabsPanel}>{current ? renderChildren(current.children) : null}</div>
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
  props: { title: String },
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
          {items.map((item, i) => (
            <div key={i}>
              <button
                class={s.accordionHead}
                onClick={() => (open.value = open.value === i ? null : i)}
              >
                {(item.props?.title as string) ?? `Item ${i + 1}`}
                <span class={s.accordionIcon}>{open.value === i ? '−' : '+'}</span>
              </button>
              {open.value === i ? (
                <div class={s.accordionBody}>{renderChildren(item.children)}</div>
              ) : null}
            </div>
          ))}
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
              <div>{renderChildren(item.children)}</div>
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
