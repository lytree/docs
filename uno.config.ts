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
      // raw tokens (also exposed as CSS variables in Global.scss)
      bg: 'var(--fd-background)',
      card: 'var(--fd-card)',
      'card-fg': 'var(--fd-card-foreground)',
      fg: 'var(--fd-foreground)',
      'fg-muted': 'var(--fd-muted-foreground)',
      muted: 'var(--fd-muted)',
      border: 'var(--fd-border)',
      primary: 'var(--fd-primary)',
      'primary-fg': 'var(--fd-primary-foreground)',
      accent: 'var(--fd-accent)',
      'accent-fg': 'var(--fd-accent-foreground)',
      ring: 'var(--fd-ring)',
      overlay: 'var(--fd-overlay)',
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
