# doc

杨 ◦ 柳 · 个人文档站 —— Vue 3 + TSX 版的 Fumadocs。

源码：[github.com/lytree/docs](https://github.com/lytree/docs) · 站点：[doc.prideyang.top](https://doc.prideyang.top)

## 开发

```bash
pnpm install
pnpm dev          # 启动 Vite dev server
```

## 构建

```bash
pnpm build         # 产出 dist/
pnpm prerender     # 可选：用 playwright 把每条路由预渲染成静态 HTML
pnpm build:full    # = build + prerender
```

## 技术栈

- Vue 3 + TSX（`vue-jsx`）
- Vite 6
- UnoCSS（presetWind3）
- SCSS Modules + lightningcss
- MDX 3（自定义 JSX 运行时适配到 Vue 的 `h()`，见 `src/lib/JsxRuntime.ts`）
- Shiki（构建期代码高亮 + 行高亮 + `title` 元数据）
- KaTeX（数学公式）
- 自研内容管线：`plugins/Source.ts`，与 Fumadocs 的 `meta.json` 页面树格式兼容

## 目录结构

- `content/docs/` —— MDX 文档源；一级目录就是侧边栏的 root folders（`dotnet/java/db/middleware/other`）。
- `src/components/` —— 布局组件（DocsLayout / Sidebar / Toc / SearchDialog）、MDX 自定义组件。
- `src/pages/` —— 路由级页面（Home / DocPage / NotFound）。
- `src/lib/` —— 共享工具（JSX 运行时适配、SEO、主题、source 访问器）。
- `plugins/Source.ts` —— 内容管线插件，构建期生成 `virtual:source`（页面树、搜索索引、TOC、frontmatter）。
- `public/assets/` —— 历史图片资源，MDX 中通过 `/assets/...` 引用。

## 编辑此页

每篇文档页脚都有一个「编辑此页」链接，指向 `https://github.com/lytree/docs/blob/main/content/docs/<path>`，对应 `editLink` 配置（见 `vite.config.ts`）。
