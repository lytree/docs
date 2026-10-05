import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Sidebar } from './Sidebar'
import { SearchDialog } from './SearchDialog'
import { Toc } from './Toc'
import { Banner } from './Banner'
import { Slot, type SlotContext } from '../lib/Slots'
import {
  navItems,
  isNavActive,
  uiText,
  outlineRange,
  outlineTitle,
  footerConfig,
} from '../lib/Config'
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
    const { theme, toggle, isDark } = useTheme()

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

    const rawToc = computed(
      () => (route.meta as { toc?: { title: string; url: string; depth: number }[] }).toc,
    )
    /**
     * outline 深度范围：frontmatter outline > 配置 layout.outline > [2,3]。
     * false 表示本页不显示目录。
     */
    const outline = computed<[number, number] | false>(() => {
      const fmOutline = (route.meta as { outline?: false | [number, number] }).outline
      if (fmOutline === false) return false
      if (Array.isArray(fmOutline) && fmOutline.length === 2) return fmOutline
      return outlineRange()
    })
    const toc = computed(() => {
      const range = outline.value
      if (range === false) return []
      const list = rawToc.value ?? []
      return list.filter((t) => t.depth >= range[0] && t.depth <= range[1])
    })

    const full = computed(() => (route.meta as { full?: boolean }).full === true)
    /** frontmatter aside: false 关闭目录，'left' 挪到左侧 */
    const aside = computed<'left' | 'right' | false>(() => {
      const fm = (route.meta as { aside?: 'left' | 'right' | false }).aside
      if (fm === false) return false
      if (fm === 'left' || fm === 'right') return fm
      return 'right'
    })
    const pageClass = computed(
      () => (route.meta as { pageClass?: string }).pageClass ?? '',
    )
    const docTitle = computed(
      () => (route.meta as { title?: string }).title ?? site.title,
    )

    /** 插槽上下文：布局把页面信息透给所有插槽 */
    const slotCtx = computed<SlotContext>(() => ({
      path: route.path,
      slug: currentSlug.value,
      title: docTitle.value,
      dark: theme.value === 'dark',
      page: route.meta,
      frontmatter: route.meta.frontmatter as Record<string, unknown> | undefined,
      prev: prev.value,
      next: next.value,
      locale: locale.value,
    }))

    // ---- 配置驱动的 nav ----
    const configNav = computed(() => navItems())
    const tc = computed(() => uiText())
    const footer = computed(() => footerConfig())

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

    return () => {
      const ctx = slotCtx.value
      const tocList = toc.value
      const hasToc = !full.value && tocList.length > 0

      return (
        <div class={[s.shell, pageClass.value]}>
          {/* ---- 全局顶部插槽（layout-top） ---- */}
          <Slot name="layout-top" ctx={ctx} />

          <Banner />

          {/* ------------ top nav (always visible) ------------ */}
          <header class={s.nav}>
            {/* 导航栏最左侧自定义内容 */}
            <Slot name="nav-bar-content-before" ctx={ctx} />

            <div class={s.navInner}>
              <RouterLink to="/" class={s.brandLink} aria-label={tc.value.homeLinkLabel}>
                <Slot name="nav-bar-title-before" ctx={ctx} />
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

              {/* 配置驱动的 nav（themeConfig.nav） */}
              {configNav.value.length > 0 && (
                <nav class={s.tabsList} aria-label="主导航">
                  {configNav.value.map((item) => (
                    <a
                      key={item.label}
                      href={item.to ?? '#'}
                      class={[s.tab, isNavActive(item, route.path) && s.tabActive]}
                      target={item.to?.startsWith('http') ? '_blank' : undefined}
                      rel={item.to?.startsWith('http') ? 'noreferrer' : undefined}
                    >
                      {item.icon && <span class={s.tabIcon}>{item.icon}</span>}
                      <span>{item.label}</span>
                    </a>
                  ))}
                </nav>
              )}

              <div class={s.navSpacer} />

              {/* 导航栏中部右侧自定义内容 */}
              <Slot name="nav-bar-content-after" ctx={ctx} />

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
                <span class={s.searchTriggerLabel}>
                  {tc.value.searchPlaceholder}
                </span>
                <kbd class={s.searchTriggerKbd}>Ctrl K</kbd>
              </button>

              <button
                type="button"
                class={[s.themeIconBtn, theme.value === 'dark' && s.themeIconBtnActive]}
                onClick={() => toggle()}
                aria-label={theme.value === 'dark' ? '切换到亮色' : '切换到暗色'}
                title={theme.value === 'dark' ? '切换到亮色' : '切换到暗色'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  <path class={s.themeIconDark} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>

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

            {/* 品牌名右侧自定义内容 */}
            <Slot name="nav-bar-title-after" ctx={ctx} />

            {/* mobile-only secondary row: an accordion-style page selector */}
            {!full.value && (
              <button
                type="button"
                class={s.mobileBar}
                onClick={() => (sidebarOpen.value = !sidebarOpen.value)}
                aria-expanded={sidebarOpen.value}
                aria-label={tc.value.sidebarMenuLabel}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                <span>{docTitle.value}</span>
                <span class={[s.mobileBarChevron, sidebarOpen.value && s.mobileBarChevronOpen]}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </button>
            )}
          </header>

          {/* ------------ body grid (sidebar / main / toc) ------------ */}
          <div class={s.body}>
            <div
              class={[
                s.bodyInner,
                !full.value && hasToc && s.bodyInnerWithToc,
                aside.value === 'left' && s.bodyInnerTocLeft,
              ]}
            >
              {/* sidebar */}
              {!full.value && (
                <aside
                  class={[s.sidebar, sidebarOpen.value && s.sidebarMobileOpen]}
                  aria-label="文档导航"
                >
                  <Slot name="sidebar-nav-before" ctx={ctx} />
                  <Sidebar onNavigate={() => (sidebarOpen.value = false)} />
                  <Slot name="sidebar-nav-after" ctx={ctx} />
                </aside>
              )}

              {/* content */}
              <main class={s.main}>
                <Slot name="doc-before" ctx={ctx} />

                <article class={[s.article, full.value && s.articleFull]}>
                  {!full.value && crumbs.value.length > 1 && (
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

                  {/* 正文前的自定义区域（页内） */}
                  <Slot name="doc-top" ctx={ctx} />

                  {/* mobile/tablet TOC popover sits inside the article, above the body */}
                  {!full.value && hasToc && (
                    <div class={s.articleToc}>
                      <Toc toc={tocList} path={route.path} title={outlineTitle()} />
                    </div>
                  )}

                  {slots.default?.()}

                  {!full.value && hasToc && (
                    <div class={s.articleTocAfter}>
                      <Slot name="doc-bottom" ctx={ctx} />
                    </div>
                  )}

                  {!full.value && (prev.value || next.value) && (
                    <div class={s.pager}>
                      {prev.value?.url ? (
                        <RouterLink to={prev.value.url} class={[s.pagerCard, s.pagerPrev]}>
                          <span class={s.pagerLabel}>← {tc.value.prev}</span>
                          <span class={s.pagerTitle}>{prev.value.title}</span>
                        </RouterLink>
                      ) : (
                        <span class={s.pagerPlaceholder} />
                      )}
                      {next.value?.url ? (
                        <RouterLink to={next.value.url} class={[s.pagerCard, s.pagerNext]}>
                          <span class={s.pagerLabel}>{tc.value.next} →</span>
                          <span class={s.pagerTitle}>{next.value.title}</span>
                        </RouterLink>
                      ) : (
                        <span class={s.pagerPlaceholder} />
                      )}
                    </div>
                  )}

                  {/* 页脚区：自定义插槽 */}
                  <Slot name="doc-footer" ctx={ctx} />
                </article>

                <Slot name="doc-after" ctx={ctx} />
              </main>

              {/* desktop TOC sticky column — hidden on smaller screens (Toc renders popover instead) */}
              {!full.value && hasToc ? (
                <div class={s.bodyToc}>
                  <Slot name="aside-outline-before" ctx={ctx} />
                  <Toc toc={tocList} path={route.path} title={outlineTitle()} />
                  <Slot name="aside-outline-after" ctx={ctx} />
                </div>
              ) : null}
            </div>
          </div>

          {/* mobile sidebar scrim */}
          {!full.value && sidebarOpen.value && (
            <div class={s.scrim} onClick={() => (sidebarOpen.value = false)} />
          )}

          <SearchDialog open={searchOpen.value} onClose={() => (searchOpen.value = false)} />

          {/* ---- 全局底部插槽（layout-bottom） ---- */}
          <Slot name="layout-bottom" ctx={ctx} />

          {/* ---- 全站页脚：themeConfig.footer ---- */}
          {(footer.value?.message || footer.value?.copyright) && (
            <footer class={s.globalFooter}>
              {footer.value?.message && (
                <p class={s.footerMessage}>{footer.value.message}</p>
              )}
              {footer.value?.copyright && (
                <p class={s.footerCopyright}>{footer.value.copyright}</p>
              )}
            </footer>
          )}
        </div>
      )
    }
  },
})