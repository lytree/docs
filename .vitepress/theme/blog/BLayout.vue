<script setup lang="tsx">
import { Content } from 'vitepress';
import BImage from './BImage.vue';
import BNavbar from './BNavbar.vue';
import BFooter from './BFooter.vue';
import BTOC from './BTOC.vue';
import BSideBar from './BSideBar.vue';
import BBackToTop from './BBackToTop.vue';
const BANNER_HEIGHT = `top: -100vh`


</script>
<template>
    <slot slot="head" name="head"></slot>
    <div id="top-row"
        class="z-50 pointer-events-none relative transition-all duration-700 max-w-[var(--page-width)] px-0 md:px-4 mx-auto">
        <div id="navbar-wrapper" class="pointer-events-auto sticky top-0 transition-all">
            <BNavbar></BNavbar>
        </div>
    </div>

    <div id="banner-wrapper" class="absolute z-10 w-full transition duration-70 overflow-hidden" :style=BANNER_HEIGHT>
        <BImage id="banner" alt="Banner image of the blog"
            class="object-cover h-full transition duration-700 opacity-0 scale-105" image="/heroimg.webp">
        </BImage>
    </div>

    <!-- Main content -->
    <div class="absolute w-full z-30 pointer-events-none" style="top: 30vh">
        <!-- The pointer-events-none here prevent blocking the click event of the TOC -->
        <div class="relative max-w-[var(--page-width)] mx-auto pointer-events-auto">
            <div id="main-grid"
                class="transition duration-700 w-full left-0 right-0 grid grid-cols-[17.5rem_auto] grid-rows-[auto_1fr_auto] lg:grid-rows-[auto] mx-auto gap-4 px-0 md:px-4">
                <!-- Banner image credit -->
                <a href="" id="banner-credit" target="_blank" rel="noopener" aria-label="Visit image source"
                    class="group onload-animation transition-all
                    absolute flex justify-center items-center rounded-full px-3 right-4 -top-[3.25rem] bg-black/60 hover:bg-black/70 h-9 hover:pr-9 active:bg-black/80">
                    <div class="text-white/75 text-[1.25rem] mr-1 i-material-symbols-copyright-outline-rounded">
                    </div>
                    <div class="text-white/75 text-xs"></div>
                    <div
                        class="transition absolute text-[oklch(0.75_0.14_var(--hue))] right-4 text-[0.75rem] opacity-0 group-hover:opacity-100 i-fa6-solid-arrow-up-right-from-square">
                    </div>
                </a>


                <BSideBar
                    class="mb-4 row-start-2 row-end-3 col-span-2 lg:row-start-1 lg:row-end-2 lg:col-span-1 lg:max-w-[17.5rem] onload-animation">
                </BSideBar>

                <main id="swup-container" class="transition-swup-fade col-span-2 lg:col-span-1 overflow-hidden">
                    <div id="content-wrapper" class="onload-animation">
                        <!-- the overflow-hidden here prevent long text break the layout-->
                        <!-- make id different from windows.swup global property -->
                        <Content></Content>
                        <div class="footer col-span-2 onload-animation hidden lg:block">
                            <BFooter></BFooter>
                        </div>
                    </div>
                </main>

                <div class="footer col-span-2 onload-animation block lg:hidden">
                    <BFooter></BFooter>
                </div>
            </div>

            <BBackToTop></BBackToTop>
        </div>
    </div>

    <!-- The things that should be under the banner, only the TOC for now -->
    <div class="absolute w-full z-0">
        <div class="relative max-w-[var(--page-width)] mx-auto">
            <!-- TOC component -->
            <div id="toc-wrapper"
                class="transition flex items-center absolute -right-[var(--toc-width)] hidden lg:block top-0 w-[var(--toc-width)] toc-hide">
                <div id="toc-inner-wrapper"
                    class="fixed top-14 w-[var(--toc-width)] h-[calc(100vh_-_20rem)] overflow-y-scroll overflow-x-hidden hide-scrollbar">
                    <div id="toc" class="w-full h-full transition-swup-fade ">
                        <div class="h-8 w-full"></div>
                        <BTOC headings={headings}></BTOC>
                        <div class="h-8 w-full"></div>
                    </div>
                </div>
            </div>

            <!-- #toc needs to exist for Swup to work normally -->
            <div id="toc"></div>
        </div>
    </div>
    <!-- increase the page height during page transition to prevent the scrolling animation from jumping -->
    <div id="page-height-extend" class="hidden h-[300vh]"></div>
