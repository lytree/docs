/**
 * fumadocsSource — content pipeline for the Vue port.
 *
 * Mirrors fumadocs-mdx behaviour:
 *  - scans `content/docs` for .md/.mdx files and `meta.json` page trees
 *  - i18n: locale sub-dirs (content/docs/<locale>/) get a slug prefix (/docs/<locale>/...),
 *    default locale content stays at the root, untouched
 *  - exposes everything through a virtual module `virtual:source`
 *  - extracts frontmatter + table of contents at build time
 *  - generates a client-side full-text search index (per locale)
 *  - emits llms.txt / sitemap.xml / robots.txt / routes.json (dev middleware + build assets)
 *  - generates a 1200x630 OG image per page (SVG -> PNG via @resvg/resvg-js)
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkMath from 'remark-math'
import remarkFrontmatter from 'remark-frontmatter'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { toString as mdastToString } from 'mdast-util-to-string'
import type { Root, Heading, PhrasingContent } from 'mdast'
import type { Plugin, ViteDevServer, ResolvedConfig } from 'vite'
import { generateApiPages, type ApiPage, type ApiDocData, type DocgenOptions } from './Docgen'

export const VIRTUAL_SOURCE = 'virtual:source'
const RESOLVED_SOURCE = '\0' + VIRTUAL_SOURCE

const CONTENT_ROOT = 'content/docs'

// ---------------------------------------------------------------------------
// public types
// ---------------------------------------------------------------------------

export interface TocItem {
  title: string
  url: string
  depth: number
}

export interface PageData {
  slug: string // url slug under /docs, locale-prefixed for non-default locales
  locale: string
  file: string // root-relative posix path, e.g. /content/docs/other/js/1.md
  title: string
  description?: string
  toc: TocItem[]
  icon?: string // frontmatter icon (emoji / text glyph)
  full?: boolean // frontmatter full: true — wide page, sidebar + toc hidden
  lastModified?: number // git last commit timestamp (ms)
  api?: ApiDocData // generated API reference payload (docgen pages)
}

export interface PageTreeNode {
  type: 'page' | 'folder' | 'separator'
  name: string
  url?: string
  title?: string
  description?: string
  icon?: string
  root?: boolean
  defaultOpen?: boolean
  children?: PageTreeNode[]
  index?: string // slug of folder index page
}

export interface SearchEntry {
  id: string
  type: 'page' | 'heading' | 'text'
  url: string
  title: string
  heading?: string
  content?: string
  locale: string
}

export interface SourceData {
  pages: PageData[]
  tree: PageTreeNode[]
  searchIndex: SearchEntry[]
}

export interface LocaleInfo {
  code: string
  name: string
  isDefault: boolean
}

export interface SiteInfo {
  url: string
  title: string
  description: string
  editLink?: { repo: string; branch?: string } // github repo, e.g. user/repo
}

export interface SourceRoot {
  site: SiteInfo
  locales: LocaleInfo[]
  defaultLocale: string
  byLocale: Record<string, SourceData>
  /** every page across locales */
  pages: PageData[]
}

export interface FumadocsSourceOptions {
  site?: Partial<SiteInfo>
  i18n?: {
    locales: { code: string; name: string }[]
    defaultLocale?: string
  }
  /** generate OG images (default true) */
  og?: boolean
  /** "edit this page" link target */
  editLink?: { repo: string; branch?: string }
  /** TypeDoc powered API reference generation */
  docgen?: DocgenOptions
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function prettify(name: string): string {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/(\b\w)/g, (c) => c.toUpperCase())
}

/** override object form: { "page-name": { title, description, icon, pages, ... } } */
interface MetaOverride {
  title?: string
  description?: string
  icon?: string
  root?: boolean
  defaultOpen?: boolean
  /** present → inline (virtual) folder with the given page list */
  pages?: MetaEntry[]
}

type MetaEntry = string | Record<string, MetaOverride>

interface DirMeta {
  title?: string
  description?: string
  icon?: string
  root?: boolean
  defaultOpen?: boolean
  pages?: MetaEntry[]
}

/** map a single-key override object / separator object to (name, override) */
function entryKey(entry: MetaEntry): { name: string; override?: MetaOverride } | null {
  if (typeof entry === 'string') return { name: entry }
  const keys = Object.keys(entry)
  if (keys.length !== 1) return null
  return { name: keys[0], override: entry[keys[0]] }
}

