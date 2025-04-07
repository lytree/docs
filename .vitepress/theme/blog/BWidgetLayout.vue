<template>
    <div :data-id="id" :data-is-collapsed="String(isCollapsed)" :class="['pb-4 card-base', className]" :style="style">
        <div class="font-bold transition text-lg text-neutral-900 dark:text-neutral-100 relative ml-8 mt-4 mb-2" :style="{
            'before:w': '1px',
            'before:h': '4px',
            'before:rounded-md': true,
            'before:bg': 'var(--primary)',
            'before:absolute': true,
            'before:left': '-16px',
            'before:top': '5.5px'
        }">
            {{ name }}
        </div>
        <div :id="id" class="collapse-wrapper px-4 overflow-hidden" :class="{ collapsed: isCollapsed }"
            :style="{ height: isCollapsed ? collapsedHeight : 'auto' }">
            <slot></slot>
        </div>
        <div v-if="isCollapsed" class="expand-btn px-4 -mb-2">
            <button class="btn-plain rounded-lg w-full h-9" @click="expand">
                <div class="text-[var(--primary)] flex items-center justify-center gap-2 -translate-x-2">
                    <Icon icon="material-symbols:more-horiz" class="text-[1.75rem]" />
                    {{ }}
                </div>
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue'
import { Icon } from "@iconify/vue";

const props = defineProps({
    id: String,
    name: String,
    isCollapsed: { type: Boolean, default: true },
    collapsedHeight: { type: String, default: '7.5rem' },
    className: { type: String, default: '' },
    style: { type: String, default: '' }
})


const expand = () => {
    // When the button is clicked, it will expand the widget and hide the expand button.
    props.isCollapsed = false
}
</script>

<style scoped>
.collapsed {
    height: var(--collapsedHeight);
}
</style>