</template>
<style lang="scss" scoped>
:root {
    --radius-large: 1rem;
    --content-delay: 150ms
}

@supports (color: oklch(0 0 0)) {
    :root {
        --primary: oklch(0.7 0.14 var(--hue));
        --page-bg: oklch(0.95 0.01 var(--hue));
        --card-bg: white;
        --btn-content: oklch(0.55 0.12 var(--hue));
        --btn-regular-bg: oklch(0.95 0.025 var(--hue));
        --btn-regular-bg-hover: oklch(0.9 0.05 var(--hue));
        --btn-regular-bg-active: oklch(0.85 0.08 var(--hue));
        --btn-plain-bg-hover: oklch(0.95 0.025 var(--hue));
        --btn-plain-bg-active: oklch(0.98 0.01 var(--hue));
        --btn-card-bg-hover: oklch(0.98 0.005 var(--hue));
        --btn-card-bg-active: oklch(0.9 0.03 var(--hue));
        --enter-btn-bg: var(--btn-regular-bg);
        --enter-btn-bg-hover: var(--btn-regular-bg-hover);
        --enter-btn-bg-active: var(--btn-regular-bg-active);
        --deep-text: oklch(0.25 0.02 var(--hue));
        --title-active: oklch(0.6 0.1 var(--hue));
        --line-divider: rgba(0, 0, 0, 0.08);
        --line-color: rgba(0, 0, 0, 0.1);
        --meta-divider: rgba(0, 0, 0, 0.2);
        --inline-code-bg: var(--btn-regular-bg);
        --inline-code-color: var(--btn-content);
        --selection-bg: oklch(0.9 0.05 var(--hue));
        --codeblock-selection: oklch(0.4 0.08 var(--hue));
        --codeblock-bg: oklch(0.2 0.015 var(--hue));
        --license-block-bg: rgba(0, 0, 0, 0.03);
        --link-underline: oklch(0.93 0.04 var(--hue));
        --link-hover: oklch(0.95 0.025 var(--hue));
        --link-active: oklch(0.9 0.05 var(--hue));
        --float-panel-bg: white;
        --scrollbar-bg-light: rgba(0, 0, 0, 0.4);
        --scrollbar-bg-hover-light: rgba(0, 0, 0, 0.5);
        --scrollbar-bg-active-light: rgba(0, 0, 0, 0.6);
        --scrollbar-bg-dark: rgba(255, 255, 255, 0.4);
        --scrollbar-bg-hover-dark: rgba(255, 255, 255, 0.5);
        --scrollbar-bg-active-dark: rgba(255, 255, 255, 0.6);
        --scrollbar-bg: var(--scrollbar-bg-light);
        --scrollbar-bg-hover: var(--scrollbar-bg-hover-light);
        --scrollbar-bg-active: var(--scrollbar-bg-active-light);
        --color-selection-bar: linear-gradient(to right,
                oklch(0.8 0.1 0),
                oklch(0.8 0.1 30),
                oklch(0.8 0.1 60),
                oklch(0.8 0.1 90),
                oklch(0.8 0.1 120),
                oklch(0.8 0.1 150),
                oklch(0.8 0.1 180),
                oklch(0.8 0.1 210),
                oklch(0.8 0.1 240),
                oklch(0.8 0.1 270),
                oklch(0.8 0.1 300),
                oklch(0.8 0.1 330),
                oklch(0.8 0.1 360));
        --display-light-icon: 1;
        --display-dark-icon: 0;
        --admonitions-color-tip: oklch(0.7 0.14 180);
        --admonitions-color-note: oklch(0.7 0.14 250);
        --admonitions-color-important: oklch(0.7 0.14 310);
        --admonitions-color-warning: oklch(0.7 0.14 60);
        --admonitions-color-caution: oklch(0.6 0.2 25);
        --toc-badge-bg: oklch(0.9 0.045 var(--hue));
        --toc-btn-hover: oklch(0.92 0.015 var(--hue));
        --toc-btn-active: oklch(0.9 0.015 var(--hue));
    }

    :root.dark {
        --primary: oklch(0.75 0.14 var(--hue));
        --page-bg: oklch(0.16 0.014 var(--hue));
        --card-bg: oklch(0.23 0.015 var(--hue));
        --btn-content: oklch(0.75 0.1 var(--hue));
        --btn-regular-bg: oklch(0.33 0.035 var(--hue));
        --btn-regular-bg-hover: oklch(0.38 0.04 var(--hue));
        --btn-regular-bg-active: oklch(0.43 0.045 var(--hue));
        --btn-plain-bg-hover: oklch(0.3 0.035 var(--hue));
        --btn-plain-bg-active: oklch(0.27 0.025 var(--hue));
        --btn-card-bg-hover: oklch(0.3 0.03 var(--hue));
        --btn-card-bg-active: oklch(0.35 0.035 var(--hue));
        --line-divider: rgba(255, 255, 255, 0.08);
        --line-color: rgba(255, 255, 255, 0.1);
        --meta-divider: rgba(255, 255, 255, 0.2);
        --selection-bg: oklch(0.4 0.08 var(--hue));
        --codeblock-bg: oklch(0.17 0.015 var(--hue));
        --license-block-bg: var(--codeblock-bg);
        --link-underline: oklch(0.4 0.08 var(--hue));
        --link-hover: oklch(0.4 0.08 var(--hue));
        --link-active: oklch(0.35 0.07 var(--hue));
        --float-panel-bg: oklch(0.19 0.015 var(--hue));
        --scrollbar-bg: var(--scrollbar-bg-dark);
        --scrollbar-bg-hover: var(--scrollbar-bg-hover-dark);
        --scrollbar-bg-active: var(--scrollbar-bg-active-dark);
        --color-selection-bar: linear-gradient(to right,
                oklch(0.7 0.1 0),
                oklch(0.7 0.1 30),
                oklch(0.7 0.1 60),
                oklch(0.7 0.1 90),
                oklch(0.7 0.1 120),
                oklch(0.7 0.1 150),
                oklch(0.7 0.1 180),
                oklch(0.7 0.1 210),
                oklch(0.7 0.1 240),
                oklch(0.7 0.1 270),
                oklch(0.7 0.1 300),
                oklch(0.7 0.1 330),
                oklch(0.7 0.1 360));
        --display-light-icon: 0;
        --display-dark-icon: 1;
        --admonitions-color-tip: oklch(0.75 0.14 180);
        --admonitions-color-note: oklch(0.75 0.14 250);
        --admonitions-color-important: oklch(0.75 0.14 310);
        --admonitions-color-warning: oklch(0.75 0.14 60);
        --admonitions-color-caution: oklch(0.65 0.2 25);
        --toc-badge-bg: var(--btn-regular-bg);
        --toc-btn-hover: oklch(0.22 0.02 var(--hue));
        --toc-btn-active: oklch(0.25 0.02 var(--hue));
    }
}

