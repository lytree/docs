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

    const localeSwitchUrl = (code: string): string => {
      const bare = stripLocale(currentSlug.value)
      if (code === defaultLocale) return bare ? `/docs/${bare}` : '/docs'
      return `/docs/${code}${bare ? `/${bare}` : ''}`
    }
    const otherLocales = computed(() => locales.filter((l) => l.code !== locale.value))

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchOpen.value = true
      }
    }
    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    return () => (
      <div class={s.shell}>
        {/* top nav — always visible, scrolls horizontally on small screens */}
        <header class={s.appHeader}>
          <div class={s.appHeaderInner}>
            <RouterLink to="/" class={s.brand}>
              <span class={s.brandMark}>◦</span>
              <span class={s.brandName}>{site.title}</span>
            </RouterLink>

            <nav class={s.appTabs} aria-label="主题">
              {rootFolders.value.map((folder) => (
                <RouterLink
                  key={folder.name}
                  to={folder.url ?? '/docs'}
                  class={[
                    s.appTab,
                    isTabActive(folder.url, currentUrl.value) && s.appTabActive,
                  ]}
                >
                  {folder.icon && <span class={s.appTabIcon}>{folder.icon}</span>}
                  <span>{folder.title ?? folder.name}</span>
                </RouterLink>
              ))}
            </nav>

            <div class={s.appHeaderSpacer} />

            <nav class={s.langSwitch} aria-label="语言">
              {otherLocales.value.map((l) => (
                <RouterLink key={l.code} to={localeSwitchUrl(l.code)} class={s.langLink}>
                  {l.name}
                </RouterLink>
              ))}
            </nav>

            <button
              type="button"
              class={s.searchBtn}
              onClick={() => (searchOpen.value = true)}
              aria-label="搜索"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <span class={s.searchLabel}>搜索</span>
              <kbd class={s.kbd}>Ctrl K</kbd>
            </button>

            <button
              type="button"
              class={s.themeBtn}
              onClick={toggle}
              aria-label="切换主题"
            >
              {theme.value === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div class={s.body}>
          {/* sidebar */}
          {!full.value && (
            <aside class={[s.sidebar, sidebarOpen.value && s.sidebarOpen]}>
              <Sidebar />
            </aside>
          )}

          {/* content */}
          <main
            class={[
              s.docsMain,
              !full.value && toc.value?.length && s.docsMainWithToc,
              full.value && s.docsMainFull,
            ]}
          >
            <article class={s.docsArticle}>
              {!full.value && (
                <div class={s.crumbs}>
                  {crumbs.value.map((c, i) => (
                    <span class={s.crumbsItem}>
                      {i > 0 && <span class={s.crumbsSep}>/</span>}
                      {c.url ? (
                        <RouterLink to={c.url} class={s.crumbsLink}>
                          {c.title}
                        </RouterLink>
                      ) : (
                        <span>{c.title}</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

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

              {slots.default?.()}

              {!full.value && (prev.value || next.value) && (
                <div class={s.pager}>
                  {prev.value?.url ? (
                    <RouterLink to={prev.value.url} class={[s.pagerCard, s.pagerPrev]}>
                      <span class={s.pagerLabel}>← 上一篇</span>
                      <span class={s.pagerTitle}>{prev.value.title}</span>
                    </RouterLink>
                  ) : (
                    <span class={s.pagerCardPlaceholder} />
                  )}
                  {next.value?.url ? (
                    <RouterLink to={next.value.url} class={[s.pagerCard, s.pagerNext]}>
                      <span class={s.pagerLabel}>下一篇 →</span>
                      <span class={s.pagerTitle}>{next.value.title}</span>
                    </RouterLink>
                  ) : (
                    <span class={s.pagerCardPlaceholder} />
                  )}
                </div>
              )}
            </article>
          </main>

          {!full.value && toc.value?.length ? <Toc toc={toc.value} path={route.path} /> : null}
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