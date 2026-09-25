import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchIndexFor, localeOfSlug, type SearchEntry } from '../lib/Source'
import s from './SearchDialog.module.scss'

interface Hit extends SearchEntry {
  score: number
}

const TYPE_LABEL: Record<string, string> = {
  page: '页面',
  heading: '标题',
  text: '内容',
}

function highlight(text: string, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return [text]
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx < 0) return [text]
  return [text.slice(0, idx), text.slice(idx, idx + q.length), text.slice(idx + q.length)]
}

/** show the context around the first term match instead of a fixed prefix */
function snippet(text: string, terms: string[]): string {
  if (!text) return text
  const lower = text.toLowerCase()
  let idx = -1
  for (const t of terms) {
    if (!t) continue
    const i = lower.indexOf(t)
    if (i >= 0 && (idx < 0 || i < idx)) idx = i
  }
  if (idx < 0) return text.slice(0, 110)
  const start = Math.max(0, idx - 30)
  return `${start > 0 ? '…' : ''}${text.slice(start, start + 110)}`
}

export const SearchDialog = defineComponent({
  name: 'SearchDialog',
  props: { open: Boolean },
  emits: ['close'],
  setup(props, { emit }) {
    const query = ref('')
    const active = ref(0)
    const inputRef = ref<HTMLInputElement | null>(null)
    const router = useRouter()
    const route = useRoute()

    // search only the current locale's index
    const index = computed(() =>
      searchIndexFor(
        localeOfSlug(
          route.path.startsWith('/docs')
            ? route.path.replace(/^\/docs\/?/, '').replace(/\/$/, '')
            : '',
        ),
      ),
    )

    const hits = computed<Hit[]>(() => {
      const q = query.value.trim().toLowerCase()
      if (!q) return []
      const terms = q.split(/\s+/)
      const out: Hit[] = []
      for (const e of index.value) {
        const title = e.title.toLowerCase()
        const heading = (e.heading ?? '').toLowerCase()
        const content = (e.content ?? '').toLowerCase()
        let score = 0
        let ok = true
        for (const t of terms) {
          if (title.includes(t)) score += 50
          else if (heading.includes(t)) score += 20
          else if (content.includes(t)) score += 8
          else {
            ok = false
            break
          }
        }
        if (ok && score > 0) out.push({ ...e, score })
      }
      return out.sort((a, b) => b.score - a.score).slice(0, 12)
    })

    watch([query, hits], () => (active.value = 0))

    watch(
      () => props.open,
      async (v) => {
        if (v) {
          query.value = ''
          await nextTick()
          inputRef.value?.focus()
        }
      },
    )

    const go = (hit: Hit) => {
      emit('close')
      router.push(hit.url)
    }

    const onKey = (e: KeyboardEvent) => {
      if (!props.open) return
      if (e.key === 'Escape') emit('close')
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        active.value = Math.min(active.value + 1, hits.value.length - 1)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        active.value = Math.max(active.value - 1, 0)
      }
      if (e.key === 'Enter' && hits.value[active.value]) go(hits.value[active.value])
    }

    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    const renderHitText = (text: string) =>
      highlight(text, query.value).map((part, j, arr) =>
        arr.length === 3 && j === 1 ? <mark>{part}</mark> : part,
      )

    const renderMetaText = (text: string) =>
      highlight(snippet(text, query.value.trim().toLowerCase().split(/\s+/)), query.value).map((part, j, arr) =>
        arr.length === 3 && j === 1 ? <mark>{part}</mark> : part,
      )

    return () => (
      <>
        {props.open && (
          <div class={s.searchOverlay}>
            <div class={s.searchBackdrop} onClick={() => emit('close')} />
            <div class={s.searchPanel}>
              <div class={s.searchBar}>
                <span class={s.searchIcon}>⌕</span>
                <input
                  ref={inputRef}
                  class={s.searchInput}
                  placeholder="搜索文档…"
                  value={query.value}
                  onInput={(e) => (query.value = (e.target as HTMLInputElement).value)}
                />
                <kbd class={s.searchEsc}>ESC</kbd>
              </div>
              <div class={s.searchList}>
                {hits.value.length === 0 ? (
                  <p class={s.searchEmpty}>
                    {query.value ? '没有匹配的结果' : '输入关键词开始搜索'}
                  </p>
                ) : (
                  hits.value.map((hit, i) => (
                    <button
                      key={hit.id}
                      class={[s.searchHit, i === active.value && s.searchHitActive]}
                      onMouseenter={() => (active.value = i)}
                      onClick={() => go(hit)}
                    >
                      <span>{renderHitText(hit.title)}</span>
                      <span class={s.searchHitMeta}>
                        {`${TYPE_LABEL[hit.type]}${hit.heading ? ` · ${hit.heading}` : ''}${
                          hit.content ? ' — ' : ''
                        }`}
                        {hit.content && renderMetaText(hit.content)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </>
    )
  },
})
