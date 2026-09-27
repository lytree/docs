import { computed } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

/**
 * Reactive theme toggle backed by VueUse.
 *
 * - `isDark` is a `Ref<boolean>` that follows:
 *   1. localStorage('vueuse-color-scheme') if present
 *   2. otherwise the system `prefers-color-scheme: dark`
 * - Writing to `isDark` (or calling `toggle()`) persists to localStorage
 *   and reflects on <html class="dark"> + `color-scheme`.
 */
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  storageKey: 'fd-theme',
})

const toggleDark = useToggle(isDark)

export function useTheme() {
  return {
    theme: computed(() => (isDark.value ? 'dark' : 'light')),
    isDark,
    toggle: toggleDark,
  }
}

export default useTheme