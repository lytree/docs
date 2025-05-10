// https://vitepress.dev/guide/custom-theme

import './styles.scss'

import 'virtual:uno.css'
import 'virtual:group-icons.css'
import mediumZoom from 'medium-zoom'
import { useRoute, type Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import { nextTick, onMounted, watch } from 'vue'
export default {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp({ app, router, siteData }) {
    // ...
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
} satisfies Theme
