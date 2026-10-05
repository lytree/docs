/**
 * markdown-it-container 的类型声明（该包未提供类型）。
 *
 * markdown-it 本身自带类型（dist/markdown-it.d.mts），无需补充。
 */
declare module 'markdown-it-container' {
  import type MarkdownIt from 'markdown-it'
  import type { Token } from 'markdown-it'

  interface ContainerOptions {
    marker?: string
    /** v4 起 params 就是 info 字符串本身 */
    validate?: (params: string, markup: string) => boolean
    render: (tokens: Token[], idx: number) => string
  }

  const plugin: (md: MarkdownIt, name: string, options: ContainerOptions) => void
  export default plugin
}