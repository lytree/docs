<script setup lang="tsx">
import { inject, ref, watchPostEffect } from 'vue'
import { useData } from "vitepress"
import VPFooter from 'vitepress/dist/client/theme-default/components/VPFooter.vue'
const { frontmatter, isDark } = useData();


const toggleAppearance = inject('toggle-appearance', () => {
    isDark.value = !isDark.value
})

</script>
<template>
    <div class="flex min-h-screen flex-col">
        <div class="flex flex-grow flex-col items-center justify-center">
            <div>
                <div class="flex items-center justify-center " @click="toggleAppearance">
                    <img class="logo inline rounded-full" src="/favicon/favicon192.png" alt="logo" width="150" />
                </div>
                <h1 class="flex items-center justify-center">杨柳亭</h1>
                <h2 class="flex items-center justify-center">回忆的地方</h2>
                <p class="flex items-center justify-center">
                    <a v-for="features in frontmatter.features" :href="features.url">
                        <img :src="features.image" :alt="features.title" />
                    </a>
                </p>
            </div>
        </div>
        <VPFooter />
    </div>
</template>
<style>
.logo:hover {
    transform: rotate(666turn);
    transition: transform 59s 1s cubic-bezier(0.3, 0, 0.8, 1);
}
</style>