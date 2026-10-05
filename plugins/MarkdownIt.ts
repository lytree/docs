/**
 * markdown-it 管线 —— 对齐 VitePress 的技术选型。
 *
 * 为什么从 MDX 换到 markdown-it：
 * MDX 把 Markdown 当 JSX 解析，于是裸 `<`（`List<String>`、`a < b`）、
 * `<<<` 文件导入指令、`Map<K,V>` 这类泛型写法都会触发 JSX 解析错误。
 * markdown-it 是行内 HTML 语义的解析器，这些内容天然安全；
 * 而组件能力通过「容器语法 + 自定义渲染」提供，不必依赖 JSX。
 *
 * 本插件负责：
 *  - frontmatter 抽取
 *  - ::: 容器（markdown-it-container 扩展）
 *  - <<< 文件导入（块级规则，先于解析阶段处理）
 *  - 代码块高亮（Shiki，支持 fence meta 的 [filename] / 行高亮 / focus / diff）
 *  - KaTeX 数学
 *  - 输出 Vue 渲染函数（配合 @mdit-vue/plugin-sfc 的 Vue 组件包装）
 */
import MarkdownIt from 'markdown-it'
import type { Token } from 'markdown-it'
type MdIt = InstanceType<typeof MarkdownIt>
import type { Plugin } from 'vite'
import { createHighlighter, type Highlighter } from 'shiki'
import type { ShikiTransformer, ShikiTransformerContext } from 'shiki'
import container from 'markdown-it-container'
import { katexWrapper, type KatexOptions } from './Katex'
import { resolveFileImports } from './FileImport'
import { fenceMetaTitle, parseFenceMeta } from './FenceMeta'

export interface MarkdownItOptions {
  /** 代码高亮主题（明/暗双主题） */
  themes?: { light: string; dark: string }
  /** 是否显示行号 */
  lineNumbers?: boolean
  /** `:::type` -> 组件名 */
  containers?: Record<string, string>
  /** KaTeX 配置；传 false 关闭 */
  katex?: KatexOptions | false
  /** `<<<` 导入基准 */
  imports?: { contentRoot?: string; projectRoot?: string }
}

// ---------------------------------------------------------------------------
// ::: 容器
// ---------------------------------------------------------------------------

/**
 * 内置容器：类型 -> 规范化后的名字。
 * 多个输入类型（warn/caution…）归一到同一个渲染名。
 */
export const BUILTIN_CONTAINERS: Record<string, string> = {
  tip: 'tip',
  info: 'info',
  note: 'note',
  warning: 'warning',
  warn: 'warning',
  caution: 'warning',
  danger: 'danger',
  error: 'danger',
  important: 'important',
  quote: 'quote',
  details: 'details',
  raw: 'raw',
  'code-group': 'code-group',
}

/**
 * 容器以 `<div class="md-container" data-container=... data-title=...>` 标记，
 * 交互（标题栏、折叠）在 Vue 侧完成 —— 见 src/lib/Markdown.ts。
 *
 * 注意嵌套：markdown-it-container 的 `validate` 要放行，
 * 且 render 必须同时处理开闭两种 nesting，否则嵌套容器会被吞掉。
 */
