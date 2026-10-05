# doc

杨 ◦ 柳 · 个人文档站 —— Vue 3 + TSX 实现的 Fumadocs，接入 VitePress 的布局与写作体系。

源码：[github.com/lytree/docs](https://github.com/lytree/docs) · 站点：[doc.lytree.top](https://doc.lytree.top)

## 开发

```bash
pnpm install
pnpm dev          # 启动 Vite dev server
pnpm typecheck    # vue-tsc --noEmit
```

## 构建

```bash
pnpm build         # 产出 dist/
pnpm prerender     # 可选：用 playwright 把每条路由预渲染成静态 HTML
pnpm build:full    # = build + prerender
```

## 技术栈

- Vue 3 + TSX（`vue-jsx`）、Vue Router
- Vite 6、UnoCSS（presetWind3）、SCSS Modules + lightningcss
- **markdown-it**（与 VitePress 同款管线）+ `markdown-it-container`
- Shiki 双主题（`github-light` / `github-dark`，CSS 变量切换暗色）
- KaTeX（数学公式）
- 自研内容管线 `plugins/Source.ts`，与 Fumadocs 的 `meta.json` 页面树格式兼容

### 为什么是 markdown-it 而不是 MDX

MDX 把 Markdown 当 JSX 解析，于是 `List<String>`、`a < b`、`Map<K,V>` 这类写法都会触发
JSX 解析错误，写作时得反复提防尖括号。markdown-it 走行内 HTML 语义，这些内容天然安全；
组件能力改由**容器语法 + 自定义渲染**提供。

## 内容写作能力

容器语法（示例见「其他 → Markdown 能力一览」）：

| 语法 | 效果 |
| --- | --- |
| `::: tip 标题` | 提示块（还有 `info` / `note` / `warning` / `danger` / `important` / `quote`） |
| `::: details 标题` | 可折叠容器 |
| `::: code-group` | 多个代码块变标签页，围栏 `[文件名]` 作为标签 |
| `::: raw` | 原样输出 |

代码块（在围栏信息里写）：

| 写法 | 效果 |
| --- | --- |
| `[文件名]` / `title="..."` | 标题栏 + 复制按钮 |
| `{1,3-5}` | 行高亮 |
| `[!code focus]` | 聚焦（其余行淡出） |
| `[!code ++]` / `[!code --]` | diff 标注 |
| `[!code word:xxx]` | 关键词高亮 |

文件导入——独占一行的指令把磁盘文件嵌进文档：

```markdown
<<< @/other/snippets/pool-config.ts
```

`@/` 指向 `content/docs/`；也可以写相对路径。指令必须独占一行。
dev 下改被导入的文件会触发热重载。

frontmatter 可覆盖布局：

```yaml
---
title: 我的页面
aside: false        # 关闭右侧目录；'left' 挪到左侧
outline: [2, 4]     # 目录收录到 h4
pageClass: my-page  # 附加到布局根节点的类名
full: true          # 宽屏，隐藏侧边栏与目录
lastUpdated: false  # 隐藏「最后更新」
head:               # 追加 <head> 标签
  - tag: meta
    attrs: { name: author, content: lytree }
---
```

## 站点定制

### 1. 数据配置 —— `vite.config.ts` 的 `fumadocsSource()`

```ts
fumadocsSource({
  site: { url, title, description, lang, head, banner },
  nav: [{ label: '首页', to: '/', icon: '🏠' }],
  sidebar: { '/docs/java': [...], '/docs': [...] },   // 按路径前缀切换
  outline: { range: [2, 3], title: '本页目录' },
  markdown: { lineNumbers: false, containers: {} },
  tokens: { brand: {...}, radius: {...}, layout: {...} },
  ui: { searchPlaceholder: '搜索文档…', editLink: '在 GitHub 编辑' },
  footer: { message, copyright },
  editLink: { repo: 'lytree/docs', branch: 'main' },
  i18n: { locales: [...], defaultLocale: 'zh' },
  hooks: { transformPageData, transformHead },
})
```

需要复用配置时用普通函数 spread，**不引入配置继承**：

```ts
const nav = () => [{ label: '文档', to: '/docs' }]
fumadocsSource({ nav: nav(), ... })
```

### 2. 组件与插槽 —— `theme.tsx`

```tsx
import { defineComponent, h } from 'vue'
import { defineTheme } from './src/lib/Slots'

const Note = defineComponent({
  setup: () => () => h('p', { class: 'note' }, '自定义内容'),
})

export default defineTheme({
  slots: {
    'layout-bottom': () => h('div', '全站底部'),
    'doc-footer-before': Note,
    'doc-after': (ctx) => (ctx.frontmatter?.banner ? h('div', String(ctx.frontmatter.banner)) : null),
  },
  components: {},   // 追加全局组件
})
```

可用插槽：

```
layout-top / layout-bottom              整页最外层
nav-bar-content-before                  导航栏最左侧
nav-bar-title-before / nav-bar-title-after
nav-bar-content-after                   导航栏最右侧
sidebar-nav-before / sidebar-nav-after  侧边栏上下
aside-outline-before / aside-outline-after
doc-before / doc-after                  正文所在列上下
doc-top / doc-bottom                    文章内部
doc-footer-before / doc-footer-after    页脚内部
```

插槽内容支持四种形态：渲染函数（`(ctx) => VNode`，可读 `path` / `slug` /
`frontmatter` / `dark`）、组件对象、VNode、字符串。

> 为什么要拆成两个文件：`fumadocsSource()` 的配置会被 `vite.config.ts` 在 Node 侧读取，
> 如果它 import 组件，Vue 就会被拖进 Vite 的配置执行环境。所以数据留在 `vite.config.ts`，
> 组件留在 `theme.tsx`。

### 3. 设计 token

`fumadocsSource({ tokens })` 会把配置摊平成 CSS 变量在运行时注入，
改配色/圆角/侧边栏宽度不需要动组件。

## 目录结构

- `content/docs/` —— Markdown 文档源；一级目录即侧边栏的 root folders
- `theme.tsx` —— 组件与插槽注册（浏览器端）
- `vite.config.ts` —— 站点配置，全部传给 `fumadocsSource()`
- `plugins/MarkdownIt.ts` —— markdown-it 管线（容器、代码高亮、标题锚点、表格）
- `plugins/Katex.ts` —— 数学公式规则 + 浏览器端渲染
- `plugins/FileImport.ts` —— `<<<` 文件导入
- `plugins/Source.ts` —— 内容管线，生成 `virtual:source`（页面树、搜索索引、TOC）
- `src/components/` —— 布局组件（DocsLayout / Sidebar / Toc / SearchDialog / Banner）
- `src/lib/Slots.ts` —— 插槽系统
- `src/lib/Markdown.ts` —— markdown 产物的 Vue 渲染与交互增强
- `src/pages/` —— 路由级页面（Home / DocPage / NotFound）

## 编辑此页

每篇文档页脚都有「编辑此页」链接，指向
`https://github.com/lytree/docs/blob/main/content/docs/<path>`，
对应 `editLink` 配置。
