<script setup lang="tsx">
import BProfile from "./BProfile.vue"
import BCategories from "./BCategories.vue"
import BTag from "./BTag.vue"
</script>
<template>
    <div id="sidebar" class="w-full">
        <div class="mb-4 flex w-full flex-col gap-4">
            <BProfile />
        </div>
        <div id="sidebar-sticky" class="sticky top-4 flex w-full flex-col gap-4 transition-all duration-700">
            <BCategories class="onload-animation" style="animation-delay: 150ms" />
            <BTag class="onload-animation" style="animation-delay: 200ms" />
        </div>
    </div>
</template>