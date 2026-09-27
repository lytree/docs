/**
 * Simulate breadcrumb() walk over the generated tree and report pages that
 * either skip the breadcrumb or yield unexpectedly short ones. Useful for
 * debugging the "some pages don't show breadcrumb" question.
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cwd = resolve(__dirname, '..')

const { fumadocsSource } = await import(pathToFileURL(resolve(cwd, 'plugins/Source.ts')).href)
const plugin = fumadocsSource({
  site: { url: 'http://localhost', title: '杨 ◦ 柳', description: '' },
  i18n: { locales: [{ code: 'zh', name: '中文' }], defaultLocale: 'zh' },
})

const code = plugin.load.call({ error: () => {} }, '\0virtual:source')
const match = code.match(/export const source = (\{[\s\S]*\});?\s*$/)
if (!match) { console.error('parse fail'); process.exit(1) }
const root = JSON.parse(match[1])
const tree = root.byLocale[root.defaultLocale].tree

const urlBySlug = (slug) => `/docs${slug ? '/' + slug : ''}`

function breadcrumb(slug) {
  const url = urlBySlug(slug)
  const crumbs = []
  const walk = (list, chain) => {
    for (const node of list) {
      if (node.type === 'separator') continue
      const next =
        node.type === 'folder' && !node.url
          ? chain
          : [...chain, { title: node.title ?? node.name, url: node.url }]
      if (node.url === url) { crumbs.push(...next); return true }
      if (node.type === 'folder' && node.children && walk(node.children, next)) return true
    }
    return false
  }
  walk(tree, [])
  return crumbs
}

const flatPages = (nodes, out = []) => {
  for (const n of nodes) {
    if (n.type === 'separator') continue
    if (n.type === 'page') out.push(n)
    if (n.type === 'folder' && n.children) flatPages(n.children, out)
  }
  return out
}
const all = flatPages(tree)

const empty = []
const lenOne = []
for (const p of all) {
  const url = p.url
  const slug = url.replace(/^\/docs\/?/, '').replace(/\/$/, '')
  const crumbs = breadcrumb(slug)
  if (crumbs.length === 0) empty.push({ url, title: p.title })
  else if (crumbs.length === 1) lenOne.push({ url, title: p.title, crumb: crumbs[0] })
}

console.log(`total pages in tree: ${all.length}`)
console.log(`empty breadcrumbs: ${empty.length}`)
for (const e of empty) console.log(`  EMPTY  ${e.url.padEnd(50)} ${e.title}`)
console.log()
console.log(`breadcrumb length == 1 (only parent, no current page): ${lenOne.length}`)
for (const e of lenOne) console.log(`  LEN=1  ${e.url.padEnd(50)} breadcrumb shows "${e.crumb.title}"`)
