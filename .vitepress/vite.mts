import UnoCSS from 'unocss/vite'
import { groupIconVitePlugin } from 'vitepress-plugin-group-icons'
import ElementPlus from 'unplugin-element-plus/vite'
export const viteConfig: any = {
  resolve: {
    alias: [

    ]
  },
  ssr: { noExternal: ['element-plus'] },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
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
  ],
  optimizeDeps: {
    include: ['pdf'], // 将pdf文件添加到include数组中
    exclude: [], // 排除其他不需要优化的文件类型
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: `assets/[name].[ext]`,
      }
    }
  }
}