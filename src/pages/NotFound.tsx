import { defineComponent } from 'vue'
import s from './NotFound.module.scss'

export const NotFound = defineComponent({
  name: 'NotFoundPage',
  setup() {
    return () => (
      <div class={s.nf}>
        <p class={s.nfCode}>404</p>
        <p class={s.nfText}>页面不存在</p>
        <a href="/docs" class={s.nfLink}>
          返回文档
        </a>
      </div>
    )
  },
})
