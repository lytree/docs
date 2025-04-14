import type { HeadConfig, SiteConfig } from 'vitepress'

import type { PluginOption } from 'vite'
import type { Theme } from './theme/composables/config/index'
import { _require } from './theme/utils/node/mdPlugins'
import { getArticles } from './theme/utils/node/theme'
import { joinPath } from './theme/utils/node/fs'


export function registerVitePlugins(vpCfg: any, plugins: any[]) {
  vpCfg.vite = {
    plugins,
    ...vpCfg.vite,
  }
}

export function inlineInjectMermaidClient() {
  return {
    name: '@sugarat/theme-plugin-inline-inject-mermaid-client',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('src/index.ts') && code.startsWith('// @sugarat/theme index')) {
        return code
          .replace('// replace-mermaid-import-code', 'import Mermaid from \'vitepress-plugin-mermaid/Mermaid.vue\'')
          .replace('// replace-mermaid-mounted-code', 'if (!ctx.app.component(\'Mermaid\')) { ctx.app.component(\'Mermaid\', Mermaid as any) }')
      }
      return code
    },
  } as PluginOption
}


// 支持frontmatter中的相对路径图片自动处理
export function coverImgTransform() {
  let blogConfig: Theme.BlogConfig
  let vitepressConfig: SiteConfig
  let assetsDir: string

  const relativeMetaName: (keyof Theme.PageMeta)[] = ['cover']
  const relativeMeta: Theme.PageMeta[] = []
  const relativeMetaMap: Record<string, Theme.PageMeta> = {}
  const viteAssetsMap: Record<string, string> = {}
  const relativePathMap: Record<string, string> = {}
  return {
    name: 'vitepress-plugin-cover-transform',
    apply: 'build',
    // enforce: 'pre',
    configResolved(config: any) {
      vitepressConfig = config.vitepress
      assetsDir = vitepressConfig.assetsDir
      blogConfig = config.vitepress.site.themeConfig.blog

      const pagesData = [...blogConfig.pagesData]
      // 兼容国际化
      if (vitepressConfig.site.locales && Object.keys(vitepressConfig.site.locales).length > 1 && blogConfig?.locales) {
        Object.values(blogConfig?.locales).map(v => v.pagesData)
          .filter(v => !!v)
          .forEach(v => pagesData.push(...v))
      }
      // 提取所有相对路径的属性
      pagesData.forEach((v) => {
        relativeMetaName.forEach((k) => {
          const value = v.meta[k]
          if (value && typeof value === 'string' && value.startsWith('/')) {
            const absolutePath = `${vitepressConfig.srcDir}${value}`

            // 复用已经映射后的值
            if (relativeMetaMap[absolutePath]) {
              Object.assign(v.meta, { [k]: relativeMetaMap[absolutePath][k] })
              return
            }

            relativePathMap[value] = absolutePath
            relativePathMap[absolutePath] = value
            relativeMeta.push(v.meta)
            relativeMetaMap[absolutePath] = v.meta
          }
        })
      })
    },
    moduleParsed(info) {
      if (!relativePathMap[info.id]) {
        return
      }
      const asset = info.code?.match(/export default "(.*)"/)?.[1]
      if (!asset) {
        return
      }

      viteAssetsMap[info.id] = asset
      viteAssetsMap[asset] = info.id

      // 换成 ViteAssets，影响输出 HTML
      relativeMeta.forEach((meta) => {
        relativeMetaName.forEach((k) => {
          const value = meta[k]
          if (!value || !relativePathMap[value as string]) {
            return
          }
          const viteAsset = viteAssetsMap[relativePathMap[value as string]]
          if (viteAsset) {
            Object.assign(meta, { [k]: viteAsset })
          }
        })
      })
    },
    generateBundle(_: any, bundle: Record<string, any>) {
      // 换成 最终输出路径，影响 CSR 内容
      const assetsMap = Object.entries(bundle).filter(([key]) => {
        return key.startsWith(assetsDir)
      }).map(([_, value]) => {
        return value
      }).filter(v => v.type === 'asset')

      if (!assetsMap.length) {
        return
      }

      relativeMeta.forEach((meta) => {
        relativeMetaName.forEach((k) => {
          const value = meta[k]
          if (!value || !viteAssetsMap[value as string]) {
            return
          }
          const absolutePath = viteAssetsMap[value as string]
          const matchAsset = assetsMap.find(v => joinPath(`${vitepressConfig.srcDir}/`, v.originalFileName) === absolutePath)
          if (matchAsset) {
            Object.assign(meta, { [k]: joinPath('/', matchAsset.fileName) })
          }
        })
      })
    }
  } as PluginOption
}

export function providePageData() {
  return {
    name: 'vitepress-plugin-provide-page-data',
    async config(config: any, env) {
      const vitepressConfig: SiteConfig = config.vitepress
      const pagesData = await getArticles(vitepressConfig)

      if (vitepressConfig.site.locales && Object.keys(vitepressConfig.site.locales).length > 1) {
        if (!vitepressConfig.site.themeConfig.blog.locales) {
          vitepressConfig.site.themeConfig.blog.locales = {}
        }
        // 兼容国际化
        const localeKeys = Object.keys(vitepressConfig.site.locales)
        localeKeys.forEach((localeKey) => {
          if (!vitepressConfig.site.themeConfig.blog.locales[localeKey]) {
            vitepressConfig.site.themeConfig.blog.locales[localeKey] = {}
          }

          vitepressConfig.site.themeConfig.blog.locales[localeKey].pagesData = pagesData.filter((v) => {
            const { route } = v
            const isRoot = localeKey === 'root'
            if (isRoot) {
              return !localeKeys.filter(v => v !== 'root').some(k => route.startsWith(`/${k}`))
            }
            return route.startsWith(`/${localeKey}`)
          })
        })
        if (env.mode === 'production') {
          return
        }
      }
      //@ts-ignore
      vitepressConfig.site.themeConfig.blog.pagesData = pagesData
    },
  } as PluginOption
}