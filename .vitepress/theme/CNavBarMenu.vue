<script lang="tsx" setup>
import { useData } from 'vitepress'
import { getNav } from "./utils/client/nav"
import type { Theme } from './types/index'

import VPNavBarMenuLink from 'vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue'
import VPNavBarMenuGroup from 'vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue'
import { ref, watch } from 'vue'


type NavItem = Theme.NavItem

const navs = ref<NavItem[]>([])

const { theme, page, frontmatter } = useData()

watch(
    () => [page.value.relativePath, theme.value.blog.navs] as const,
    ([relativePath, sidebarConfig]) => {
        const newNav = sidebarConfig
            ? getNav(sidebarConfig, relativePath)
            : []
        if (JSON.stringify(newNav) !== JSON.stringify(navs.value)) {
            navs.value = newNav
        }
    },
    { immediate: true, deep: true, flush: 'sync' }
)
</script>

<template>
    <nav v-if="navs.length > 0" aria-labelledby="main-nav-aria-label" class="VPNavBarMenu">
        <span id="main-nav-aria-label" class="visually-hidden">
            Main Navigation
        </span>
        <template v-for="item in navs" :key="JSON.stringify(item)">
            <VPNavBarMenuLink v-if="'link' in item" :item />
            <VPNavBarMenuGroup v-else :item />
        </template>
    </nav>
</template>

<style scoped>
.VPNavBarMenu {
    display: none;
}

@media (min-width: 768px) {
    .VPNavBarMenu {
        display: flex;
    }
}
</style>
