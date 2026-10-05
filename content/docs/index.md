---
title: 介绍
description: 个人文档站 —— Java / dotnet / 数据库 / 中间件 等笔记。
---

# 杨 ◦ 柳 · 个人文档

这里收录日常学习与工作中沉淀下来的技术笔记，按主题分成几个目录。
内容用 Markdown 写，配合 markdown-it 管线渲染，支持自定义容器、数学公式、代码高亮、暗色模式和全文搜索（`Ctrl K`）。

## 主题目录

| 主题 | 说明 |
| --- | --- |
| [🟣 dotnet](/docs/dotnet) | .NET / LINQ 相关实践与笔记。 |
| [☕ Java](/docs/java) | Java 语言、JVM、并发与常用框架。 |
| [🗄️ 数据库](/docs/db) | MySQL / PostgreSQL 等使用笔记。 |
| [🧩 中间件](/docs/middleware) | Redis、消息队列等中间件相关。 |
| [📚 其他](/docs/other) | 正则、数学、UV 等杂项。 |

## 关于本站

- **框架**：fumadocs 的 Vue 3 + TSX 移植，并接入 VitePress 的布局与写作体系
- **渲染**：Vue 3 + Vite + markdown-it + UnoCSS + SCSS Modules
- **内容格式**：Markdown（目录结构兼容 Fumadocs 的 `meta.json` 页面树）
- **可定制**：布局插槽、设计 token、自定义容器，全部可用 TSX 扩展
- **站点源码**：[lytree/docs](https://github.com/lytree/docs)

## 写作能力

::: tip 提示块开箱即用
`::: warning`、`::: danger`、`::: details`、`::: code-group` 等容器都内置了。
:::

::: details 想深入了解怎么定制？
- **布局插槽** —— 导航、侧边栏、目录、页脚等位置都能注入自己的组件
- **设计 token** —— 改配置即可换配色、圆角、侧边栏宽度
- **文件导入** —— 把代码文件直接嵌进文档，避免重复维护

详见「其他 → 布局与语法」。
:::
