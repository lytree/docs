import { defineConfig, presetAttributify, presetWind3, presetTypography, presetIcons, transformerVariantGroup, transformerDirectives } from 'unocss'
import svgToDataUri from 'mini-svg-data-uri'
import type { Preset } from 'unocss'
export default defineConfig({
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
  ],
  presets: [
    presetAttributify({ /* preset options */ }),
    presetWind3(),
    presetTypography(),
    presetIcons(),
  ],
  shortcuts: [{
    'expand-animation': 'relative before:ease-out before:transition active:bg-none hover:before:bg-[var(--btn-plain-bg-hover)] active:before:bg-[var(--btn-plain-bg-active)] z-0 before:absolute before:rounded-[inherit] before:inset-0 before:scale-[0.85] hover:before:scale-100 before:-z-10'
  }, {
    'text-90': 'text-black/90 dark:text-white/90',
    'text-75': 'text-black/75 dark:text-white/75',
    'text-50': 'text-black/50 dark:text-white/50',
    'text-30': 'text-black/30 dark:text-white/30',
    'text-25': 'text-black/25 dark:text-white/25'
  }],
  theme: {
    colors: {
      "primary-50": '#f2f7fb',
      "primary-100": '#e7f0f8',
      "primary-200": '#d3e2f2',
      "primary-300": '#b9cfe8',
      "primary-400": '#9cb6dd',
      "primary-500": '#839dd1',
      "primary-600": '#6a7fc1',
      "primary-700": '#6374ae',
      "primary-800": '#4a5989',
      "primary-900": '#414e6e',
      "primary-950": '#262c40',
      "accent-50": '#fffbea',
      "accent-100": '#fff2c5',
      "accent-200": '#ffe585',
      "accent-300": '#ffd146',
      "accent-400": '#ffbc1b',
      "accent-500": '#ff9800',
      "accent-600": '#e27100',
      "accent-700": '#bb4c02',
      "accent-800": '#983a08',
      "accent-900": '#7c300b',
      "accent-950": '#481700',
    }
  }
})
