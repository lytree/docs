import { defineComponent, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { site, defaultLocale, dataFor } from '../lib/Source'
import { applyHead } from '../lib/Seo'
import { Banner } from '../components/Banner'
import s from './Home.module.scss'

export const Home = defineComponent({
  name: 'HomePage',
  setup() {
    onMounted(() =>
      applyHead({ title: site.title, description: site.description, path: '/' }),
    )

    const nodes = dataFor(defaultLocale).tree
    const folders = nodes.filter((n) => n.type === 'folder' && n.root)
    const totalPages = dataFor(defaultLocale).pages.length

    const links = computed(() =>
      folders.length
        ? folders.map((f) => ({
            title: f.title ?? f.name,
            description: f.description,
            icon: f.icon,
            url: f.url ?? '/docs',
          }))
        : [{ title: '文档', description: '开始阅读', icon: '📘', url: '/docs' }],
    )

    return () => (
      <div class={s.home}>
        <Banner />
        <header class={s.header}>
          <div class={s.headerInner}>
            <RouterLink to="/" class={s.brand}>
              <span class={s.brandIcon} aria-hidden="true">
                Y
              </span>
              <span>{site.title}</span>
            </RouterLink>
            <nav class={s.nav}>
              <RouterLink to="/docs" class={s.navCta}>
                进入文档 →
              </RouterLink>
            </nav>
          </div>
        </header>

        <main class={s.main}>
          {/* HERO */}
          <section class={s.hero}>
            <div>
              <div class={s.heroBadge}>
                <span class={s.heroBadgeDot} aria-hidden="true" />
                <a href="https://github.com/lytree/docs" target="_blank" rel="noreferrer">
                  ⭐ v2.0 · Vue 3 + MDX
                </a>
              </div>
              <h1 class={s.heroTitle}>{site.title}</h1>
              <p class={s.heroSubtitle}>
                个人文档站 —— 记录日常学习与工作中沉淀下来的技术笔记：
                Java、.NET、数据库、中间件 与其他。每篇文档均由 MDX 撰写，带
                代码高亮、数学公式、全文搜索与暗色模式。
              </p>
              <div class={s.heroActions}>
                <RouterLink to="/docs" class={s.heroPrimary}>
                  开始阅读
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </RouterLink>
                <a
                  href="https://github.com/lytree/docs"
                  target="_blank"
                  rel="noreferrer"
                  class={s.heroSecondary}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.57.11.78-.25.78-.55v-2.02c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a10.94 10.94 0 0 1 5.74 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                  </svg>
                  GitHub 仓库
                </a>
              </div>

              <div class={s.heroStats}>
                <div class={s.heroStat}>
                  <span class={s.heroStatValue}>{folders.length}</span>
                  <span class={s.heroStatLabel}>主题分类</span>
                </div>
                <div class={s.heroStat}>
                  <span class={s.heroStatValue}>{totalPages}</span>
                  <span class={s.heroStatLabel}>文档条目</span>
                </div>
                <div class={s.heroStat}>
                  <span class={s.heroStatValue}>100%</span>
                  <span class={s.heroStatLabel}>开源可定制</span>
                </div>
              </div>
            </div>

            <div class={s.heroVisual}>
              <div class={s.codeWindow}>
                <div class={s.codeHeader}>
                  <div class={s.codeDots}>
                    <span class={s.codeDot} />
                    <span class={s.codeDot} />
                    <span class={s.codeDot} />
                  </div>
                  <span class={s.codeFile}>~/notes/dotnet/index.mdx</span>
                </div>
                <div class={s.codeBody}>
                  <span class={s.codeLine}>
                    <span class={s.codeComment}>{'// 一段开箱即用的笔记'}</span>
                  </span>
                  <span class={s.codeLine}>
                    <span class={s.codeKeyword}>import</span>{' '}
                    <span class={s.codeType}>{'{ defineConfig }'}</span>{' '}
                    <span class={s.codeKeyword}>from</span>{' '}
                    <span class={s.codeString}>'fumadocs'</span>
                  </span>
                  <span class={s.codeLine}>&nbsp;</span>
                  <span class={s.codeLine}>
                    <span class={s.codeKeyword}>export default</span>{' '}
                    <span class={s.codeFn}>defineConfig</span>
                    <span class={s.codePunct}>{'({'}</span>
                  </span>
                  <span class={s.codeLine}>
                    {'  '}
                    <span class={s.codeProp}>title</span>
                    <span class={s.codePunct}>:</span>{' '}
                    <span class={s.codeString}>'杨 ◦ 柳'</span>
                    <span class={s.codePunct}>,</span>
                  </span>
                  <span class={s.codeLine}>
                    {'  '}
                    <span class={s.codeProp}>description</span>
                    <span class={s.codePunct}>:</span>{' '}
                    <span class={s.codeString}>'个人文档站'</span>
                    <span class={s.codePunct}>,</span>
                  </span>
                  <span class={s.codeLine}>
                    {'  '}
                    <span class={s.codeProp}>theme</span>
                    <span class={s.codePunct}>:</span>{' '}
                    <span class={s.codeString}>'auto'</span>
                    <span class={s.codePunct}>,</span>
                  </span>
                  <span class={s.codeLine}>
                    {'  '}
                    <span class={s.codeProp}>search</span>
                    <span class={s.codePunct}>:</span>{' '}
                    <span class={s.codeString}>'orama'</span>
                    <span class={s.codePunct}>,</span>
                  </span>
                  <span class={s.codeLine}>
                    <span class={s.codePunct}>{'})'}</span>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* CATEGORIES */}
          <section class={s.section}>
            <h2 class={s.sectionTitle}>主题目录</h2>
            <p class={s.sectionDesc}>所有笔记按主题归档，点击进入阅读。</p>
            <div class={s.catGrid}>
              {links.value.map((f) => (
                <RouterLink key={f.url} to={f.url} class={s.catCard}>
                  {f.icon && <span class={s.catIcon}>{f.icon}</span>}
                  <p class={s.catTitle}>{f.title}</p>
                  {f.description && <p class={s.catDesc}>{f.description}</p>}
                </RouterLink>
              ))}
            </div>
          </section>

          {/* FEATURES */}
          <section class={s.section}>
            <h2 class={s.sectionTitle}>特性</h2>
            <p class={s.sectionDesc}>
              由 Fumadocs 的 Vue 3 + TSX 复刻，内置文档站常用的全部零件。
            </p>
            <div class={s.featureGrid}>
              <div class={s.feature}>
                <span class={s.featureIcon}>📝</span>
                <p class={s.featureTitle}>MDX 内容</p>
                <p class={s.featureDesc}>兼容 Fumadocs meta.json 页面树，支持 frontmatter、TOC、KaTeX。</p>
              </div>
              <div class={s.feature}>
                <span class={s.featureIcon}>🔍</span>
                <p class={s.featureTitle}>全文搜索</p>
                <p class={s.featureDesc}>客户端索引、快捷键 <kbd>Ctrl K</kbd> 即开即搜。</p>
              </div>
              <div class={s.feature}>
                <span class={s.featureIcon}>🌗</span>
                <p class={s.featureTitle}>主题切换</p>
                <p class={s.featureDesc}>亮 / 暗 双主题，CSS 变量驱动，切换无闪烁。</p>
              </div>
              <div class={s.feature}>
                <span class={s.featureIcon}>🎨</span>
                <p class={s.featureTitle}>代码高亮</p>
                <p class={s.featureDesc}>Shiki + Transformers，支持行高亮、diff、注释块。</p>
              </div>
              <div class={s.feature}>
                <span class={s.featureIcon}>📑</span>
                <p class={s.featureTitle}>完整布局</p>
                <p class={s.featureDesc}>左侧栏 + 中央正文 + 右侧目录，移动端侧滑抽屉。</p>
              </div>
              <div class={s.feature}>
                <span class={s.featureIcon}>⚡</span>
                <p class={s.featureTitle}>静态导出</p>
                <p class={s.featureDesc}>可选 SSG / Prerender：每条路由预渲染为 HTML。</p>
              </div>
            </div>
          </section>
        </main>

        <footer class={s.footer}>
          <span>
            © {new Date().getFullYear()} lytree · Vue 3 · TSX · Vite · UnoCSS
          </span>
          <div class={s.footerLinks}>
            <a class={s.footerLink} href="/llms.txt">llms.txt</a>
            <a class={s.footerLink} href="/sitemap.xml">sitemap</a>
            <a
              class={s.footerLink}
              href="https://github.com/lytree/docs"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    )
  },
})