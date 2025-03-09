import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "docs",
  description: "exam",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      {
        text: '公考', items: [
          { text: '言语理解', link: '/lalognosis' },
          { text: '资料分析', link: '/dataanalysis' },
          { text: '数量', link: '/quantity' },
          { text: '判断推理', link: '/Inferring' },
          { text: '政治理论', link: '/political/1' },
        ]
      }
    ],

    sidebar: [
      {
        text: '政治理论',
        items: [
          { text: '新思想', link: '/political/1' },
        ]
      }
    ],
  }
})
