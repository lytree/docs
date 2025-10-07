<script setup lang="ts">
import { useData } from 'vitepress'
const { theme, frontmatter } = useData()
</script>

<template>
    <footer v-if="theme.footer && frontmatter.footer !== false" class="LFooter"
        :class="{ 'has-sidebar': frontmatter.sidebar }">
        <div class="container">
            <p v-if="theme.footer.message" class="message" v-html="theme.footer.message"></p>
            <p v-if="theme.footer.copyright" class="copyright" v-html="theme.footer.copyright"></p>
        </div>
    </footer>
</template>

<style lang="scss" scoped>
.LFooter {
    position: absolute;
    bottom: 0;
    min-width: 100%;
    border-top: 1px solid var(--vp-c-gutter);
    background-color: transparent;
    padding: 32px 24px;
}

.LFooter.has-sidebar {
    display: none;
}

.LFooter :deep(a) {
    text-decoration-line: underline;
    text-underline-offset: 2px;
    transition: color 0.25s;
}

.LFooter :deep(a:hover) {
    color: var(--vp-c-text-1);
}

@media (min-width: 768px) {
    .LFooter {
        padding: 32px;
    }
}

.container {
    margin: 0 auto;
    max-width: var(--vp-layout-max-width);
    text-align: center;
}

.message,
.copyright {
    line-height: 24px;
    font-size: 14px;
    font-weight: 500;
    color: var(--vp-c-text-2);
}
</style>
