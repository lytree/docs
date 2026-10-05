import { defineComponent, computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  site,
  defaultLocale,
  dataFor,
  urlBySlug,
  type PageTreeNode,
} from '../lib/Source'
import { applyHead } from '../lib/Seo'
import { Banner } from '../components/Banner'
import { SearchDialog } from '../components/SearchDialog'
import { Slot } from '../lib/Slots'
import { navItems, uiText, siteConfig } from '../lib/Config'
import { useTheme } from '../lib/Theme'
import s from './Home.module.scss'

const REPO = 'https://github.com/lytree/docs'

/** 递归统计一棵页面树里的文档数（folder 的 index 页也算一篇） */
function countDocs(nodes: PageTreeNode[]): number {
  let n = 0
  for (const node of nodes) {
    if (node.type === 'page') n += 1
    else if (node.type === 'folder') n += countDocs(node.children ?? [])
  }
  return n
}

/** 取分类下前若干个可点击的子页面，作为卡片里的速览入口 */
function peekChildren(folder: PageTreeNode, limit = 4): PageTreeNode[] {
  const out: PageTreeNode[] = []
  const walk = (list: PageTreeNode[]) => {
    for (const node of list) {
      if (out.length >= limit) return
      if (node.type === 'separator') continue
      if (node.url) out.push(node)
      else if (node.type === 'folder') walk(node.children ?? [])
    }
  }
  walk(folder.children ?? [])
  return out
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const Home = defineComponent({
  name: 'HomePage',
  setup() {
    const route = useRoute()
    const searchOpen = ref(false)
    const { theme, toggle } = useTheme()
    const tc = uiText()
    const cfg = siteConfig()

    onMounted(() => {
      applyHead({ title: cfg.title, description: cfg.description, path: '/' })
    })

    // Ctrl/⌘ + K 唤起搜索 —— 与文档页保持同一套快捷键
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchOpen.value = true
      }
    }
    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    const data = dataFor(defaultLocale)
    const folders = data.tree.filter((n) => n.type === 'folder' && n.root)
    const pages = data.pages

    /** 分类卡片：图标 / 描述 / 文档数 / 子页面速览 */
    const categories = computed(() =>
      folders.map((f) => ({
        title: f.title ?? f.name,
        slug: f.name,
        description: f.description,
        icon: f.icon,
        url: f.url ?? '/docs',
        count: countDocs(f.children ?? []),
        children: peekChildren(f),
      })),
    )

    /** 最近更新：按 git 最后提交时间倒序 */
    const recent = computed(() =>
      pages
        .filter((p) => typeof p.lastModified === 'number')
        .sort((a, b) => (b.lastModified ?? 0) - (a.lastModified ?? 0))
        .slice(0, 6)
        .map((p) => ({
          title: p.title,
          description: p.description,
          url: urlBySlug(p.slug),
          date: p.lastModified as number,
        })),
    )

    const stats = computed(() => [
      { value: String(categories.value.length), label: '主题分类' },
      { value: String(pages.length), label: '文档条目' },
      { value: '100%', label: '开源可定制' },
    ])

    const features = [
      {
        title: 'Markdown 内容',
        desc: 'markdown-it 管线，兼容 meta.json 页面树，支持 frontmatter、目录大纲与 KaTeX 公式。',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="M6 15.5v-5l3 3 3-3v5" />
            <path d="M17 10.5v5M14.5 13l2.5 2.5 2.5-2.5" />
          </svg>
        ),
      },
      {
        title: '全文搜索',
        desc: '构建期生成客户端索引，快捷键 Ctrl K 即开即搜，支持页面、章节与正文命中。',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        ),
      },
      {
        title: '亮暗双主题',
        desc: 'CSS 变量驱动的设计 token，亮 / 暗两套配色跟随系统，切换无闪烁。',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
          </svg>
        ),
      },
      {
        title: '代码高亮',
        desc: 'Shiki 双主题着色，支持行高亮、diff 标记、文件代码组与 `<<<` 文件导入。',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="m9 8-5 4 5 4M15 8l5 4-5 4" />
          </svg>
        ),
      },
      {
        title: '完整布局',
        desc: '左侧栏 + 中央正文 + 右侧大纲，移动端自动收为抽屉，跨设备一致。',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
            <path d="M9 4v16M15.5 9.5H19M15.5 14.5H19" />
          </svg>
        ),
      },
      {
        title: '静态导出',
        desc: '可选 SSG 预渲染：把每条路由快照为静态 HTML，Vercel 一键部署。',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12z" />
          </svg>
        ),
      },
    ]

    return () => {
      const ctx = { path: route.path, title: site.title }
      return (
        <div class={s.home}>
          <Slot name="layout-top" ctx={ctx} />
          <Banner />

          <header class={s.header}>
            <div class={s.headerInner}>
              <RouterLink to="/" class={s.brand}>
                <span class={s.brandIcon} aria-hidden="true">
                  Y
                </span>
                <span class={s.brandText}>{site.title}</span>
              </RouterLink>

              <nav class={s.nav} aria-label="主导航">
                {navItems()
                  .filter((n) => n.to !== '/')
                  .map((n) =>
                    n.to?.startsWith('http') ? (
                      <a
                        key={n.to}
                        class={s.navLink}
                        href={n.to}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {n.icon && <span aria-hidden="true">{n.icon} </span>}
                        {n.label}
                      </a>
                    ) : (
                      <RouterLink key={n.to} to={n.to ?? '/'} class={s.navLink}>
                        {n.label}
                      </RouterLink>
                    ),
                  )}
              </nav>

              <div class={s.headerActions}>
                <button
                  type="button"
                  class={s.searchTrigger}
                  onClick={() => (searchOpen.value = true)}
                  aria-label="搜索文档"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <span class={s.searchTriggerLabel}>{tc.searchPlaceholder}</span>
                  <kbd class={s.kbd}>Ctrl K</kbd>
                </button>

                <button
                  type="button"
                  class={[s.iconBtn, theme.value === 'dark' && s.iconBtnActive]}
                  onClick={() => toggle()}
                  aria-label={theme.value === 'dark' ? '切换到亮色' : '切换到暗色'}
                  title={theme.value === 'dark' ? '切换到亮色' : '切换到暗色'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                    <path class={s.moon} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </button>

                <RouterLink to="/docs" class={s.headerCta}>
                  进入文档
                </RouterLink>
              </div>
            </div>
          </header>

          <main class={s.main}>
            {/* ---------------- HERO ---------------- */}
            <section class={s.hero}>
              <div class={s.heroGlow} aria-hidden="true" />
              <div class={s.heroGrid} aria-hidden="true" />

              <div class={s.heroInner}>
                <div class={s.heroCopy}>
                  <div class={s.badge}>
                    <span class={s.badgeDot} aria-hidden="true" />
                    <a href={REPO} target="_blank" rel="noreferrer">
                      Vue 3 + TSX 自建文档站
                    </a>
                  </div>

                  <h1 class={s.heroTitle}>
                    把踩过的坑
                    <br />
                    <span class={s.heroTitleAccent}>写成可检索的笔记</span>
                  </h1>

                  <p class={s.heroSubtitle}>
                    {site.description} 左侧栏分类导航、右侧大纲、全文搜索、暗色主题一应俱全，
                    代码高亮与数学公式开箱可用。
                  </p>

                  <div class={s.heroActions}>
                    <RouterLink to="/docs" class={s.heroPrimary}>
                      开始阅读
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </RouterLink>
                    <button type="button" class={s.heroSecondary} onClick={() => (searchOpen.value = true)}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="7" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                      搜索文档
                    </button>
                    <a class={s.heroSecondary} href={REPO} target="_blank" rel="noreferrer">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.57.11.78-.25.78-.55v-2.02c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a10.94 10.94 0 0 1 5.74 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                      </svg>
                      GitHub
                    </a>
                  </div>

                  <div class={s.stats}>
                    {stats.value.map((st) => (
                      <div class={s.stat} key={st.label}>
                        <span class={s.statValue}>{st.value}</span>
                        <span class={s.statLabel}>{st.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 装饰用的笔记片段 */}
                <div class={s.heroVisual}>
                  <div class={s.noteCard}>
                    <div class={s.noteBar}>
                      <div class={s.noteDots}>
                        <span />
                        <span />
                        <span />
                      </div>
                      <span class={s.notePath}>~/notes/java/thread-pool.md</span>
                    </div>
                    <div class={s.noteBody}>
                      <span class={s.noteLine}>
                        <span class={s.noteMeta}>---</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.noteKey}>title</span>
                        <span class={s.notePunct}>:</span>{' '}
                        <span class={s.noteStr}>'线程池的七个参数'</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.noteKey}>tags</span>
                        <span class={s.notePunct}>:</span>{' '}
                        <span class={s.noteStr}>[java, concurrency]</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.noteMeta}>---</span>
                      </span>
                      <span class={s.noteLine}>&nbsp;</span>
                      <span class={s.noteLine}>
                        <span class={s.noteHead}>## 核心参数</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.notePunct}>|</span> 参数{' '}
                        <span class={s.notePunct}>|</span> 说明 <span class={s.notePunct}>|</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.notePunct}>| --- | --- |</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.notePunct}>|</span>{' '}
                        <span class={s.noteFn}>corePoolSize</span>{' '}
                        <span class={s.notePunct}>|</span> 核心线程数 <span class={s.notePunct}>|</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.notePunct}>|</span>{' '}
                        <span class={s.noteFn}>maxPoolSize</span>{' '}
                        <span class={s.notePunct}>|</span> 最大线程数 <span class={s.notePunct}>|</span>
                      </span>
                      <span class={s.noteLine}>
                        <span class={s.notePunct}>|</span>{' '}
                        <span class={s.noteFn}>workQueue</span>{' '}
                        <span class={s.notePunct}>|</span> 任务队列 <span class={s.notePunct}>|</span>
                      </span>
                      <span class={s.noteLine}>&nbsp;</span>
                      <span class={s.noteLine}>
                        <span class={s.noteStr}>::: tip</span>{' '}
                        <span class={s.noteText}>无界队列会让 maximumPoolSize 失效</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ---------------- 主题分类 ---------------- */}
            <section class={s.section}>
              <div class={s.sectionHead}>
                <div>
                  <span class={s.eyebrow}>Categories</span>
                  <h2 class={s.sectionTitle}>主题分类</h2>
                </div>
                <p class={s.sectionDesc}>
                  所有笔记按主题归档，共 {pages.length} 篇。点击卡片进入对应分类。
                </p>
              </div>

              <div class={s.catGrid}>
                {categories.value.map((c, i) => (
                  <RouterLink
                    key={c.slug}
                    to={c.url}
                    class={s.catCard}
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    <div class={s.catTop}>
                      <span class={s.catIcon} aria-hidden="true">
                        {c.icon ?? '📘'}
                      </span>
                      <span class={s.catCount}>{c.count} 篇</span>
                    </div>
                    <p class={s.catTitle}>{c.title}</p>
                    {c.description && <p class={s.catDesc}>{c.description}</p>}

                    {c.children.length > 0 && (
                      <ul class={s.catChildren}>
                        {c.children.map((child) => (
                          <li key={child.url}>
                            <span class={s.catChildDot} aria-hidden="true" />
                            <span class={s.catChildText}>{child.title ?? child.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <span class={s.catArrow} aria-hidden="true">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </RouterLink>
                ))}
              </div>
            </section>

            {/* ---------------- 最近更新 ---------------- */}
            {recent.value.length > 0 && (
              <section class={s.section}>
                <div class={s.sectionHead}>
                  <div>
                    <span class={s.eyebrow}>Recent</span>
                    <h2 class={s.sectionTitle}>最近更新</h2>
                  </div>
                  <p class={s.sectionDesc}>按最后提交时间排序的最新笔记。</p>
                </div>

                <ul class={s.recentList}>
                  {recent.value.map((r) => (
                    <li key={r.url}>
                      <RouterLink to={r.url} class={s.recentItem}>
                        <span class={s.recentMain}>
                          <span class={s.recentTitle}>{r.title}</span>
                          {r.description && (
                            <span class={s.recentDesc}>{r.description}</span>
                          )}
                        </span>
                        <time
                          class={s.recentDate}
                          datetime={new Date(r.date).toISOString()}
                        >
                          {formatDate(r.date)}
                        </time>
                      </RouterLink>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* ---------------- 特性 ---------------- */}
            <section class={s.section}>
              <div class={s.sectionHead}>
                <div>
                  <span class={s.eyebrow}>Features</span>
                  <h2 class={s.sectionTitle}>站点能力</h2>
                </div>
                <p class={s.sectionDesc}>
                  自建文档站常用的零件都已就位，写笔记只需要关心内容本身。
                </p>
              </div>

              <div class={s.featureGrid}>
                {features.map((f, i) => (
                  <div
                    class={s.feature}
                    key={f.title}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span class={s.featureIcon} aria-hidden="true">
                      {f.icon}
                    </span>
                    <p class={s.featureTitle}>{f.title}</p>
                    <p class={s.featureDesc}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ---------------- CTA ---------------- */}
            <section class={s.ctaBand}>
              <div class={s.ctaCopy}>
                <h2 class={s.ctaTitle}>从 {pages.length} 篇笔记里找到你要的那一条</h2>
                <p class={s.ctaDesc}>
                  全文搜索支持页面标题、章节标题与正文内容，或直接从分类目录开始浏览。
                </p>
              </div>
              <div class={s.ctaActions}>
                <RouterLink to="/docs" class={s.heroPrimary}>
                  浏览全部文档
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </RouterLink>
                <button type="button" class={s.heroSecondary} onClick={() => (searchOpen.value = true)}>
                  <kbd class={s.kbd}>Ctrl K</kbd> 搜索
                </button>
              </div>
            </section>
          </main>

          <footer class={s.footer}>
            <div class={s.footerInner}>
              <div class={s.footerBrand}>
                <span class={s.brandIcon} aria-hidden="true">
                  Y
                </span>
                <div>
                  <p class={s.footerTitle}>{site.title}</p>
                  <p class={s.footerDesc}>{site.description}</p>
                </div>
              </div>

              <div class={s.footerLinks}>
                <RouterLink to="/docs" class={s.footerLink}>
                  文档
                </RouterLink>
                <a class={s.footerLink} href="/llms.txt">
                  llms.txt
                </a>
                <a class={s.footerLink} href="/sitemap.xml">
                  sitemap
                </a>
                <a class={s.footerLink} href={REPO} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </div>
            </div>
            <div class={s.footerBottom}>
              <span>
                © {new Date().getFullYear()} {site.title} · Vue 3 · TSX · Vite · UnoCSS
              </span>
            </div>
          </footer>

          <SearchDialog
            open={searchOpen.value}
            onClose={() => (searchOpen.value = false)}
          />
        </div>
      )
    }
  },
})
