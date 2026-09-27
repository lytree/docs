import { defineComponent, computed, ref, watch, h, type Component } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { DocsLayout } from '../components/DocsLayout'
import { ApiDoc } from '../components/ApiDoc'
import {
  pageBySlug,
  site,
  getPageTreePeers,
  type PageData,
  type PageTreeNode,
} from '../lib/Source'
import { applyHead } from '../lib/Seo'
import { setMDXComponents } from '../lib/JsxRuntime'
import { mdxComponents } from '../components/MdxComponents'
import s from './DocPage.module.scss'

const modules = import.meta.glob('/content/docs/**/*.{md,mdx}')

/** og image file name for a page slug (slashes flattened) */
export const ogKey = (slug: string) => `/og/${slug.replace(/\//g, '-') || 'index'}.png`

const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })

export const DocPage = defineComponent({
  name: 'DocPage',
  setup() {
    const route = useRoute()
    const page = ref<PageData | null>(null)
    const MdxContent = ref<Component | null>(null)
    const notFound = ref(false)
    const mdCopied = ref(false)
    const viewOptionsOpen = ref(false)

    const slug = computed(() =>
      route.path.startsWith('/docs')
        ? route.path.replace(/^\/docs\/?/, '').replace(/\/$/, '')
        : '',
    )

    /** "edit this page" url for content pages */
    const editUrl = computed(() => {
      const el = site.editLink
      const p = page.value
      if (!el?.repo || !p?.file || p.api) return null
      return `https://github.com/${el.repo}/edit/${el.branch ?? 'main'}${p.file}`
    })

    /** docs category — siblings of the current page (used on index pages) */
    const peers = computed<PageTreeNode[]>(() => {
      if (!page.value || page.value.api) return []
      return getPageTreePeers(page.value.slug)
    })

    const load = async () => {
      notFound.value = false
      mdCopied.value = false
      viewOptionsOpen.value = false
      const data = pageBySlug(slug.value)
      page.value = data ?? null
      if (!data) {
        notFound.value = true
        MdxContent.value = null
        route.meta.full = false
        applyHead({ title: `未找到 · ${site.title}`, path: route.path })
        return
      }
      route.meta.toc = data.toc
      route.meta.title = data.title
      route.meta.full = !!data.full
      applyHead({
        title: `${data.title} · ${site.title}`,
        description: data.description,
        path: route.path,
        ogImage: ogKey(data.slug),
        locale: data.locale,
      })
      if (data.api) {
        MdxContent.value = null
        return
      }
      const loader = modules[data.file]
      if (!loader) {
        notFound.value = true
        return
      }
      const mod = (await loader()) as { default: Component }
      MdxContent.value = mod.default
    }

    watch(slug, load, { immediate: true })
    watch(MdxContent, (c) => {
      if (c) setMDXComponents(mdxComponents)
    })
    // Tabs' `router.replace` (query-only) creates a fresh route whose meta is
    // reset from the route record — re-apply the runtime meta of current page
    // so TOC / InlineToc keep working after a tab switch.
    watch(
      () => route.fullPath,
      () => {
        const p = page.value
        if (!p) return
        route.meta.toc = p.toc
        route.meta.title = p.title
        route.meta.full = !!p.full
      },
    )

    /** fetch the canonical raw markdown for the current page (used by Copy / View as MD) */
    const fetchMarkdownUrl = async (): Promise<string | null> => {
      if (!page.value) return null
      // pages live at <slug>.md or <slug>.mdx under /content/docs — but the dev server
      // does not serve those directly. We try the .mdx URL (next-style) and fall back
      // to telling the user to copy from GitHub.
      const p = page.value
      const candidates = [`${p.slug}.mdx`, `${p.slug}.md`]
      for (const c of candidates) {
        try {
          const r = await fetch(`/docs/${c}`, { method: 'HEAD' })
          if (r.ok) return `/docs/${c}`
        } catch {
          /* ignore */
        }
      }
      return null
    }

    const copyMarkdown = async () => {
      const url = await fetchMarkdownUrl()
      if (!url) {
        if (editUrl.value) window.open(editUrl.value, '_blank')
        return
      }
      try {
        const r = await fetch(url)
        const text = await r.text()
        await navigator.clipboard.writeText(text)
        mdCopied.value = true
        setTimeout(() => (mdCopied.value = false), 1500)
      } catch {
        /* clipboard unavailable */
      }
    }

    return () => {
      if (notFound.value) {
        return (
          <DocsLayout>
            <div class={s.doc404}>
              <p class={s.doc404Code}>404</p>
              <p class={s.doc404Text}>该页面不存在</p>
              <RouterLink to="/docs" class={s.doc404Back}>
                返回文档
              </RouterLink>
            </div>
          </DocsLayout>
        )
      }
      if (!page.value) {
        return (
          <DocsLayout>
            <p class={s.docLoading}>加载中…</p>
          </DocsLayout>
        )
      }
      const p = page.value
      return (
        <DocsLayout>
          <article class="fd-prose">
            <h1 class={s.docTitle}>{p.title}</h1>
            {p.description && <p class={s.docDesc}>{p.description}</p>}

            {/* Page toolbar — Copy Markdown + View Options (faux <ViewOptionsPopover />) */}
            <div class={s.docToolbar}>
              <button
                type="button"
                class={s.toolbarBtn}
                onClick={copyMarkdown}
                aria-label="复制 Markdown"
                title="复制 Markdown"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                </svg>
                <span>{mdCopied.value ? '已复制' : 'Copy Markdown'}</span>
              </button>

              <div class={s.viewOptions}>
                <button
                  type="button"
                  class={s.toolbarBtn}
                  onClick={() => (viewOptionsOpen.value = !viewOptionsOpen.value)}
                  aria-haspopup="menu"
                  aria-expanded={viewOptionsOpen.value}
                  title="视图选项"
                >
                  <span>Open</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style={{ marginLeft: '2px' }}>
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {viewOptionsOpen.value && (
                  <div class={s.viewMenu} role="menu">
                    {editUrl.value && (
                      <a class={s.viewItem} href={editUrl.value} target="_blank" rel="noopener" role="menuitem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                          <path d="M7 7h10v10" />
                          <path d="M7 17 17 7" />
                        </svg>
                        <span>Open in GitHub</span>
                      </a>
                    )}
                    <a
                      class={s.viewItem}
                      href={ogKey(p.slug)}
                      target="_blank"
                      rel="noopener"
                      role="menuitem"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
                      </svg>
                      <span>Open OG Image</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {p.api ? (
              <ApiDoc data={p.api} />
            ) : MdxContent.value ? (
              h(MdxContent.value as Component, { components: mdxComponents })
            ) : (
              <p class={s.docLoading}>加载中…</p>
            )}

            {/* DocsCategory — list siblings on index pages */}
            {peers.value.length > 0 && (
              <div class={s.docCategory}>
                {peers.value.map((peer) => (
                  <RouterLink key={peer.url ?? peer.name} to={peer.url ?? '#'} class={s.docCategoryCard}>
                    {peer.icon && <span class={s.docCategoryIcon}>{peer.icon}</span>}
                    <span class={s.docCategoryBody}>
                      <span class={s.docCategoryTitle}>{peer.title ?? peer.name}</span>
                      {peer.description && (
                        <span class={s.docCategoryDesc}>{peer.description}</span>
                      )}
                    </span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class={s.docCategoryArrow}>
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </RouterLink>
                ))}
              </div>
            )}

            {/* footer: last updated + edit link */}
            {(p.lastModified || editUrl.value) && (
              <footer class={s.docFooter}>
                <div class={s.docFooterLeft}>
                  {p.lastModified && (
                    <span class={s.docFooterDate}>
                      最后更新于 {fmtDate(p.lastModified)}
                    </span>
                  )}
                </div>
                <div class={s.docFooterRight}>
                  {editUrl.value && (
                    <a class={s.docFooterEdit} href={editUrl.value} target="_blank" rel="noopener">
                      在 GitHub 编辑 ↗
                    </a>
                  )}
                </div>
              </footer>
            )}
          </article>
        </DocsLayout>
      )
    }
  },
})