import UnoCSS from 'unocss/vite'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import ElementPlus from 'unplugin-element-plus/vite'
export const viteConfig: any = {
  resolve: {
    alias: [

    ]
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        // additionalData: `@use "@/style/global.scss" as *;`,
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  plugins: [
    groupIconVitePlugin(),
    ElementPlus({
      // options
    }),
    UnoCSS({
      configFile: "./vite.uno.mts",
    })
  ]
}