<script setup lang="tsx">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import BlogLayout from './BLayout.vue'
import Overview from './Overview.vue'
const { frontmatter } = useData()
const { Layout } = DefaultTheme
</script>

<template>
  <template v-if="frontmatter.router == 'overview'">
    <Overview />
  </template>
  <template v-else-if="frontmatter.router == 'blog'">
    <BlogLayout class="blog" />
  </template>
  <template v-else-if="frontmatter.router == 'doc'">
    <Layout class="doc" />
  </template>
  <template v-else-if="frontmatter.router == 'nav'">
  </template>
</template>