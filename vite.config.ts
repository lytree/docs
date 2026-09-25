import { defineConfig } from 'vite'
import vueJsx from 'vue-jsx/vite'
import UnoCSS from 'unocss/vite'
import mdx from '@mdx-js/rollup'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { fumadocsSource } from './plugins/Source'

export default defineConfig({
  plugins: [
    // MDX must run before vue-jsx
    {
      enforce: 'pre',
      ...mdx({
        jsxRuntime: 'automatic',
        jsxImportSource: 'vue',
        providerImportSource: 'vue/jsx-runtime',
        remarkPlugins: [
          (await import('remark-frontmatter')).default,
          [(await import('remark-mdx-frontmatter')).default, { name: 'frontmatter' }],
          (await import('remark-gfm')).default,
          (await import('remark-math')).default,
        ],
        rehypePlugins: [
          (await import('rehype-slug')).default,
          [(await import('@shikijs/rehype')).default, {
            theme: 'github-light',
            transformers: [
              (await import('@shikijs/transformers')).transformerNotationHighlight(),
            ],
          }],
          (await import('rehype-katex')).default,
        ],
      }),
    },
    UnoCSS(),
    vueJsx(),
    fumadocsSource({
      site: {
        // used for sitemap.xml / robots.txt / canonical / og:image absolute urls
        url: 'https://doc.prideyang.top',
        title: '杨 ◦ 柳',
        description:
          '个人文档站 —— Java / dotnet / 数据库 / 中间件 等笔记。',
      },
      i18n: {
        locales: [{ code: 'zh', name: '中文' }],
        defaultLocale: 'zh',
      },
      // "edit this page" footer links
      editLink: {
        repo: 'lytree/docs',
        branch: 'main',
      },
    }),
  ],
  resolve: {
    alias: {
      // MDX compiled output imports from 'vue/jsx-runtime' — Vue doesn't ship one,
      // so we provide a small adapter that maps JSX calls onto h()
      'vue/jsx-runtime': fileURLToPath(new URL('./src/lib/JsxRuntime.ts', import.meta.url)),
      'vue/jsx-dev-runtime': fileURLToPath(new URL('./src/lib/JsxRuntime.ts', import.meta.url)),
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
})
