import { createApp } from 'vue'
import App from './App'
import { router } from './Router'
import { setMDXComponents } from './lib/JsxRuntime'
import { mdxComponents } from './components/MdxComponents'
import '@unocss/reset/tailwind-v4.css'
import 'virtual:uno.css'
import './styles/Global.scss'

setMDXComponents(mdxComponents)

createApp(App).use(router).mount('#app')
