import { defineComponent, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { site, defaultLocale, dataFor, locales } from '../lib/Source'
import { applyHead } from '../lib/Seo'
import s from './Home.module.scss'

export const Home = defineComponent({
  name: 'HomePage',
  setup() {
    onMounted(() =>
      applyHead({ title: site.title, description: site.description, path: '/' }),
    )

    const nodes = dataFor(defaultLocale).tree
    const folders = nodes.filter((n) => n.type === 'folder' && n.root)
    const links = folders.length
      ? folders.map((f) => ({ title: f.title ?? f.name, icon: f.icon, url: f.url ?? '/docs' }))
      : [{ title: '文档', icon: '📘', url: '/docs' }]
    const hasI18n = locales.length > 1

    return () => (
      <div class={s.home}>
        <header class={s.homeHeader}>
          <div class={s.homeHeaderInner}>
            <span class={s.homeBrand}>杨 ◦ 柳</span>
            <a href="/docs" class={s.homeCta}>
              进入文档 →
            </a>
          </div>
        </header>
        <main class={s.homeMain}>
          <h1 class={s.homeTitle}>个人文档</h1>
          <p class={s.homeDesc}>
            记录日常学习与工作中沉淀下来的技术笔记 —— Java、dotnet、数据库、中间件 等。
          </p>
          <div class={s.homeLinks}>
            {links.map((f) => (
              <RouterLink key={f.url} to={f.url} class={s.homeLink}>
                {f.icon && <span class={s.homeLinkIcon}>{f.icon}</span>}
                <span>{f.title}</span>
              </RouterLink>
            ))}
            {hasI18n && (
              <RouterLink to="/docs/en" class={s.homeLink}>
                English Docs
              </RouterLink>
            )}
          </div>
        </main>
        <footer class={s.homeFooter}>Vue 3 · TSX · Vite · UnoCSS · {new Date().getFullYear()} lytree</footer>
      </div>
    )
  },
})
