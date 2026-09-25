import { createRouter, createWebHistory } from 'vue-router'
import { Home } from './pages/Home'
import { DocPage } from './pages/DocPage'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    // /docs/... catch-all like fumadocs
    { path: '/docs/:slug(.*)*', name: 'docs', component: DocPage },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./pages/NotFound').then((m) => m.NotFound) },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 80 }
    return { top: 0 }
  },
})