function withContainers(md: MdIt, custom: Record<string, string>): void {
  const register = (name: string) => {
    md.use(container, name, {
      // 允许 info 携带标题：`::: tip 标题`
      // markdown-it-container v4 的 validate 收到的是 info 字符串本身
      validate: (params) => new RegExp(`^${escapeRe(name)}(\\s+|$)`).test(String(params).trim()),
      render(tokens: Token[], idx: number): string {
        const token = tokens[idx]
        // markdown-it-container 会为 open/close 各调一次 render，
        // 返回空串表示「沿用默认渲染」——默认会给 div 加上容器名 class。
        // 我们自己输出完整标签（含 data-*），因此两种 nesting 都直接产出。
        if (token.nesting !== 1) return '</div>'
        const info = token.info.trim()
        // `::: details 点击展开` -> 标题
        const title = info.slice(name.length).trim()
        const titleAttr = title ? ` data-title="${escapeAttr(title)}"` : ''
        return `<div class="md-container" data-container="${escapeAttr(name)}"${titleAttr}>`
      },
    })
  }

  for (const name of Object.keys(BUILTIN_CONTAINERS)) register(name)
  for (const name of Object.keys(custom)) register(name)
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ---------------------------------------------------------------------------
// 代码块高亮（Shiki）
// ---------------------------------------------------------------------------

/** 解析 fence meta：`{1,3-5}` 行高亮、`[!code focus]`、`[!code ++]`、`[!code word:x]` */
export function parseFenceAnnotations(meta: string): {
  /** 显式高亮的行号 */
  lines: number[]
  /** 聚焦模式：非高亮行淡出 */
  focus: boolean
  /** 关键词高亮 */
  words: string[]
} {
  const result: { lines: number[]; focus: boolean; words: string[] } = {
    lines: [],
    focus: false,
    words: [],
  }
  if (!meta) return result

  // {1,3-5} 或 {1}
  const range = /\{([\d,-]+)\}/.exec(meta)
  if (range) {
    for (const part of range[1].split(',')) {
      const [a, b] = part.split('-').map(Number)
      if (!Number.isFinite(a)) continue
      const start = a as number
      const end = Number.isFinite(b) ? (b as number) : start
      for (let i = start; i <= end; i++) result.lines.push(i)
    }
  }

  // [!code focus]
  if (/\[!code\s+focus\]/.test(meta)) result.focus = true

  // [!code word:xxx] / [!code word:xxx,yyy]
  const word = /\[!code\s+word:([^\]]+)\]/.exec(meta)
  if (word) result.words = word[1].split(',').map((w) => w.trim()).filter(Boolean)

  return result
}

/** 取得 fence 的原始 meta */
function rawMeta(ctx: ShikiTransformerContext): string {
  const meta = ctx.options.meta as unknown as { __raw?: string } | string | undefined
  return typeof meta === 'string' ? meta : (meta?.__raw ?? '')
}

/** Shiki transformer 集合：文件名 -> <pre data-title>；行高亮；聚焦淡出 */
function shikiTransformers(lineNumbers: boolean): ShikiTransformer[] {
  const pre = function (this: ShikiTransformerContext, node: { properties: Record<string, unknown> }) {
    const meta = rawMeta(this)
    const title = fenceMetaTitle(meta)
    if (title) node.properties['data-title'] = title
    if (lineNumbers) {
      const cls = (node.properties.class as string | undefined) ?? ''
      if (!cls.includes('has-line-numbers')) {
        node.properties.class = `${cls} has-line-numbers`.trim()
      }
    }
  }

  const line = function (
    this: ShikiTransformerContext,
    node: { properties: Record<string, unknown> },
    lineNo: number,
  ) {
    const { lines } = parseFenceAnnotations(rawMeta(this))
    if (lines.includes(lineNo)) {
      const cls = (node.properties.class as string | undefined) ?? ''
      node.properties.class = `${cls} highlighted`.trim()
    }
  }

  const code = function (
    this: ShikiTransformerContext,
    node: { children?: Array<{ properties: Record<string, unknown> }> },
  ) {
    const { focus, words } = parseFenceAnnotations(rawMeta(this))
    const children = (node.children ?? []) as Array<{ properties: Record<string, unknown> }>
    if (focus) {
      for (const child of children) {
        const cls = (child.properties.class as string | undefined) ?? ''
        if (!cls.includes('highlighted')) {
          child.properties.class = `${cls} faded`.trim()
        }
      }
    }
    if (words.length) {
      for (const w of words) {
        for (const child of children) child.properties['data-word'] = w
      }
    }
  }

  return [{ name: 'md-fence', pre, line, code } as unknown as ShikiTransformer]
}

// ---------------------------------------------------------------------------
// markdown-it 实例
// ---------------------------------------------------------------------------

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(themes: { light: string; dark: string }): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [themes.light, themes.dark],
      langs: ['bash', 'c', 'cpp', 'csharp', 'css', 'diff', 'docker', 'go', 'html',
              'ini', 'java', 'javascript', 'json', 'kotlin', 'less', 'lua', 'markdown',
              'php', 'plaintext', 'python', 'ruby', 'rust', 'scss', 'shell', 'sql',
              'swift', 'toml', 'typescript', 'vue', 'xml', 'yaml'],
    })
  }
  return highlighterPromise
}

/** markdown-it v15 的 Env 类型 */
type MdEnv = Record<string, unknown>

