export const nav: any = [
    { text: '首页', link: '/' },
    {
        text: '公考', link: 'official'
    },
    {
        text: '语言', items: [
            { text: 'java', link: '/script/java/1' },
            { text: 'dotnet', link: '/script/dotnet/1' },
        ]
    },
    {
        text: '中间件', link: '/middleware/redis/1'
    }
]
export const sidebar: any = {
    "/middleware": [
        {
            text: 'Redis', collapsed: true, items: [
                {
                    text: "redis",
                    link: '/middleware/redis/1'
                }
            ]
        }],
    "/script/java": [{
        text: '语法', collapsed: true, items: [
            {
                text: "语法",
                link: '/script/java/1'
            }
        ]
    }],
    "/script/dotnet": [{
        text: '语法', collapsed: true, items: [
            {
                text: "语法",
                link: '/script/dotnet/1'
            }
        ]
    }],
    "/official/": [
        {
            text: '言语', collapsed: true, items: [
                {
                    text: "言语1",
                    link: '/official/lalognosis/1'
                }
            ]
        },
        {
            text: '判断', collapsed: true, items: [
                {
                    text: "资料分析1",
                    link: '/official/inferring/1'
                }
            ]
        },
        {
            text: '资料', collapsed: true, items: [
                {
                    text: "资料分析1",
                    link: '/official/dataanalysis/1'
                }
            ]
        },
        {
            text: '数量', collapsed: true, items: [
                {
                    text: "数量",
                    link: '/official/quantity/1'
                }
            ]
        },
        {
            text: '常识', collapsed: true, items: [
                {
                    text: "常识",
                    link: '/official/commonsense/1'
                }
            ]
        },
        {
            text: '政治', collapsed: true, items: [
                {
                    text: "常识",
                    link: 'official/political/1'
                }
            ]
        },
    ],

}