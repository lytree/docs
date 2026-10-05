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

/** landing url of a root folder: its own index page, else its first descendant
 *  page, else /docs — a category with no `index.md` must still be clickable. */
function folderLanding(folder: PageTreeNode): string {
  if (folder.url) return folder.url
  for (const node of flattenTree(folder.children ?? [])) {
    if (node.type === 'page' && node.url) return node.url
  }
  return '/docs'
}

/** all top-level root folders of a locale, plus the one owning `slug`.
 *  Used by the sidebar category switcher (one-click directory jump). */
export function rootFoldersOf(slug: string): {
  folders: { node: PageTreeNode; href: string }[]
  active?: PageTreeNode
} {
  const nodes = dataFor(localeOfSlug(slug)).tree
  const url = urlBySlug(slug)
  const roots = nodes.filter((n) => n.type === 'folder' && n.root)

  const folders = roots.map((node) => ({ node, href: folderLanding(node) }))
  const owns = (node: PageTreeNode) =>
    node.url === url || flattenTree(node.children ?? []).some((n) => n.url === url)

  const active = roots.find(owns)
  return { folders, active }
}

/** find the parent folder of a slug and return its page children, skipping the slug itself.
 *  Used by DocsCategory — index pages list their siblings as cards. */
export function getPageTreePeers(slug: string, treeNodes?: PageTreeNode[]): PageTreeNode[] {
  const nodes = treeNodes ?? dataFor(localeOfSlug(slug)).tree
  const url = urlBySlug(slug)

  const findFolder = (list: PageTreeNode[], chain: PageTreeNode[]): PageTreeNode[] | null => {
    for (const n of list) {
      if (n.type === 'separator') continue
      if (n.type === 'folder') {
        if (n.url === url) return [...chain, n]
        const sub = n.children ? findFolder(n.children, [...chain, n]) : null
        if (sub) return sub
      } else if (n.type === 'page' && n.url === url) {
        return chain
      }
    }
    return null
  }

  const folderChain = findFolder(nodes, [])
  if (!folderChain || folderChain.length === 0) {
    // page lives at the content root — peers are the other root nodes
    return nodes.filter((n) => n.type !== 'separator' && !(n.type === 'page' && n.url === url))
  }
  const parent = folderChain[folderChain.length - 1]
  return (parent.children ?? []).filter(
    (n) => n.type !== 'separator' && !(n.type === 'page' && n.url === url),
  )
}

export function breadcrumb(slug: string, treeNodes?: PageTreeNode[]): { title: string; url?: string }[] {
  const nodes = treeNodes ?? dataFor(localeOfSlug(slug)).tree
  const url = urlBySlug(slug)
  const crumbs: { title: string; url?: string }[] = []
  const walk = (list: PageTreeNode[], chain: { title: string; url?: string }[]): boolean => {
    for (const node of list) {
      if (node.type === 'separator') continue
      // folders without an index page have no url — they aren't clickable in
      // the sidebar either, so including them in the breadcrumb just produces
      // a dead label ("Uv" / "Regular") between the parent category and the
      // page. Descend without adding them to the chain.
      const next =
        node.type === 'folder' && !node.url
          ? chain
          : [...chain, { title: node.title ?? node.name, url: node.url }]
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
