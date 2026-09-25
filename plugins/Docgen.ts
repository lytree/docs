/**
 * Docgen — TypeDoc powered API reference generator.
 *
 * Mirrors fumadocs-docgen: runs TypeDoc programmatically, walks the serialized
 * reflection JSON and produces structured API pages that are injected into the
 * content pipeline (page tree, search index, sitemap, OG images, prerender).
 */
import path from 'node:path'
import GithubSlugger from 'github-slugger'

// ---------------------------------------------------------------------------
// public types (shared with the client via virtual:source declarations)
// ---------------------------------------------------------------------------

export interface ApiParam {
  name: string
  type: string
  required: boolean
  comment?: string
  defaultValue?: string
}

export interface ApiSignature {
  code: string
  params: ApiParam[]
  returns?: string
  returnsComment?: string
  typeParams: { name: string; comment?: string }[]
}

export interface ApiMemberData {
  name: string
  kind: 'property' | 'method' | 'constructor' | 'enum-member' | 'index-signature' | 'call-signature' | 'get' | 'set'
  anchor: string
  type?: string
  comment?: string
  required?: boolean
  readonly?: boolean
  static?: boolean
  defaultValue?: string
  signatures?: ApiSignature[]
}

export interface ApiDocData {
  kind: 'class' | 'interface' | 'function' | 'enum' | 'type-alias' | 'variable'
  name: string
  summary?: string
  remarks?: string
  examples?: string[]
  typeParams?: { name: string; comment?: string }[]
  /** flattened type string (type alias / variable) */
  type?: string
  signatures?: ApiSignature[]
  members?: ApiMemberData[]
  /** extends/implements clauses */
  heritage?: string[]
  sources?: { fileName: string; line: number }[]
  toc: { title: string; url: string; depth: number }[]
}

export interface ApiPage {
  slug: string
  title: string
  description?: string
  data: ApiDocData
}

export interface DocgenOptions {
  /** TS entry files to document (relative to project root) */
  entryPoints: string[]
  tsconfig?: string
  /** url slug prefix, default 'api' → pages live at /docs/api/... */
  slug?: string
  /** which locale tree receives the API folder; defaults to the default locale */
  locale?: string
  /** folder title in the sidebar, default 'API 参考' */
  title?: string
}

// ---------------------------------------------------------------------------
// typedoc reflection kind ids (stable numeric values from ReflectionKind)
// ---------------------------------------------------------------------------

const K = {
  Module: 2,
  Namespace: 4,
  Enum: 8,
  EnumMember: 16,
  Variable: 32,
  Function: 64,
  Class: 128,
  Interface: 256,
  Constructor: 512,
  Property: 1024,
  Method: 2048,
  IndexSignature: 8192,
  TypeAlias: 2097152,
  Accessor: 262144,
} as const

type Json = Record<string, any> | undefined | null

// ---------------------------------------------------------------------------
// json helpers
// ---------------------------------------------------------------------------

function textOf(parts?: Json): string {
  if (!parts) return ''
  if (!Array.isArray(parts)) return String(parts)
  return parts.map((p) => (typeof p === 'string' ? p : (p?.text ?? ''))).join('').trim()
}

function commentOf(c?: Json): string | undefined {
  const t = textOf(c?.summary)
  return t || undefined
}

function blockTags(c?: Json, tag?: string): Record<string, any>[] {
  if (!c || !Array.isArray(c.blockTags)) return []
  return c.blockTags.filter((t: Record<string, any>) => !tag || t.tag === tag)
}

function tagText(c: Json, tag: string): string | undefined {
  const found = blockTags(c, tag)[0]
  return found ? textOf(found.content) : undefined
}

function hasFlag(r: Json, name: string): boolean {
  const f = r?.flags
  if (!f) return false
  if (Array.isArray(f)) {
    const lower = name.toLowerCase()
    return f.some((x: unknown) => String(x).toLowerCase().includes(lower))
  }
  if (typeof f === 'object') {
    const camel = `is${name[0].toUpperCase()}${name.slice(1).toLowerCase()}`
    return !!f[name] || !!f[camel] || !!f[name.toLowerCase()]
  }
  return false
}

// ---------------------------------------------------------------------------
// type -> string serializer (covers the common JSON type nodes)
// ---------------------------------------------------------------------------

