<script setup lang="tsx">
import Theme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import { useDarkTransition } from './hooks/useDarkTransition'
// import { useBlogThemeMode, useDarkTransitionConfig } from './composables/config/blog'
import BlogHomeInfo from './components/BlogHomeInfo.vue'
import BlogHomeBanner from './components/BlogHomeBanner.vue'
import BlogList from './components/BlogList.vue'
// import BlogSidebar from './components/BlogSidebar.vue'
import BlogImagePreview from './components/BlogImagePreview.vue'
import BlogArticleAnalyze from './components/BlogArticleAnalyze.vue'
import BlogFooter from './components/BlogFooter.vue'
import BlogHomeHeaderAvatar from './components/BlogHomeHeaderAvatar.vue'
import BlogBackToTop from './components/BlogBackToTop.vue'

const { frontmatter } = useData()
const layout = computed(() => frontmatter.value.layout)
const { Layout } = Theme

// 切换深色模式过渡
// https://vitepress.dev/zh/guide/extending-default-theme#on-appearance-toggle
useDarkTransition()
</script>

<template>
  <Layout class="blog-theme-layout">
    <template #doc-before>
      <slot name="doc-before" />
      <!-- 阅读时间分析 -->
      <ClientOnly>
        <BlogArticleAnalyze />
        <!-- 图片预览 -->
        <BlogImagePreview />
      </ClientOnly>
    </template>

    <template #nav-bar-content-before>
      <slot name="nav-bar-content-before" />
    </template>
    <!-- 自定义首页 -->
    <template #home-hero-before>
      <slot name="home-hero-before" />
      <div class="home">
        <BlogHomeHeaderAvatar />
        <div class="header-banner">
          <BlogHomeBanner />
        </div>
        <div class="content-wrapper">
          <div class="blog-list-wrapper">
            <BlogList />
          </div>
          <div class="blog-info-wrapper">
            <BlogHomeInfo />
          </div>
        </div>
      </div>
    </template>
    <template #sidebar-nav-after>
      <slot name="sidebar-nav-after" />
      <!-- <BlogSidebar /> -->
    </template>
    <template #doc-after>
      <slot name="doc-after" />
      <ClientOnly>
        <BlogBackToTop />
      </ClientOnly>
    </template>
    <template #layout-bottom>
      <BlogFooter />
      <slot name="layout-bottom" />
    </template>
    <!-- 透传默认主题的其它插槽 -->
    <!-- navbar -->
    <template #nav-bar-title-before>

      <!-- <slot name="nav-bar-title-before" /> -->
    </template>
    <template #nav-bar-title-after>

      <!-- <slot name="nav-bar-title-after" /> -->
    </template>
    <template #nav-bar-content-after>

      <!-- <slot name="nav-bar-content-after" /> -->
    </template>
    <template #nav-screen-content-before>

      <!-- <slot name="nav-screen-content-before" /> -->
    </template>
    <template #nav-screen-content-after>

      <!-- <slot name="nav-screen-content-after" /> -->
    </template>

    <!-- sidebar -->
    <template #sidebar-nav-before>
      <slot name="sidebar-nav-before" />
    </template>

    <!-- content -->
    <template #page-top>
      <slot name="page-top" />
    </template>
    <template #page-bottom>
      <slot name="page-bottom" />
    </template>

    <template #not-found>
      <slot name="not-found" />
    </template>
    <template #home-hero-info>
      <slot name="home-hero-info" />
    </template>
    <template #home-hero-image>
      <slot name="home-hero-image" />
    </template>
    <template #home-hero-after>
      <slot name="home-hero-after" />
    </template>
    <template #home-features-before>
      <slot name="home-features-before" />
    </template>
    <template #home-features-after>
      <slot name="home-features-after" />
    </template>

    <template #doc-footer-before>
      <slot name="doc-footer-before" />
    </template>

    <template #doc-top>
      <slot name="doc-top" />
    </template>
    <template #doc-bottom>
      <slot name="doc-bottom" />
    </template>

    <template #aside-top>
      <slot name="aside-top" />
    </template>
    <template #aside-bottom>
      <slot name="aside-bottom" />
    </template>
    <template #aside-outline-before>
      <slot name="aside-outline-before" />
    </template>
    <template #aside-outline-after>
      <slot name="aside-outline-after" />
    </template>
    <template #aside-ads-before>
      <slot name="aside-ads-before" />
    </template>
    <template #aside-ads-after>
      <slot name="aside-ads-after" />
    </template>
  </Layout>
</template>

<style scoped lang="scss">
.home {
  margin: 0 auto;
  padding: 20px;
  max-width: 1126px;
}

@media screen and (min-width: 960px) {
  .home {
    padding-top: var(--vp-nav-height);
  }
}

.header-banner {
  width: 100%;
  padding: 60px 0;
}

.content-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.blog-list-wrapper {
  width: 100%;
}

.blog-info-wrapper {
  margin-left: 16px;
  position: sticky;
  top: 100px;
}

@media screen and (max-width: 959px) {
  .blog-info-wrapper {
    margin-left: 16px;
    position: sticky;
    top: 40px;
  }
}

@media screen and (max-width: 767px) {
  .content-wrapper {
    flex-wrap: wrap;
  }

  .blog-info-wrapper {
    margin: 20px 0;
    width: 100%;
  }
}
</style>

<style>
@import url(./styles/dark-transition.css);
</style>
