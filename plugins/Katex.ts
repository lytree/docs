/**
 * KaTeX 的 markdown-it 集成。
 *
 * markdown-it 默认把 `$` 留给文本，这里显式注册行内与块级数学规则，
 * 边界规则沿用 markdown-it-katex 的做法：
 *  - 行内 `$...$`：定界符不跨空行、同一行内闭合
 *  - 块级 `$$...$$`：独占一行
 */
import MarkdownItCtor from 'markdown-it'
type MarkdownItType = InstanceType<typeof MarkdownItCtor>
import type { StateInline, StateBlock, Token } from 'markdown-it'

export interface KatexOptions {
  /** 抛错而非输出错误标记 */
  throwOnError?: boolean
  /** 输出 HTML 而非 MathML */
  output?: 'htmlAndMathml' | 'html' | 'mathml'
}

/** 定界符是否可用 */
interface DelimInfo {
  can_open: boolean
  can_close: boolean
}

/**
 * 判断某个位置能否作为数学定界的**起点**。
 *
 * 只需排除货币符号误判：`$5 and $10` 不该被当成公式。
 * 注意 `$\alpha$` 这种以反斜杠开头的内容是合法的 —— 反斜杠只用来
 * 转义 `\$` 本身，此时紧跟的不是反斜杠。
 */
function isValidDelim(state: StateInline, pos: number): DelimInfo {
  const nextChar = state.src.charCodeAt(pos + 1)
  // `\$` 是转义美元符
  if (nextChar === 0x5c && state.src[pos + 2] === '$') {
    return { can_open: false, can_close: false }
  }
  // `$5 ` 这种货币写法
  if (nextChar >= 0x30 && nextChar <= 0x39 && /^\d+\s/.test(state.src.slice(pos + 1))) {
    return { can_open: false, can_close: false }
  }
  return { can_open: true, can_close: true }
}

/**
 * 注入 KaTeX 规则的 markdown-it 插件。
 *
 * 这里只负责**识别**公式并输出占位元素；真正的渲染在浏览器侧
 * `src/lib/Markdown.ts` 里静态 import katex 完成 ——
 * Node 侧不能碰 DOM，也不该把 katex 打进插件。
 */
export function katexWrapper(md: MarkdownItType, options: KatexOptions = {}): void {
  // ---- 块级 $$...$$ ----
  // 必须排在 paragraph 之前：`$$` 独占一行时会被 paragraph 先吃掉
  md.block.ruler.before(
    'paragraph',
    'math_block',
    (state: StateBlock, start: number, end: number, silent: boolean) => {
      const startPos = state.bMarks[start] + state.tShift[start]
      const startMax = state.eMarks[start]

      // 必须以 `$$` 开头（且这一行在 `$$` 之后没有公式内容）
      if (state.src.slice(startPos, startPos + 2) !== '$$') return false
      if (state.src[startPos + 2] === '$') return false

      const lines: string[] = []
      let next = start
      let closed = false

      // 单行形式：`$$ x=y $$`
      const firstRest = state.src.slice(startPos + 2, startMax)
      if (firstRest.trimEnd().endsWith('$$') && firstRest.trim() !== '') {
        lines.push(firstRest.trim().slice(0, -2))
        closed = true
      } else if (firstRest.trim() === '') {
        // `$$` 独占一行 -> 向后找闭合
        for (next = start + 1; next < end; next++) {
          const line = state.src.slice(state.bMarks[next] + state.tShift[next], state.eMarks[next])
          if (line.trimEnd().endsWith('$$')) {
            lines.push(line.trim().slice(0, -2))
            closed = true
            break
          }
          lines.push(line)
        }
      }

      if (!closed) return false

      const tex = lines.join('\n').trim()
      if (tex === '') return false

      if (!silent) {
        const token = state.push('math_block', 'math', 0)
        token.block = true
        token.content = tex
        token.markup = '$$'
        token.map = [start, next + 1]
      }
      state.line = next + 1
      return true
    },
  )

  // ---- 行内 $...$ ----
  // 必须排在 text 之前：inline parser 逐字符前进，
  // 位置太靠后时 `$` 已经被当成普通文本吃掉。
  md.inline.ruler.before('text', 'math_inline', (state: StateInline, silent: boolean) => {
    if (state.src[state.pos] !== '$') return false
    // `$$` 是块级公式，交给 math_block 处理
    if (state.src[state.pos + 1] === '$') return false
    if (!isValidDelim(state, state.pos).can_open) return false

    const start = state.pos + 1
    const match = state.src.indexOf('$', start)
    // 找不到闭合定界符
    if (match < 0) return false
    // 空白开头（`$ x$`）不合规范
    if (state.src[start] === ' ' || state.src[start] === '\n') return false
    // 闭合定界符被反斜杠转义
    if (state.src[match - 1] === '\\') return false

    const content = state.src.slice(start, match)
    // 内容含换行 -> 交给块级规则
    if (content.indexOf('\n') !== -1) return false
    // 空公式
    if (content.trim() === '') return false
    // 只有省略号 / 纯标点 —— 中文行文里的「……$」不是公式
    if (!/[\\^_{}=+\-*/<>|]/.test(content) && !/[a-zA-Z]/.test(content)) return false
    // 过长（> 500 字符）多半是跨段误配，不是公式
    if (content.length > 500) return false

    if (!silent) {
      const token = state.push('math_inline', 'math', 0)
      token.markup = '$'
      token.content = content
    }
    state.pos = match + 1
    return true
  })

  // ---- 渲染为占位容器，真正的 katex 在 Vue 侧执行 ----
  md.renderer.rules.math_inline = (tokens: Token[], idx: number) =>
    `<span class="md-math md-math-inline" data-tex="${escapeAttr(tokens[idx].content)}"></span>`
  md.renderer.rules.math_block = (tokens: Token[], idx: number) =>
    `<div class="md-math md-math-block" data-tex="${escapeAttr(tokens[idx].content)}"></div>`

  void options
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

export default katexWrapper