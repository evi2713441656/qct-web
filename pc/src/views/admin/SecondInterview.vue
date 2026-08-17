<template>
  <div>
    <div class="card">
      <h2 class="section-title">二面管理</h2>

      <div class="toolbar">
        <el-select v-model="statusFilter" style="width: 150px;" @change="load()">
          <el-option label="等待二面" value="waiting_second" />
          <el-option label="全部状态" value="all" />
        </el-select>
        <el-button type="primary" @click="load()">刷新</el-button>
      </div>

      <el-table :data="list" border stripe size="small" @selection-change="(rows) => (selected = rows)">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="student_id" label="学号" width="110" />
        <el-table-column label="意向部门" width="140">
          <template #default="{ row }">{{ listText(row.departments) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="'status-' + row.status">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="签到号" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.secondInterview && row.secondInterview.checkInNumber != null" size="small" type="success">
              {{ row.secondInterview.checkInNumber }} 号
            </el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'waiting_second'">
              <el-button link type="success" size="small" @click="passSecond(row)">二面通过</el-button>
              <el-button link type="danger" size="small" @click="failSecond(row)">二面不通过</el-button>
            </template>
            <template v-if="row.secondInterview && row.secondInterview.status !== 'completed'">
              <el-button link type="primary" size="small" @click="markInterviewed(row)">标记已面试</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="batch-bar" v-if="selected.length">
        已选 {{ selected.length }} 条：
        <el-button type="success" size="small" @click="batchPass">批量二面通过</el-button>
        <el-button type="danger" size="small" @click="batchFail">批量二面不通过</el-button>
      </div>
    </div>

    <!-- 二面通过部门选择 -->
    <el-dialog v-model="passVisible" :title="batch ? '批量二面通过' : '二面通过'" width="440px">
      <p class="muted" style="margin-top: 0;">请选择通过的部门（最多 3 个）</p>
      <el-checkbox-group v-model="passDepartments" :max="3">
        <el-checkbox v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="passVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPass">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listApplications, updateStatus, updateInterviewStatus } from '../../api/application.js'
import { getSystemConfigAdmin } from '../../api/admin.js'
import { getStatusText } from '../../utils/status.js'
import { listText } from '../../utils/format.js'

const list = ref([])
const statusFilter = ref('waiting_second')
const selected = ref([])
const departmentOptions = ref(['策划部', '执行部', '宣传部'])
const passVisible = ref(false)
const passDepartments = ref([])
const batch = ref(false)
const passTarget = ref(null)

const load = async () => {
  try {
    const params = { page: 1, pageSize: 200 }
    if (statusFilter.value !== 'all') params.status = statusFilter.value
    const result = await listApplications(params)
    list.value = result.data.list || []
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const markInterviewed = async (row) => {
  try {
    await updateInterviewStatus(row._id, 'second', 'completed')
    ElMessage.success('已标记已面试')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const passSecond = (row) => {
  batch.value = false
  passTarget.value = row
  passDepartments.value = []
  passVisible.value = true
}

const batchPass = () => {
  batch.value = true
  passDepartments.value = []
  passVisible.value = true
}

const confirmPass = async () => {
  if (!passDepartments.value.length) {
    ElMessage.warning('请选择通过的部门')
    return
  }
  try {
    if (batch.value) {
      await Promise.all(selected.value
        .filter((r) => r.status === 'waiting_second')
        .map((r) => updateStatus(r._id, 'department_selection', { departments: passDepartments.value })))
      ElMessage.success(`已通过 ${selected.value.length} 人`)
    } else {
      await updateStatus(passTarget.value._id, 'department_selection', { departments: passDepartments.value })
      ElMessage.success('已标记二面通过')
    }
    passVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const failSecond = async (row) => {
  try {
    await ElMessageBox.confirm(`确定将「${row.name}」的二面标记为不通过吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await updateStatus(row._id, 'second_failed')
    ElMessage.success('已标记二面不通过')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const batchFail = async () => {
  try {
    await ElMessageBox.confirm(`确定将选中的 ${selected.value.length} 人二面标记为不通过吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await Promise.all(selected.value
      .filter((r) => r.status === 'waiting_second')
      .map((r) => updateStatus(r._id, 'second_failed')))
    ElMessage.success('批量操作完成')
    load()
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
.toolbar { display: flex; gap: 10px; margin-bottom: 14px; }
.muted { color: var(--text-secondary); }
.batch-bar {
  background: var(--primary-light);
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
