/**
 * markdown-it 产出的 HTML 在 Vue 侧的渲染与增强。
 *
 * markdown-it 只负责把 Markdown 变成 HTML；所有**交互**（容器折叠、
 * 代码组切换、Tab、KaTeX、图片缩放）在这里用 Vue 接管 ——
 * 这是 VitePress 的同款思路：解析与渲染分离。
 */
import { defineComponent, h, onMounted, ref, type VNode } from 'vue'
import katex from 'katex'

// ---------------------------------------------------------------------------
// KaTeX
// ---------------------------------------------------------------------------

/**
 * 把 `.md-math[data-tex]` 占位替换成 KaTeX 渲染结果。
 *
 * 用 `renderToString` 而非 `render`：后者签名是
 * `render(tex, element, options)` —— 直接往 DOM 元素里塞，返回 void；
 * 这里需要的是 HTML 字符串好塞进 `innerHTML`。
 *
 * 另外用静态 import 而非动态 import：katex 的 CJS 入口经打包后模块形态不稳定，
 * 动态 import 拿到的不保证是带 `renderToString` 的对象。
 */
function hydrateKatex(root: ParentNode): void {
  const nodes = root.querySelectorAll<HTMLElement>('.md-math[data-tex]')
  for (const el of Array.from(nodes)) {
    if (el.dataset.done === '1') continue
    el.dataset.done = '1'
    const tex = el.dataset.tex ?? ''
    const displayMode = el.classList.contains('md-math-block')
    try {
      el.innerHTML = katex.renderToString(tex, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml',
      })
    } catch (e) {
      el.textContent = tex
      el.classList.add('md-math-failed')
      console.warn('[katex] render failed:', (e as Error)?.message)
    }
  }
}

// ---------------------------------------------------------------------------
// v-html 容器 + 挂载后增强
// ---------------------------------------------------------------------------

/**
 * 生成一个组件：渲染 markdown 产出的 HTML，并在挂载后增强交互。
 */
export function renderMarkdown(html: string, frontmatter?: Record<string, unknown>): VNode {
  const Component = defineComponent({
    name: 'MarkdownBody',
    props: {
      html: { type: String, required: true },
    },
    setup(props) {
      const root = ref<HTMLElement | null>(null)

      onMounted(() => {
        const el = root.value
        if (!el) return
        hydrateKatex(el)
        enhanceCodeblocks(el)
        enhanceContainers(el)
        enhanceImages(el)
      })

      return () =>
        h('div', {
          ref: root,
          class: 'fd-prose md-body',
          innerHTML: props.html,
        })
    },
  })

  return h(Component, { html })
}

// ---------------------------------------------------------------------------
// 代码块：复制按钮 + 标题栏
// ---------------------------------------------------------------------------

function enhanceCodeblocks(root: HTMLElement): void {
  for (const wrap of Array.from(root.querySelectorAll<HTMLElement>('.md-codeblock'))) {
    if (wrap.dataset.ready === '1') continue
    wrap.dataset.ready = '1'

    const pre = wrap.querySelector('pre')
    if (!pre) continue

    const title = wrap.dataset.title ?? ''
    const lang = pre.querySelector('code')?.className.match(/language-([\w-]+)/)?.[1] ?? ''
    const label = title || lang

    // 标题栏
    if (label) {
      const head = document.createElement('div')
      head.className = 'md-codeblock-head'
      head.innerHTML =
        `<span class="md-codeblock-title">${escapeHtml(label)}</span>` +
        `<button type="button" class="md-codeblock-copy" aria-label="复制代码" title="复制代码">` +
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>` +
        `</button>`
      wrap.insertBefore(head, pre)
      const btn = head.querySelector('button')
      btn?.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pre.textContent ?? '')
          btn.classList.add('copied')
          btn.innerHTML =
            `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`
          setTimeout(() => {
            btn.classList.remove('copied')
            btn.innerHTML =
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`
          }, 1500)
        } catch {
          /* clipboard unavailable */
        }
      })
      wrap.classList.add('md-codeblock-has-title')
    } else {
      wrap.classList.add('md-codeblock-plain')
    }
  }
}

// ---------------------------------------------------------------------------
// ::: 容器
// ---------------------------------------------------------------------------

