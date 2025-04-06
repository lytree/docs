<template>
    <a :href="href" :aria-label="label" class="btn-regular h-8 text-sm px-3 rounded-lg flex items-center">
        <div v-if="dot" class="h-1 w-1 bg-[var(--btn-content)] dark:bg-[var(--card-bg)] transition rounded-md mr-2">
        </div>
        <slot />
    </a>
</template>

<script setup lang="ts">
defineProps<{
    size?: string
    dot?: boolean
    href?: string
    label?: string
}>()
</script>