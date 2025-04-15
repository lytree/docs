export const sidebar: any = {
    "/docs/middleware": [
        {
            text: 'Redis', collapsed: true, items: [
                {
                    text: "redis 基础",
                    link: '/docs/middleware/redis/1'
                },
                {
                    text: "redis 进阶",
                    link: '/docs/middleware/redis/2'
                }
            ]
        }],
    "/docs/script/java": [
        {
            text: 'effective java', collapsed: true, items: [

                {
                    link: 'docs/script/java/effectivejava/01',
                    text: '01. 考虑使用静态工厂方法替代构造方法'
                },


                {
                    link: 'docs/script/java/effectivejava/02',
                    text: '02. 当构造方法参数过多时使用builder模式'
                },


                {
                    link: 'docs/script/java/effectivejava/03',
                    text: '03. 使用私有构造方法或枚类实现Singleton属性'
                },


                {
                    link: 'docs/script/java/effectivejava/04',
                    text: '04. 使用私有构造方法执行非实例化'
                },


                {
                    link: 'docs/script/java/effectivejava/05',
                    text: '05. 依赖注入优于硬连接资源(hardwiring resources)'
                },


                {
                    link: 'docs/script/java/effectivejava/06',
                    text: '06. 避免创建不必要的对象'
                },


                {
                    link: 'docs/script/java/effectivejava/07',
                    text: '07. 消除过期的对象引用'
                },


                {
                    link: 'docs/script/java/effectivejava/08',
                    text: '08. 避免使用Finalizer和Cleaner机制'
                },


                {
                    link: 'docs/script/java/effectivejava/09',
                    text: '09. 使用try-with-resources语句替代try-finally语句'
                },


                {
                    link: 'docs/script/java/effectivejava/10',
                    text: '10. 重写equals方法时遵守通用约定'
                },


                {
                    link: 'docs/script/java/effectivejava/11',
                    text: '11. 重写equals方法时同时也要重写hashcode方法'
                },


                {
                    link: 'docs/script/java/effectivejava/12',
                    text: '12. 始终重写 toString 方法'
                },


                {
                    link: 'docs/script/java/effectivejava/13',
                    text: '13. 谨慎地重写 clone 方法'
                },


                {
                    link: 'docs/script/java/effectivejava/14',
                    text: '14. 考虑实现Comparable接口'
                },


                {
                    link: 'docs/script/java/effectivejava/15',
                    text: '15. 使类和成员的可访问性最小化'
                },


                {
                    link: 'docs/script/java/effectivejava/16',
                    text: '16. 在公共类中使用访问方法而不是公共属性'
                },


                {
                    link: 'docs/script/java/effectivejava/17',
                    text: '17. 最小化可变性'
                },


                {
                    link: 'docs/script/java/effectivejava/18',
                    text: '18. 组合优于继承'
                },


                {
                    link: 'docs/script/java/effectivejava/19',
                    text: '19. 要么设计继承并提供文档说明，要么禁用继承'
                },


                {
                    link: 'docs/script/java/effectivejava/20',
                    text: '20. 接口优于抽象类'
                },


                {
                    link: 'docs/script/java/effectivejava/21',
                    text: '21. 为后代设计接口'
                },


                {
                    link: 'docs/script/java/effectivejava/22',
                    text: '22. 接口仅用来定义类型'
                },


                {
                    link: 'docs/script/java/effectivejava/23',
                    text: '23. 类层次结构优于标签类'
                },


                {
                    link: 'docs/script/java/effectivejava/24',
                    text: '24. 支持使用静态成员类而不是非静态类'
                },


                {
                    link: 'docs/script/java/effectivejava/25',
                    text: '25. 将源文件限制为单个顶级类'
                },


                {
                    link: 'docs/script/java/effectivejava/26',
                    text: '26. 不要使用原始类型'
                },


                {
                    link: 'docs/script/java/effectivejava/27',
                    text: '27. 消除非检查警告'
                },


                {
                    link: 'docs/script/java/effectivejava/28',
                    text: '28. 列表优于数组'
                },


                {
                    link: 'docs/script/java/effectivejava/29',
                    text: '29. 优先考虑泛型'
                },


                {
                    link: 'docs/script/java/effectivejava/30',
                    text: '30. 优先使用泛型方法'
                },


                {
                    link: 'docs/script/java/effectivejava/31',
                    text: '31. 使用限定通配符来增加API的灵活性'
                },


                {
                    link: 'docs/script/java/effectivejava/32',
                    text: '32. 合理地结合泛型和可变参数'
                },


                {
                    link: 'docs/script/java/effectivejava/33',
                    text: '33. 优先考虑类型安全的异构容器'
                },


                {
                    link: 'docs/script/java/effectivejava/34',
                    text: '34. 使用枚举类型替代整型常量'
                },


                {
                    link: 'docs/script/java/effectivejava/35',
                    text: '35. 使用实例属性替代序数'
                },


                {
                    link: 'docs/script/java/effectivejava/36',
                    text: '36. 使用EnumSet替代位属性'
                },


                {
                    link: 'docs/script/java/effectivejava/37',
                    text: '37. 使用EnumMap替代序数索引'
                },


                {
                    link: 'docs/script/java/effectivejava/38',
                    text: '38. 使用接口模拟可扩展的枚举'
                },


                {
                    link: 'docs/script/java/effectivejava/39',
                    text: '39. 注解优于命名模式'
                },


                {
                    link: 'docs/script/java/effectivejava/40',
                    text: '40. 始终使用Override注解'
                },


                {
                    link: 'docs/script/java/effectivejava/41',
                    text: '41. 使用标记接口定义类型'
                },


                {
                    link: 'docs/script/java/effectivejava/42',
                    text: '42. lambda表达式优于匿名类'
                },


                {
                    link: 'docs/script/java/effectivejava/43',
                    text: '43. 方法引用优于lambda表达式'
                },


                {
                    link: 'docs/script/java/effectivejava/44',
                    text: '44. 优先使用标准的函数式接口'
                },


                {
                    link: 'docs/script/java/effectivejava/45',
                    text: '45. 明智审慎地使用Stream'
                },


                {
                    link: 'docs/script/java/effectivejava/46',
                    text: '46. 优先考虑流中无副作用的函数'
                },

                {
                    link: 'docs/script/java/effectivejava/48',
                    text: '48. 谨慎使用流并行'
                },


                {
                    link: 'docs/script/java/effectivejava/49',
                    text: '49. 检查参数有效性'
                },


                {
                    link: 'docs/script/java/effectivejava/50',
                    text: '50. 必要时进行防御性拷贝'
                },


                {
                    link: 'docs/script/java/effectivejava/51',
                    text: '51. 仔细设计方法签名'
                },


                {
                    link: 'docs/script/java/effectivejava/52',
                    text: '52. 明智审慎地使用重载'
                },


                {
                    link: 'docs/script/java/effectivejava/53',
                    text: '53. 明智审慎地使用可变参数'
                },


                {
                    link: 'docs/script/java/effectivejava/54',
                    text: '54. 返回空的数组或集合，不要返回 null'
                },


                {
                    link: 'docs/script/java/effectivejava/55',
                    text: '55. 明智审慎地返回 Optional'
                },


                {
                    link: 'docs/script/java/effectivejava/56',
                    text: '56. 为所有已公开的 API 元素编写文档注释'
                },


                {
                    link: 'docs/script/java/effectivejava/57',
                    text: '57. 最小化局部变量的作用域'
                },


                {
                    link: 'docs/script/java/effectivejava/58',
                    text: '58. for-each 循环优于传统 for 循环'
                },


                {
                    link: 'docs/script/java/effectivejava/59',
                    text: '59. 了解并使用库'
                },


                {
                    link: 'docs/script/java/effectivejava/60',
                    text: '60. 若需要精确答案就应避免使用 float 和 double 类型'
                },


                {
                    link: 'docs/script/java/effectivejava/61',
                    text: '61. 基本数据类型优于包装类'
                },


                {
                    link: 'docs/script/java/effectivejava/62',
                    text: '62. 当使用其他类型更合适时应避免使用字符串'
                },


                {
                    link: 'docs/script/java/effectivejava/63',
                    text: '63. 当心字符串连接引起的性能问题'
                },


                {
                    link: 'docs/script/java/effectivejava/64',
                    text: '64. 通过接口引用对象'
                },


                {
                    link: 'docs/script/java/effectivejava/65',
                    text: '65. 接口优于反射'
                },


                {
                    link: 'docs/script/java/effectivejava/66',
                    text: '66. 明智审慎地本地方法'
                },


                {
                    link: 'docs/script/java/effectivejava/67',
                    text: '67. 明智审慎地进行优化'
                },


                {
                    link: 'docs/script/java/effectivejava/68',
                    text: '68. 遵守被广泛认可的命名约定'
                },


                {
                    link: 'docs/script/java/effectivejava/69',
                    text: '69. 只针对异常的情况下才使用异常'
                },


                {
                    link: 'docs/script/java/effectivejava/70',
                    text: '70. 对可恢复的情况使用受检异常，对编程错误使用运行时异常'
                },


                {
                    link: 'docs/script/java/effectivejava/71',
                    text: '71. 避免不必要的使用受检异常'
                },


                {
                    link: 'docs/script/java/effectivejava/72',
                    text: '72. 优先使用标准的异常'
                },


                {
                    link: 'docs/script/java/effectivejava/73',
                    text: '73. 抛出与抽象对应的异常'
                },


                {
                    link: 'docs/script/java/effectivejava/74',
                    text: '74. 每个方法抛出的异常都需要创建文档'
                },


                {
                    link: 'docs/script/java/effectivejava/75',
                    text: '75. 在细节消息中包含失败一捕获信息'
                },


                {
                    link: 'docs/script/java/effectivejava/76',
                    text: '76. 保持失败原子性'
                },


                {
                    link: 'docs/script/java/effectivejava/77',
                    text: '77. 不要忽略异常'
                },


                {
                    link: 'docs/script/java/effectivejava/78',
                    text: '78. 同步访问共享的可变数据'
                },


                {
                    link: 'docs/script/java/effectivejava/79',
                    text: '79. 避免过度同步'
                },


                {
                    link: 'docs/script/java/effectivejava/80',
                    text: '80. executor 、task 和 stream 优先于线程'
                },


                {
                    link: 'docs/script/java/effectivejava/81',
                    text: '81. 并发工具优于 wait 和 notify'
                },


                {
                    link: 'docs/script/java/effectivejava/82',
                    text: '82. 文档应包含线程安全属性'
                },


                {
                    link: 'docs/script/java/effectivejava/83',
                    text: '83. 明智审慎的使用延迟初始化'
                },


                {
                    link: 'docs/script/java/effectivejava/84',
                    text: '84. 不要依赖线程调度器'
                },


                {
                    link: 'docs/script/java/effectivejava/85',
                    text: '85. 优先选择 Java 序列化的替代方案'
                },


                {
                    link: 'docs/script/java/effectivejava/86',
                    text: '86. 非常谨慎地实现 Serializable'
                },


                {
                    link: 'docs/script/java/effectivejava/87',
                    text: '87. 考虑使用自定义的序列化形式'
                },


                {
                    link: 'docs/script/java/effectivejava/88',
                    text: '88. 保护性的编写 readObject 方法'
                },


                {
                    link: 'docs/script/java/effectivejava/89',
                    text: '89. 对于实例控制，枚举类型优于 readResolve'
                },


                {
                    link: 'docs/script/java/effectivejava/90',
                    text: '90. 考虑用序列化代理代替序列化实例'
                },
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