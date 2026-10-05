/** fence meta 解析 —— `[filename]` / `title="..."` -> 展示用标题 */
const TITLE_RE = /\[([^\][]+)\]|title="([^"]*)"|title='([^']*)'/

export interface FenceMeta {
  /** 标题（文件名） */
  title?: string
  /** 除标题之外的原始 meta */
  rest: string
}

export function parseFenceMeta(meta: string | null | undefined): FenceMeta {
  if (!meta) return { rest: '' }
  const m = TITLE_RE.exec(meta)
  if (!m) return { rest: meta.trim() }
  const title = m[1] ?? m[2] ?? m[3]
  const rest = meta.replace(TITLE_RE, ' ').trim()
  return { title: title?.trim() || undefined, rest }
}

/** 只要标题 */
export function fenceMetaTitle(meta: string | null | undefined): string | undefined {
  return parseFenceMeta(meta).title
}