function typeToString(t: Json): string {
  if (!t) return 'unknown'
  switch (t.type) {
    case 'intrinsic':
      return String(t.name)
    case 'reference': {
      const args = Array.isArray(t.typeArguments) ? t.typeArguments.map(typeToString).join(', ') : ''
      return `${t.name}${args ? `<${args}>` : ''}`
    }
    case 'array':
      return `${typeToString(t.elementType)}[]`
    case 'union':
      return (t.types ?? []).map(typeToString).join(' | ') || 'unknown'
    case 'intersection':
      return (t.types ?? []).map(typeToString).join(' & ') || 'unknown'
    case 'literal':
      return typeof t.value === 'string' ? JSON.stringify(t.value) : String(t.value)
    case 'tuple':
      return `[${(t.elements ?? []).map(typeToString).join(', ')}]`
    case 'named-tuple-member':
      return `${t.name}${hasFlag(t, 'optional') ? '?' : ''}: ${typeToString(t.element)}`
    case 'reflection':
      return reflectionToString(t.declaration)
    case 'predicate':
      return t.name ? `${t.name} is ${typeToString(t.asserts ?? t.targetType)}` : 'boolean'
    case 'query':
      return `typeof ${typeToString(t.queryType)}`
    case 'indexed':
      return `${typeToString(t.objectType)}[${typeToString(t.indexType)}]`
    case 'conditional':
      return `${typeToString(t.checkType)} extends ${typeToString(t.extendsType)} ? ${typeToString(t.trueType)} : ${typeToString(t.falseType)}`
    case 'mapped':
      return typeToString(t.template)
    case 'optional':
      return `${typeToString(t.elementType)}?`
    case 'rest':
      return `...${typeToString(t.elementType)}`
    case 'template-literal':
      return `\`${(t.head ?? '')}${(t.tail ?? []).map((p: Record<string, any>) => (p.type ? `\${${typeToString(p.type)}}` : '') + (p.text ?? '')).join('')}\``
    default:
      return t.name ?? 'unknown'
  }
}

function reflectionToString(decl: Json): string {
  if (!decl) return '{}'
  const sigs: Record<string, any>[] = decl.signatures ?? []
  if (sigs.length) return sigs.map((sg) => sigCode('', sg)).join(' | ')
  const idx: Record<string, any>[] = decl.indexSignatures ?? []
  if (idx.length) return `{ [${idx.map((i) => `[${(i.parameters ?? []).map((p: Record<string, any>) => `${p.name}: ${typeToString(p.type)}`).join(', ')}]: ${typeToString(i.type)}`).join('; ')}] }`
  const kids: Record<string, any>[] = decl.children ?? []
  if (!kids.length) return '{}'
  return `{ ${kids
    .map((c) => `${c.name}${hasFlag(c, 'optional') ? '?' : ''}: ${typeToString(c.type)}`)
    .join('; ')} }`
}

function sigCode(name: string, sg: Json): string {
  const tps = (sg?.typeParameter ?? [])
    .map((p: Record<string, any>) => {
      let s = p.name
      if (p.type) s += ` extends ${typeToString(p.type)}`
      if (p.default) s += ` = ${typeToString(p.default)}`
      return s
    })
    .join(', ')
  const params = (sg?.parameters ?? [])
    .map((p: Record<string, any>) => {
      const rest = hasFlag(p, 'rest') ? '...' : ''
      const opt = hasFlag(p, 'optional') ? '?' : ''
      return `${rest}${p.name}${opt}: ${typeToString(p.type)}`
    })
    .join(', ')
  const ret = sg?.type ? typeToString(sg.type) : 'void'
  return `${name}${tps ? `<${tps}>` : ''}(${params}): ${ret}`
}

function signatureOf(name: string, sg: Json): ApiSignature {
  return {
    code: sigCode(name, sg),
    params: (sg?.parameters ?? []).map((p: Record<string, any>) => ({
      name: `${hasFlag(p, 'rest') ? '...' : ''}${p.name}`,
      type: typeToString(p.type),
      required: !hasFlag(p, 'optional'),
      comment: commentOf(p.comment),
      defaultValue: tagText(p.comment, '@default'),
    })),
    returns: sg?.type ? typeToString(sg.type) : undefined,
    returnsComment: tagText(sg?.comment, '@returns'),
    typeParams: (sg?.typeParameter ?? []).map((p: Record<string, any>) => ({
      name: p.name,
      comment: commentOf(p.comment),
    })),
  }
}

// ---------------------------------------------------------------------------
// page builder
// ---------------------------------------------------------------------------

const KIND_LABEL: Record<number, ApiDocData['kind']> = {
  [K.Class]: 'class',
  [K.Interface]: 'interface',
  [K.Function]: 'function',
  [K.Enum]: 'enum',
  [K.TypeAlias]: 'type-alias',
  [K.Variable]: 'variable',
}

