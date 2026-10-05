import { defineConfig, type UserConfig } from 'vite'
import vueJsx from 'vue-jsx/vite'
import UnoCSS from 'unocss/vite'
import { fileURLToPath } from 'node:url'
import { fumadocsSource } from './plugins/Source'
import { markdownItPlugin } from './plugins/MarkdownIt'
import { fileImportPlugin } from './plugins/FileImport'

/**
 * 站点配置全部收在这里，传给 `fumadocsSource()` —— 与 fumadocs 的用法一致。
 * 需要复用配置时，用普通函数返回片段再 spread，不做配置继承。
 */
const siteConfig = {
  site: {
    url: 'https://doc.prideyang.top',
    title: '杨 ◦ 柳',
    description: '个人文档站 —— Java / dotnet / 数据库 / 中间件 等笔记。',
    lang: 'zh-CN',
    banner: {
      id: '2026-layout-parity',
      text: '布局已接入 VitePress 体系 —— 插槽 · ::: 容器 · 文件导入 · 代码组',
      link: 'https://github.com/lytree/docs',
    },
  },

  nav: [
    { label: '首页', to: '/', icon: '🏠' },
    { label: '源码', to: 'https://github.com/lytree/docs', icon: '📦' },
  ],

  outline: { range: [2, 3] as [number, number], title: '本页目录' },

  markdown: {
    lineNumbers: false,
    /** 自定义 `:::type` 容器 -> MDX 组件名 */
    containers: {},
  },

  tokens: {
    brand: { '1': '#3b6ef6', '2': '#2f5fe0' },
    radius: { md: '8px', lg: '12px' },
    layout: { sidebarWidth: '260px', asideWidth: '232px' },
  },

  ui: {
    searchPlaceholder: '搜索文档…',
    editLink: '在 GitHub 编辑',
    lastUpdated: '最后更新于',
    prev: '上一篇',
    next: '下一篇',
  },

  footer: {
    message: 'Vue 3 + TSX 文档站',
    copyright: `© ${new Date().getFullYear()} 杨 ◦ 柳`,
  },

  editLink: { repo: 'lytree/docs', branch: 'main' },

  i18n: {
    locales: [{ code: 'zh', name: '中文' }],
    defaultLocale: 'zh',
  },

  hooks: {
    /** 构建期改写页面数据 */
    transformPageData(page: { description?: string; frontmatter?: Record<string, unknown> }) {
      if (!page.description) {
        const d = page.frontmatter?.description
        if (typeof d === 'string') page.description = d
      }
    },
  },
}

/** <<< 文件导入的路径基准 */
const IMPORT_OPTS = { contentRoot: 'content/docs', projectRoot: process.cwd() }

export default defineConfig(async (): Promise<UserConfig> => {
  return {
    plugins: [
      // markdown-it 管线 —— .md -> Vue 组件（替代原 MDX）
      markdownItPlugin({
        themes: { light: 'github-light', dark: 'github-dark' },
        lineNumbers: siteConfig.markdown.lineNumbers,
        containers: siteConfig.markdown.containers,
        imports: IMPORT_OPTS,
      }),
      UnoCSS(),
      vueJsx(),
      // <<< 被导入的文件变化时热重载
      fileImportPlugin(IMPORT_OPTS),
      fumadocsSource(siteConfig),
    ],
    resolve: {
      alias: {
        // markdown-it 管线产出的 Vue 组件需要按绝对路径引用运行时
        '@/lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
      },
    },
    css: {
      // Lightning CSS replaces PostCSS entirely: vendor prefixing, minification
      // and syntax lowering all happen through the native lightningcss binary
      transformer: 'lightningcss',
      lightningcss: {
        targets: { chrome: (129 << 16), firefox: (130 << 16), safari: (17 << 16 | 4) },
      },
      modules: {
        // access kebab-case classes as camelCase: s.treeLink
        localsConvention: 'camelCaseOnly',
      },
    },
  }
})