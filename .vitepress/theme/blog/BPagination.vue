<template>
    <div :class="['flex flex-row gap-3 justify-center']" :style="style">
        <!-- Previous Page -->
        <a :href="page.url.prev || '#'" :aria-label="page.url.prev ? 'Previous Page' : null"
            class="btn-card overflow-hidden rounded-lg text-[var(--primary)] w-11 h-11"
            :class="{ disabled: !page.url.prev }">
            <Icon icon="material-symbols:chevron-left-rounded" class="text-[1.75rem]" />
        </a>

        <!-- Page Numbers -->
        <div
            class="bg-[var(--card-bg)] flex flex-row rounded-lg items-center text-neutral-700 dark:text-neutral-300 font-bold">
            <template v-for="p in pages" :key="p === HIDDEN ? `dot-${Math.random()}` : `page-${p}`">
                <Icon v-if="p === HIDDEN" icon="material-symbols:more-horiz" class="mx-1" />
                <div v-else-if="p === page.currentPage" class="h-11 w-11 rounded-lg bg-[var(--primary)] flex items-center justify-center
              font-bold text-white dark:text-black/70">
                    {{ p }}
                </div>
                <a v-else :href="getPageUrl(p)" :aria-label="`Page ${p}`"
                    class="btn-card w-11 h-11 rounded-lg overflow-hidden active:scale-[0.85]">
                    {{ p }}
                </a>
            </template>
        </div>

        <!-- Next Page -->
        <a :href="page.url.next || '#'" :aria-label="page.url.next ? 'Next Page' : null"
            class="btn-card overflow-hidden rounded-lg text-[var(--primary)] w-11 h-11"
            :class="{ disabled: !page.url.next }">
            <Icon icon="material-symbols:chevron-right-rounded" class="text-[1.75rem]" />
        </a>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from "@iconify/vue";

interface Page {
    currentPage: number
    lastPage: number
    url: {
        prev: string
        next: string
    }
}

const props = defineProps<{
    page: Page
    class?: string
    style?: string
}>()

const HIDDEN = -1
const ADJ_DIST = 2
const VISIBLE = ADJ_DIST * 2 + 1

const getPageUrl = (p: number) => {
    if (p === 1) return '/'
    return `/${p}/`
}

const pages = computed(() => {
    let count = 1
    let l = props.page.currentPage
    let r = props.page.currentPage

    while (l > 1 && r < props.page.lastPage && count + 2 <= VISIBLE) {
        l--
        r++
        count += 2
    }
    while (l > 1 && count < VISIBLE) {
        l--
        count++
    }
    while (r < props.page.lastPage && count < VISIBLE) {
        r++
        count++
    }

    const result: number[] = []
    if (l > 1) result.push(1)
    if (l === 3) result.push(2)
    if (l > 3) result.push(HIDDEN)
    for (let i = l; i <= r; i++) result.push(i)
    if (r < props.page.lastPage - 2) result.push(HIDDEN)
    if (r === props.page.lastPage - 2) result.push(props.page.lastPage - 1)
    if (r < props.page.lastPage) result.push(props.page.lastPage)

    return result
})
</script>