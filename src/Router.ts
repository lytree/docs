import { createRouter, createWebHistory } from 'vue-router'
import { Home } from './pages/Home'
import { DocPage } from './pages/DocPage'
import { DebugTree } from './pages/DebugTree'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    // /docs 单独命中（index 页）
    { path: '/docs', name: 'docs-root', component: DocPage },
    // /docs/... 子路径
    { path: '/docs/:slug(.*)*', name: 'docs', component: DocPage },
    { path: '/__debug/tree', name: 'debug-tree', component: DebugTree },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./pages/NotFound').then((m) => m.NotFound) },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0 }
  },
})
