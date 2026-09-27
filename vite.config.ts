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
            // dual theme — shiki emits inline `color` for light plus
            // `--shiki-dark` CSS vars; Global.scss switches on `:root.dark`
            themes: {
              light: 'github-light',
              dark: 'github-dark',
            },
            transformers: [
              (await import('@shikijs/transformers')).transformerNotationHighlight(),
              (await import('@shikijs/transformers')).transformerNotationDiff(),
              // fence meta `{1,3-5}` — add "highlighted" to those lines
              (await import('@shikijs/transformers')).transformerMetaHighlight(),
              // fence meta `title="..."` — lift onto the pre element for <Pre/>
              {
                pre(node) {
                  const meta = (this.options.meta as string) ?? ''
                  const t = meta.match(/title="([^"]+)"/)
                  if (t) node.properties['data-title'] = t[1]
                },
              },
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
        // site-wide announcement banner (fumadocs Banner); remove to hide
        banner: {
          id: '2026-fumadocs-parity',
          text: '文档站已完成 Fumadocs 全功能复刻 — FileTree · TypeTable · Banner · ImageZoom · InlineToc',
          link: 'https://github.com/lytree/docs',
        },
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
