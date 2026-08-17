<template>
  <div>
    <div class="card">
      <h2 class="section-title">录取名单</h2>

      <div class="toolbar">
        <el-radio-group v-model="typeFilter" @change="load()">
          <el-radio-button value="pending">待确认部门（{{ pendingCount }}）</el-radio-button>
          <el-radio-button value="accepted">已录取</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
        <el-select v-model="deptFilter" placeholder="部门" clearable style="width: 140px;" @change="load()">
          <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
        </el-select>
        <el-button @click="load()">刷新</el-button>
      </div>

      <el-table :data="list" border stripe size="small">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="student_id" label="学号" width="120" />
        <el-table-column label="录取部门" width="130">
          <template #default="{ row }">
            <el-tag v-if="row.finalDepartment" type="success">{{ row.finalDepartment }}</el-tag>
            <span v-else-if="secondPassed(row).length" class="muted">{{ listText(secondPassed(row)) }}</span>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span :class="'status-' + row.status">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'department_selection'" link type="primary" size="small"
              @click="remind(row)">提醒确认</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getAdmissions, remindDepartmentSelection, getSystemConfigAdmin } from '../../api/admin.js'
import { getStatusText } from '../../utils/status.js'
import { listText } from '../../utils/format.js'

const list = ref([])
const typeFilter = ref('pending')
const deptFilter = ref('')
const departmentOptions = ref(['策划部', '执行部', '宣传部'])

const pendingCount = computed(() => list.value.filter((x) => x.status === 'department_selection').length)

const secondPassed = (row) => {
  const list2 = row.secondInterview?.passedDepartments || []
  return Array.isArray(list2) ? list2 : String(list2).split(',').filter(Boolean)
}

const load = async () => {
  try {
    const result = await getAdmissions()
    let rows = result.data || []
    if (typeFilter.value === 'pending') rows = rows.filter((x) => x.status === 'department_selection')
    else if (typeFilter.value === 'accepted') rows = rows.filter((x) => x.status === 'accepted')
    if (deptFilter.value) {
      rows = rows.filter((x) =>
        x.finalDepartment === deptFilter.value || secondPassed(x).includes(deptFilter.value))
    }
    list.value = rows
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const remind = async (row) => {
  try {
    await remindDepartmentSelection(row.user_id, row.name)
    ElMessage.success('已发送提醒')
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(async () => {
  try {
    const result = await getSystemConfigAdmin()
    const details = result.data?.departmentDetails
    if (details) departmentOptions.value = Object.keys(details)
  } catch { /* 使用默认部门 */ }
  load()
})
</script>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.muted { color: var(--text-secondary); }
</style>