@supports not (color: oklch(0 0 0)) {
    :root {
        --primary: #53a3f2;
        --page-bg: #eaeff5;
        --card-bg: white;
        --btn-content: #3275b4;
        --btn-regular-bg: #e2f0ff;
        --btn-regular-bg-hover: #c6e1ff;
        --btn-regular-bg-active: #a6d2ff;
        --btn-plain-bg-hover: #e2f0ff;
        --btn-plain-bg-active: #f4f9ff;
        --btn-card-bg-hover: #f6f9fc;
        --btn-card-bg-active: #d0e0f2;
        --enter-btn-bg: var(--btn-regular-bg);
        --enter-btn-bg-hover: var(--btn-regular-bg-hover);
        --enter-btn-bg-active: var(--btn-regular-bg-active);
        --deep-text: #1a222b;
        --title-active: #4f84ba;
        --line-divider: rgba(0, 0, 0, 0.08);
        --line-color: rgba(0, 0, 0, 0.1);
        --meta-divider: rgba(0, 0, 0, 0.2);
        --inline-code-bg: var(--btn-regular-bg);
        --inline-code-color: var(--btn-content);
        --selection-bg: #c6e1ff;
        --codeblock-selection: #224a71;
        --codeblock-bg: #11171d;
        --license-block-bg: rgba(0, 0, 0, 0.03);
        --link-underline: #d4ebff;
        --link-hover: #e2f0ff;
        --link-active: #c6e1ff;
        --float-panel-bg: white;
        --scrollbar-bg-light: rgba(0, 0, 0, 0.4);
        --scrollbar-bg-hover-light: rgba(0, 0, 0, 0.5);
        --scrollbar-bg-active-light: rgba(0, 0, 0, 0.6);
        --scrollbar-bg-dark: rgba(255, 255, 255, 0.4);
        --scrollbar-bg-hover-dark: rgba(255, 255, 255, 0.5);
        --scrollbar-bg-active-dark: rgba(255, 255, 255, 0.6);
        --scrollbar-bg: var(--scrollbar-bg-light);
        --scrollbar-bg-hover: var(--scrollbar-bg-hover-light);
        --scrollbar-bg-active: var(--scrollbar-bg-active-light);
        --color-selection-bar: linear-gradient(to right,
                oklch(0.8 0.1 0),
                oklch(0.8 0.1 30),
                oklch(0.8 0.1 60),
                oklch(0.8 0.1 90),
                oklch(0.8 0.1 120),
                oklch(0.8 0.1 150),
                oklch(0.8 0.1 180),
                oklch(0.8 0.1 210),
                oklch(0.8 0.1 240),
                oklch(0.8 0.1 270),
                oklch(0.8 0.1 300),
                oklch(0.8 0.1 330),
                oklch(0.8 0.1 360));
        --display-light-icon: 1;
        --display-dark-icon: 0;
        --admonitions-color-tip: #53a3f2;
        --admonitions-color-note: #53a3f2;
        --admonitions-color-important: #53a3f2;
        --admonitions-color-warning: #53a3f2;
        --admonitions-color-caution: #0081f1;
        --toc-badge-bg: #c8e1fb;
        --toc-btn-hover: #dde6ee;
        --toc-btn-active: #d7dfe8;
    }

    :root.dark {
        --primary: #63b3ff;
        --page-bg: #090e13;
        --card-bg: #181e24;
        --btn-content: #7cb3eb;
        --btn-regular-bg: #283747;
        --btn-regular-bg-hover: #324457;
        --btn-regular-bg-active: #3d5268;
        --btn-plain-bg-hover: #202f3f;
        --btn-plain-bg-active: #1d2732;
        --btn-card-bg-hover: #222f3c;
        --btn-card-bg-active: #2d3c4c;
        --line-divider: rgba(255, 255, 255, 0.08);
        --line-color: rgba(255, 255, 255, 0.1);
        --meta-divider: rgba(255, 255, 255, 0.2);
        --selection-bg: #224a71;
        --codeblock-bg: #0a1016;
        --license-block-bg: var(--codeblock-bg);
        --link-underline: #224a71;
        --link-hover: #224a71;
        --link-active: #1b3c5d;
        --float-panel-bg: #0f141a;
        --scrollbar-bg: var(--scrollbar-bg-dark);
        --scrollbar-bg-hover: var(--scrollbar-bg-hover-dark);
        --scrollbar-bg-active: var(--scrollbar-bg-active-dark);
        --color-selection-bar: linear-gradient(to right,
                oklch(0.7 0.1 0),
                oklch(0.7 0.1 30),
                oklch(0.7 0.1 60),
                oklch(0.7 0.1 90),
                oklch(0.7 0.1 120),
                oklch(0.7 0.1 150),
                oklch(0.7 0.1 180),
                oklch(0.7 0.1 210),
                oklch(0.7 0.1 240),
                oklch(0.7 0.1 270),
                oklch(0.7 0.1 300),
                oklch(0.7 0.1 330),
                oklch(0.7 0.1 360));
        --display-light-icon: 0;
        --display-dark-icon: 1;
        --admonitions-color-tip: #63b3ff;
        --admonitions-color-note: #63b3ff;
        --admonitions-color-important: #63b3ff;
        --admonitions-color-warning: #63b3ff;
        --admonitions-color-caution: #0091ff;
        --toc-badge-bg: var(--btn-regular-bg);
        --toc-btn-hover: #141b24;
        --toc-btn-active: #1a222b;
    }
}