/** markdown-it 实例 + 异步渲染入口 */
export interface MarkdownRenderer {
  md: MdIt
  /** 渲染 markdown 到 HTML（先异步高亮代码块，再同步输出） */
  render(src: string, env?: MdEnv): Promise<string>
}

export async function createMarkdownIt(
  options: MarkdownItOptions = {},
): Promise<MarkdownRenderer> {
  const themes = options.themes ?? { light: 'github-light', dark: 'github-dark' }
  const lineNumbers = options.lineNumbers ?? false
  const highlighter = await getHighlighter(themes)

  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: false,
    breaks: false,
  })

  // ---- ::: 容器 ----
  withContainers(md, options.containers ?? {})

  // ---- 代码块高亮 ----
  // markdown-it 的 renderer 必须同步，而 shiki 的 codeToHtml 是异步的。
  // 做法：先 parse 出 token 树，异步把所有 fence 高亮好存进 map，
  // 再同步 render —— renderer 只按 token 索引取值。
  const fenceHtml = new Map<number, string>()

  md.renderer.rules.fence = (tokens: Token[], idx: number) => {
    return (
      fenceHtml.get(idx) ??
      `<pre><code>${escapeHtml(tokens[idx].content)}</code></pre>`
    )
  }

  // ---- KaTeX ----
  if (options.katex !== false) {
    katexWrapper(md, options.katex)
  }

  // ---- 标题锚点 ----
  const slugs = new Map<string, number>()
  md.core.ruler.push('anchor', (state) => {
    slugs.clear()
    const tokens = state.tokens
    for (const token of tokens) {
      if (token.type !== 'heading_open') continue
      const inline = tokens[tokens.indexOf(token) + 1]
      if (!inline || inline.type !== 'inline') continue
      let text = ''
      for (const c of inline.children ?? []) {
        if (c.type === 'text' || c.type === 'code_inline') text += c.content
      }
      let base = text
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 64) || 'section'
      const n = slugs.get(base) ?? 0
      slugs.set(base, n + 1)
      const id = n === 0 ? base : `${base}-${n}`
      token.attrSet('id', id)
      inline.attrJoin('class', 'md-heading')
    }
    return true
  })

  // ---- 表格加外层容器（便于横向滚动）----
  // 必须成对重写 table_open / table_close：只开不闭会让后续表格全部
  // 落进第一个 wrapper，margin/border 层层累积，把正文撑到数万像素。
  md.renderer.rules.table_open = (tokens: Token[], idx, options_, env, self) =>
    `<div class="md-table-wrap">${(self as { renderToken(t: Token[], i: number, o: unknown): string }).renderToken(tokens, idx, options_)}`
  md.renderer.rules.table_close = (tokens: Token[], idx, options_, env, self) =>
    `${(self as { renderToken(t: Token[], i: number, o: unknown): string }).renderToken(tokens, idx, options_)}</div>`

  // ---- 对外暴露：先异步高亮 fence，再同步渲染 ----
  const originalParse = md.parse.bind(md)

  const renderer: MarkdownRenderer = {
    md,
    async render(src: string, env: MdEnv = {}): Promise<string> {
      fenceHtml.clear()
      const tokens = originalParse(src, env)
      await Promise.all(
        tokens.map(async (token, idx) => {
          if (token.type !== 'fence') return
          const html = await highlightFence(
            token.content,
            token.info,
            highlighter,
            themes,
            lineNumbers,
          )
          fenceHtml.set(idx, html)
        }),
      )
      return md.renderer.render(tokens, md.options, env)
    },
  }

  return renderer
}

/** 高亮单个代码块 */
async function highlightFence(
  content: string,
  info: string,
  highlighter: Highlighter,
  themes: { light: string; dark: string },
  lineNumbers: boolean,
): Promise<string> {
  const trimmed = info.trim()
  const langMatch = /^([\w-]+)/.exec(trimmed)
  const lang = langMatch?.[1] ?? ''
  const meta = trimmed.slice(lang.length).trim()
  const source = content.replace(/\n$/, '')
  const loaded = highlighter.getLoadedLanguages().includes(lang) ? lang : 'plaintext'

  const { title } = parseFenceMeta(meta)
  const html = await highlighter.codeToHtml(source, {
    lang: loaded,
    themes: { light: themes.light, dark: themes.dark },
    defaultColor: false,
    transformers: shikiTransformers(lineNumbers),
    meta: { __raw: meta },
  })

  const titleAttr = title ? ` data-title="${escapeAttr(title)}"` : ''
  return `<div class="md-codeblock"${titleAttr}>${html}</div>`
}

