import UnoCSS from 'unocss/vite'
import { transformerDirectives, transformerVariantGroup } from 'unocss'

export default {
    plugins: [
        UnoCSS({
            transformers: [
                transformerDirectives(), transformerVariantGroup()
            ],
        })
    ]
}