<script lang="tsx" setup>
import { ElTable, ElTableColumn } from 'element-plus'
interface Tables {
    name: string;
    time: number;
    questionCount: number;
    correctCount: number;
    children?: Tables[];
    hasChildren?: boolean

}
interface Props {
    data: Tables[]
}

const props = withDefaults(defineProps<Props>(), {
    data: () => []
})

</script>
<template>
    <el-table :data="props.data" max-height="400" style="width: 100%; margin-bottom: 40px" row-key="name" border>
        <el-table-column fixed prop="name" label="模块" min-width="150" />
        <el-table-column prop="questionCount" label="总题数" min-width="40" />
        <el-table-column prop="correctCount" label="正确" min-width="40" />
        <el-table-column prop="time" label="用时" min-width="40">
            <template #default="scope">
                <template v-if="scope.row.time > 60">{{ (scope.row.time / 60).toFixed(1) }} 分</template>
                <template v-else>{{ scope.row.time }} 秒</template>
            </template>
        </el-table-column>
        <el-table-column label="正确率" min-width="40">
            <template #default="scope">
                {{ (scope.row.correctCount * 100 / scope.row.questionCount).toFixed(1) }} %
            </template>
        </el-table-column>
    </el-table>

</template>