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

export const DocsLayout = defineComponent({
  name: 'DocsLayout',
  setup(_props, { slots }) {
    const route = useRoute()
    const searchOpen = ref(false)
    const sidebarOpen = ref(false)
    const { theme, toggle } = useTheme()

    const currentSlug = () =>
      route.path.startsWith('/docs')
        ? route.path.replace(/^\/docs\/?/, '').replace(/\/$/, '')
        : ''

    const locale = computed(() => localeOfSlug(currentSlug()))
    const localeTree = computed(() => dataFor(locale.value).tree)
    const rootFolders = computed(() => localeTree.value.filter((n) => n.type === 'folder' && n.root))
    const crumbs = computed(() => breadcrumb(currentSlug(), localeTree.value))
    const currentUrl = computed(() => urlBySlug(currentSlug()))

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
    /** frontmatter full: true — hide sidebar + toc, widen content */
    const full = computed(() => (route.meta as { full?: boolean }).full === true)

    /** url of the same page under another locale */
    const localeSwitchUrl = (code: string): string => {
      const bare = stripLocale(currentSlug())
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
      <>
        {/* top nav */}
        <header class={s.appHeader}>
          <div class={s.appHeaderInner}>
            {!full.value && (
              <button
                class={s.menuBtn}
                aria-label="menu"
                onClick={() => (sidebarOpen.value = !sidebarOpen.value)}
              >
                ☰
              </button>
            )}
            <RouterLink to="/" class={s.brand}>
              {site.title}
            </RouterLink>
            <nav class={s.appTabs}>
              {rootFolders.value.map((folder) => (
                <RouterLink
                  key={folder.name}
                  to={folder.url ?? '/docs'}
                  class={[
                    s.appTab,
                    currentUrl.value.startsWith(folder.url ?? '/docs/__never') &&
                      s.appTabActive,
                  ]}
                >
                  {folder.icon && <span class={s.appTabIcon}>{folder.icon}</span>}
                  {folder.title ?? folder.name}
                </RouterLink>
              ))}
            </nav>
            <div class={s.appHeaderSpacer} />
            <nav class={s.langSwitch}>
              {otherLocales.value.map((l) => (
                <RouterLink key={l.code} to={localeSwitchUrl(l.code)} class={s.langLink}>
                  {l.name}
                </RouterLink>
              ))}
            </nav>
            <button class={s.searchBtn} onClick={() => (searchOpen.value = true)}>
              <span>⌕ 搜索</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button class={s.themeBtn} onClick={toggle}>
              {theme.value === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {/* sidebar */}
        {!full.value && (
          <aside class={[s.sidebar, sidebarOpen.value && s.sidebarOpen]}>
            <Sidebar />
          </aside>
        )}
        {!full.value && sidebarOpen.value && (
          <div class={s.sidebarScrim} onClick={() => (sidebarOpen.value = false)} />
        )}

        {/* content */}
        <main class={[s.docsMain, !full.value && toc.value?.length && s.docsMainWithToc, full.value && s.docsMainFull]}>
          <div class={s.docsMainInner}>
            <div class={s.docsMainBody}>
              {/* breadcrumb */}
              <div class={s.crumbs}>
                {crumbs.value.map((c, i) => (
                  <>
                    {i > 0 && <span>/</span>}
                    {c.url ? (
                      <RouterLink to={c.url} class={s.crumbsLink}>
                        {c.title}
                      </RouterLink>
                    ) : (
                      <span>{c.title}</span>
                    )}
                  </>
                ))}
              </div>
              {slots.default?.()}
              {/* pagination */}
              <div class={s.pager}>
                {prev.value ? (
                  <a href={prev.value.url} class={s.pagerCard}>
                    <p class={s.pagerLabel}>← 上一篇</p>
                    <p class={s.pagerTitle}>{prev.value.title}</p>
                  </a>
                ) : (
                  <div />
                )}
                {next.value ? (
                  <a href={next.value.url} class={[s.pagerCard, s.pagerCardRight]}>
                    <p class={s.pagerLabel}>下一篇 →</p>
                    <p class={s.pagerTitle}>{next.value.title}</p>
                  </a>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </main>

        {!full.value && toc.value?.length ? <Toc toc={toc.value} path={route.path} /> : null}

        <SearchDialog open={searchOpen.value} onClose={() => (searchOpen.value = false)} />
      </>
    )
  },
})
