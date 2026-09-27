/**
 * Site-wide announcement banner (fumadocs Banner).
 *
 * - content comes from vite.config.ts `fumadocsSource({ site: { banner } })`
 * - dismiss state persists to localStorage (`fd-banner-<id>`)
 * - variant: 'normal' (muted) | 'rainbow' (animated gradient)
 */
import { defineComponent, ref, onMounted } from 'vue'
import { site } from '../lib/Source'
import s from './Banner.module.scss'

export const Banner = defineComponent({
  name: 'FdBanner',
  setup() {
    const config = site.banner
    const dismissed = ref(false)

    onMounted(() => {
      if (!config) return
      try {
        dismissed.value = localStorage.getItem(`fd-banner-${config.id}`) === '1'
      } catch {
        /* storage unavailable */
      }
    })

    const close = () => {
      dismissed.value = true
      if (!config) return
      try {
        localStorage.setItem(`fd-banner-${config.id}`, '1')
      } catch {
        /* storage unavailable */
      }
    }

    return () => {
      if (!config || dismissed.value) return null
      const rainbow = (config.variant ?? 'normal') === 'rainbow'
      return (
        <div class={[s.banner, rainbow && s.rainbow]} role="banner">
          <div class={s.inner}>
            <p class={s.text}>
              {config.link ? (
                <a class={s.link} href={config.link} target="_blank" rel="noreferrer">
                  {config.text}
                </a>
              ) : (
                config.text
              )}
            </p>
            <button type="button" class={s.close} onClick={close} aria-label="关闭公告">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
      )
    }
  },
})
