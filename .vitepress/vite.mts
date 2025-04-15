import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'
import { coverImgTransform, providePageData } from './vite.plugins.ts'
import { pagefindPlugin } from 'vitepress-plugin-pagefind'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
export const viteConfig: any = {
    resolve: {
        alias: [
            {
                find: /^.*\/VPNavBarMenu\.vue$/,
                replacement: fileURLToPath(
                    new URL('./theme/NavBarMenu.vue', import.meta.url)
                )
            }
        ]
    },
    plugins: [
        groupIconVitePlugin(),
        coverImgTransform(),
        providePageData(),
        pagefindPlugin(),
        UnoCSS({
            configFile: "./vite.uno.mts",
        })
    ]
}