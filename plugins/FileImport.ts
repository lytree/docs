/**
 * `<<<` 文件导入 —— 把磁盘上的代码文件嵌进文档，避免重复维护。
 *
 * 在 Markdown 里写：
 *   <<< @/snippets/redis.js
 *   <<< ./shared/config.ts
 *
 * 为什么不用 remark 插件改 mdast：
 * MDX 会把 `<<<` 里的 `<` 当成 JSX 标签起始，解析直接报错
 * （"Unexpected character `<` before name"）。所以必须在 **MDX 解析之前**
 * 于源码阶段处理 —— 把 `<<< path` 替换成一个完整的代码围栏。
 */
import fs from 'node:fs'
import path from 'node:path'

/** 语言推断：扩展名 -> shiki 语言 id */
const LANG: Record<string, string> = {
  ts: 'ts', tsx: 'tsx', js: 'js', jsx: 'jsx', mjs: 'js', cjs: 'js',
  vue: 'vue', json: 'json', yaml: 'yaml', yml: 'yaml', md: 'markdown',
  css: 'css', scss: 'scss', less: 'less', html: 'html', sh: 'bash',
  bash: 'bash', zsh: 'bash', fish: 'bash', sql: 'sql', xml: 'xml',
  toml: 'toml', ini: 'ini', conf: 'ini', graphql: 'graphql', py: 'python',
  rb: 'ruby', go: 'go', rs: 'rust', java: 'java', kt: 'kotlin', swift: 'swift',
  c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cs: 'csharp', php: 'php',
  diff: 'diff', env: 'bash', gitignore: 'ini', dockerfile: 'docker',
}

export interface FileImportOptions {
  /** `@/` 前缀指向的目录，默认 `content/docs` */
  contentRoot?: string
  /** 限制可导入的根目录，默认项目根（防目录穿越） */
  projectRoot?: string
}

/** 只匹配「独占一行」的导入指令 */
const IMPORT_LINE_RE = /^\s*<<<\s+(.+?)\s*$/

/** 文件内容里若含 ```，围栏要用更长的反引号序列 */
function fenceFor(content: string): string {
  let longest = 2
  for (const m of content.matchAll(/`+/g)) longest = Math.max(longest, m[0].length)
  return '`'.repeat(longest + 1)
}

/**
 * 把源码里的 `<<< path` 换成代码围栏。
 * 返回处理后的字符串；没有导入指令时原样返回。
 */
export function resolveFileImports(
  source: string,
  filePath: string,
  options: FileImportOptions = {},
): string {
  if (!source.includes('<<<')) return source

  const contentRoot = options.contentRoot ?? 'content/docs'
  const projectRoot = options.projectRoot ?? process.cwd()
  const absFile = path.resolve(filePath)
  const dir = path.dirname(absFile)
  const docRoot = path.resolve(projectRoot, contentRoot)

  const lines = source.split(/\r?\n/)
  const out: string[] = []
  // 记录这些文件，dev 下改了就热重载
  touched.add(path.resolve(docRoot))

  for (const line of lines) {
    const m = IMPORT_LINE_RE.exec(line)
    if (!m) {
      out.push(line)
      continue
    }

    const spec = m[1].replace(/^['"]|['"]$/g, '')
    let target: string
    if (spec.startsWith('@/')) {
      target = path.resolve(docRoot, spec.slice(2))
    } else {
      target = path.resolve(dir, spec)
    }

    // 目录穿越防护：必须落在项目根内
    const relToRoot = path.relative(projectRoot, target)
    if (relToRoot.startsWith('..')) {
      out.push(`> 导入被拒绝（路径越界）：\`${spec}\``)
      continue
    }

    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      // 显式报错而不是静默丢失
      out.push(`> ⚠ 找不到被导入的文件：\`${spec}\``)
      continue
    }

    const raw = fs.readFileSync(target, 'utf8').replace(/\s+$/, '')
    const ext = path.extname(target).slice(1).toLowerCase()
    const lang = LANG[ext] ?? 'text'
    const title = path.relative(dir, target).split(path.sep).join('/')
    const fence = fenceFor(raw)

    touched.add(path.resolve(target))
    out.push(`${fence}${lang} [${title}]`)
    out.push(raw)
    out.push(fence)
  }

  return out.join('\n')
}

/** 收集被导入过的文件，供 dev 监听使用 */
export const touched = new Set<string>()

/**
 * Vite 插件：把源码预处理挂到 mdx 的 transform 之前，
 * 并在 dev 下监听被导入的文件。
 */
export function fileImportPlugin(options: FileImportOptions = {}): import('vite').Plugin {
  return {
    name: 'lytree-file-import',
    enforce: 'pre',
    configureServer(server) {
      const { projectRoot = process.cwd(), contentRoot = 'content/docs' } = options
      const docRoot = path.resolve(projectRoot, contentRoot)

      const check = (file: string) => {
        const abs = path.resolve(file)
        if (!touched.has(abs) && !abs.startsWith(docRoot + path.sep)) return
        // 重新解析所有 md，让引用了新内容的页面更新
        server.watcher.emit('change', abs)
        for (const id of server.moduleGraph.idToModuleMap.keys()) {
          if (!/\.mdx?$/.test(id)) continue
          const mod = server.moduleGraph.getModuleById(id)
          if (mod) server.moduleGraph.invalidateModule(mod)
        }
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.on('change', check)
      server.watcher.on('add', check)
    },
  }
}

export default resolveFileImports