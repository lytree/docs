<script setup lang="tsx">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import BlogLayout from './BLayout.vue'
const { frontmatter } = useData()
const { Layout } = DefaultTheme
</script>

<template>
  <div v-if="frontmatter.router == 'overview'">
    overview
  </div>
  <div v-else-if="frontmatter.router == 'blog'">
    <BlogLayout class="blog" />
  </div>
  <div v-else-if="frontmatter.router == 'doc'">
    <Layout class="doc" />
  </div>
  <div v-else>
  </div>
</template>