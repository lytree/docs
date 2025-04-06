<template>
    <WidgetLayout name="" id="tags" :isCollapsed="isCollapsed" :collapsedHeight="COLLAPSED_HEIGHT" :class="className"
        :style="style">
        <div class="flex gap-2 flex-wrap">
            <ButtonTag v-for="tag in tags" :key="tag.name" :href="url(`/archive/tag/${tag.name}/`)"
                :label="`View all posts with the ${tag.name} tag`">
                {{ tag.name }}
            </ButtonTag>
        </div>
    </WidgetLayout>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue'
import WidgetLayout from './BWidgetLayout.vue'
import BBtnTag from './BBtnTag.vue'

const tags = ref<any[]>([])
const COLLAPSED_HEIGHT = '7.5rem'
const className = defineProps<{ class?: string }>().class
const style = defineProps<{ style?: string }>().style

const isCollapsed = computed(() => tags.value.length >= 20)

onMounted(async () => {
    tags.value = []
})
</script>

<style scoped lang="scss">
/* 你可以在这里加入特定的样式 */
</style>