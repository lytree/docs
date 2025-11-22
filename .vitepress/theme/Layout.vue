<template>

    <LHome v-if="frontmatter.layout && frontmatter.layout === 'home'"></LHome>
    <slot v-else-if="frontmatter.layout && frontmatter.layout === 'page'"></slot>
    <LDoc v-else="frontmatter.layout"></LDoc>
    <!-- <Content v-else>1</Content> -->
</template>
<script setup lang="ts">


import { useData } from 'vitepress'
import { nextTick, provide, onMounted } from 'vue'
import LDoc from './component/LDoc.vue'
import LHome from './component/LHome.vue'
const { isDark, frontmatter, page } = useData()
const enableTransitions = () =>
    'startViewTransition' in document &&
    window.matchMedia('(prefers-reduced-motion: no-preference)').matches

provide('toggle-appearance', async ({ clientX: x, clientY: y }: MouseEvent) => {
    if (!enableTransitions()) {
        isDark.value = !isDark.value
        return
    }

    const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        )}px at ${x}px ${y}px)`
    ]

    await document.startViewTransition(async () => {
        isDark.value = !isDark.value
        await nextTick()
    }).ready

    document.documentElement.animate(
        { clipPath: isDark.value ? clipPath.reverse() : clipPath },
        {
            duration: 300,
            easing: 'ease-in',
            pseudoElement: `::view-transition-${isDark.value ? 'old' : 'new'}(root)`
        }
    )
})

</script>
<style lang="scss">
::view-transition-old(root),
::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
}

::view-transition-old(root),
.dark::view-transition-new(root) {
    z-index: 1;
}

::view-transition-new(root),
.dark::view-transition-old(root) {
    z-index: 9999;
}

::-webkit-scrollbar {
    width: 4px;
    height: 4px;
}

::-webkit-scrollbar-track-piece {
    background-color: rgba(0, 0, 0, 0);
}

::-webkit-scrollbar-thumb:vertical {
    height: 4px;
    border-radius: 4px;
    background-color: var(--vp-c-brand-1);
}

::-webkit-scrollbar-thumb:horizontal {
    width: 4px;
    border-radius: 4px;
    background-color: var(--vp-c-brand-1);
}

.medium-zoom-overlay {
    z-index: 20;
}

.medium-zoom-image {
    z-index: 21;
}
</style>