function readMeta(dir: string): DirMeta | null {
  const p = path.join(dir, 'meta.json')
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as DirMeta
  } catch {
    return null
  }
}

function slugFromFile(relFile: string): string {
  let base = relFile.replace(/\.(md|mdx)$/i, '')
  if (path.posix.basename(base) === 'index') {
    base = path.posix.dirname(base)
  }
  if (base === '.') base = ''
  return base
}

// ---------------------------------------------------------------------------
// git helpers (last modified time)
// ---------------------------------------------------------------------------

const gitTimeCache = new Map<string, number | undefined>()
let isGitRepo: boolean | null = null

function gitLastModified(absFile: string): number | undefined {
  if (isGitRepo === null) {
    const probe = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], { encoding: 'utf8' })
    isGitRepo = probe.status === 0 && probe.stdout.trim() === 'true'
    if (!isGitRepo) return undefined
  }
  if (!isGitRepo) return undefined
  if (gitTimeCache.has(absFile)) return gitTimeCache.get(absFile)
  let ts: number | undefined
  try {
    const out = spawnSync('git', ['log', '-1', '--format=%ct', '--', absFile], { encoding: 'utf8' })
    const n = Number.parseInt(out.stdout.trim(), 10)
    if (Number.isFinite(n) && n > 0) ts = n * 1000
  } catch {
    /* no git available */
  }
  gitTimeCache.set(absFile, ts)
  return ts
}

// ---------------------------------------------------------------------------
// markdown parsing (TOC + search text)
// ---------------------------------------------------------------------------

const parser = unified()
  .use(remarkParse as never)
  .use(remarkGfm as never)
  .use(remarkMdx as never)
  .use(remarkMath as never)
  .use(remarkFrontmatter as never, ['yaml', 'toml'] as never)

function parseMdast(source: string): Root | null {
  try {
    return parser.parse(source) as unknown as Root
  } catch {
    return null
  }
}

function extractToc(mdast: Root): TocItem[] {
  const slugger = new GithubSlugger()
  const toc: TocItem[] = []
  visit(mdast, 'heading', (node: Heading) => {
    const text = mdastToString(node).trim()
    if (!text) return
    const id = slugger.slug(text)
    if (node.depth >= 2 && node.depth <= 3) {
      toc.push({ title: text, url: `#${id}`, depth: node.depth })
    }
  })
  return toc
}

function inlineText(children: PhrasingContent[]): string {
  return mdastToString({ type: 'root', children: children as never } as never).trim()
}

function extractSearchEntries(mdast: Root, page: PageData, pageTitle: string): SearchEntry[] {
  const slugger = new GithubSlugger()
  const entries: SearchEntry[] = []
  const baseUrl = `/docs${page.slug ? `/${page.slug}` : ''}`

  entries.push({
    id: `page:${page.slug}`,
    type: 'page',
    url: baseUrl,
    title: pageTitle,
    content: page.description ?? '',
    locale: page.locale,
  })

  let currentHeading = ''
  let currentHeadingId = ''
  let buf: string[] = []
  let chunkIdx = 0

  const flush = () => {
    const text = buf.join('\n').trim()
    buf = []
    if (!text) return
    if (currentHeading) {
      entries.push({
        id: `heading:${page.slug}:${currentHeadingId}`,
        type: 'heading',
        url: `${baseUrl}#${currentHeadingId}`,
        title: currentHeading,
        heading: pageTitle,
        content: text.slice(0, 600),
        locale: page.locale,
      })
    } else {
      const prev = entries[entries.length - 1]
      if (prev && prev.type === 'page') prev.content = `${prev.content} ${text}`.trim().slice(0, 600)
      else
        entries.push({
          id: `text:${page.slug}:${chunkIdx++}`,
          type: 'text',
          url: baseUrl,
          title: pageTitle,
          content: text.slice(0, 600),
          locale: page.locale,
        })
    }
  }

  visit(mdast, (node: unknown) => {
    const n = node as { type: string; depth?: number; children?: PhrasingContent[] }
    if (n.type === 'heading') {
      flush()
      const heading = n as unknown as Heading
      const text = mdastToString(heading).trim()
      const id = slugger.slug(text)
      if (heading.depth === 2) {
        currentHeading = text
        currentHeadingId = id
      } else if (heading.depth === 3 && !currentHeading) {
        currentHeading = text
        currentHeadingId = id
      }
      return
    }
    if (n.type === 'code') return
    if (['paragraph', 'list', 'table', 'blockquote'].includes(n.type)) {
      const text = mdastToString(node).trim()
      if (text) buf.push(text)
    }
  })
  flush()
  return entries
}

