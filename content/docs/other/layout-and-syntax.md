---
title: 布局与语法
description: VitePress 布局体系 + 文档写作能力的完整演示。
icon: 🎨
---

本页演示站点新增的布局与写作能力。所有示例都是**真实可交互**的，不是截图。

## ::: 容器

容器语法是 Markdown 里最常用的高亮写法，直接写 `::: 类型 标题` 即可。

::: tip 这是一个提示
`tip` 类型用于「值得知道但不打断阅读」的信息。
:::

::: warning 注意
`warning` 类型用于「不照做会出问题」的情况。
:::

::: danger 危险
`danger` 类型用于「会造成数据丢失或安全问题」的情况。
:::

::: note 补充说明
也可以写 `info`、`note`、`important`、`quote`、`caution`。
:::

::: details 点击展开折叠内容
`details` 容器默认折叠，适合放长代码或延伸阅读。

```java
public final class ConnectionPool {
    private final int maxSize;
    private final BlockingQueue<Socket> idle;

    ConnectionPool(int maxSize) {
        this.maxSize = maxSize;
        this.idle = new ArrayBlockingQueue<>(maxSize);
    }
}
:::

::: details 默认展开
加上 `open` 属性（写在标题位置）可以让它默认展开。
:::

容器可以嵌套：

::: warning 外层提示
这里套了一个内层的 `tip`：

::: tip 内层提示
嵌套容器同样可用 —— 解析时会递归展开。
:::
:::

## 代码组

用 `::: code-group` 包住多个代码块，每个围栏的 `[文件名]` 会变成标签页。

::: code-group

```ts [config.ts]
export default defineConfig({
  site: { title: '杨 ◦ 柳', url: 'https://doc.prideyang.top' },
})
```

```json [config.json]
{
  "name": "doc",
  "private": true,
  "type": "module"
}
```

```bash [deploy.sh]
pnpm build
pnpm preview
```

:::

## 代码块增强

### 文件名与标题栏

用 `[filename]` 写文件名，或用 `title="..."`，都会渲染成标题栏：

```ts [src/lib/Slots.ts]
export function defineSlots(slots: SlotsMap): void {
  Object.assign(registry, slots)
}
```

### 行高亮

`{1,3-5}` 高亮指定行：

```ts [行高亮]
const registry: Record<string, SlotEntry> = {}

export function defineSlots(slots: SlotsMap): void {
  Object.assign(registry, slots)
}

export function useSlots() {
  return registry
}
```

### focus —— 聚焦特定行

在代码注释里写 `[!code focus]`，其余行会自动淡出：

```ts [聚焦]
function greet(name: string) {
  // [!code focus]
  return `Hello, ${name}!`
}

function farewell(name: string) {
  return `Bye, ${name}.`
}
```

### 关键词高亮

`[!code word:xxx]` 高亮注释中提到的标识符：

```ts [关键词高亮]
// [word highlight] 高亮 keyword
// [word highlight] 高亮 highlight
const theme = 'github-dark'
```

### diff 标注

`[!code ++]` 新增、`[!code --]` 删除：

```ts [diff]
const theme = 'github-light'
const lineNumbers = true  // [!code ++]
// const legacy = true    [!code --]
```

### 文件导入

用导入指令（三个左尖括号）把磁盘上的文件内容嵌进文档，避免代码在文档里重复维护。
下面这段来自 `content/docs/other/snippets/pool-config.ts`：

<<< @/other/snippets/pool-config.ts

改那个文件，这一页同步更新 —— 适合放配置样例、类型定义、常见模板。

::: tip
`@/` 指向内容根目录（`content/docs/`），也可以写相对路径（`./xxx.ts`）。
导入指令必须**独占一行**，写在行内代码里不会生效。
:::

## 布局插槽

站点的每个关键位置都预留了插槽，在 `theme.tsx` 里注册组件或渲染函数即可插入内容。

可用的插槽位置：

| 插槽 | 位置 |
| --- | --- |
| `layout-top` / `layout-bottom` | 整页最外层的上下 |
| `nav-bar-content-before` | 导航栏最左侧 |
| `nav-bar-title-before` / `nav-bar-title-after` | Logo 的前后 |
| `nav-bar-content-after` | 导航栏最右侧 |
| `sidebar-nav-before` / `sidebar-nav-after` | 侧边栏的上下 |
| `aside-outline-before` / `aside-outline-after` | 右侧目录的上下 |
| `doc-before` / `doc-after` | 正文所在列的上下 |
| `doc-top` / `doc-bottom` | 文章内部（面包屑之后） |
| `doc-footer-before` / `doc-footer-after` | 页脚内部 |

注册示例：

```tsx [theme.tsx]
import { defineComponent, h } from 'vue'
import { defineTheme } from './src/lib/Slots'

const Note = defineComponent({
  setup: () => () => h('p', { class: 'note' }, '这里是自定义内容'),
})

export default defineTheme({
  slots: {
    'doc-footer-before': Note,
    'layout-bottom': () => h('div', '全站底部'),
  },
})
```

插槽内容支持四种形态，按优先级：

1. **渲染函数** —— `(ctx) => VNode`，`ctx` 里有 `path` / `slug` / `title` / `frontmatter` / `dark`
2. **组件** —— `defineComponent` 对象
3. **VNode** —— 已创建好的节点
4. **字符串** —— 直接当文本

```tsx [带上下文]
export default defineTheme({
  slots: {
    'doc-after': (ctx) =>
      ctx.frontmatter?.banner
        ? h('div', { class: 'tip' }, ctx.frontmatter.banner)
        : null,
  },
})
```

本页顶部和底部都能看到插槽渲染出来的内容 —— 它们就注册在 `theme.tsx` 里。

## frontmatter 布局覆盖

每篇文档可以用 frontmatter 覆盖布局：

```yaml [frontmatter]
---
title: 我的页面
aside: false        # 关闭右侧目录
outline: [2, 4]     # 收录到 h4
pageClass: my-page  # 给 <article> 加类名，可用于自定义样式
full: true          # 宽屏模式，隐藏侧边栏与目录
---
```

| 字段 | 类型 | 作用 |
| --- | --- | --- |
| `title` | `string` | 页面标题（必填） |
| `description` | `string` | 描述，用于 SEO 与卡片 |
| `full` | `boolean` | 宽屏布局 |
| `aside` | `false \| 'left' \| 'right'` | 目录位置，`false` 关闭 |
| `outline` | `false \| [number, number]` | 目录收录的标题层级 |
| `pageClass` | `string` | 附加到布局根节点的类名 |
| `lastUpdated` | `false` | 隐藏「最后更新」 |
| `head` | `array` | 追加 `<head>` 标签 |

## 为什么是 markdown-it

本站内容管线是 markdown-it（与 VitePress 同款），不是 MDX。差别很实际：

| | MDX | markdown-it |
| --- | --- | --- |
| `List<String>` 这类泛型 | 触发 JSX 解析错误 | 正常文本 |
| `a < b` 这类比较 | 触发 JSX 解析错误 | 正常文本 |
| 文件导入指令 | `<` 与 JSX 冲突，需特殊处理 | 普通块级文本 |
| 裸 HTML | 需闭合标签 | 宽松 |

换来的是：容器语法、代码组、文件导入、插槽这些能力都在，且写作时不用担心尖括号。

## 下一步

- 想了解配置项全貌，看 `vite.config.ts` 里的 `fumadocsSource()`
- 想加自己的插槽组件，改 `theme.tsx`
- 想改配色 / 圆角 / 布局尺寸，改 `fumadocsSource({ tokens })`