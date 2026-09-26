import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchIndexFor, localeOfSlug, type SearchEntry } from '../lib/Source'
import s from './SearchDialog.module.scss'

interface Hit extends SearchEntry {
  score: number
}

const TYPE_LABEL: Record<string, string> = {
  page: '页面',
  heading: '章节',
  text: '正文',
}

const TYPE_ICON: Record<string, string> = {
  page: '📄',
  heading: '#',
  text: '¶',
}

function highlight(text: string, query: string): { plain: boolean; parts: string[] } {
  const q = query.trim().toLowerCase()
  if (!q) return { plain: true, parts: [text] }
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx < 0) return { plain: true, parts: [text] }
  return {
    plain: false,
    parts: [text.slice(0, idx), text.slice(idx, idx + q.length), text.slice(idx + q.length)],
  }
}

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
  const end = Math.min(text.length, start + 110)
  return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`
}

const renderHL = (text: string, q: string) => {
  const r = highlight(text, q)
  if (r.plain) return text
  return (
    <>
      {r.parts[0]}
      <mark>{r.parts[1]}</mark>
      {r.parts[2]}
    </>
  )
}

export const SearchDialog = defineComponent({
  name: 'SearchDialog',
  props: { open: Boolean },
  emits: ['close'],
  setup(props, { emit }) {
    const query = ref('')
    const active = ref(0)
    const inputRef = ref<HTMLInputElement | null>(null)
    const listRef = ref<HTMLDivElement | null>(null)
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
      if (e.key === 'Escape') {
        e.preventDefault()
        emit('close')
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        active.value = Math.min(active.value + 1, hits.value.length - 1)
        scrollActiveIntoView()
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        active.value = Math.max(active.value - 1, 0)
        scrollActiveIntoView()
      }
      if (e.key === 'Enter' && hits.value[active.value]) {
        e.preventDefault()
        go(hits.value[active.value])
      }
    }

    const scrollActiveIntoView = () => {
      nextTick(() => {
        const el = listRef.value?.querySelector<HTMLElement>(`[data-active="true"]`)
        el?.scrollIntoView({ block: 'nearest' })
      })
    }

    onMounted(() => window.addEventListener('keydown', onKey))
    onUnmounted(() => window.removeEventListener('keydown', onKey))

    return () => (
      <>
        {props.open && (
          <div class={s.overlay}>
            <div class={s.backdrop} onClick={() => emit('close')} />
            <div class={s.panel} role="dialog" aria-label="搜索文档">
              <div class={s.bar}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class={s.icon}
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  ref={inputRef}
                  class={s.input}
                  placeholder="搜索文档…"
                  value={query.value}
                  onInput={(e) => (query.value = (e.target as HTMLInputElement).value)}
                />
                <kbd class={s.kbd}>ESC</kbd>
              </div>
              <div class={s.list} ref={listRef}>
                {hits.value.length === 0 ? (
                  <p class={s.empty}>
                    {query.value ? `没有匹配 “${query.value}” 的结果` : '输入关键词开始搜索'}
                  </p>
                ) : (
                  <div class={s.group}>
                    {hits.value.map((hit, i) => (
                      <button
                        key={hit.id}
                        class={[s.hit, i === active.value && s.hitActive]}
                        data-active={i === active.value}
                        onMouseenter={() => (active.value = i)}
                        onClick={() => go(hit)}
                      >
                        <span class={s.hitIcon}>{TYPE_ICON[hit.type] ?? '•'}</span>
                        <span class={s.hitBody}>
                          <span class={s.hitTitle}>{renderHL(hit.title, query.value)}</span>
                          {hit.content && (
                            <span class={s.hitMeta}>
                              {hit.heading ? `${hit.heading} · ` : `${TYPE_LABEL[hit.type]} · `}
                              {renderHL(snippet(hit.content, query.value.trim().toLowerCase().split(/\s+/)), query.value)}
                            </span>
                          )}
                          {!hit.content && hit.heading && (
                            <span class={s.hitMeta}>{hit.heading}</span>
                          )}
                        </span>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          class={s.hitArrow}
                          aria-hidden="true"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div class={s.footer}>
                <span class={s.footerHint}>
                  <kbd class={s.kbd}>↑</kbd>
                  <kbd class={s.kbd}>↓</kbd>
                  浏览
                </span>
                <span class={s.footerHint}>
                  <kbd class={s.kbd}>↵</kbd>
                  打开
                </span>
                <span class={s.footerHint}>
                  <kbd class={s.kbd}>ESC</kbd>
                  关闭
                </span>
              </div>
            </div>
          </div>
        )}
      </>
    )
  },
})