// ---------------------------------------------------------------------------
// page tree builder (fumadocs meta.json compatible)
// ---------------------------------------------------------------------------

interface ScanContext {
  contentRoot: string // absolute content/docs dir
  scanDir: string // absolute dir this locale's tree is built from
  prefix: string // slug prefix, '' for default locale
  skipLocaleDirs: boolean // true when scanning default locale: hide locale sub-dirs
  localeCodes: Set<string>
  pages: Map<string, PageData> // slug -> data
}

function scanPage(ctx: ScanContext, absFile: string, locale: string): PageData {
  const relToScan = path.relative(ctx.scanDir, absFile).split(path.sep).join('/')
  const relSlug = slugFromFile(relToScan)
  const slug = ctx.prefix ? (relSlug ? `${ctx.prefix}/${relSlug}` : ctx.prefix) : relSlug
  const cached = ctx.pages.get(slug)
  if (cached) return cached

  const raw = fs.readFileSync(absFile, 'utf8')
  const { content, data } = matter(raw)
  const mdast = parseMdast(content)
  const toc = mdast ? extractToc(mdast) : []
  const relToContent = path.relative(ctx.contentRoot, absFile).split(path.sep).join('/')
  const title = (data.title as string) ?? prettify(path.basename(slug || 'index'))
  const page: PageData = {
    slug,
    locale,
    file: `/${CONTENT_ROOT}/${relToContent}`,
    title,
    description: data.description as string | undefined,
    toc,
    icon: data.icon as string | undefined,
    full: data.full === true,
    lastModified: gitLastModified(absFile),
  }
  ctx.pages.set(slug, page)
  return page
}