.card-base {
    --at-apply: rounded-[var(--radius-large)] overflow-hidden transition bg-[var(--card-bg)];
}

h1,
h2,
h3,
h4,
h5,
h6,
p,
a,
span,
li,
ul,
ol,
blockquote,
code,
pre,
table,
th,
td,
strong {
    --at-apply: transition;
}


.link {
    --at-apply: transition rounded-md p-1 -m-1;
}

.link-lg {
    --at-apply: transition rounded-md p-[1.5] -m-[1.5] expand-animation;
}

.float-panel {
    --at-apply: top-[5.25rem] rounded-[var(--radius-large)] overflow-hidden bg-[var(--float-panel-bg)] transition shadow-xl dark:shadow-none
}

.float-panel-closed {
    --at-apply: -translate-y-1 opacity-0 pointer-events-none
}

.search-panel mark {
    --at-apply: bg-transparent text-[var(--primary)]
}

.btn-card {
    --at-apply: transition flex items-center justify-center bg-[var(--card-bg)] hover:bg-[var(--btn-card-bg-hover)] active:bg-[var(--btn-card-bg-active)]
}

.btn-card.disabled {
    --at-apply: pointer-events-none text-black/10 dark:text-white/10
}

.btn-plain {
    --at-apply: transition relative flex items-center justify-center bg-none text-black/75 hover:text-[var(--primary)] dark:text-white/75 dark:hover:text-[var(--primary)];

    &:not(.scale-animation) {
        --at-apply: hover:bg-[var(--btn-plain-bg-hover)] active:bg-[var(--btn-plain-bg-active)]
    }

    &.scale-animation {
        --at-apply: expand-animation;

        &.current-theme-btn {
            --at-apply: before:scale-100 before:opacity-100 before:bg-[var(--btn-plain-bg-hover)] text-[var(--primary)]
        }
    }
}

