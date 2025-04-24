// https://vitepress.dev/guide/custom-theme

import './styles.scss'

import 'virtual:uno.css'
import 'virtual:group-icons.css'

import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
export default {
  extends: DefaultTheme,
  Layout: Layout,
  enhanceApp({ app, router, siteData }) {
    // ...
  }
} satisfies Theme