function buildFolderChildren(ctx: ScanContext, dir: string, locale: string): PageTreeNode[] {
  const meta = readMeta(dir)
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const isContentRoot = path.resolve(dir) === path.resolve(ctx.contentRoot)
  const skipDir = (name: string) =>
    ctx.skipLocaleDirs && isContentRoot && ctx.localeCodes.has(name)
  const files = entries
    .filter((e) => e.isFile() && /\.(md|mdx)$/i.test(e.name))
    .map((e) => path.join(dir, e.name))
  const folders = entries
    .filter((e) => e.isDirectory() && !skipDir(e.name))
    .map((e) => path.join(dir, e.name))

  const pageNode = (absFile: string, override?: MetaOverride): PageTreeNode => {
    const page = scanPage(ctx, absFile, locale)
    const base = path.basename(absFile).replace(/\.(md|mdx)$/i, '')
    return {
      type: 'page',
      name: base === 'index' ? path.basename(path.dirname(absFile)) || 'index' : base,
      url: `/docs${page.slug ? `/${page.slug}` : ''}`,
      title: override?.title ?? page.title,
      description: override?.description ?? page.description,
      icon: override?.icon ?? page.icon,
    }
  }

  const folderNode = (absFolder: string, override?: MetaOverride): PageTreeNode => {
    const name = path.basename(absFolder)
    const subMeta = readMeta(absFolder)
    const children = buildFolderChildren(ctx, absFolder, locale)
    const indexChild = children.find((c) => c.type === 'page' && c.name === 'index')
    const folderIndexPage = fs.existsSync(path.join(absFolder, 'index.md'))
      ? scanPage(ctx, path.join(absFolder, 'index.md'), locale)
      : undefined
    return {
      type: 'folder',
      name,
      url: folderIndexPage ? `/docs/${folderIndexPage.slug}` : undefined,
      title: override?.title ?? subMeta?.title ?? prettify(name),
      description: override?.description ?? subMeta?.description,
      icon: override?.icon ?? subMeta?.icon,
      root: override?.root ?? subMeta?.root,
      defaultOpen: override?.defaultOpen ?? subMeta?.defaultOpen ?? true,
      children,
      index: folderIndexPage?.slug ?? (indexChild as { url?: string } | undefined)?.url?.replace('/docs/', ''),
    }
  }

  /** inline virtual folder from a meta.json override with its own pages list */
  const inlineFolderNode = (name: string, override: MetaOverride): PageTreeNode => {
    const children = buildList(override.pages ?? null)
    const indexChild = children.find((c) => c.type === 'page' && c.name === 'index')
    return {
      type: 'folder',
      name,
      url: (indexChild as { url?: string } | undefined)?.url,
      title: override.title ?? prettify(name),
      description: override.description,
      icon: override.icon,
      root: override.root,
      defaultOpen: override.defaultOpen ?? true,
      children,
    }
  }

  /** build an ordered node list, optionally following an explicit entries list */
  function buildList(entries: MetaEntry[] | null): PageTreeNode[] {
    const ordered: PageTreeNode[] = []
    const listed = new Set<string>()

    const findFile = (name: string): string | undefined =>
      files.find((f) => path.basename(f).replace(/\.(md|mdx)$/i, '') === name)
    const findFolder = (name: string): string | undefined =>
      folders.find((f) => path.basename(f) === name)

    if (entries?.length) {
      for (const rawEntry of entries) {
        const parsed = entryKey(rawEntry)
        if (!parsed) continue
        let name = parsed.name
        const override = parsed.override

        // separator object form: { "---": "label" }
        if (typeof rawEntry !== 'string' && name === '---') {
          ordered.push({ type: 'separator', name: String(override ?? '') })
          continue
        }
        if (typeof rawEntry === 'string') {
          if (rawEntry === '...') continue // expanded below
          if (rawEntry === '---') {
            ordered.push({ type: 'separator', name: '' })
            continue
          }
          if (rawEntry.startsWith('---') && rawEntry.endsWith('---') && rawEntry.length > 6) {
            ordered.push({ type: 'separator', name: rawEntry.slice(3, -3) })
            continue
          }
          if (rawEntry.startsWith('!')) name = rawEntry.slice(1)
        }

        if (override?.pages) {
          // inline folder (may or may not exist on disk)
          listed.add(name)
          ordered.push(inlineFolderNode(name, override))
          continue
        }

        const absFile = findFile(name)
        const absFolder = findFolder(name)
        if (absFile) {
          listed.add(name)
          ordered.push(pageNode(absFile, override))
        } else if (absFolder) {
          listed.add(name)
          ordered.push(folderNode(absFolder, override))
        }
      }
      // "..." -> everything not explicitly listed
      for (const f of files) {
        const name = path.basename(f).replace(/\.(md|mdx)$/i, '')
        if (!listed.has(name)) ordered.push(pageNode(f))
      }
      for (const d of folders) {
        const name = path.basename(d)
        if (!listed.has(name)) ordered.push(folderNode(d))
      }
      return ordered
    }

    // no explicit list: natural order
    for (const f of files) ordered.push(pageNode(f))
    for (const d of folders) ordered.push(folderNode(d))
    return ordered
  }

  return buildList(meta?.pages ?? null)
}

// ---------------------------------------------------------------------------
// per-locale scan
// ---------------------------------------------------------------------------

function buildLocaleData(
  cwd: string,
  code: string | null, // null = default locale (root content, locale dirs skipped)
  localeCodes: Set<string>,
): SourceData {
  const contentRoot = path.join(cwd, CONTENT_ROOT)
  if (!fs.existsSync(contentRoot)) return { pages: [], tree: [], searchIndex: [] }

  const scanDir = code ? path.join(contentRoot, code) : contentRoot
  if (code && !fs.existsSync(scanDir)) return { pages: [], tree: [], searchIndex: [] }

  const ctx: ScanContext = {
    contentRoot,
    scanDir,
    prefix: code ?? '',
    skipLocaleDirs: code === null,
    localeCodes,
    pages: new Map(),
  }
  const locale = code ?? 'default'

  const tree = buildFolderChildren(ctx, scanDir, locale)

  // ensure every page has been parsed (folders may not be referenced by meta.json)
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (
        e.isDirectory() &&
        !(code === null && dir === contentRoot && localeCodes.has(e.name))
      ) {
        walk(path.join(dir, e.name))
      } else if (/\.(md|mdx)$/i.test(e.name)) {
        scanPage(ctx, path.join(dir, e.name), locale)
      }
    }
  }
  walk(scanDir)

  const searchIndex: SearchEntry[] = []
  for (const page of ctx.pages.values()) {
    const raw = fs.readFileSync(path.join(cwd, page.file), 'utf8')
    const { content, data } = matter(raw)
    const mdast = parseMdast(content)
    const title = (data.title as string) ?? page.title
    if (mdast) searchIndex.push(...extractSearchEntries(mdast, page, title))
  }

  return { pages: [...ctx.pages.values()], tree, searchIndex }
}

