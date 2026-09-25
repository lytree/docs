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
      ? folders.map((f) => ({
          title: f.title ?? f.name,
          description: f.description,
          icon: f.icon,
          url: f.url ?? '/docs',
        }))
      : [{ title: '文档', description: '开始阅读', icon: '📘', url: '/docs' }]
    const hasI18n = locales.length > 1

    return () => (
      <div class={s.home}>
        <header class={s.header}>
          <div class={s.headerInner}>
            <RouterLink to="/" class={s.brand}>
              <span class={s.brandMark}>◦</span>
              <span class={s.brandName}>{site.title}</span>
            </RouterLink>
            <nav class={s.nav}>
              {hasI18n &&
                locales.map((l) => (
                  <RouterLink key={l.code} to={`/docs/${l.code}`} class={s.navLink}>
                    {l.name}
                  </RouterLink>
                ))}
              <RouterLink to="/docs" class={s.navCta}>
                进入文档 →
              </RouterLink>
            </nav>
          </div>
        </header>

        <main class={s.main}>
          <section class={s.hero}>
            <h1 class={s.heroTitle}>{site.title}</h1>
            <p class={s.heroDesc}>
              记录日常学习与工作中沉淀下来的技术笔记 —— Java、dotnet、数据库、中间件 等。
            </p>
          </section>

          <section class={s.cards}>
            <h2 class={s.cardsTitle}>主题目录</h2>
            <div class={s.cardsGrid}>
              {links.map((f) => (
                <RouterLink key={f.url} to={f.url} class={s.card}>
                  {f.icon && <span class={s.cardIcon}>{f.icon}</span>}
                  <span class={s.cardTitle}>{f.title}</span>
                  {f.description && (
                    <span class={s.cardDesc}>{f.description}</span>
                  )}
                </RouterLink>
              ))}
            </div>
          </section>

          <section class={s.about}>
            <h2 class={s.aboutTitle}>关于本站</h2>
            <ul class={s.aboutList}>
              <li>框架：Fumadocs 的 Vue 3 + TSX 复刻</li>
              <li>渲染：Vue 3 · Vite · UnoCSS · SCSS Modules</li>
              <li>内容格式：MDX（兼容 Fumadocs 的 <code>meta.json</code> 页面树）</li>
              <li>源码：<a href="https://github.com/lytree/docs" target="_blank" rel="noreferrer">lytree/docs</a></li>
            </ul>
          </section>
        </main>

        <footer class={s.footer}>
          <span>Vue 3 · TSX · Vite · UnoCSS</span>
          <span>© {new Date().getFullYear()} lytree</span>
        </footer>
      </div>
    )
  },
})