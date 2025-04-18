import UnoCSS from 'unocss/vite'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
export const viteConfig: any = {
    resolve: {
        alias: [

        ]
    },
    plugins: [
        groupIconVitePlugin(),
        UnoCSS({
            configFile: "./vite.uno.mts",
        })
    ]
}