const kebab = (s: string): string =>
  s
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()

function buildMember(child: Record<string, any>, slugger: GithubSlugger): ApiMemberData | null {
  const anchor = slugger.slug(child.name)
  const common = { anchor, static: hasFlag(child, 'static') }

  switch (child.kind) {
    case K.Constructor:
      return {
        name: 'constructor',
        kind: 'constructor',
        ...common,
        comment: commentOf(child.signatures?.[0]?.comment) ?? commentOf(child.comment),
        signatures: (child.signatures ?? []).map((sg: Record<string, any>) => signatureOf('constructor', sg)),
      }
    case K.Property:
      return {
        name: child.name,
        kind: 'property',
        ...common,
        type: typeToString(child.type),
        comment: commentOf(child.comment),
        required: !hasFlag(child, 'optional'),
        readonly: hasFlag(child, 'readonly'),
        defaultValue: child.defaultValue ?? tagText(child.comment, '@default'),
      }
    case K.Accessor: {
      const get = child.getSignature
      const kind: ApiMemberData['kind'] = child.setSignature && !get ? 'set' : get ? 'get' : 'property'
      return {
        name: child.name,
        kind,
        ...common,
        type: get ? typeToString(get.type) : undefined,
        comment: commentOf(get?.comment) ?? commentOf(child.setSignature?.comment) ?? commentOf(child.comment),
        required: true,
        signatures: get ? [{ ...signatureOf(child.name, get), code: `get ${sigCode(child.name, get)}` }] : undefined,
      }
    }
    case K.Method:
      return {
        name: child.name,
        kind: 'method',
        ...common,
        comment: commentOf(child.signatures?.[0]?.comment) ?? commentOf(child.comment),
        signatures: (child.signatures ?? []).map((sg: Record<string, any>) => signatureOf(child.name, sg)),
      }
    case K.IndexSignature:
      return {
        name: `[${(child.parameters ?? []).map((p: Record<string, any>) => `${p.name}: ${typeToString(p.type)}`).join(', ')}]`,
        kind: 'index-signature',
        ...common,
        type: typeToString(child.type),
        comment: commentOf(child.comment),
        required: true,
      }
    case K.EnumMember:
      return {
        name: child.name,
        kind: 'enum-member',
        ...common,
        type: child.type ? typeToString(child.type) : undefined,
        comment: commentOf(child.comment),
        required: true,
        defaultValue: child.defaultValue ?? undefined,
      }
    default:
      return null
  }
}

const SECTION = {
  overview: '概述',
  signatures: '签名',
  ctor: '构造函数',
  props: '属性',
  methods: '方法',
  members: '成员',
  type: '类型',
  examples: '示例',
} as const

