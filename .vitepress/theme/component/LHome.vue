<template>
    <LCover :background="{ src: () => '/bg.jpeg' }" title="学习文档" avatar="/favicon/favicon128.png" :socialLinks=[]>
    </LCover>
    <VPNav></VPNav>
</template>
<script setup lang="ts">
import VPNav from 'vitepress/dist/client/theme-default/components/VPNav.vue'
import LCover from './LCover.vue'


</script>