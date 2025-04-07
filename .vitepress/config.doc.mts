export const nav: any = [
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
]
export const sidebar: any = {
    "/docs/middleware": [
        {
            text: 'Redis', collapsed: true, items: [
                {
                    text: "redis",
                    link: '/docs/middleware/redis/1'
                }
            ]
        }],
    "/docs/script/java": [{
        text: '语法', collapsed: true, items: [
            {
                text: "语法",
                link: '/docs/script/java/1'
            }
        ]
    }],
    "/docs/script/dotnet": [{
        text: '语法', collapsed: true, items: [
            {
                text: "语法",
                link: '/docs/script/dotnet/1'
            }
        ]
    }],
    "/docs/official/": [
        {
            text: '言语', collapsed: true, items: [
                {
                    text: "言语1",
                    link: '/docs/official/lalognosis/1'
                }
            ]
        },
        {
            text: '判断', collapsed: true, items: [
                {
                    text: "资料分析1",
                    link: '/docs/official/inferring/1'
                }
            ]
        },
        {
            text: '资料', collapsed: true, items: [
                {
                    text: "资料分析1",
                    link: '/docs/official/dataanalysis/1'
                }
            ]
        },
        {
            text: '数量', collapsed: true, items: [
                {
                    text: "数量",
                    link: '/docs/official/quantity/1'
                }
            ]
        },
        {
            text: '常识', collapsed: true, items: [
                {
                    text: "常识",
                    link: '/docs/official/commonsense/1'
                }
            ]
        },
        {
            text: '政治', collapsed: true, items: [
                {
                    text: "常识",
                    link: '/docs/official/political/1'
                }
            ]
        },
    ],

}