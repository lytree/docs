<script setup lang="tsx">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import BlogLayout from './blog/BLayout.vue'
const { frontmatter } = useData()
const { Layout } = DefaultTheme
</script>

<template>
  <div v-if="frontmatter.router == 'overview'">
    overview
  </div>
  <div v-else-if="frontmatter.router == 'blog'">
    <BlogLayout />
  </div>
  <div v-else-if="frontmatter.router == 'doc'">
    <Layout />
  </div>
  <div v-else>
  </div>
</template>