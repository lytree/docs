/**
 * 连接池配置示例 —— 被 <<< 文件导入 引用。
 * 文档里看到的代码块内容来自这个文件，改这里文档同步更新。
 */
export const poolConfig = {
  maxSize: 16,
  idleTimeoutMs: 30_000,
  validateOnBorrow: true,
} as const
