<script setup lang="tsx">
import { ref } from 'vue'
function backToTop() {
    window.scroll({ top: 0, behavior: 'smooth' });
}

function scrollFunction() {
    const back_to_top_btn = ref()
    if (document.body.scrollTop > 600 || document.documentElement.scrollTop > 600) {
        back_to_top_btn?.value.classList.remove('hide')
    } else {
        back_to_top_btn?.value.classList.add('hide')
    }
}
window.onscroll = scrollFunction
</script>
<template>
    <!-- There can't be a filter on parent element, or it will break `fixed` -->
    <div class="back-to-top-wrapper hidden lg:block">
        <div ref="back_to_top_btn" class="back-to-top-btn hide flex items-center rounded-2xl overflow-hidden transition"
            @onclick="backToTop()">
            <button aria-label="Back to Top" class="btn-card h-[3.75rem] w-[3.75rem]">
                <div class="i-material-symbols-keyboard-arrow-up-rounded mx-auto"></div>
            </button>
        </div>
    </div>

</template>
<style lang="scss">
.back-to-top-wrapper {
    width: 3.75rem;
    height: 3.75rem;
    position: absolute;
    right: 0;
    top: 0;
}

.back-to-top-btn {
    color: var(--primary);
    font-size: 2.25rem;
    font-weight: bold;
    border: none;
    position: fixed;
    bottom: 15rem;
    opacity: 1;
    cursor: pointer;
    transform: translateX(5rem);

    i {
        font-size: 1.75rem;
    }

    &.hide {
        transform: translateX(5rem) scale(0.9);
        opacity: 0;
        pointer-events: none;
    }

    &:active {
        transform: translateX(5rem) scale(0.9);
    }
}
</style>
