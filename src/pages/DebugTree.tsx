import { defineComponent } from 'vue'
import { source } from 'virtual:source'

/** Diagnostic page: dumps the full source tree + page list. Visit /__debug/tree */
export const DebugTree = defineComponent({
  name: 'DebugTree',
  setup() {
    return () => (
      <div style={{ padding: '2rem', fontFamily: 'ui-monospace, Consolas, monospace', fontSize: '12px' }}>
        <h1 style={{ fontSize: '20px', marginBottom: '1rem' }}>Debug: source tree</h1>
        <section>
          <h2 style={{ fontSize: '16px' }}>locales</h2>
          <pre>{JSON.stringify(source.locales, null, 2)}</pre>
          <p>defaultLocale = <code>{source.defaultLocale}</code></p>
        </section>
        <section>
          <h2 style={{ fontSize: '16px' }}>tree (default locale)</h2>
          <pre>{JSON.stringify(source.byLocale[source.defaultLocale]?.tree ?? null, null, 2)}</pre>
        </section>
        <section>
          <h2 style={{ fontSize: '16px' }}>pages ({source.pages.length})</h2>
          <pre>{JSON.stringify(source.pages.map((p: { slug: string; title: string }) => ({ slug: p.slug, title: p.title, url: `/docs/${p.slug}` })), null, 2)}</pre>
        </section>
      </div>
    )
  },
})