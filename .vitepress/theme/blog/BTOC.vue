<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { useData } from "vitepress"
interface Props {
    class?: string
}

defineProps<Props>()

const tocRef = ref<HTMLElement | null>(null)
const activeIndicator = ref<HTMLElement | null>(null)

const visibleClass = 'visible'
const headings = ref(useData().page.value.headers)
const sections: HTMLElement[] = []
const headingIdxMap = new Map<string, number>()
const active: boolean[] = []
let tocEntries: HTMLAnchorElement[] = []
let observer: IntersectionObserver
let anchorNavTarget: HTMLElement | null = null

const minlevel = ref(10)
const heading1Count = ref(1)

const removeTailingHash = (text: string) => {
    let lastIndexOfHash = text.lastIndexOf('#')
    return lastIndexOfHash === text.length - 1 ? text.substring(0, lastIndexOfHash) : text
}

const init = () => {
    tocEntries = Array.from(document.querySelectorAll<HTMLAnchorElement>("#toc a[href^='#']"))
    if (tocEntries.length === 0) return

    for (let i = 0; i < tocEntries.length; i++) {
        const id = decodeURIComponent(tocEntries[i].hash?.substring(1))
        const heading = document.getElementById(id)
        const section = heading?.parentElement
        if (heading instanceof HTMLElement && section instanceof HTMLElement) {
            sections[i] = section
            headingIdxMap.set(id, i)
        }
    }
    active.length = tocEntries.length
    active.fill(false)
    sections.forEach(section => observer.observe(section))
    fallback()
    update()
}

const markVisibleSection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
        const id = entry.target.children[0]?.getAttribute('id')
        const idx = id ? headingIdxMap.get(id) : undefined
        if (idx != undefined) active[idx] = entry.isIntersecting
        if (entry.isIntersecting && anchorNavTarget === entry.target.firstChild) anchorNavTarget = null
    })
    if (!active.includes(true)) fallback()
    update()
}

const update = () => {
    requestAnimationFrame(() => {
        toggleActiveHeading()
        scrollToActiveHeading()
    })
}

const toggleActiveHeading = () => {
    let i = active.length - 1
    let min = active.length - 1, max = 0
    while (i >= 0 && !active[i]) {
        tocEntries[i].classList.remove(visibleClass)
        i--
    }
    while (i >= 0 && active[i]) {
        tocEntries[i].classList.add(visibleClass)
        min = Math.min(min, i)
        max = Math.max(max, i)
        i--
    }
    while (i >= 0) {
        tocEntries[i].classList.remove(visibleClass)
        i--
    }
    const parentOffset = tocRef.value?.getBoundingClientRect().top || 0
    const scrollOffset = tocRef.value?.scrollTop || 0
    const top = tocEntries[min].getBoundingClientRect().top - parentOffset + scrollOffset
    const bottom = tocEntries[max].getBoundingClientRect().bottom - parentOffset + scrollOffset
    activeIndicator.value?.setAttribute('style', `top: ${top}px; height: ${bottom - top}px`)
}

const scrollToActiveHeading = () => {
    if (anchorNavTarget || !tocRef.value) return
    const activeHeading = document.querySelectorAll<HTMLDivElement>(`#toc .${visibleClass}`)
    if (!activeHeading.length) return

    const topmost = activeHeading[0]
    const bottommost = activeHeading[activeHeading.length - 1]
    const tocHeight = tocRef.value.clientHeight

    let top
    if (bottommost.getBoundingClientRect().bottom - topmost.getBoundingClientRect().top < 0.9 * tocHeight)
        top = topmost.offsetTop - 32
    else
        top = bottommost.offsetTop - tocHeight * 0.8

    tocRef.value.scrollTo({ top, left: 0, behavior: 'smooth' })
}

const fallback = () => {
    if (!sections.length) return

    for (let i = 0; i < sections.length; i++) {
        const offsetTop = sections[i].getBoundingClientRect().top
        const offsetBottom = sections[i].getBoundingClientRect().bottom

        if ((offsetTop > 0 && offsetTop < window.innerHeight)
            || (offsetBottom > 0 && offsetBottom < window.innerHeight)
            || (offsetTop < 0 && offsetBottom > window.innerHeight)) {
            active[i] = true
        } else if (offsetTop > window.innerHeight) break
    }
}

const handleAnchorClick = (event: Event) => {
    const anchor = event.composedPath().find(e => e instanceof HTMLAnchorElement) as HTMLAnchorElement
    if (anchor) {
        const id = decodeURIComponent(anchor.hash?.substring(1))
        const idx = headingIdxMap.get(id)
        anchorNavTarget = idx !== undefined ? document.getElementById(id) : null
    }
}

onMounted(() => {
    observer = new IntersectionObserver(markVisibleSection, { threshold: 0 })
    headings.value.forEach(h => minlevel.value = Math.min(minlevel.value, h.level))
    nextTick(() => {
        document.querySelector('.prose')?.addEventListener('animationend', init, { once: true })
    })
})

onBeforeUnmount(() => {
    sections.forEach(section => observer.unobserve(section))
    observer.disconnect()
    tocRef.value?.removeEventListener("click", handleAnchorClick)
})
</script>

<template>
    <div id="toc" :class="['group', $props.class]">
        <div id="toc-inner-wrapper" ref="tocRef" class="relative w-full" @click="handleAnchorClick">
            <a v-for="(heading, index) in headings" :key="heading.slug" :href="`#${heading.slug}`"
                class="px-2 flex gap-2 relative transition w-full min-h-9 rounded-xl hover:bg-[var(--toc-btn-hover)] active:bg-[var(--toc-btn-active)] py-2">
                <div :class="[
                    'transition w-5 h-5 shrink-0 rounded-lg text-xs flex items-center justify-center font-bold',
                    heading.level === minlevel ? 'bg-[var(--toc-badge-bg)] text-[var(--btn-content)]' : '',
                    heading.level === minlevel + 1 ? 'ml-4' : '',
                    heading.level === minlevel + 2 ? 'ml-8' : ''
                ]">
                    <template v-if="heading.level === minlevel">{{ heading1Count++ }}</template>
                    <template v-else-if="heading.level === minlevel + 1">
                        <div class="transition w-2 h-2 rounded-[0.1875rem] bg-[var(--toc-badge-bg)]"></div>
                    </template>
                    <template v-else-if="heading.level === minlevel + 2">
                        <div class="transition w-1.5 h-1.5 rounded-sm bg-black/5 dark:bg-white/10"></div>
                    </template>
                </div>
                <div :class="[
                    'transition text-sm',
                    heading.level === minlevel || heading.level === minlevel + 1 ? 'text-50' : '',
                    heading.level === minlevel + 2 ? 'text-30' : ''
                ]">
                    {{ removeTailingHash(heading.title) }}
                </div>
            </a>
            <div id="active-indicator" ref="activeIndicator"
                :class="[headings.length === 0 ? 'hidden' : '',
                    '-z-10 absolute bg-[var(--toc-btn-hover)] left-0 right-0 rounded-xl transition-all group-hover:bg-transparent border-2 border-[var(--toc-btn-hover)] group-hover:border-[var(--toc-btn-active)] border-dashed']">
            </div>
        </div>
    </div>
</template>

<style scoped>
.visible {
    background-color: var(--toc-btn-hover);
}
</style>
