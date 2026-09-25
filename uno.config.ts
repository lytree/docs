import {
  defineConfig,
  presetWind3,
  transformerDirectives,
} from 'unocss'

export default defineConfig({
  presets: [
    // class-based dark mode: `dark:` matches `.dark` ancestors (see Global.scss)
    presetWind3({ dark: 'class' }),
  ],
  transformers: [
    // enforce 'pre': expand @apply BEFORE vite's css pipeline (sass + css
    // modules + lightningcss) — the default phase would run after core css
    // processing, too late for the generated declarations to be included
    { ...transformerDirectives(), enforce: 'pre' },
  ],
  theme: {
    colors: {
      // semantic palette backed by CSS custom properties defined in
      // Global.scss (:root / :root.dark) — dark mode keeps working with
      // pure class switching, no duplicated utilities needed
      bg: 'var(--bg)',
      fg: 'var(--fg)',
      muted: 'var(--muted)',
      'muted-fg': 'var(--muted-fg)',
      border: 'var(--border)',
      primary: 'var(--primary)',
      'primary-contrast': 'var(--primary-contrast)',
      accent: 'var(--accent)',
      card: 'var(--card)',
      overlay: 'var(--overlay)',
    },
  },
  content: {
    pipeline: {
      // include css/scss so transformerDirectives can expand @apply
      // inside *.module.scss before vite's css pipeline sees them
      include: [/\.(vue|svelte|[jt]sx|mdx?|astro|html|css|scss|sass|less)($|\?)/],
    },
  },
})
