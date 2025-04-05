import UnoCSS from 'unocss/vite'


export default {
    plugins: [
        UnoCSS({
            configFile: "./vite.uno.mts",
        })
    ]
}