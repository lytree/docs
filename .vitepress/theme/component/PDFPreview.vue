<template>
    <div>
        <div class="on-demand-pdf-container" ref="pdfContainerRef">
            <canvas id="pdf-canvas" />
        </div>
        <el-pagination :hide-on-single-page="loadFished" v-model:page-size="pageSize" v-model:current-page="pdfPage"
            layout="prev, pager, next, jumper, ->, total" :total="pdfPages" />
    </div>
</template>

<script setup lang="ts">

import { watch, onMounted, ref, computed, onUnmounted } from "vue";
import { ElPagination } from 'element-plus'

const props = defineProps({
    url: String
});

let pdfDoc: any = null;
const pdfPage = ref(1)
const pdfPages = ref(0);
const pageSize = ref(1)
const pdfScale = ref(1.5);
const pdfContainerRef = ref<HTMLElement | null>(null);
const loadedNum = ref(1);

const loadFished = computed(() => {
    const loadFinished = loadedNum.value > 0;
    if (loadFinished) {
        removeEventListeners();
    }
    return loadFinished;
});

let loadingTask;
const renderPage = (num: any) => {
    pdfDoc.getPage(num).then((page: any) => {
        page.cleanup();
        if (pdfContainerRef.value) {
            pdfScale.value = pdfContainerRef.value.clientWidth / page.view[2];
        }
        const canvas: any = document.getElementById("pdf-canvas");
        if (canvas) {

            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const dpr = window.devicePixelRatio || 1;
            const bsr =
                ctx.webkitBackingStorePixelRatio ||
                ctx.mozBackingStorePixelRatio ||
                ctx.msBackingStorePixelRatio ||
                ctx.oBackingStorePixelRatio ||
                ctx.backingStorePixelRatio ||
                1;
            const ratio = dpr / bsr;
            const viewport = page.getViewport({ scale: pdfScale.value });
            canvas.width = viewport.width * ratio;
            canvas.height = viewport.height * ratio;
            canvas.style.width = viewport.width + "px";
            canvas.style.height = viewport.height + "px";
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
            };
            page.render(renderContext);
        }
    });
};

const initPdfLoader = async (loadingTask: any) => {
    return new Promise((resolve, reject) => {
        loadingTask.promise
            .then((pdf: any) => {
                pdf.loadingParams.disableAutoFetch = true;
                pdf.loadingParams.disableStream = true;
                pdfDoc = pdf; // 保存加载的pdf文件流
                pdfPages.value = pdfDoc.numPages; // 获取pdf文件的总页数
                resolve(true);
            })
            .catch((error: any) => {
                reject(error);
                console.warn(`[upthen] pdfReader loadFile error: ${error}`);
            });
    });
};

const distanceToBottom = ref(0);
const calculateDistanceToBottom = () => {
    if (pdfContainerRef.value) {
        const containerHeight = pdfContainerRef.value.offsetHeight;
        const containerScrollHeight = pdfContainerRef.value.scrollHeight;
        distanceToBottom.value =
            containerScrollHeight -
            containerHeight -
            pdfContainerRef.value.scrollTop;
    }
};

const lazyRenderPdf = () => {
    calculateDistanceToBottom();
    if (distanceToBottom.value < 1000) {
        renderPage(pdfPage);
    }
};
watch(pdfPage, (newValue, oldValue) => {
    renderPage(newValue);
})
const removeEventListeners = () => {
    pdfContainerRef.value?.removeEventListener("scroll", () => {
        lazyRenderPdf();
    });
};

onMounted(async () => {
    import("pdfjs-dist").then(async (pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            import.meta.url,
        ).toString();
        loadingTask = pdfjs.getDocument({
            url: props.url
        });
        if (await initPdfLoader(loadingTask)) {
            renderPage(1);
        }

        pdfContainerRef.value?.addEventListener("scroll", () => {
            lazyRenderPdf();
        });
    });

});

onUnmounted(() => {
    removeEventListeners();
});
</script>

<style lang="scss" scoped>
.on-demand-pdf-container {
    height: 100%;
    overflow-y: scroll;
    overflow-x: hidden;

    canvas {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
}
</style>