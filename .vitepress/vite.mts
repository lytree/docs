import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import { themeReloadPlugin, providePageData } from './vite.plugins.ts'

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
        // themeReloadPlugin({ docsDir: "./blog" }),
        providePageData(),
        UnoCSS({
            configFile: "./vite.uno.mts",
        })
    ]
}