<script setup lang="ts">
import { computed } from 'vue'
import { slugify } from '@mdit-vue/shared'

import LNavLink from './LNavLink.vue'
import type { NavLink } from '../types'

const props = defineProps<{
    title: string
    items: NavLink[]
}>()

const formatTitle = computed(() => {
    return slugify(props.title)
})
</script>

<template>
    <h2 v-if="title" :id="formatTitle" tabindex="-1">
        {{ title }}
        <a class="header-anchor" :href="`#${formatTitle}`" aria-hidden="true"></a>
    </h2>
    <div class="l-nav-links">
        <LNavLink v-for="{ icon, title, desc, link } in items" :key="link" :icon="icon" :title="title" :desc="desc"
            :link="link" />
    </div>
</template>

<style lang="scss" scoped>
.l-nav-links {
    --l-nav-gap: 10px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    grid-row-gap: var(--l-nav-gap);
    grid-column-gap: var(--l-nav-gap);
    grid-auto-flow: row dense;
    justify-content: center;
    margin-top: var(--l-nav-gap);
}

@each $media, $size in (500px: 140px, 640px: 155px, 768px: 175px, 960px: 200px, 1440px: 240px) {
    @media (min-width: $media) {
        .l-nav-links {
            grid-template-columns: repeat(auto-fill, minmax($size, 1fr));
        }
    }
}

@media (min-width: 960px) {
    .l-nav-links {
        --l-nav-gap: 20px;
    }
}
</style>