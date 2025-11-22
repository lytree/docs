// https://vitepress.dev/guide/custom-theme
import "./styles/base.scss"
import 'virtual:uno.css'
import 'virtual:group-icons.css'
// if you just want to import css
import 'element-plus/theme-chalk/dark/css-vars.css'
import mediumZoom from 'medium-zoom'
import TreeTable from './component/TreeTable.vue'
import PDFPreview from './component/PDFPreview.vue'
import LNavLinks from './component/LNavLinks.vue'

import { useRoute, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import { nextTick, onMounted, watch } from 'vue'
import { TransformContext } from "vitepress"
export default {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp({ app, router, siteData }) {
    app.component('TreeTable', TreeTable)
    app.component('PDFPreview', PDFPreview)
    app.component('LNavLinks', LNavLinks)
  },
  setup() {
    const route = useRoute()
    const initZoom = () => {
      mediumZoom('.main img', { background: 'var(--vp-c-bg)' })
    }
    onMounted(() => {
      initZoom()
    })
    watch(
      () => route.path,
      () => nextTick(() => initZoom())
    )
  },
  async transformHead(context: TransformContext) {
    // 相应地调整正则表达式以匹配字体
    const fontFile = context.assets.find((file: string) => /font-name\.[\w-]+\.woff2/.test(file))
    if (fontFile) {
      return [
        [
          'link',
          {
            rel: 'preload',
            href: fontFile,
            as: 'font',
            type: 'font/woff2',
            crossorigin: ''
          }
        ]
      ]
    }
  },
} satisfies Theme