.btn-regular {
    --at-apply: transition flex items-center justify-center bg-[var(--btn-regular-bg)] hover:bg-[var(--btn-regular-bg-hover)] active:bg-[var(--btn-regular-bg-active)] text-[var(--btn-content)] dark:text-white/75
}

.link-underline {
    --at-apply: transition underline decoration-2 decoration-dashed decoration-[var(--link-underline)] hover:decoration-[var(--link-hover)] active:decoration-[var(--link-active)] underline-offset-[0.25rem]
}

.toc-hide,
.toc-not-ready {
    --at-apply: opacity-0 pointer-events-none
}

#toc-inner-wrapper {
    mask-image: linear-gradient(to bottom, transparent 0%, black 2rem, black calc(100% - 2rem), transparent 100%);
}

.hide-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
    display: none;
}


html.is-changing .transition-swup-fade {
    --at-apply: transition-all duration-200
}

html.is-animating .transition-swup-fade {
    --at-apply: opacity-0 translate-y-4
}

/* PhotoSwipe */
.pswp__button {
    --at-apply: transition bg-black/40 hover:bg-black/50 active:bg-black/60 flex items-center justify-center mr-0 w-12 h-12;
}

.pswp__button--zoom,
.pswp__button--close {
    --at-apply: mt-4 rounded-xl active:scale-90;
}

.pswp__button--zoom {
    --at-apply: mr-2.5 !;
}

.pswp__button--close {
    --at-apply: mr-4 !;
}

.custom-md img,
#post-cover img {
    --at-apply: cursor-zoom-in
}


.meta-icon {
    --at-apply: w-8 h-8 transition rounded-md flex items-center justify-center bg-[var(--btn-regular-bg)] text-[var(--btn-content)] mr-2
}

.with-divider {
    --at-apply: before:content-['/'] before:ml-1.5 before:mr-1.5 before:text-[var(--meta-divider)] before:text-sm before:font-medium before:first-of-type:hidden before:transition
}



.btn-regular-dark {
    --at-apply: flex items-center justify-center bg-[oklch(0.45_0.01_var(--hue))] hover:bg-[oklch(0.50_0.01_var(--hue))] active:bg-[oklch(0.55_0.01_var(--hue))] dark:bg-[oklch(0.30_0.02_var(--hue))] dark:hover:bg-[oklch(0.35_0.03_var(--hue))] dark:active:bg-[oklch(0.40_0.03_var(--hue))]
}

.btn-regular-dark.success {
    --at-apply: bg-[oklch(0.75_0.14_var(--hue))] dark:bg-[oklch(0.75_0.14_var(--hue))]
}

.copy-btn-icon {
    --at-apply: absolute top-1/2 left-1/2 transition -translate-x-1/2 -translate-y-1/2
}

.copy-btn .copy-icon {
    --at-apply: opacity-100 fill-white dark:fill-white/75
}

.copy-btn.success .copy-icon {
    --at-apply: opacity-0 fill-[var(--deep-text)]
}

.copy-btn .success-icon {
    --at-apply: opacity-0
}

.copy-btn.success .success-icon {
    --at-apply: opacity-100
}




.dash-line {
    position: relative;
}

.dash-line::before {
    content: "";
    position: absolute;
    width: 10%;
    height: 100%;
    top: 50%;
    left: calc(50% - 1px);
    border-left: 2px dashed var(--line-color);
    pointer-events: none;
    transition: all 0.3s;
    transform: translateY(-50%);
}



.custom-md h1 {
    --at-apply: text-3xl
}


@keyframes fade-in-up {
    0% {
        transform: translateY(2rem);
        opacity: 0;
    }

    100% {
        transform: translateY(0);
        opacity: 1;
    }
}
</style>