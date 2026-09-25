/// <reference types="vite/client" />

declare module '*.module.scss' {
  const classes: Record<string, string>
  export default classes
}

declare module 'virtual:source' {
  export interface TocItem {
    title: string
    url: string
    depth: number
  }
  export interface ApiParam {
    name: string
    type: string
    required: boolean
    comment?: string
    defaultValue?: string
  }
  export interface ApiSignature {
    code: string
    params: ApiParam[]
    returns?: string
    returnsComment?: string
    typeParams: { name: string; comment?: string }[]
  }
  export interface ApiMemberData {
    name: string
    kind: 'property' | 'method' | 'constructor' | 'enum-member' | 'index-signature' | 'call-signature' | 'get' | 'set'
    anchor: string
    type?: string
    comment?: string
    required?: boolean
    readonly?: boolean
    static?: boolean
    defaultValue?: string
    signatures?: ApiSignature[]
  }
  export interface ApiDocData {
    kind: 'class' | 'interface' | 'function' | 'enum' | 'type-alias' | 'variable'
    name: string
    summary?: string
    remarks?: string
    examples?: string[]
    typeParams?: { name: string; comment?: string }[]
    type?: string
    signatures?: ApiSignature[]
    members?: ApiMemberData[]
    heritage?: string[]
    sources?: { fileName: string; line: number }[]
    toc: TocItem[]
  }
  export interface PageData {
    slug: string
    locale: string
    file: string
    title: string
    description?: string
    toc: TocItem[]
    icon?: string
    full?: boolean
    lastModified?: number
    api?: ApiDocData
  }
  export interface PageTreeNode {
    type: 'page' | 'folder' | 'separator'
    name: string
    url?: string
    title?: string
    description?: string
    icon?: string
    root?: boolean
    defaultOpen?: boolean
    children?: PageTreeNode[]
    index?: string
  }
  export interface SearchEntry {
    id: string
    type: 'page' | 'heading' | 'text'
    url: string
    title: string
    heading?: string
    content?: string
    locale: string
  }
  export interface SourceData {
    pages: PageData[]
    tree: PageTreeNode[]
    searchIndex: SearchEntry[]
  }
  export interface LocaleInfo {
    code: string
    name: string
    isDefault: boolean
  }
  export interface SiteInfo {
    url: string
    title: string
    description: string
    editLink?: { repo: string; branch?: string }
  }
  export const source: {
    site: SiteInfo
    locales: LocaleInfo[]
    defaultLocale: string
    byLocale: Record<string, SourceData>
    pages: PageData[]
  }
}