function scanContent(cwd: string, opts: FumadocsSourceOptions): SourceRoot {
  const localeList = opts.i18n?.locales ?? []
  const defaultLocale = opts.i18n?.defaultLocale ?? localeList[0]?.code ?? 'default'
  const localeCodes = new Set(localeList.map((l) => l.code))
  localeCodes.delete(defaultLocale) // default locale may live at the root

  const byLocale: Record<string, SourceData> = {}
  byLocale[defaultLocale] = buildLocaleData(cwd, null, localeCodes)
  for (const l of localeList) {
    if (l.code === defaultLocale) continue
    byLocale[l.code] = buildLocaleData(cwd, l.code, localeCodes)
  }

  const pages = Object.values(byLocale).flatMap((d) => d.pages)

  return {
    site: {
      url: (opts.site?.url ?? 'http://localhost:5173').replace(/\/$/, ''),
      title: opts.site?.title ?? 'Fumadocs Vue',
      description:
        opts.site?.description ??
        'Fumadocs re-implemented with Vue 3 + TSX — MDX, page tree, full-text search, code highlighting, dark mode.',
      editLink: opts.editLink,
    },
    locales: [
      { code: defaultLocale, name: localeList.find((l) => l.code === defaultLocale)?.name ?? defaultLocale, isDefault: true },
      ...localeList.filter((l) => l.code !== defaultLocale).map((l) => ({ code: l.code, name: l.name, isDefault: false })),
    ],
    defaultLocale,
    byLocale,
    pages,
  }
}

// ---------------------------------------------------------------------------
// generated files: llms.txt / sitemap / robots / routes / OG images
// ---------------------------------------------------------------------------

function generateLlmsTxt(data: SourceData, site: SiteInfo): string {
  const lines: string[] = [`# ${site.title}`, '', site.description, '']
  const walk = (nodes: PageTreeNode[], depth = 0) => {
    for (const node of nodes) {
      const pad = '  '.repeat(depth)
      if (node.type === 'separator') continue
      if (node.type === 'folder') {
        lines.push(`${pad}- ${node.title ?? node.name}`)
        if (node.children) walk(node.children, depth + 1)
      } else {
        lines.push(`${pad}- [${node.title ?? node.name}](${node.url})`)
      }
    }
  }
  walk(data.tree)
  lines.push('', '## Pages', '')
  for (const page of data.pages) {
    const url = `/docs${page.slug ? `/${page.slug}` : ''}`
    lines.push(`- [${page.title}](${url})`)
    if (page.description) lines.push(`  ${page.description}`)
  }
  return lines.join('\n') + '\n'
}

function pageUrl(slug: string): string {
  return `/docs${slug ? `/${slug}` : ''}`
}

function generateSitemap(root: SourceRoot): string {
  const urls = ['/', ...root.pages.map((p) => pageUrl(p.slug))]
  const today = new Date().toISOString().slice(0, 10)
  const body = urls
    .map((u) => `  <url>\n    <loc>${root.site.url}${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

function generateRobots(site: SiteInfo): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`
}

// ---- OG image generation (SVG -> PNG) -------------------------------------

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string,
  )
}

function wrapText(t: string, maxChars: number, maxLines: number): string[] {
  const chars = Array.from(t)
  const lines: string[] = []
  for (let i = 0; i < chars.length && lines.length < maxLines; i += maxChars) {
    lines.push(chars.slice(i, i + maxChars).join(''))
  }
  if (chars.length > maxLines * maxChars && lines.length === maxLines) {
    lines[maxLines - 1] = Array.from(lines[maxLines - 1]).slice(0, -1).join('') + '…'
  }
  return lines
}

