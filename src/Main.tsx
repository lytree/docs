import { createApp } from 'vue'
import App from './App'
import { router } from './Router'
import { tokenStyleSheet } from './lib/Config'
import '@unocss/reset/tailwind-v4.css'
import 'virtual:uno.css'
import './styles/Global.scss'
import './styles/Markdown.scss'
// 导入即注册：theme.tsx 里的插槽与自定义组件在此生效
import '../theme'

// 设计 token（fumadocsSource 的 tokens 配置）-> CSS 变量
const tokenCss = tokenStyleSheet()
if (tokenCss) {
  const style = document.createElement('style')
  style.setAttribute('data-design-tokens', '')
  style.textContent = tokenCss
  document.head.appendChild(style)
}

createApp(App).use(router).mount('#app')