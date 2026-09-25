import { source } from 'virtual:source'

const site = source.site

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export interface HeadOptions {
  title: string
  description?: string
  /** current path, e.g. /docs/en/other/js/1 */
  path: string
  /** og image path relative to site root, e.g. /og/other-js-1.png */
  ogImage?: string
  locale?: string
}

/** update document head: title / description / OpenGraph / Twitter / canonical */
export function applyHead(o: HeadOptions) {
  document.title = o.title

  const desc = o.description ?? site.description
  upsertMeta('name', 'description', desc)

  upsertMeta('property', 'og:site_name', site.title)
  upsertMeta('property', 'og:title', o.title)
  upsertMeta('property', 'og:description', desc)
  upsertMeta('property', 'og:type', 'article')
  upsertMeta('property', 'og:url', `${site.url}${o.path}`)
  upsertMeta('property', 'og:image', `${site.url}${o.ogImage ?? '/og/index.png'}`)
  if (o.locale) upsertMeta('property', 'og:locale', o.locale)

  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', o.title)
  upsertMeta('name', 'twitter:description', desc)
  upsertMeta('name', 'twitter:image', `${site.url}${o.ogImage ?? '/og/index.png'}`)

  upsertCanonical(`${site.url}${o.path}`)
}
