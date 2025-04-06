<template>
    <div id="nav-menu-panel" class="float-panel float-panel-closed absolute transition-all fixed right-4 px-2 py-2">
        <a v-for="link in links" :key="link.url" :href="link.external ? link.url : resolveUrl(link.url)" class="group flex justify-between items-center py-2 pl-3 pr-1 rounded-lg gap-8
               hover:bg-[var(--btn-plain-bg-hover)]
               active:bg-[var(--btn-plain-bg-active)] transition" :target="link.external ? '_blank' : null">
            <div
                class="transition text-black/75 dark:text-white/75 font-bold group-hover:text-[var(--primary)] group-active:text-[var(--primary)]">
                {{ link.name }}
            </div>
            <Icon v-if="!link.external" icon="material-symbols:chevron-right-rounded"
                class="transition text-[1.25rem] text-[var(--primary)]" />
            <Icon v-else icon="fa6-solid:arrow-up-right-from-square"
                class="transition text-[0.75rem] text-black/25 dark:text-white/25 -translate-x-1" />
        </a>
    </div>
</template>

<script setup lang="ts">
import { Icon } from "@iconify/vue";

interface NavBarLink {
    name: string
    url: string
    external?: boolean
}

defineProps<{
    links: NavBarLink[]
}>()

// url helper（Astro 的 url() 替代）
const resolveUrl = (path: string) => {
    return path.startsWith('/') ? path : `/${path}`
}
</script>