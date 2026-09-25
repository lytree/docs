/**
 * vue/jsx-runtime adapter for MDX.
 *
 * MDX v3 compiled with `jsxImportSource: 'vue'` imports `jsx` / `jsxs` /
 * `Fragment` / `useMDXComponents` from this module. We map the JSX runtime
 * calls onto Vue's `h()`, translating a few HTML-centric attribute names.
 */
import { h, Fragment, type VNodeChild, type Component } from 'vue'

export { Fragment }

/** React-style attribute name -> Vue attribute name */
const ATTR_MAP: Record<string, string> = {
  className: 'class',
  htmlFor: 'for',
  tabIndex: 'tabindex',
  readOnly: 'readonly',
  maxLength: 'maxlength',
  minLength: 'minlength',
  autoComplete: 'autocomplete',
  autoFocus: 'autofocus',
  colSpan: 'colspan',
  rowSpan: 'rowspan',
  contentEditable: 'contenteditable',
  spellCheck: 'spellcheck',
  srcDoc: 'srcdoc',
  srcLang: 'srclang',
  noValidate: 'novalidate',
}

function normalizeProps(props: Record<string, unknown> | null) {
  if (!props) return {}
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') continue
    out[ATTR_MAP[key] ?? key] = value
  }
  return out
}

export function jsx(
  type: string | Component,
  props: Record<string, unknown> | null,
  key?: string | number | null,
): ReturnType<typeof h> {
  const { children } = props ?? ({} as { children?: VNodeChild })
  return h(type as never, { key: key ?? undefined, ...normalizeProps(props) }, children as never)
}

export const jsxs = jsx

/**
 * Dev-mode JSX runtime entry (MDX generates `jsxDEV` calls when the
 * `NODE_ENV !== 'production'`). Extra args (isStatic / source / self) are
 * only used for dev warnings — safe to ignore here.
 */
export function jsxDEV(
  type: string | Component,
  props: Record<string, unknown> | null,
  key?: string | number | null,
): ReturnType<typeof h> {
  return jsx(type, props, key)
}

/** MDX component mapping support (mirrors MDXProvider semantics) */
let providedComponents: Record<string, unknown> | null = null

export function useMDXComponents(
  userComponents?: Record<string, unknown> | null,
): Record<string, unknown> {
  return { ...(providedComponents ?? {}), ...(userComponents ?? {}) }
}

/** Register default MDX components globally (called by the docs layout) */
export function setMDXComponents(map: Record<string, unknown>): void {
  providedComponents = map
}