const CONTAINER_TITLES: Record<string, { title: string; icon: string }> = {
  tip: { title: 'TIP', icon: '💡' },
  info: { title: 'INFO', icon: 'ℹ' },
  note: { title: 'NOTE', icon: '📝' },
  warning: { title: 'WARNING', icon: '⚠' },
  danger: { title: 'DANGER', icon: '✕' },
  important: { title: 'IMPORTANT', icon: '❗' },
  quote: { title: 'QUOTE', icon: '❝' },
}

function enhanceContainers(root: HTMLElement): void {
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('.md-container'))) {
    const kind = el.dataset.container ?? 'tip'
    const customTitle = el.dataset.title ?? ''

    // details：原生 <details> 行为
    if (kind === 'details') {
      const title = customTitle || '详细信息'
      const summary = document.createElement('summary')
      summary.className = 'md-details-summary'
      summary.innerHTML =
        `<span class="md-details-caret" aria-hidden="true">›</span><span>${escapeHtml(title)}</span>`
      el.insertBefore(summary, el.firstChild)
      const details = document.createElement('details')
      details.className = 'md-details'
      details.innerHTML = el.innerHTML
      el.replaceWith(details)
      continue
    }

    // raw：不加任何包裹
    if (kind === 'raw') {
      const inner = el.innerHTML
      el.outerHTML = inner
      continue
    }

    // code-group：把内部代码块变成标签页
    if (kind === 'code-group') {
      buildCodeGroup(el)
      continue
    }

    // 普通提示块
    const meta = CONTAINER_TITLES[kind] ?? { title: kind.toUpperCase(), icon: 'ℹ' }
    const head = document.createElement('p')
    head.className = 'md-container-title'
    head.innerHTML =
      `<span class="md-container-icon" aria-hidden="true">${meta.icon}</span>` +
      `<span>${escapeHtml(customTitle || meta.title)}</span>`
    el.insertBefore(head, el.firstChild)
    el.classList.add(`md-container-${kind}`)
  }
}

/** ::: code-group -> 标签页 */
function buildCodeGroup(el: HTMLElement): void {
  const blocks = Array.from(el.querySelectorAll<HTMLElement>(':scope > .md-codeblock'))
  if (blocks.length === 0) return

  if (blocks.length === 1) {
    el.classList.add('md-codegroup-single')
    return
  }

  const tabs = document.createElement('div')
  tabs.className = 'md-codegroup-tabs'
  tabs.setAttribute('role', 'tablist')

  const panel = document.createElement('div')
  panel.className = 'md-codegroup-panel'

  blocks.forEach((block, i) => {
    const title =
      block.dataset.title ?? block.querySelector('code')?.className.match(/language-([\w-]+)/)?.[1] ?? `#${i + 1}`

    const tab = document.createElement('button')
    tab.type = 'button'
    tab.className = 'md-codegroup-tab'
    tab.textContent = title
    tab.setAttribute('role', 'tab')
    tab.setAttribute('aria-selected', String(i === 0))
    if (i === 0) tab.classList.add('active')

    tab.addEventListener('click', () => {
      for (const t of Array.from(tabs.children)) {
        t.classList.remove('active')
        t.setAttribute('aria-selected', 'false')
      }
      tab.classList.add('active')
      tab.setAttribute('aria-selected', 'true')
      for (let k = 0; k < blocks.length; k++) {
        blocks[k].style.display = k === i ? '' : 'none'
      }
    })
    tabs.appendChild(tab)

    block.style.display = i === 0 ? '' : 'none'
    panel.appendChild(block)
  })

  el.innerHTML = ''
  el.appendChild(tabs)
  el.appendChild(panel)
  el.classList.add('md-codegroup')
}

// ---------------------------------------------------------------------------
// 图片：点击放大
// ---------------------------------------------------------------------------

function enhanceImages(root: HTMLElement): void {
  for (const img of Array.from(root.querySelectorAll('img'))) {
    if (img.dataset.zoom === '1') continue
    img.dataset.zoom = '1'
    img.classList.add('md-zoomable')
    img.addEventListener('click', () => {
      const overlay = document.createElement('div')
      overlay.className = 'md-zoom-overlay'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      const big = document.createElement('img')
      big.src = img.src
      big.alt = img.alt
      big.className = 'md-zoom-img'
      overlay.appendChild(big)
      const close = () => {
        overlay.remove()
        document.body.style.overflow = ''
        document.removeEventListener('keydown', onKey)
      }
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') close()
      }
      overlay.addEventListener('click', close)
      document.addEventListener('keydown', onKey)
      document.body.style.overflow = 'hidden'
      document.body.appendChild(overlay)
    })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default renderMarkdown