// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import 'virtual:uno.css'
import './style.css'
import CustomLayout from './CLayout.vue'
// page
import UserWorksPage from './components/UserWorks.vue'
import { withConfigProvider } from './composables/config/blog'
import {} from "./utils/node"
export default {
  extends: DefaultTheme,
  Layout: withConfigProvider(CustomLayout),
  enhanceApp({ app, router, siteData }) {
    app.component('UserWorksPage', UserWorksPage as any)
    // ...
  }
} satisfies Theme
