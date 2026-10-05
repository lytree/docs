---
title: Markdown 能力一览
description: 本站 markdown-it 管线支持的全部写作语法。
icon: 📖
---

本页是本站写作能力的完整参考，所有示例都是真实渲染的。

## 提示容器

提示类容器共 6 种，标题可自定义。

::: tip 这是提示
用于「值得知道但不打断阅读」的信息。
:::

::: info 这是信息
补充性的背景说明。
:::

::: note 这是笔记
补充记录。
:::

::: warning 这是警告
不照做会出问题的情况。
:::

::: danger 这是危险
会造成数据丢失或安全问题的情况。
:::

::: important 这是重点
必须知道的信息。
:::

::: quote 引用
引述他人或他处的说法。
:::

## 折叠容器

`::: details` 默认折叠，点击标题展开。

::: details 点击展开
里面的内容是完全正常的 Markdown。

支持列表：

- 第一项
- 第二项

也支持代码块：

```java
int x = 1;
```

表格同样可以：

| 列 A | 列 B |
| --- | --- |
| 1 | 2 |
:::

## 代码组

`::: code-group` 把多个代码块变成标签页，围栏的 `[文件名]` 作为标签。

::: code-group

```ts [src/config.ts]
export default defineConfig({
  site: { title: '杨 ◦ 柳' },
})
```

```json [package.json]
{
  "name": "doc",
  "private": true,
  "type": "module"
}
```

```bash [构建命令]
pnpm build
pnpm preview
```

:::

## 代码块

### 文件名标题栏

围栏信息里写 `[文件名]` 或 `title="文件名"`：

```ts [src/lib/Slots.ts]
export function defineSlots(slots: SlotsMap): void {
  Object.assign(registry, slots)
}
```

### 行高亮

`{1,3-5}` 高亮指定行：

```ts [高亮演示]
const registry: Record<string, SlotEntry> = {}

export function defineSlots(slots: SlotsMap): void {
  Object.assign(registry, slots)
}

export function useSlots() {
  return registry
}
```

### 聚焦

`[!code focus]` 让非目标行淡出：

```ts [聚焦演示]
function greet(name: string) {
  // [!code focus]
  return `Hello, ${name}!`
}

function farewell(name: string) {
  return `Bye, ${name}.`
}
```

### diff 标注

`[!code ++]` 新增、`[!code --]` 删除：

```ts [diff 演示]
const theme = 'github-light'
const lineNumbers = true  // [!code ++]
// const legacy = true    [!code --]
```

### 行号

配置 `fumadocsSource({ markdown: { lineNumbers: true } })` 后所有代码块显示行号。

## 文件导入

独占一行的导入指令会把磁盘文件嵌进文档：

<<< @/other/snippets/pool-config.ts

改那个 `.ts` 文件，本页同步更新。

::: tip
`@/` 指向内容根目录（`content/docs/`），也可以写相对路径。
指令必须**独占一行**。
:::

## 数学公式

行内公式 `$E = mc^2$`，块级公式：

$$
\int_0^\infty e^{-x^2}\,dx = \frac{\sqrt{\pi}}{2}
$$

## 表格

GFM 表格支持对齐控制：

| 左对齐 | 居中 | 右对齐 |
| :--- | :---: | ---: |
| 左 | 中 | 右 |
| 文字 | 文字 | 123 |

## 其他

- **删除线**：`~~删除~~`
- **自动链接**：https://example.com 会自动识别
- **图片**：正文图片自动支持点击放大
- **裸 HTML**：`<kbd>` 之类可直接写

## 与自定义能力的关系

容器语法负责**内容表达**，下面这些由站点框架提供：

- **布局插槽** —— 导航、侧边栏、目录、页脚等位置注入自定义组件
- **设计 token** —— 改配置换配色、圆角、布局尺寸
- **frontmatter 覆盖** —— 单页控制目录位置、收录层级、布局类名

详见「其他 → 布局与语法」。