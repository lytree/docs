<script lang="tsx" setup>
import { ElTable, ElTableColumn } from 'element-plus'
interface Tables {
    //public int type {get;set;}
    name: string;
    time: number;
    questionCount: number;
    correctCount: number;
    children?: Tables[];
    hasChildren?: boolean

}
const tableData: Tables[] = [
    {
        name: "政治理论",
        time: 466,
        questionCount: 20,
        correctCount: 9,
        children: [
            {
                name: "马克思主义",
                time: 76,
                questionCount: 3,
                correctCount: 3,
                children: [
                    {
                        name: "哲学",
                        time: 45,
                        questionCount: 2,
                        correctCount: 2,
                        children: [
                            {
                                name: "辩证法",
                                time: 45,
                                questionCount: 2,
                                correctCount: 2,


                            }
                        ],

                    },
                    {
                        name: "政治经济学",
                        time: 31,
                        questionCount: 1,
                        correctCount: 1,
                        children: [
                            {
                                name: "政治经济学-其他",
                                time: 31,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    }
                ],

            },
            {
                name: "理论与政策",
                time: 390,
                questionCount: 17,
                correctCount: 6,
                children: [
                    {
                        name: "经济建设",
                        time: 224,
                        questionCount: 9,
                        correctCount: 2,


                    },
                    {
                        name: "社会建设",
                        time: 29,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "生态文明建设",
                        time: 21,
                        questionCount: 2,
                        correctCount: 1,


                    },
                    {
                        name: "国防和军队建设",
                        time: 22,
                        questionCount: 1,
                        correctCount: 0,
                    },
                    {
                        name: "党的建设",
                        time: 86,
                        questionCount: 3,
                        correctCount: 2,


                    },
                    {
                        name: "理论与政策-其他",
                        time: 8,
                        questionCount: 1,
                        correctCount: 1,


                    }
                ],

            },
            {
                name: "时政热点",
                time: 291,
                questionCount: 12,
                correctCount: 4,
                children: [
                    {
                        name: "重要文件",
                        time: 132,
                        questionCount: 5,
                        correctCount: 2,


                    },
                    {
                        name: "重大会议及讲话",
                        time: 159,
                        questionCount: 7,
                        correctCount: 2,
                    }
                ],

            }
        ],

    },
    {
        name: "常识判断",
        time: 377,
        questionCount: 15,
        correctCount: 4,
        children: [
            {
                name: "经济常识",
                time: 34,
                questionCount: 1,
                correctCount: 0,
                children: [
                    {
                        name: "市场",
                        time: 34,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "法律常识",
                time: 152,
                questionCount: 7,
                correctCount: 4,
                children: [
                    {
                        name: "行政法",
                        time: 27,
                        questionCount: 2,
                        correctCount: 2,


                    },
                    {
                        name: "民法",
                        time: 61,
                        questionCount: 2,
                        correctCount: 1,


                    },
                    {
                        name: "刑法",
                        time: 29,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "其他法律法规",
                        time: 17,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "经济法",
                        time: 18,
                        questionCount: 1,
                        correctCount: 1,


                    }
                ],

            },
            {
                name: "科技常识",
                time: 109,
                questionCount: 4,
                correctCount: 0,
                children: [
                    {
                        name: "物理常识",
                        time: 17,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "化学常识",
                        time: 42,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "生物常识",
                        time: 33,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "生活常识",
                        time: 17,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "人文常识",
                time: 61,
                questionCount: 2,
                correctCount: 0,
                children: [
                    {
                        name: "中国历史",
                        time: 45,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "文化常识",
                        time: 16,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "地理国情",
                time: 21,
                questionCount: 1,
                correctCount: 0,
                children: [
                    {
                        name: "国情社情",
                        time: 21,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            }
        ],

    },
    {
        name: "言语理解与表达",
        time: 1335,
        questionCount: 30,
        correctCount: 20,
        children: [
            {
                name: "逻辑填空",
                time: 482,
                questionCount: 15,
                correctCount: 10,
                children: [
                    {
                        name: "实词填空",
                        time: 95,
                        questionCount: 3,
                        correctCount: 2,


                    },
                    {
                        name: "成语填空",
                        time: 248,
                        questionCount: 8,
                        correctCount: 5,


                    },
                    {
                        name: "混搭填空",
                        time: 139,
                        questionCount: 4,
                        correctCount: 3,


                    },
                    {
                        name: "词的辨析",
                        time: 304,
                        questionCount: 7,
                        correctCount: 4,
                        children: [
                            {
                                name: "词的辨析-搭配对象",
                                time: 242,
                                questionCount: 6,
                                correctCount: 3,


                            },
                            {
                                name: "词的辨析-程度轻重",
                                time: 62,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "语境分析",
                        time: 482,
                        questionCount: 15,
                        correctCount: 10,
                        children: [
                            {
                                name: "关联关系-并列关系",
                                time: 221,
                                questionCount: 6,
                                correctCount: 4,


                            },
                            {
                                name: "对应关系-形象表达",
                                time: 8,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "对应关系-前后呼应",
                                time: 365,
                                questionCount: 11,
                                correctCount: 7,


                            }
                        ],

                    }
                ],

            },
            {
                name: "片段阅读",
                time: 547,
                questionCount: 10,
                correctCount: 7,
                children: [
                    {
                        name: "中心理解题",
                        time: 271,
                        questionCount: 6,
                        correctCount: 3,
                        children: [
                            {
                                name: "中心理解题-关联词-对策",
                                time: 133,
                                questionCount: 3,
                                correctCount: 2,


                            },
                            {
                                name: "中心理解题-主题词",
                                time: 199,
                                questionCount: 4,
                                correctCount: 2,


                            },
                            {
                                name: "分述句特征-引入铺垫",
                                time: 38,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "细节判断题",
                        time: 241,
                        questionCount: 3,
                        correctCount: 3,


                    },
                    {
                        name: "标题填入题",
                        time: 35,
                        questionCount: 1,
                        correctCount: 1,


                    }
                ],

            },
            {
                name: "语句表达",
                time: 306,
                questionCount: 5,
                correctCount: 3,
                children: [
                    {
                        name: "语句排序题",
                        time: 153,
                        questionCount: 2,
                        correctCount: 1,
                        children: [
                            {
                                name: "确定首句-非首句特征",
                                time: 100,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "确定捆绑",
                                time: 53,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "确定顺序",
                                time: 153,
                                questionCount: 2,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "语句填空题",
                        time: 85,
                        questionCount: 2,
                        correctCount: 1,
                        children: [
                            {
                                name: "横线在开头",
                                time: 49,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "横线在中间",
                                time: 36,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "接语选择题",
                        time: 68,
                        questionCount: 1,
                        correctCount: 1,


                    }
                ],

            }
        ],

    },
    {
        name: "数量关系",
        time: 694,
        questionCount: 10,
        correctCount: 2,
        children: [
            {
                name: "数学运算",
                time: 694,
                questionCount: 10,
                correctCount: 2,
                children: [
                    {
                        name: "多位数问题",
                        time: 92,
                        questionCount: 1,
                        correctCount: 1,


                    },
                    {
                        name: "工程问题",
                        time: 126,
                        questionCount: 1,
                        correctCount: 0,
                        children: [
                            {
                                name: "给完工时间型",
                                time: 126,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "最值问题",
                        time: 214,
                        questionCount: 3,
                        correctCount: 1,
                        children: [
                            {
                                name: "非典型最值问题",
                                time: 214,
                                questionCount: 3,
                                correctCount: 1,


                            },
                            {
                                name: "多集合反向构造",
                                time: 15,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "和差倍比问题",
                        time: 112,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "行程问题",
                        time: 106,
                        questionCount: 2,
                        correctCount: 0,
                        children: [
                            {
                                name: "普通行程",
                                time: 97,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "相遇追及",
                                time: 9,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "几何问题",
                        time: 124,
                        questionCount: 2,
                        correctCount: 0,
                        children: [
                            {
                                name: "平面几何",
                                time: 124,
                                questionCount: 2,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "容斥原理问题",
                        time: 19,
                        questionCount: 2,
                        correctCount: 1,
                        children: [
                            {
                                name: "两集合",
                                time: 4,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "三集合",
                                time: 15,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "经济利润问题",
                        time: 17,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "不定方程问题",
                        time: 195,
                        questionCount: 1,
                        correctCount: 0,
                        children: [
                            {
                                name: "不定方程组",
                                time: 195,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    }
                ],

            }
        ],

    },
    {
        name: "判断推理",
        time: 1751,
        questionCount: 35,
        correctCount: 19,
        children: [
            {
                name: "图形推理",
                time: 584,
                questionCount: 10,
                correctCount: 4,
                children: [
                    {
                        name: "空间类",
                        time: 169,
                        questionCount: 3,
                        correctCount: 1,
                        children: [
                            {
                                name: "空间类-立体拼合",
                                time: 74,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "空间类-截面图",
                                time: 76,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "空间类-空间重构-六面体",
                                time: 19,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "特殊规律",
                        time: 20,
                        questionCount: 1,
                        correctCount: 1,
                        children: [
                            {
                                name: "特殊规律-功能元素",
                                time: 20,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "数量规律",
                        time: 241,
                        questionCount: 4,
                        correctCount: 1,
                        children: [
                            {
                                name: "数量规律-点",
                                time: 84,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "数量规律-线",
                                time: 39,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "数量规律-面",
                                time: 35,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "数量规律-素",
                                time: 83,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "位置规律",
                        time: 94,
                        questionCount: 1,
                        correctCount: 0,
                        children: [
                            {
                                name: "位置规律-平移",
                                time: 94,
                                questionCount: 1,
                                correctCount: 0,


                            }
                        ],

                    },
                    {
                        name: "样式规律",
                        time: 60,
                        questionCount: 1,
                        correctCount: 1,
                        children: [
                            {
                                name: "样式规律-黑白运算",
                                time: 60,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    }
                ],

            },
            {
                name: "定义判断",
                time: 476,
                questionCount: 10,
                correctCount: 7,
                children: [
                    {
                        name: "单定义",
                        time: 275,
                        questionCount: 7,
                        correctCount: 5,
                        children: [
                            {
                                name: "大前提",
                                time: 44,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "方式目的",
                                time: 56,
                                questionCount: 2,
                                correctCount: 1,


                            },
                            {
                                name: "原因结果",
                                time: 45,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "单定义-其他句式",
                                time: 130,
                                questionCount: 3,
                                correctCount: 2,


                            }
                        ],

                    },
                    {
                        name: "多定义",
                        time: 201,
                        questionCount: 3,
                        correctCount: 2,
                        children: [
                            {
                                name: "常规问法",
                                time: 148,
                                questionCount: 2,
                                correctCount: 1,


                            },
                            {
                                name: "特殊问法",
                                time: 53,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    }
                ],

            },
            {
                name: "类比推理",
                time: 158,
                questionCount: 5,
                correctCount: 4,
                children: [
                    {
                        name: "语法关系",
                        time: 25,
                        questionCount: 1,
                        correctCount: 1,


                    },
                    {
                        name: "逻辑关系",
                        time: 158,
                        questionCount: 5,
                        correctCount: 4,
                        children: [
                            {
                                name: "逻辑关系-并列关系",
                                time: 65,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "逻辑关系-交叉关系",
                                time: 26,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "逻辑关系-包容关系",
                                time: 65,
                                questionCount: 1,
                                correctCount: 1,


                            },
                            {
                                name: "逻辑关系-对应关系",
                                time: 67,
                                questionCount: 3,
                                correctCount: 3,


                            }
                        ],

                    },
                    {
                        name: "拆分思维",
                        time: 19,
                        questionCount: 1,
                        correctCount: 1,


                    }
                ],

            },
            {
                name: "逻辑判断",
                time: 533,
                questionCount: 10,
                correctCount: 4,
                children: [
                    {
                        name: "翻译推理",
                        time: 74,
                        questionCount: 1,
                        correctCount: 1,
                        children: [
                            {
                                name: "集合推理",
                                time: 74,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "加强题型",
                        time: 109,
                        questionCount: 2,
                        correctCount: 1,
                        children: [
                            {
                                name: "补充论据",
                                time: 53,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "加强选非题",
                                time: 56,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "削弱题型",
                        time: 75,
                        questionCount: 2,
                        correctCount: 1,
                        children: [
                            {
                                name: "削弱论点",
                                time: 40,
                                questionCount: 1,
                                correctCount: 0,


                            },
                            {
                                name: "拆桥",
                                time: 35,
                                questionCount: 1,
                                correctCount: 1,


                            }
                        ],

                    },
                    {
                        name: "组合排列-材料",
                        time: 275,
                        questionCount: 5,
                        correctCount: 1,


                    }
                ],

            }
        ],

    },
    {
        name: "资料分析",
        time: 2257,
        questionCount: 20,
        correctCount: 7,
        children: [
            {
                name: "文字资料",
                time: 595,
                questionCount: 5,
                correctCount: 1,


            },
            {
                name: "综合资料",
                time: 1662,
                questionCount: 15,
                correctCount: 6,


            },
            {
                name: "基期与现期",
                time: 195,
                questionCount: 3,
                correctCount: 2,
                children: [
                    {
                        name: "基期计算",
                        time: 45,
                        questionCount: 1,
                        correctCount: 1,


                    },
                    {
                        name: "基期和差",
                        time: 80,
                        questionCount: 1,
                        correctCount: 1,


                    },
                    {
                        name: "现期计算",
                        time: 70,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "增长率",
                time: 159,
                questionCount: 2,
                correctCount: 0,
                children: [
                    {
                        name: "一般增长率",
                        time: 159,
                        questionCount: 2,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "增长量",
                time: 310,
                questionCount: 3,
                correctCount: 1,
                children: [
                    {
                        name: "增长量计算",
                        time: 142,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "增长量比较",
                        time: 79,
                        questionCount: 1,
                        correctCount: 1,


                    },
                    {
                        name: "年均增长量",
                        time: 89,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "比重问题",
                time: 321,
                questionCount: 2,
                correctCount: 1,
                children: [
                    {
                        name: "现期比重",
                        time: 151,
                        questionCount: 1,
                        correctCount: 1,


                    },
                    {
                        name: "两期比重",
                        time: 170,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "平均数问题",
                time: 531,
                questionCount: 5,
                correctCount: 2,
                children: [
                    {
                        name: "基期平均数",
                        time: 33,
                        questionCount: 1,
                        correctCount: 0,


                    },
                    {
                        name: "平均数的增长率",
                        time: 356,
                        questionCount: 3,
                        correctCount: 2,


                    },
                    {
                        name: "平均数的增长量",
                        time: 142,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "倍数与比值相关",
                time: 111,
                questionCount: 1,
                correctCount: 0,
                children: [
                    {
                        name: "现期倍数",
                        time: 111,
                        questionCount: 1,
                        correctCount: 0,


                    }
                ],

            },
            {
                name: "综合分析",
                time: 630,
                questionCount: 4,
                correctCount: 1,


            }
        ],

    }
]
</script>
<template>
    <el-table :data="tableData" style="width: 100%; margin-bottom: 20px" row-key="name" border default-expand-all>
        <el-table-column prop="name" label="模块" />
        <el-table-column prop="questionCount" label="总题数" />
        <el-table-column prop="correctCount" label="正确" />
        <el-table-column prop="time" label="用时" />
    </el-table>

</template>