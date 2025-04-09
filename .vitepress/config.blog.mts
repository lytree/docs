
import { Theme } from "./theme/types"

export const blogTheme: Partial<Theme.BlogConfig> =
{
    navs: {
        "/docs": [
            { text: '首页', link: '/docs' },
            {
                text: '公考', link: '/docs/official'
            },
            {
                text: '语言', items: [
                    { text: 'java', link: '/docs/script/java/1' },
                    { text: 'dotnet', link: '/docs/script/dotnet/1' },
                ]
            },
            {
                text: '中间件', link: '/docs/middleware/redis/1'
            }
        ],
        "/blog": []
    },
}
