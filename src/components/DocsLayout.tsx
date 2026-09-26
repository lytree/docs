import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Sidebar } from './Sidebar'
import { SearchDialog } from './SearchDialog'
import { Toc } from './Toc'
import { useTheme } from '../lib/Theme'
import {
  locales,
  defaultLocale,
  localeOfSlug,
  stripLocale,
  dataFor,
  flattenTree,
  breadcrumb,
  urlBySlug,
  site,
  type PageTreeNode,
} from '../lib/Source'
import s from './DocsLayout.module.scss'

type PageNode = PageTreeNode & { type: 'page' }

function isTabActive(folderUrl: string | undefined, currentUrl: string): boolean {
  if (!folderUrl) return false
  return currentUrl === folderUrl || currentUrl.startsWith(folderUrl + '/')
}

export const DocsLayout = defineComponent({
  name: 'DocsLayout',
  setup(_props, { slots }) {
    const route = useRoute()
    const searchOpen = ref(false)
    const sidebarOpen = ref(false)
    const { theme, toggle } = useTheme()

    const currentSlug = computed(() =>
      route.path.startsWith('/docs')
        ? route.path.replace(/^\/docs\/?/, '').replace(/\/$/, '')
        : '',
    )

    const locale = computed(() => localeOfSlug(currentSlug.value))
    const localeTree = computed(() => dataFor(locale.value).tree)
    const rootFolders = computed(() => localeTree.value.filter((n) => n.type === 'folder' && n.root))
    const crumbs = computed(() => breadcrumb(currentSlug.value, localeTree.value))
    const currentUrl = computed(() => urlBySlug(currentSlug.value))

    const pageNodes = computed(
      () => flattenTree(localeTree.value).filter((n) => n.type === 'page') as PageNode[],
    )
    const idx = computed(() => pageNodes.value.findIndex((p) => p.url === currentUrl.value))
    const prev = computed(() => (idx.value > 0 ? pageNodes.value[idx.value - 1] : null))
    const next = computed(() =>
      idx.value >= 0 && idx.value < pageNodes.value.length - 1
        ? pageNodes.value[idx.value + 1]
        : null,
    )

    const toc = computed(
      () => (route.meta as { toc?: { title: string; url: string; depth: number }[] }).toc,
    )
    const full = computed(() => (route.meta as { full?: boolean }).full === true)
    const docTitle = computed(
      () => (route.meta as { title?: string }).title ?? site.title,
    )

    const localeSwitchUrl = (code: string): string => {
      const bare = stripLocale(currentSlug.value)
      if (code === defaultLocale) return bare ? `/docs/${bare}` : '/docs'
      return `/docs/${code}${bare ? `/${bare}` : ''}`
    }
    const otherLocales = computed(() => locales.filter((l) => l.code !== locale.value))

    const onKey = (e: KeyboardEvent) => {
      // cmd/ctrl-K opens search (skip when in form inputs — handled there too)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchOpen.value = true
      }
      // "/" also opens search when not focused on input
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault()
        searchOpen.value = true
      }
    }
    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    return () => (
      <div class={s.shell}>
        {/* ------------ top nav (always visible) ------------ */}
        <header class={s.nav}>
          <div class={s.navInner}>
            <RouterLink to="/" class={s.brandLink}>
              <span class={s.brandIcon} aria-hidden="true">
                Y
              </span>
              <span class={s.brandName}>{site.title}</span>
            </RouterLink>

            {rootFolders.value.length > 0 && (
              <nav class={s.tabsList} aria-label="主题">
                {rootFolders.value.map((folder) => (
                  <RouterLink
                    key={folder.name}
                    to={folder.url ?? '/docs'}
                    class={[s.tab, isTabActive(folder.url, currentUrl.value) && s.tabActive]}
                  >
                    {folder.icon && <span class={s.tabIcon}>{folder.icon}</span>}
                    <span>{folder.title ?? folder.name}</span>
                  </RouterLink>
                ))}
              </nav>
            )}

            <div class={s.navSpacer} />

            {otherLocales.value.length > 0 && (
              <nav class={s.navLinks} aria-label="语言">
                {otherLocales.value.map((l) => (
                  <RouterLink key={l.code} to={localeSwitchUrl(l.code)} class={s.navLink}>
                    {l.name}
                  </RouterLink>
                ))}
              </nav>
            )}

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
              <span class={s.searchTriggerLabel}>搜索文档…</span>
              <kbd class={s.searchTriggerKbd}>Ctrl K</kbd>
            </button>

            <div class={s.themeSwitcher} role="group" aria-label="主题切换">
              <button
                type="button"
                class={[s.themeOption, theme.value === 'light' && s.themeOptionActive]}
                onClick={() => theme.value !== 'light' && toggle()}
                aria-label="亮色主题"
                aria-pressed={theme.value === 'light'}
                title="亮色主题"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              </button>
              <button
                type="button"
                class={[s.themeOption, theme.value === 'dark' && s.themeOptionActive]}
                onClick={() => theme.value !== 'dark' && toggle()}
                aria-label="暗色主题"
                aria-pressed={theme.value === 'dark'}
                title="暗色主题"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
            </div>

            <a
              href="https://github.com/lytree/docs"
              target="_blank"
              rel="noreferrer"
              class={s.navIconBtn}
              aria-label="GitHub"
              title="GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.92.57.11.78-.25.78-.55v-2.02c-3.2.7-3.87-1.37-3.87-1.37-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18a10.94 10.94 0 0 1 5.74 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.11 3.04.73.8 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.13v3.16c0 .31.21.67.79.55A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            </a>
          </div>
        </header>

        {/* ------------ body grid (sidebar / main / toc) ------------ */}
        <div class={s.body}>
          <div class={[s.bodyInner, !full.value && toc.value?.length && s.bodyInnerWithToc]}>
            {/* sidebar */}
            {!full.value && (
              <aside
                class={[s.sidebar, sidebarOpen.value && s.sidebarMobileOpen]}
                aria-label="文档导航"
              >
                <Sidebar onNavigate={() => (sidebarOpen.value = false)} />
              </aside>
            )}

            {/* content */}
            <main class={s.main}>
              <article class={[s.article, full.value && s.articleFull]}>
                {!full.value && (
                  <div class={s.mobileBar}>
                    <button
                      type="button"
                      class={s.mobileMenu}
                      onClick={() => (sidebarOpen.value = !sidebarOpen.value)}
                      aria-label="目录"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                      </svg>
                      <span>目录</span>
                    </button>
                    <span class={s.mobileTitle}>{docTitle.value}</span>
                  </div>
                )}

                {!full.value && crumbs.value.length > 0 && (
                  <nav class={s.breadcrumb} aria-label="breadcrumb">
                    {crumbs.value.map((c, i) => (
                      <span key={i} style="display:inline-flex;align-items:center;gap:0.25rem">
                        {i > 0 && <span class={s.breadcrumbSep}>/</span>}
                        {c.url ? (
                          <RouterLink to={c.url} class={s.breadcrumbLink}>
                            {c.title}
                          </RouterLink>
                        ) : (
                          <span>{c.title}</span>
                        )}
                      </span>
                    ))}
                  </nav>
                )}

                {slots.default?.()}

                {!full.value && (prev.value || next.value) && (
                  <div class={s.pager}>
                    {prev.value?.url ? (
                      <RouterLink to={prev.value.url} class={[s.pagerCard, s.pagerPrev]}>
                        <span class={s.pagerLabel}>← 上一篇</span>
                        <span class={s.pagerTitle}>{prev.value.title}</span>
                      </RouterLink>
                    ) : (
                      <span class={s.pagerPlaceholder} />
                    )}
                    {next.value?.url ? (
                      <RouterLink to={next.value.url} class={[s.pagerCard, s.pagerNext]}>
                        <span class={s.pagerLabel}>下一篇 →</span>
                        <span class={s.pagerTitle}>{next.value.title}</span>
                      </RouterLink>
                    ) : (
                      <span class={s.pagerPlaceholder} />
                    )}
                  </div>
                )}
              </article>
            </main>

            {!full.value && toc.value?.length ? <Toc toc={toc.value} path={route.path} /> : null}
          </div>
        </div>

        {/* mobile sidebar scrim */}
        {!full.value && sidebarOpen.value && (
          <div class={s.scrim} onClick={() => (sidebarOpen.value = false)} />
        )}

        <SearchDialog open={searchOpen.value} onClose={() => (searchOpen.value = false)} />
      </div>
    )
  },
})