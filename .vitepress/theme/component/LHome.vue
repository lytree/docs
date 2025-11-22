<template>
    <div class="l-layout">
        <VPNav class="l-nav"></VPNav>
        <!-- <VPHome class="l-home"></VPHome> -->
        <LCover :background="{ src: () => './bg.jpeg' }" class="w-full h-full"></LCover>
        <VPFooter></VPFooter>
    </div>
</template>
<script setup lang="ts">
import VPHome from 'vitepress/dist/client/theme-default/components/VPHome.vue'
import VPNav from 'vitepress/dist/client/theme-default/components/VPNav.vue'
import VPFooter from 'vitepress/dist/client/theme-default/components/VPFooter.vue'
import LCover from './LCover.vue'

</script>
<style lang="scss" scoped>
.l-layout {
    display: flex;
    flex-direction: column;
    background-position: top center;
    background-repeat: no-repeat;
    background-size: cover;
    background-attachment: scroll;
    // background-image: v-bind(imageUrl);
    // backdrop-filter: brightness(0.6);
    background-image: url('/bg.jpeg');
    background-blend-mode: multiply;
    height: 100%;
}

.l-layout::after {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.4;
    background: var(--vp-c-bg);
}

:deep(.VPFooter),
:deep(.VPNav) {
    opacity: 0.6;
}
</style>