function buildPage(child: Record<string, any>, slugRoot: string): ApiPage | null {
  const kind = KIND_LABEL[child.kind]
  if (!kind) return null

  const name: string = child.name
  const comment = child.comment
  const data: ApiDocData = {
    kind,
    name,
    summary: commentOf(comment),
    remarks: tagText(comment, '@remarks'),
    examples: blockTags(comment, '@example').map((t) => textOf(t.content)).filter(Boolean),
    sources: (child.sources ?? []).map((s: Record<string, any>) => ({ fileName: s.fileName, line: s.line })),
    toc: [],
  }

  const slugger = new GithubSlugger()
  const slug = (title: string) => `#${slugger.slug(title)}`
  data.toc.push({ title: SECTION.overview, url: slug(SECTION.overview), depth: 2 })

  // generic type parameters (class / interface / function / type alias)
  if (Array.isArray(child.typeParameter) && child.typeParameter.length) {
    data.typeParams = child.typeParameter.map((p: Record<string, any>) => ({
      name: p.name + (p.default ? ` = ${typeToString(p.default)}` : ''),
      comment: commentOf(p.comment),
    }))
  }

  const members: ApiMemberData[] = []
  for (const c of child.children ?? []) {
    const m = buildMember(c, slugger)
    if (m) members.push(m)
  }

  if (kind === 'class' || kind === 'interface') {
    if (kind === 'class') {
      data.heritage = [
        ...(child.extendedTypes ?? []).map(typeToString),
        ...(child.implementedTypes ?? []).map(typeToString),
      ]
    } else {
      data.heritage = (child.extendedTypes ?? []).map(typeToString)
    }
    if (!data.heritage?.length) delete data.heritage
  }

  switch (kind) {
    case 'class': {
      const ctors = members.filter((m) => m.kind === 'constructor')
      const props = members.filter((m) => m.kind === 'property' || m.kind === 'get' || m.kind === 'set')
      const methods = members.filter((m) => m.kind === 'method')
      data.members = members
      if (ctors.length) data.toc.push({ title: SECTION.ctor, url: slug(SECTION.ctor), depth: 2 })
      if (props.length) data.toc.push({ title: SECTION.props, url: slug(SECTION.props), depth: 2 })
      if (methods.length) data.toc.push({ title: SECTION.methods, url: slug(SECTION.methods), depth: 2 })
      break
    }
    case 'interface': {
      data.members = members
      if (Array.isArray(child.signatures) && child.signatures.length) {
        data.signatures = child.signatures.map((sg: Record<string, any>) => signatureOf(name, sg))
        data.toc.push({ title: SECTION.signatures, url: slug(SECTION.signatures), depth: 2 })
      }
      if (members.some((m) => m.kind === 'index-signature' || m.kind === 'property'))
        data.toc.push({ title: SECTION.props, url: slug(SECTION.props), depth: 2 })
      if (members.some((m) => m.kind === 'method'))
        data.toc.push({ title: SECTION.methods, url: slug(SECTION.methods), depth: 2 })
      break
    }
    case 'function': {
      data.signatures = (child.signatures ?? []).map((sg: Record<string, any>) => signatureOf(name, sg))
      data.toc.push({ title: SECTION.signatures, url: slug(SECTION.signatures), depth: 2 })
      break
    }
    case 'enum': {
      data.members = members
      data.toc.push({ title: SECTION.members, url: slug(SECTION.members), depth: 2 })
      break
    }
    case 'type-alias':
    case 'variable': {
      data.type = typeToString(child.type)
      if (kind === 'variable') data.typeParams = undefined
      data.toc.push({ title: SECTION.type, url: slug(SECTION.type), depth: 2 })
      break
    }
  }

  // member level toc entries
  if (data.members?.length) {
    const sectionFor = (m: ApiMemberData): string =>
      kind === 'enum' ? SECTION.members : m.kind === 'constructor' ? SECTION.ctor : m.kind === 'method' ? SECTION.methods : SECTION.props
    for (const m of data.members) {
      const sec = sectionFor(m)
      if (!data.toc.some((t) => t.title === sec && t.depth === 2)) continue
      data.toc.push({ title: m.name, url: `#${m.anchor}`, depth: 3 })
    }
  }

  if (data.examples?.length) data.toc.push({ title: SECTION.examples, url: slug(SECTION.examples), depth: 2 })

  return {
    slug: `${slugRoot}/${kebab(name)}`,
    title: name,
    description: data.summary?.split(/\n/)[0]?.slice(0, 160),
    data,
  }
}

// ---------------------------------------------------------------------------
// entry point
// ---------------------------------------------------------------------------

export async function generateApiPages(opts: DocgenOptions): Promise<ApiPage[]> {
  const { Application, LogLevel } = await import('typedoc')

  const app = await Application.bootstrapWithPlugins({
    entryPoints: opts.entryPoints,
    tsconfig: opts.tsconfig ?? 'tsconfig.json',
    logLevel: LogLevel.Error,
    skipErrorChecking: true,
    excludePrivate: true,
    excludeInternal: true,
    excludeExternals: true,
    readme: 'none',
  } as never)

  const project = await app.convert()
  if (!project) throw new Error('typedoc convert() failed')
  // projectToObject expects a NormalizedPath (forward slashes)
  const cwdNormalized = process.cwd().replace(/\\/g, '/') as never
  const json = app.serializer.projectToObject(project, cwdNormalized)

  const slugRoot = opts.slug ?? 'api'
  const pages: ApiPage[] = []

  const collect = (list: Record<string, any>[]) => {
    for (const c of list) {
      if (c.kind === K.Module || c.kind === K.Namespace) {
        collect(c.children ?? [])
        continue
      }
      const page = buildPage(c, slugRoot)
      if (page) pages.push(page)
    }
  }
  collect(json.children ?? [])

  // remove node_modules / ambient noise that slipped through
  return pages.filter(
    (p) => !p.data.sources?.some((s) => s.fileName.includes('node_modules')),
  )
}

/** absolute dir of the docgen entries — used to watch for rebuilds */
export function entryFiles(opts: DocgenOptions): string[] {
  return opts.entryPoints.map((e) => path.resolve(e))
}
