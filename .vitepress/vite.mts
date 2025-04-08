import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

export default {
    resolve: {
        alias: [
            {
                find: /^.*\/VPNavBarMenu\.vue$/,
                replacement: fileURLToPath(
                    new URL('./theme/CNavBarMenu.vue', import.meta.url)
                )
            }
        ]
    },
    plugins: [
        UnoCSS({
            configFile: "./vite.uno.mts",
        })
    ]
}