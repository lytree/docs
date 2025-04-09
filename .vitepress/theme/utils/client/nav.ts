//@ts-nocheck
import type { Theme } from '../../types/index'
type NavItem = Theme.NavItem


export function getNav(
    _nav: Theme.Nav | undefined,
    path: string
): NavItem[] {
    if (Array.isArray(_nav)) return addBase(_nav)
    if (_nav == null) return []

    path = ensureStartingSlash(path)

    const dir = Object.keys(_nav)
        .sort((a, b) => {
            return b.split('/').length - a.split('/').length
        })
        .find((dir) => {
            // make sure the multi sidebar key starts with slash too
            return path.startsWith(ensureStartingSlash(dir))
        })

    const nav = dir ? _nav[dir] : []
    return Array.isArray(nav)
        ? addBase(nav)
        : addBase(nav.items, nav.base)
}

function addBase(items: NavItem[], _base?: string): NavItem[] {
    return [...items].map((_item) => {
        const item = { ..._item }
        const base = item.base || _base
        if (base && item.link) item.link = base + item.link
        if (item.items) item.items = addBase(item.items, base)
        return item
    })
}
function ensureStartingSlash(path: string): string {
    return path.startsWith('/') ? path : `/${path}`
}