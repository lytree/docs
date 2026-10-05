/**
 * `fumadocsSource()` 的配置类型。
 *
 * 站点配置、导航、侧边栏、设计 token、Markdown 行为全部收在这一份对象里，
 * 由 vite.config.ts 传给 `fumadocsSource()`（fumadocs 的惯例）。
 *
 * 需要在多处复用配置时，用普通函数返回片段再 spread —— 不引入配置继承：
 *
 *   const nav = () => [{ label: '文档', to: '/docs' }]
 *   fumadocsSource({ nav: nav(), ... })
 */

// ---------------------------------------------------------------------------
// 站点元信息
// ---------------------------------------------------------------------------

export interface BannerConfig {
  /** localStorage 存储键的后缀；改这个值让公告对所有人重新出现 */
  id: string
  text: string
  variant?: 'normal' | 'rainbow'
  link?: string
}

export interface HeadConfig {
  tag: 'meta' | 'link' | 'script' | 'style' | 'noscript'
  attrs?: Record<string, string | boolean | null | undefined>
  children?: string
  /** script 追加到 body 末尾（默认放 head） */
  appendToBody?: boolean
}

// ---------------------------------------------------------------------------
// 顶部导航
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string
  /** 站内路径（/docs/x）或外链（https://…） */
  to?: string
  /** 手动指定高亮匹配的正则源码；不给则按 to 前缀匹配 */
  match?: string
  /** 图标：emoji 或短文本 */
  icon?: string
  /** 二级菜单 */
  children?: NavItem[]
}

// ---------------------------------------------------------------------------
// 侧边栏
// ---------------------------------------------------------------------------

export interface SidebarEntry {
  label: string
  to?: string
  items?: SidebarEntry[]
  /** 覆盖默认折叠状态 */
  collapsed?: boolean
  /** 覆盖默认可折叠性 */
  collapsible?: boolean
}

/**
 * 两种形态：
 *  - `SidebarEntry[]`                —— 全站共用一份
 *  - `Record<string, SidebarEntry[]>` —— 按路径前缀切换多份，最长前缀优先
 * 不配置时回退到 meta.json 生成的页面树。
 */
export type SidebarConfig = SidebarEntry[] | Record<string, SidebarEntry[]>

// ---------------------------------------------------------------------------
// 目录（右侧 outline）
// ---------------------------------------------------------------------------

export interface OutlineConfig {
  /** 收录的标题层级，默认 [2, 3] */
  range?: [number, number]
  title?: string
}

// ---------------------------------------------------------------------------
// 界面文案
// ---------------------------------------------------------------------------

export interface UiText {
  searchPlaceholder?: string
  sidebarMenuLabel?: string
  homeLinkLabel?: string
  editLink?: string
  lastUpdated?: string
  prev?: string
  next?: string
  notFound?: string
  backToHome?: string
}

export interface FooterConfig {
  message?: string
  copyright?: string
}

// ---------------------------------------------------------------------------
// 设计 token —— 覆盖 CSS 变量，不需要改组件
// ---------------------------------------------------------------------------

export interface DesignTokens {
  /** 品牌色：单色直接覆盖主色，或给色阶（brand-1 … brand-11） */
  brand?: string | Record<string, string>
  fontFamily?: { body?: string; mono?: string }
  fontSize?: { base?: string; contentWidth?: string }
  radius?: { sm?: string; md?: string; lg?: string }
  layout?: {
    sidebarWidth?: string
    asideWidth?: string
    navHeight?: string
    contentPadding?: string
  }
  spacing?: Record<string, string>
  /** 任意额外变量，直接落到 :root */
  extra?: Record<string, string>
}

// ---------------------------------------------------------------------------
// 构建期钩子
// ---------------------------------------------------------------------------

/** 钩子里拿到的页面数据形态 */
export interface PageHookInput {
  slug: string
  title: string
  description?: string
  frontmatter?: Record<string, unknown>
  [key: string]: unknown
}

export interface ConfigHooks {
  /** 扫描完页面后改写数据；返回新对象或就地修改均可 */
  transformPageData?: (
    page: PageHookInput,
  ) => PageHookInput | void | Promise<PageHookInput | void>
  /** 为某个页面追加 head 标签 */
  transformHead?: (
    page: PageHookInput,
  ) => HeadConfig[] | void | Promise<HeadConfig[] | void>
}

// ---------------------------------------------------------------------------
// fumadocsSource() 选项
// ---------------------------------------------------------------------------

export interface SourceOptions {
  /** 站点信息 */
  site?: {
    url?: string
    title?: string
    description?: string
    lang?: string
    base?: string
    /** 注入 <head> 的标签 */
    head?: HeadConfig[]
    /** 全站公告栏 */
    banner?: BannerConfig
  }
  i18n?: {
    locales: { code: string; name: string }[]
    defaultLocale?: string
  }
  /** 「编辑此页」 */
  editLink?: { repo: string; branch?: string }
  /** 生成 OG 图（默认 true） */
  og?: boolean

  /** 顶部导航；不配置时由 root folders 自动生成 */
  nav?: NavItem[]
  /** 侧边栏；不配置时回退到 meta.json 页面树 */
  sidebar?: SidebarConfig
  /** 右侧目录 */
  outline?: OutlineConfig
  /** 界面文案 */
  ui?: UiText
  /** 全局页脚 */
  footer?: FooterConfig
  /** 设计 token */
  tokens?: DesignTokens
  /** Markdown 行为 */
  markdown?: {
    /** 代码块行号 */
    lineNumbers?: boolean
    /** 自定义 `:::type` 容器 -> MDX 组件名 */
    containers?: Record<string, string>
    /** 追加到默认链之后 */
    remarkPlugins?: unknown[]
    rehypePlugins?: unknown[]
  }

  hooks?: ConfigHooks
}