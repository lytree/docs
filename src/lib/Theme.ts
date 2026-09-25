import { ref, watchEffect } from 'vue'

const theme = ref<'light' | 'dark'>(
  document.documentElement.classList.contains('dark') ? 'dark' : 'light',
)

export function useTheme() {
  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', theme.value === 'dark')
    try {
      localStorage.setItem('fd-theme', theme.value)
    } catch {
      /* ignore */
    }
  })
  return { theme, toggle }
}
