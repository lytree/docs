/**
 * 主题定制入口。
 *
 * 这里放**组件级**的定制：布局插槽、自定义 MDX 组件、页面附加内容。
 * 数据级的配置（导航、token、文案）在 vite.config.ts 的 `fumadocsSource()` 里。
 *
 * 分工的原因：`fumadocsSource()` 的配置会被 vite.config.ts 在 Node 侧读取，
 * 如果它 import 组件，Vue 就会被拖进 vite 的配置执行环境。所以两侧分开：
 *   vite.config.ts  →  纯数据（fumadocsSource）
 *   theme.tsx       →  组件与插槽（仅浏览器）
 */
import { defineTheme } from './src/lib/Slots'

// ---------------------------------------------------------------------------
// 1. 布局插槽
// ---------------------------------------------------------------------------

/**
 * 可用插槽（对齐 VitePress 的位置命名）：
 *
 *   layout-top / layout-bottom          整页最外层
 *   nav-bar-content-before               导航栏最左侧
 *   nav-bar-title-before                 Logo 之前
 *   nav-bar-title-after                  Logo 之后
 *   nav-bar-content-after                导航栏最右侧
 *   sidebar-nav-before / sidebar-nav-after   侧边栏上下
 *   aside-outline-before / aside-outline-after 右侧目录上下
 *   doc-before / doc-after               正文所在列的上下
 *   doc-top / doc-bottom                 文章内部（面包屑之后）
 *   doc-footer-before / doc-footer-after 页脚内部
 *
 * 插槽内容可以是组件、渲染函数或字符串；渲染函数能拿到 ctx（path/slug/frontmatter…）。
 */

export default defineTheme({
  slots: {
    // 目前没有自定义插槽。需要时在这里注册，例如：
    //   'doc-after': () => h(MyChart)
  },
  components: {
    // 这里可以登记供插槽复用的组件，例如 { MyChart: MyChart }
  },
})

// ---------------------------------------------------------------------------
// 2. 自定义组件
// ---------------------------------------------------------------------------
//
// `components` 里的键值对会被放进全局组件表（`resolveComponents()`），
// 供插槽内容与其它组件按名字引用：
//
//   export default defineTheme({
//     slots: { 'doc-after': () => <MyChart /> },
//     components: { MyChart },
//   })