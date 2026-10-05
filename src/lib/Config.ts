/**
 * 运行时的站点配置访问层。
 *
 * 数据来自 `virtual:source` 的 `config` 区块（由 fumadocsSource 在构建期生成），
 * 与 fumadocs 的 `fumadocsSource({ ... })` 配置一一对应。
 *
 * 组件与插槽不在这里 —— 那些在 theme.tsx 里注册。
 */
import { source } from 'virtual:source'
import type { ClientConfig } from 'virtual:source'
import type {
  NavItem,
  SidebarConfig,
  SidebarEntry,
  OutlineConfig,
  UiText,
  FooterConfig,
  DesignTokens,
  HeadConfig,
} from './ConfigTypes'

export type {
  NavItem,
  SidebarConfig,
  SidebarEntry,
  OutlineConfig,
  UiText,
  FooterConfig,
  DesignTokens,
  HeadConfig,
}

const cfg = (source.config ?? {
  nav: [],
  outline: { range: [2, 3] as [number, number] },
  ui: {} as Required<UiText>,
  markdown: { lineNumbers: false, containers: {} },
}) as unknown as ClientConfig

// ---------------------------------------------------------------------------
// 基础访问
// ---------------------------------------------------------------------------

export function useConfig(): ClientConfig {
  return cfg
}

export function siteConfig() {
  return source.site
}

/** 拼页面标题：`标题 · 站点名` */
export function pageTitle(title?: string): string {
  const base = source.site.title
  return title ? `${title} · ${base}` : base
}

export function uiText(): Required<UiText> {
  return cfg.ui
}

// ---------------------------------------------------------------------------
// nav
// ---------------------------------------------------------------------------

export function navItems(): NavItem[] {
  return cfg.nav ?? []
}

/** 某个 nav 项在当前路径下是否高亮 */
export function isNavActive(item: NavItem, path: string): boolean {
  if (item.match) {
    try {
      return new RegExp(item.match).test(path)
    } catch {
      /* 非法正则时退回前缀匹配 */
    }
  }
  if (!item.to?.startsWith('/')) return false
  const base = item.to.replace(/\/$/, '')
  return path === base || path.startsWith(base + '/')
}

// ---------------------------------------------------------------------------
// sidebar —— 未配置时回退到 meta.json 页面树
// ---------------------------------------------------------------------------

/** 记录形态下按路径前缀取侧边栏，最长前缀优先 */
export function sidebarFor(path: string): SidebarEntry[] | null {
  const sidebar = cfg.sidebar
  if (!sidebar) return null
  if (Array.isArray(sidebar)) return sidebar
  for (const key of Object.keys(sidebar).sort((a, b) => b.length - a.length)) {
    const base = key.replace(/\/$/, '')
    if (path === base || path.startsWith(base + '/')) return sidebar[key]
  }
  return null
}

/** 是否显式配置了侧边栏（是则优先于页面树） */
export function hasSidebarConfig(): boolean {
  return cfg.sidebar != null
}

// ---------------------------------------------------------------------------
// outline
// ---------------------------------------------------------------------------

export function outlineRange(): [number, number] {
  const r = cfg.outline?.range
  return Array.isArray(r) && r.length === 2 ? ([r[0], r[1]] as [number, number]) : [2, 3]
}

export function outlineTitle(): string {
  return cfg.outline?.title ?? '本页目录'
}

export function footerConfig(): FooterConfig | undefined {
  return cfg.footer
}

// ---------------------------------------------------------------------------
// 设计 token -> CSS 变量
// ---------------------------------------------------------------------------

/** 把 tokens 摊平成 CSS 变量声明 */
export function tokensToCssVars(tokens?: DesignTokens): Record<string, string> {
  const vars: Record<string, string> = {}
  if (!tokens) return vars

  if (tokens.brand) {
    if (typeof tokens.brand === 'string') {
      vars['--fd-primary'] = tokens.brand
    } else {
      for (const [k, v] of Object.entries(tokens.brand)) {
        vars[`--fd-brand-${k}`] = v
        if (k === '1') vars['--fd-primary'] = v
      }
    }
  }

  if (tokens.fontFamily?.body) vars['--fd-font-body'] = tokens.fontFamily.body
  if (tokens.fontFamily?.mono) vars['--fd-font-mono'] = tokens.fontFamily.mono

  if (tokens.fontSize?.base) vars['--fd-font-size-base'] = tokens.fontSize.base
  if (tokens.fontSize?.contentWidth) vars['--fd-content-width'] = tokens.fontSize.contentWidth

  if (tokens.radius?.sm) vars['--fd-radius-sm'] = tokens.radius.sm
  if (tokens.radius?.md) vars['--fd-radius'] = tokens.radius.md
  if (tokens.radius?.lg) vars['--fd-radius-lg'] = tokens.radius.lg

  const layout = tokens.layout
  if (layout?.sidebarWidth) vars['--fd-sidebar-width'] = layout.sidebarWidth
  if (layout?.asideWidth) vars['--fd-toc-width'] = layout.asideWidth
  if (layout?.navHeight) vars['--fd-nav-height'] = layout.navHeight
  if (layout?.contentPadding) vars['--fd-content-padding'] = layout.contentPadding

  if (tokens.spacing) {
    for (const [k, v] of Object.entries(tokens.spacing)) vars[`--fd-space-${k}`] = v
  }

  if (tokens.extra) Object.assign(vars, tokens.extra)

  return vars
}

/** token 的 CSS 文本，供 <style> 注入 */
export function tokenStyleSheet(): string {
  const entries = Object.entries(tokensToCssVars(cfg.tokens))
  if (entries.length === 0) return ''
  return `:root{${entries.map(([k, v]) => `${k}:${v}`).join(';')}}`
}

export default useConfig