#!/usr/bin/env node
/**
 * Scaffold a new Vue 3 TSX component (.tsx + .module.scss) under src/.
 *
 * Interactive:
 *   node scripts/NewComponent.mjs
 *
 * Non-interactive:
 *   node scripts/NewComponent.mjs <Kind> <Name> [--no-style] [--with-props]
 *                                          [--no-state] [--force]
 *
 *   <Kind>     "component" -> src/components/   (default)
 *              "page"      -> src/pages/
 *   <Name>     PascalCase component name, e.g. "Card" or "UserProfile"
 *
 *   --no-style    skip generating the .module.scss
 *   --with-props  include a typed Props interface and props: { ... }
 *   --no-state    omit ref/computed imports & state scaffolding
 *   --force       overwrite existing files
 *
 * Examples:
 *   node scripts/NewComponent.mjs component Card
 *   node scripts/NewComponent.mjs page UserProfile --with-props
 *   node scripts/NewComponent.mjs component Badge --no-style
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const SRC_DIR = resolve(ROOT, 'src')

const KINDS = ['component', 'page']

function pascalCase(s) {
  return String(s ?? '')
    .replace(/[_\-\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (_, c) => c.toUpperCase())
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

function dirFor(kind) {
  return kind === 'page' ? resolve(SRC_DIR, 'pages') : resolve(SRC_DIR, 'components')
}

function fileBase(dir, name) {
  return resolve(dir, name)
}

function buildTsx({ name, kind, withProps, hasState, hasStyle }) {
  const innerLines = []
  if (withProps) innerLines.push('        <h1>{props.title}</h1>')
  innerLines.push('        {/* TODO: implement */}')
  const inner = innerLines.join('\n')

  const imports = [`import { defineComponent, Fragment${hasState ? ', ref, computed' : ''} } from 'vue'`]
  if (hasStyle) imports.push(`import s from './${name}.module.scss'`)

  const parts = [imports.join('\n')]

  if (withProps) {
    parts.push('')
    parts.push('interface Props {')
    parts.push('  /** TODO: document props */')
    parts.push('  title?: string')
    parts.push('}')
  }

  parts.push('')
  parts.push(`export const ${name} = defineComponent({`)
  parts.push(`  name: '${name}',`)

  if (withProps) {
    parts.push('  props: {')
    parts.push('    title: { type: String, default: \'\' },')
    parts.push('  },')
  }

  parts.push(`  setup${withProps ? '(props)' : '()'} {`)
  if (hasState) parts.push('    // const state = ref(\'\')')
  parts.push('    return () => (')
  parts.push('      <Fragment>')
  parts.push(inner)
  parts.push('      </Fragment>')
  parts.push('    )')
  parts.push('  },')
  parts.push('})')

  return parts.join('\n')
}

function buildScss({ name, kind }) {
  const heading = kind === 'page' ? `${name} — page` : `${name} — component`
  return [
    `/* ============================================================`,
    `   ${heading}`,
    `   ============================================================ */`,
    '.root {',
    '  /* TODO: styles */',
    '}',
    '',
  ].join('\n')
}

function listExisting(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((n) => {
    try {
      return statSync(resolve(dir, n)).isFile()
    } catch {
      return false
    }
  })
}

async function pickKind(rl) {
  console.log('Available kinds:')
  for (const k of KINDS) console.log(`  - ${k}`)
  while (true) {
    const ans = (await rl.question('Kind (component | page): ')).trim().toLowerCase()
    if (KINDS.includes(ans)) return ans
    if (ans === 'cancel') return null
    console.log(`  ! invalid kind "${ans}".`)
  }
}

async function pickName(rl, kind) {
  const dir = dirFor(kind)
  const existing = listExisting(dir).map((f) => f.replace(/\.(tsx|module\.scss)$/, ''))
  if (existing.length) {
    console.log(`Existing ${kind}s:`)
    for (const n of existing) console.log(`  - ${n}`)
  }
  while (true) {
    const ans = (await rl.question('Name (PascalCase): ')).trim()
    if (!ans) continue
    if (ans === 'cancel') return null
    const pascal = pascalCase(ans)
    if (pascal !== ans) console.log(`  ! normalized to "${pascal}"`)
    if (existing.includes(pascal)) console.log(`  ! "${pascal}" already exists. Try again.`)
    else return pascal
  }
}

async function askYesNo(rl, question, def) {
  const hint = def === undefined ? 'y/n' : def ? 'Y/n' : 'y/N'
  const ans = (await rl.question(`${question} (${hint}): `)).trim().toLowerCase()
  if (!ans) return def === undefined ? false : def
  return ans.startsWith('y')
}

async function interactiveMode() {
  const rl = readline.createInterface({ input, output })
  try {
    const kind = await pickKind(rl)
    if (!kind) return
    const name = await pickName(rl, kind)
    if (!name) return
    const withProps = await askYesNo(rl, 'Include typed Props interface?', true)
    const hasState = await askYesNo(rl, 'Include ref/computed scaffolding?', true)
    const hasStyle = await askYesNo(rl, 'Generate .module.scss?', true)
    const force = await askYesNo(rl, 'Overwrite if files exist?', false)
    await run({ kind, name, withProps, hasState, hasStyle, flags: { force } })
  } finally {
    rl.close()
  }
}

async function run({ kind, name, withProps, hasState, hasStyle, flags }) {
  if (!KINDS.includes(kind)) throw new Error(`invalid kind "${kind}". Use ${KINDS.join(' | ')}.`)
  const pascal = pascalCase(name)
  if (!pascal || !/^[A-Z][A-Za-z0-9]+$/.test(pascal)) {
    throw new Error(`invalid name "${name}". Must be PascalCase, e.g. "Card".`)
  }
  const dir = dirFor(kind)
  ensureDir(dir)

  const tsxPath = fileBase(dir, `${pascal}.tsx`)
  const scssPath = fileBase(dir, `${pascal}.module.scss`)
  const collisions = []
  if (existsSync(tsxPath)) collisions.push(tsxPath)
  if (hasStyle && existsSync(scssPath)) collisions.push(scssPath)

  if (collisions.length && !flags.force) {
    throw new Error(
      `file(s) already exist:\n  ${collisions.join('\n  ')}\n(use --force to overwrite)`,
    )
  }

  const tsx = buildTsx({ name: pascal, kind, withProps, hasState, hasStyle })
  writeFileSync(tsxPath, tsx + '\n', 'utf8')
  if (hasStyle) {
    const scss = buildScss({ name: pascal, kind })
    writeFileSync(scssPath, scss, 'utf8')
  }

  console.log('')
  console.log(`Created ${pascal} (${kind}):`)
  console.log(`  + ${tsxPath}`)
  if (hasStyle) console.log(`  + ${scssPath}`)
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true })
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2))

  if (positional.length === 0) {
    await interactiveMode()
    return
  }

  const [rawKind, rawName] = positional
  const kind = (rawKind ?? 'component').toLowerCase()
  await run({
    kind,
    name: rawName,
    withProps: Boolean(flags['with-props']),
    hasState: !flags['no-state'],
    hasStyle: !flags['no-style'],
    flags,
  })
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