// ---------------------------------------------------------------------------
// Vite 插件
// ---------------------------------------------------------------------------

/**
 * 把 `.md` 编译成 Vue 组件。
 *
 * markdown-it 产出 HTML，Vue 侧以 v-html 渲染并在挂载后增强交互
 * （容器折叠、代码组、KaTeX、图片放大）—— 见 src/lib/Markdown.ts。
 */
export function markdownItPlugin(options: MarkdownItOptions = {}): Plugin {
  let rendererPromise: Promise<MarkdownRenderer> | null = null
  const getRenderer = () => {
    if (!rendererPromise) rendererPromise = createMarkdownIt(options)
    return rendererPromise
  }

  return {
    name: 'lytree-markdown-it',
    enforce: 'pre',
    async transform(code, id) {
      const file = id.split('?')[0]
      if (!/\.md$/.test(file)) return null

      // <<< 文件导入：markdown-it 里是纯文本块，可在解析前替换成代码围栏
      const source = resolveFileImports(code, file, {
        contentRoot: options.imports?.contentRoot ?? 'content/docs',
        projectRoot: options.imports?.projectRoot ?? process.cwd(),
      })

      const renderer = await getRenderer()
      const { frontmatter, body } = splitFrontmatter(source)
      const content = await renderer.render(body, { path: file })

      return { code: renderToVue(content, frontmatter), map: null }
    },
  }
}

// ---------------------------------------------------------------------------
// frontmatter + Vue 组件输出
// ---------------------------------------------------------------------------

function splitFrontmatter(source: string): { frontmatter: string; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source)
  if (!m) return { frontmatter: '', body: source }
  return { frontmatter: m[1], body: source.slice(m[0].length) }
}

/**
 * 把渲染出的 HTML 交给 Vue。
 *
 * 说明：交互组件（折叠、Tab、代码组）通过 markdown-it 容器产出的
 * `data-container` 标记，在 Vue 侧由 enhanceApp 统一接管 —— 见 src/lib/Markdown.tsx。
 */
function renderToVue(html: string, frontmatter: string): string {
  const fm = frontmatter.trim() ? JSON.stringify(parseSimpleYaml(frontmatter)) : '{}'
  return [
    `import { defineComponent as __defineComponent } from 'vue'`,
    `import { renderMarkdown as __renderMarkdown } from '${VUE_LIB_PATH}'`,
    `const __frontmatter = ${fm}`,
    `const __html = ${JSON.stringify(html)}`,
    `export default __defineComponent({`,
    `  name: 'MarkdownPage',`,
    `  frontmatter: __frontmatter,`,
    `  setup() { return () => __renderMarkdown(__html, __frontmatter) }`,
    `})`,
  ].join('\n')
}

/** Vue 侧运行时（markdown 文件在 content 下，需要用别名引用） */
const VUE_LIB_PATH = '@/lib/Markdown'

/** 极简 YAML 解析：只处理 frontmatter 里出现的标量/数组/对象 */
function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const lines = yaml.split(/\r?\n/)
  let currentKey: string | null = null
  let listItems: string[] = []
  let listKey: string | null = null

  const flush = () => {
    if (listKey && listItems.length) out[listKey] = listItems
    listKey = null
    listItems = []
  }

  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue
    // 数组项
    const item = /^\s*-\s+(.*)$/.exec(raw)
    if (item && listKey) {
      listItems.push(unquote(item[1]))
      continue
    }
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(raw)
    if (!kv) continue
    flush()
    const key = kv[1]
    const val = kv[2].trim()
    if (val === '') {
      listKey = key
      currentKey = null
      continue
    }
    if (val.startsWith('[') && val.endsWith(']')) {
      out[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean)
      continue
    }
    if (val === 'true' || val === 'false') {
      out[key] = val === 'true'
      continue
    }
    out[key] = unquote(val)
  }
  flush()
  void currentKey
  return out
}

function unquote(s: string): string {
  return s.replace(/^['"]|['"]$/g, '')
}

export default markdownItPlugin