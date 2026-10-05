/**
 * 布局插槽系统 —— VitePress 定制能力的核心。
 *
 * 用法：
 *   // 主题侧集中注册（.vitepress/theme.tsx）
 *   import { defineSlots } from '~/lib/Slots'
 *   export default defineSlots({
 *     'doc-before': DocNotice,            // 组件
 *     'doc-after': () => <MyWidget />,   // 函数（可拿 ctx）
 *   })
 *
 *   // 布局侧输出
 *   <Slot name="doc-after" ctx={{ page }} />
 *
 * 插槽内容支持四种形态，按优先级从高到低：
 *   1. 函数    —— (ctx) => VNodeChild，可读 ctx 做条件渲染
 *   2. 组件    —— defineComponent 对象或函数式组件
 *   3. VNode   —— 已创建好的节点
 *   4. 字符串  —— 直接当文本渲染
 * 一个插槽可以填数组，按顺序渲染。
 */
import {
  defineComponent,
  h,
  type Component,
  type PropType,
  type VNode,
  type VNodeChild,
} from 'vue'

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

/** 插槽渲染上下文 —— 布局把当前页面的相关信息透传给插槽内容 */
export interface SlotContext {
  /** 路由路径 */
  path?: string
  /** 页面 slug（docs 路由下有效） */
  slug?: string
  /** 页面 frontmatter */
  frontmatter?: Record<string, unknown>
  /** 页面标题 */
  title?: string
  /** 是否处于暗色主题 */
  dark?: boolean
  [key: string]: unknown
}

export type SlotRenderer = (ctx: SlotContext) => VNodeChild
export type SlotContent = Component | SlotRenderer | VNode | string | null | undefined | false
export type SlotEntry = SlotContent | SlotContent[]
export type SlotsMap = Record<string, SlotEntry>

// ---------------------------------------------------------------------------
// 注册表
// ---------------------------------------------------------------------------

const registry: Record<string, SlotEntry> = {}

/** 注册插槽（可在多处调用，后写覆盖同名槽位） */
export function defineSlots(slots: SlotsMap): void {
  Object.assign(registry, slots)
}

/** 只读当前注册的全部插槽 */
export function useSlots(): Readonly<Record<string, SlotEntry>> {
  return registry
}

/** 某插槽是否有内容（用于避免渲染空 wrapper） */
export function hasSlot(name: string): boolean {
  const entry = registry[name]
  if (entry == null || entry === false) return false
  if (Array.isArray(entry)) return entry.length > 0
  return true
}

// ---------------------------------------------------------------------------
// 渲染
// ---------------------------------------------------------------------------

function renderOne(entry: SlotContent, ctx: SlotContext, key: number | string): VNodeChild {
  if (entry == null || entry === false) return null

  // 字符串
  if (typeof entry === 'string') return entry

  // 数组
  if (Array.isArray(entry)) {
    return entry.map((e, i) => renderOne(e, ctx, `${key}-${i}`))
  }

  // 函数 —— 一律按「渲染函数」调用并传入 ctx。
  // 函数式 Vue 组件也吃这个路径：它收到的第一个参数就是 props，
  // 而我们传的 ctx 恰好包含 path/slug/frontmatter 等常用字段。
  if (typeof entry === 'function') {
    return (entry as SlotRenderer)(ctx)
  }

  // VNode / 组件对象
  return h(entry as Component, { ...ctx, key })
}

/**
 * 插槽输出组件。布局里直接用 `<Slot name="doc-before" ctx={{...}} />`。
 *
 * - 没有注册任何内容时返回 null，不产生空 DOM
 * - 注册为数组时按顺序渲染，并用 Fragment 包裹
 */
export const Slot = defineComponent({
  name: 'FdSlot',
  inheritAttrs: false,
  props: {
    name: { type: String, required: true },
    ctx: { type: Object as PropType<SlotContext>, default: () => ({}) },
  },
  setup(props) {
    return () => {
      const entry = registry[props.name]
      if (!hasSlot(props.name)) return null

      // 单个非数组内容：直接渲染，DOM 结构最干净
      if (!Array.isArray(entry)) {
        return renderOne(entry, props.ctx ?? {}, props.name) as VNode
      }

      const children = entry
        .map((e, i) => renderOne(e, props.ctx ?? {}, `${props.name}-${i}`))
        .filter((v) => v != null && v !== false)
      if (children.length === 0) return null
      return h('div', { style: { display: 'contents' } }, children)
    }
  },
})

/**
 * 主题扩展入口：把插槽与全局组件注册收拢到一个地方。
 *
 * 对应 VitePress 的 `.vitepress/theme/index.ts`，但这里直接操作模块级注册表，
 * 不需要额外的 app 包装层。
 */
export function defineTheme(theme: {
  slots?: SlotsMap
  /** 追加到全局的组件表（供插槽内容或外部复用） */
  components?: Record<string, unknown>
}) {
  if (theme.slots) defineSlots(theme.slots)
  if (theme.components) registerComponents(theme.components)
  return theme
}

/** 追加全局组件 */
const extraComponents: Record<string, unknown> = {}

export function registerComponents(map: Record<string, unknown>): void {
  Object.assign(extraComponents, map)
}

/** 内置 + 自定义合并后的组件表 */
export function resolveComponents(base: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...base, ...extraComponents }
}

export default defineSlots