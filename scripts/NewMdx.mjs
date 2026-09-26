#!/usr/bin/env node
/**
 * Create a new MDX doc page under content/docs/ and register it in meta.json.
 *
 * Interactive:
 *   node scripts/NewMdx.mjs
 *
 * Non-interactive:
 *   node scripts/NewMdx.mjs <category> <title> [--description="..."] [--name=slug]
 *                            [--icon=emoji] [--full] [--no-meta] [--force]
 *
 *   <category>   path relative to content/docs/, e.g. "java" or "java/web"
 *   <title>      page title (required in non-interactive mode)
 *   --name=      file name without extension; defaults to a slug of the title
 *   --description=
 *   --icon=      emoji icon (optional)
 *   --full       mark the page as full-width (no sidebar/TOC)
 *   --no-meta    skip touching meta.json
 *   --force      overwrite if the file already exists
 *
 * Examples:
 *   node scripts/NewMdx.mjs java/web "JWT cookie session"
 *   node scripts/NewMdx.mjs java/web "JWT cookie session" --description="..." --full
 *   node scripts/NewMdx.mjs other/js "正则速查" --name=regex
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const CONTENT_DIR = resolve(ROOT, 'content/docs')

function toSlug(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.mdx?$/i, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function nowStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`
}

function parseArgs(argv) {
  const positional = []
  const flags = {}
  for (const arg of argv) {
    if (arg.startsWith('--')) {
      const eq = arg.indexOf('=')
      if (eq === -1) flags[arg.slice(2)] = true
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1)
    } else {
      positional.push(arg)
    }
  }
  return { positional, flags }
}

function categoryDir(category) {
  return resolve(CONTENT_DIR, category)
}

function filePath(category, name) {
  return resolve(categoryDir(category), `${name}.mdx`)
}

function categoryMetaPath(category) {
  return resolve(categoryDir(category), 'meta.json')
}

function rootMetaPath() {
  return resolve(CONTENT_DIR, 'meta.json')
}

function readJsonSafe(p, fallback) {
  if (!existsSync(p)) return fallback
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch {
    return fallback
  }
}

function listTopLevelCategories() {
  if (!existsSync(CONTENT_DIR)) return []
  return readdirSync(CONTENT_DIR).filter((n) => {
    try {
      return statSync(resolve(CONTENT_DIR, n)).isDirectory()
    } catch {
      return false
    }
  })
}

async function pickCategory(rl) {
  const cats = listTopLevelCategories()
  console.log('Available top-level categories:')
  for (const c of cats) console.log(`  - ${c}`)
  while (true) {
    const ans = (await rl.question('Category (e.g. "java" or "java/web"): ')).trim()
    if (!ans) continue
    if (ans === 'cancel') return null
    if (existsSync(categoryDir(ans))) return ans
    console.log(`  ! "${ans}" does not resolve under content/docs/. Try again.`)
  }
}

async function askTitle(rl, defaultTitle) {
  while (true) {
    const ans = (
      await rl.question(`Title${defaultTitle ? ` [${defaultTitle}]` : ''}: `)
    ).trim()
    const v = ans || defaultTitle
    if (v) return v
    console.log('  ! title is required.')
  }
}

async function askYesNo(rl, question, def) {
  const hint = def === undefined ? 'y/n' : def ? 'Y/n' : 'y/N'
  const ans = (await rl.question(`${question} (${hint}): `)).trim().toLowerCase()
  if (!ans) return def === undefined ? false : def
  return ans.startsWith('y')
}

async function askOptional(rl, question, def) {
  const ans = (await rl.question(`${question}${def ? ` [${def}]` : ''}: `)).trim()
  return ans || def || ''
}

function buildFrontmatter({ title, description, icon, full }) {
  const now = nowStamp()
  const lines = ['---']
  lines.push(`title: ${JSON.stringify(title)}`)
  if (description) lines.push(`description: ${JSON.stringify(description)}`)
  if (icon) lines.push(`icon: ${JSON.stringify(icon)}`)
  lines.push(`date: ${now}`)
  lines.push(`lastmod: ${now}`)
  if (full) lines.push('full: true')
  lines.push('---', '')
  return lines.join('\n')
}

function buildBody({ title, description }) {
  const head = `# ${title}\n\n`
  const intro = description ? `> ${description}\n\n` : ''
  const placeholder = [
    '在这里写下正文。支持：',
    '',
    '- GFM 表格、任务列表、删除线',
    '- 代码块（Shiki 高亮，可加 `title="..."` 与 `{1-3}` 高亮标记）',
    '- 数学公式 `$...$` / `$$...$$`',
    '- 组件：`<Callout>` `<Cards><Card>` `<Tabs><Tab>` `<Accordion>` `<Steps><Step>`',
    '',
  ].join('\n')
  return head + intro + placeholder
}

function registerInMeta(category, slug, flags) {
  if (flags['no-meta']) return { touched: false, reason: 'no-meta flag' }
  const metaPath = categoryMetaPath(category)
  const meta = readJsonSafe(metaPath, null)
  if (!meta) {
    return { touched: false, reason: `no meta.json at ${metaPath}` }
  }
  const pages = Array.isArray(meta.pages) ? meta.pages : []
  if (pages.includes(slug)) {
    return { touched: false, reason: `already listed in ${metaPath}` }
  }
  // Skip when the meta uses the "..." wildcard — the source plugin already
  // picks up everything in the directory, so an explicit entry would either
  // duplicate or fight the wildcard.
  if (pages.includes('...')) {
    return { touched: false, reason: `"..." wildcard in ${metaPath}; auto-picked up` }
  }
  meta.pages = [...pages, slug]
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8')
  return { touched: true, path: metaPath }
}

function rootMetaStatus() {
  const root = rootMetaPath()
  if (!existsSync(root)) return 'no root meta.json'
  return 'top-level category is the user\'s responsibility'
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

async function interactiveMode() {
  const rl = readline.createInterface({ input, output })
  try {
    const category = await pickCategory(rl)
    if (!category) return
    const title = await askTitle(rl)
    const defaultSlug = toSlug(title)
    const name = (
      await rl.question(`File name without extension [${defaultSlug}]: `)
    ).trim() || defaultSlug
    const description = await askOptional(rl, 'Description (optional)')
    const icon = await askOptional(rl, 'Icon emoji (optional)')
    const full = await askYesNo(rl, 'Full-width page (no sidebar)?', false)
    const noMeta = await askYesNo(rl, 'Skip updating meta.json?', false)
    const force = await askYesNo(rl, 'Overwrite if file exists?', false)
    await run({
      category,
      title,
      name,
      description: description || undefined,
      icon: icon || undefined,
      full,
      flags: { 'no-meta': noMeta, force },
    })
  } finally {
    rl.close()
  }
}

async function run({ category, title, name, description, icon, full, flags }) {
  if (!category) throw new Error('category is required')
  if (!title) throw new Error('title is required')
  const slug = name && name.trim() ? toSlug(name) : toSlug(title)
  if (!slug) throw new Error('could not derive a valid file name from title/name')

  const dir = categoryDir(category)
  ensureDir(dir)

  const target = filePath(category, slug)
  if (existsSync(target) && !flags.force) {
    throw new Error(`file already exists: ${target} (use --force to overwrite)`)
  }

  const frontmatter = buildFrontmatter({ title, description, icon, full })
  const body = buildBody({ title, description })
  writeFileSync(target, frontmatter + body, 'utf8')

  const metaResult = registerInMeta(category, slug, flags)

  console.log('')
  console.log('Created:')
  console.log(`  ${target}`)
  if (metaResult.touched) {
    console.log(`  + appended "${slug}" to ${metaResult.path}`)
  } else {
    console.log(`  · meta.json not modified (${metaResult.reason})`)
  }
  console.log(`  · root meta.json: ${rootMetaStatus()}`)
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))

  if (positional.length === 0) {
    await interactiveMode()
    return
  }

  const [category, title] = positional
  const name = typeof flags.name === 'string' ? flags.name : undefined
  const description = typeof flags.description === 'string' ? flags.description : undefined
  const icon = typeof flags.icon === 'string' ? flags.icon : undefined
  const full = Boolean(flags.full)

  await run({
    category,
    title,
    name,
    description,
    icon,
    full,
    flags,
  })
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
