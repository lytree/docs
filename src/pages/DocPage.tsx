import { defineComponent, computed, ref, watch, h, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { DocsLayout } from '../components/DocsLayout'
import { ApiDoc } from '../components/ApiDoc'
import { pageBySlug, site, type PageData } from '../lib/Source'
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

    const load = async () => {
      notFound.value = false
      const data = pageBySlug(slug.value)
      page.value = data ?? null
      if (!data) {
        notFound.value = true
        MdxContent.value = null
        route.meta.full = false
        applyHead({ title: `未找到 · ${site.title}`, path: route.path })
        return
      }
      // expose TOC + title + full mode to the layout through route meta
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
        // generated API reference page — rendered from structured data, no MDX
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

    return () => (
      <DocsLayout>
        {notFound.value ? (
          <div class={s.doc404}>
            <p class={s.doc404Code}>404</p>
            <p class={s.doc404Text}>该页面不存在</p>
          </div>
        ) : page.value ? (
          <article class="fd-prose">
            <h1 class={s.docTitle}>{page.value.title}</h1>
            {page.value.description && (
              <p class={s.docDesc}>{page.value.description}</p>
            )}
            {page.value.api ? (
              <ApiDoc data={page.value.api} />
            ) : MdxContent.value ? (
              h(MdxContent.value as Component, { components: mdxComponents })
            ) : notFound.value ? (
              <p class={s.docLoading}>加载失败</p>
            ) : (
              <p>加载中…</p>
            )}
            {(page.value.lastModified || editUrl.value) && (
              <footer class={s.docFooter}>
                {page.value.lastModified && (
                  <span>最后更新于 {fmtDate(page.value.lastModified)}</span>
                )}
                {editUrl.value && (
                  <a class={s.docFooterEdit} href={editUrl.value} target="_blank" rel="noopener">
                    编辑此页 ↗
                  </a>
                )}
              </footer>
            )}
          </article>
        ) : (
          <p class={s.docLoading}>加载中…</p>
        )}
      </DocsLayout>
    )
  },
})
