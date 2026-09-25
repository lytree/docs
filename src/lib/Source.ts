import { source, type PageData, type PageTreeNode, type SearchEntry, type SourceData } from 'virtual:source'

export type { PageData, PageTreeNode, SearchEntry, SourceData, TocItem, SiteInfo, LocaleInfo } from 'virtual:source'

/** site metadata from build config */
export const site = source.site
export const locales = source.locales
export const defaultLocale = source.defaultLocale

const localeCodes = new Set(locales.map((l) => l.code))

/** locale of a docs slug: 'en/other/x' -> 'en', unprefixed -> default locale */
export function localeOfSlug(slug: string): string {
  const first = slug.split('/')[0]
  return localeCodes.has(first) ? first : defaultLocale
}

/** remove the locale prefix from a slug */
export function stripLocale(slug: string): string {
  const parts = slug.split('/')
  return localeCodes.has(parts[0]) ? parts.slice(1).join('/') : slug
}

export function dataFor(locale: string): SourceData {
  return (
    source.byLocale[locale] ??
    source.byLocale[defaultLocale] ?? { pages: [], tree: [], searchIndex: [] }
  )
}

export function pageBySlug(slug: string): PageData | undefined {
  return source.pages.find((p) => p.slug === slug)
}

export function urlBySlug(slug: string): string {
  return `/docs${slug ? `/${slug}` : ''}`
}

export function searchIndexFor(locale: string): SearchEntry[] {
  return dataFor(locale).searchIndex
}

/** flatten tree into ordered page list (for prev/next pagination) */
export function flattenTree(nodes: PageTreeNode[]): PageTreeNode[] {
  const out: PageTreeNode[] = []
  for (const node of nodes) {
    if (node.type === 'separator') continue
    out.push(node)
    if (node.type === 'folder' && node.children) out.push(...flattenTree(node.children))
  }
  return out
}

/** find the sidebar root: the root-folder containing the slug (fumadocs "root folders") */
export function sidebarRoot(slug: string, treeNodes?: PageTreeNode[]): PageTreeNode[] {
  const nodes = treeNodes ?? dataFor(localeOfSlug(slug)).tree
  const url = urlBySlug(slug)
  const has = (list: PageTreeNode[]): boolean =>
    flattenTree(list).some((n) => n.url === url)

  const roots = nodes.filter(
    (n) => n.type === 'folder' && n.root && n.children && has(n.children),
  )
  if (roots.length > 0) {
    const root = roots[0]
    return [
      {
        ...root,
        type: 'folder',
        children: root.children ?? [],
      },
    ] as PageTreeNode[]
  }
  return nodes
}

export function breadcrumb(slug: string, treeNodes?: PageTreeNode[]): { title: string; url?: string }[] {
  const nodes = treeNodes ?? dataFor(localeOfSlug(slug)).tree
  const url = urlBySlug(slug)
  const crumbs: { title: string; url?: string }[] = []
  const walk = (list: PageTreeNode[], chain: { title: string; url?: string }[]): boolean => {
    for (const node of list) {
      if (node.type === 'separator') continue
      const next = [...chain, { title: node.title ?? node.name, url: node.url }]
      if (node.url === url) {
        crumbs.push(...next)
        return true
      }
      if (node.type === 'folder' && node.children && walk(node.children, next)) return true
    }
    return false
  }
  walk(nodes, [])
  return crumbs
}
