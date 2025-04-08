<script lang="ts" setup>
import { useData } from 'vitepress'
import VPNavBarMenuLink from 'vitepress/dist/client/theme-default/components/VPNavBarMenuLink.vue'
import VPNavBarMenuGroup from 'vitepress/dist/client/theme-default/components/VPNavBarMenuGroup.vue'

const { theme, frontmatter } = useData()
</script>

<template>
    <nav v-if="theme.nav && frontmatter.router == 'doc'" aria-labelledby="main-nav-aria-label" class="VPNavBarMenu">
        <span id="main-nav-aria-label" class="visually-hidden">
            Main Navigation
        </span>
        <template v-for="item in theme.nav" :key="JSON.stringify(item)">
            <VPNavBarMenuLink v-if="'link' in item" :item />
            <component v-else-if="'component' in item" :is="item.component" v-bind="item.props" />
            <VPNavBarMenuGroup v-else :item />
        </template>
    </nav>
    <nav v-if="frontmatter.router == 'blog'">nav</nav>
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
