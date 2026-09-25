/**
 * Quick diagnostic: dump the source tree as JSON.
 *
 * Uses the same `fumadocsSource()` plugin the dev server uses, then asks it
 * for the virtual module content. Useful when debugging sidebar / nav-tab /
 * breadcrumb issues without going through the dev server.
 *
 * Usage:
 *   node --import tsx scripts/DumpTree.mjs           # full tree + page list
 *   node --import tsx scripts/DumpTree.mjs dotnet    # also prints sidebarRoot('dotnet')
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
// code is a string like: export const source = { ... };
const match = code.match(/export const source = (\{[\s\S]*\});?\s*$/)
if (!match) {
  console.error('Could not parse virtual:source payload')
  console.error(code.slice(0, 200))
  process.exit(1)
}
const root = JSON.parse(match[1])

const slug = process.argv[2]
const tree = root.byLocale[root.defaultLocale].tree
const localeCodes = new Set(root.locales.map((l) => l.code))

console.log('locales:', root.locales)
console.log('defaultLocale:', root.defaultLocale)
console.log('pages:', root.pages.length)
console.log()
console.log('tree:')
console.log(JSON.stringify(tree, null, 2))
console.log()
console.log('pages (slug → url):')
for (const p of root.pages) {
  const url = `/docs${p.slug ? '/' + p.slug : ''}`
  console.log(`  ${(p.slug || '<root>').padEnd(48)} ${url.padEnd(56)} ${p.title}`)
}

if (slug !== undefined) {
  const url = `/docs${slug ? '/' + slug : ''}`
  const flattenTree = (nodes) => {
    const out = []
    for (const n of nodes) {
      if (n.type === 'separator') continue
      out.push(n)
      if (n.type === 'folder' && n.children) out.push(...flattenTree(n.children))
    }
    return out
  }
  const sidebarRoot = (nodes, wantUrl) => {
    const has = (list) => flattenTree(list).some((n) => n.url === wantUrl)
    const roots = nodes.filter((n) => n.type === 'folder' && n.root && n.children && has(n.children))
    if (roots.length > 0) return roots
    return nodes
  }
  console.log()
  console.log(`sidebarRoot("${slug}") →`)
  console.log(JSON.stringify(sidebarRoot(tree, url), null, 2))

  // root folders (nav tabs)
  console.log()
  console.log('rootFolders (nav tabs):')
  console.log(JSON.stringify(tree.filter((n) => n.type === 'folder' && n.root).map((n) => ({
    title: n.title ?? n.name,
    icon: n.icon,
    url: n.url,
    children: n.children?.length ?? 0,
  })), null, 2))
}
