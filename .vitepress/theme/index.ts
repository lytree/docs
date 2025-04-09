// https://vitepress.dev/guide/custom-theme


import './styles/index.scss'
import 'virtual:uno.css'


// element-ui
// import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/base.css'
import 'element-plus/theme-chalk/el-button.css'
import 'element-plus/theme-chalk/el-tag.css'
import 'element-plus/theme-chalk/el-icon.css'
import 'element-plus/theme-chalk/el-avatar.css'
import 'element-plus/theme-chalk/el-image.css'
import 'element-plus/theme-chalk/el-image-viewer.css'
import 'element-plus/theme-chalk/el-pagination.css'
import 'element-plus/theme-chalk/el-carousel.css'
import 'element-plus/theme-chalk/el-carousel-item.css'
import 'element-plus/theme-chalk/el-alert.css'
import 'element-plus/theme-chalk/dark/css-vars.css'


import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'

import CustomLayout from './CLayout.vue'
// page
import UserWorksPage from './components/UserWorks.vue'
import { withConfigProvider } from './composables/config/blog'
import { } from "./utils/node"
export default {
  extends: DefaultTheme,
  Layout: withConfigProvider(CustomLayout),
  enhanceApp({ app, router, siteData }) {
    app.component('UserWorksPage', UserWorksPage as any)
    // ...
  }
} satisfies Theme