function ogSvg(root: SourceRoot, title: string, description: string | undefined, crumb: string): string {
  const titleLines = wrapText(title, 18, 2)
  const descLines = description ? wrapText(description, 42, 1) : []
  const titleSpans = titleLines
    .map(
      (l, i) =>
        `<text x="96" y="${270 + i * 84}" font-size="68" font-weight="700" fill="#f2f3f8">${escapeXml(l)}</text>`,
    )
    .join('\n  ')
  const descY = 270 + titleLines.length * 84 + 24
  const descSpans = descLines
    .map(
      (l, i) =>
        `<text x="96" y="${descY + i * 44}" font-size="30" fill="#9aa1b5">${escapeXml(l)}</text>`,
    )
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b0b10"/>
      <stop offset="1" stop-color="#171e31"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1050" cy="80" r="220" fill="#2f6feb" fill-opacity="0.12"/>
  <circle cx="120" cy="580" r="160" fill="#7c5cff" fill-opacity="0.10"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="none" stroke="#2f6feb" stroke-opacity="0.35" stroke-width="2"/>
  <text x="96" y="150" font-size="34" font-weight="600" fill="#7c8cf8">${escapeXml(root.site.title)}</text>
  <text x="1104" y="150" text-anchor="end" font-size="26" fill="#5b6172">${escapeXml(crumb)}</text>
  ${titleSpans}
  ${descSpans}
  <text x="96" y="540" font-size="26" fill="#5b6172">${escapeXml(root.site.url)}</text>
</svg>`
}

type ResvgClass = new (svg: string, opts?: unknown) => { render: () => { asPng: () => Uint8Array } }

async function generateOgImages(root: SourceRoot, outDir: string): Promise<string[]> {
  let Resvg: ResvgClass | null = null
  try {
    const mod = (await import('@resvg/resvg-js')) as unknown as { Resvg: ResvgClass }
    Resvg = mod.Resvg
  } catch {
    console.warn('[fumadocs-source] @resvg/resvg-js unavailable — skipping OG images')
    return []
  }

  const written: string[] = []
  const ogDir = path.join(outDir, 'og')
  fs.mkdirSync(ogDir, { recursive: true })

  const ResvgCtor = Resvg
  const render = (svg: string, file: string) => {
    if (!ResvgCtor) return
    const resvg = new ResvgCtor(svg, {
      fitTo: { mode: 'width', value: 1200 },
      font: {
        loadSystemFonts: true,
        fontDirs: ['C:\\Windows\\Fonts', '/usr/share/fonts', '/System/Library/Fonts'],
        defaultFontFamily: 'Microsoft YaHei',
      },
    })
    fs.writeFileSync(path.join(ogDir, file), Buffer.from(resvg.render().asPng()))
    written.push(`og/${file}`)
  }

  // site card for home / fallback
  render(
    ogSvg(root, root.site.title, root.site.description, ''),
    'index.png',
  )

  for (const page of root.pages) {
    const file = `${page.slug.replace(/\//g, '-') || 'index'}.png`
    render(ogSvg(root, page.title, page.description, pageUrl(page.slug)), file)
  }
  return written
}

// ---------------------------------------------------------------------------
// docgen injection — API reference pages merged into the content pipeline
// ---------------------------------------------------------------------------

function injectApi(root: SourceRoot, pages: ApiPage[], opts: DocgenOptions, defaultLocale: string): void {
  const locale = opts.locale ?? defaultLocale
  const data = root.byLocale[locale]
  if (!data) return

  // drop previously injected pages (re-scan) before merging
  const slugRoot = opts.slug ?? 'api'
  data.pages = data.pages.filter((p) => !p.api)
  data.tree = data.tree.filter((n) => !(n.type === 'folder' && n.name === slugRoot))
  data.searchIndex = data.searchIndex.filter((e) => !e.url.startsWith(`/docs/${slugRoot}`))

  const nodes: PageTreeNode[] = pages.map((p) => ({
    type: 'page',
    name: p.data.name,
    url: `/docs/${p.slug}`,
    title: p.title,
  }))
  data.tree.push({
    type: 'folder',
    name: slugRoot,
    title: opts.title ?? 'API 参考',
    url: nodes[0]?.url,
    defaultOpen: false,
    children: nodes,
  })

  for (const p of pages) {
    const page: PageData = {
      slug: p.slug,
      locale,
      file: '',
      title: p.title,
      description: p.description,
      toc: p.data.toc,
      api: p.data,
    }
    data.pages.push(page)
    data.searchIndex.push({
      id: `page:${p.slug}`,
      type: 'page',
      url: `/docs/${p.slug}`,
      title: p.title,
      content: p.description ?? '',
      locale,
    })
  }
  root.pages = Object.values(root.byLocale).flatMap((d) => d.pages)
}

// ---------------------------------------------------------------------------
// plugin
// ---------------------------------------------------------------------------

export function fumadocsSource(opts: FumadocsSourceOptions = {}): Plugin {
  let cwd = process.cwd()
  let root: SourceRoot
  let viteConfig: ResolvedConfig | undefined

  let apiPages: ApiPage[] = []
  const applyDocgen = () => {
    if (opts.docgen && apiPages.length) injectApi(root, apiPages, opts.docgen, root.defaultLocale)
  }
  const rescan = () => {
    root = scanContent(cwd, opts)
    applyDocgen()
  }
  rescan()

  // kick off TypeDoc once; re-merge when it lands (dev + build await this)
  const docgenDone: Promise<void> | null = opts.docgen
    ? generateApiPages(opts.docgen)
        .then((pages) => {
          apiPages = pages
          rescan()
          console.log(`[fumadocs-source] docgen: ${pages.length} API pages generated`)
        })
        .catch((e) => {
          console.warn('[fumadocs-source] docgen failed:', (e as Error).message)
        })
    : null

  const virtualCode = () =>
    `// generated by fumadocs-source plugin\nexport const source = ${JSON.stringify(root)};\n`

  return {
    name: 'fumadocs-source',
    resolveId(id) {
      if (id === VIRTUAL_SOURCE) return RESOLVED_SOURCE
    },
    load(id) {
      if (id === RESOLVED_SOURCE) return virtualCode()
    },
    configResolved(config) {
      viteConfig = config
    },
    async buildStart() {
      // build: make sure API pages exist before bundling starts
      if (docgenDone) await docgenDone
      rescan()
    },
    async configureServer(server: ViteDevServer) {
      // dev: wait for TypeDoc so the first page load already has API pages
      if (docgenDone) await docgenDone
      rescan()
      const reload = (file: string) => {
        const rel = path.relative(cwd, file)
        if (!rel.startsWith(CONTENT_ROOT)) return
        rescan()
        const mod = server.moduleGraph.getModuleById(RESOLVED_SOURCE)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('change', reload)
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)

      const text = (body: string, type = 'text/plain; charset=utf-8') =>
        (_req: unknown, res: { setHeader: (k: string, v: string) => void; end: (b: string) => void }) => {
          res.setHeader('Content-Type', type)
          res.end(body)
        }

      // dev middlewares for generated files
      server.middlewares.use('/llms.txt', text(generateLlmsTxt(root.byLocale[root.defaultLocale], root.site)))
      server.middlewares.use('/sitemap.xml', text(generateSitemap(root), 'application/xml; charset=utf-8'))
      server.middlewares.use('/robots.txt', text(generateRobots(root.site)))
      server.middlewares.use(
        '/routes.json',
        text(JSON.stringify(['/', ...root.pages.map((p) => pageUrl(p.slug))]), 'application/json; charset=utf-8'),
      )
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: generateLlmsTxt(root.byLocale[root.defaultLocale], root.site) })
      for (const l of root.locales) {
        if (!l.isDefault && root.byLocale[l.code]?.pages.length) {
          this.emitFile({ type: 'asset', fileName: `llms-${l.code}.txt`, source: generateLlmsTxt(root.byLocale[l.code], root.site) })
        }
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: generateSitemap(root) })
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: generateRobots(root.site) })
      this.emitFile({
        type: 'asset',
        fileName: 'routes.json',
        source: JSON.stringify(['/', ...root.pages.map((p) => pageUrl(p.slug))]),
      })
    },
    async closeBundle() {
      if (opts.og === false) return
      const outDir = viteConfig?.build?.outDir ?? 'dist'
      const abs = path.isAbsolute(outDir) ? outDir : path.join(cwd, outDir)
      try {
        const files = await generateOgImages(root, abs)
        if (files.length) console.log(`[fumadocs-source] generated ${files.length} OG images`)
      } catch (e) {
        console.warn('[fumadocs-source] OG image generation failed:', (e as Error).message)
      }
    },
  }
}
