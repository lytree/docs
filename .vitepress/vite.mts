import UnoCSS from 'unocss/vite'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
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
        UnoCSS({
            configFile: "./vite.uno.mts",
        })
    ]
}