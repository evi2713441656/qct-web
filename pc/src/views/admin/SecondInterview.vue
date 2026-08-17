<template>
  <div>
    <div class="card">
      <h2 class="section-title">二面管理</h2>

      <div class="toolbar">
        <el-radio-group v-model="statusFilter" @change="load()">
          <el-radio-button value="waiting_second">等待二面</el-radio-button>
          <el-radio-button value="done">二面已结束</el-radio-button>
          <el-radio-button value="all">全部</el-radio-button>
        </el-radio-group>
        <el-button type="primary" @click="load()">刷新</el-button>
        <el-button type="success" plain @click="exportCsv">导出 CSV</el-button>
        <el-button type="warning" plain @click="notifyVisible = true">发送通知</el-button>
      </div>

      <el-table :data="list" border stripe size="small" @selection-change="(rows) => (selected = rows)">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="student_id" label="学号" width="110" />
        <el-table-column label="意向部门" width="140">
          <template #default="{ row }">{{ listText(row.departments) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span :class="'status-' + row.status">{{ getStatusText(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="面试状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="iv(row).status === 'completed'" size="small" type="info">已面试</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="签到号" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="iv(row).checkInNumber != null" size="small" type="success">
              {{ iv(row).checkInNumber }} 号
            </el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'waiting_second'">
              <el-button v-if="iv(row).status !== 'completed'" link type="primary" size="small" @click="markInterviewed(row)">
                标记已面试
              </el-button>
              <el-button v-else link type="warning" size="small" @click="undoInterviewed(row)">撤销面试标记</el-button>
              <el-button link type="success" size="small" @click="passSecond(row)">通过</el-button>
              <el-button link type="danger" size="small" @click="failSecond(row)">不通过</el-button>
            </template>
            <template v-if="['second_failed', 'department_selection', 'accepted', 'rejected'].includes(row.status)">
              <el-button link type="warning" size="small" @click="undoResult(row)">撤销结果</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="batch-bar" v-if="selected.length">
        已选 {{ selected.length }} 条：
        <el-button type="success" size="small" @click="batchPass">批量通过</el-button>
        <el-button type="danger" size="small" @click="batchFail">批量不通过</el-button>
      </div>
    </div>

    <!-- 二面通过部门选择 -->
    <el-dialog v-model="passVisible" :title="batchMode ? '批量二面通过' : '二面通过'" width="440px">
      <p class="muted" style="margin-top: 0;">请选择通过的部门（最多 3 个）</p>
      <el-checkbox-group v-model="passDepartments" :max="3">
        <el-checkbox v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="passVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPass">确认</el-button>
      </template>
    </el-dialog>

    <NotificationDialog v-model="notifyVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listApplications, updateStatus, updateInterviewStatus } from '../../api/application.js'
import { getSystemConfigAdmin, exportData } from '../../api/admin.js'
import { getStatusText } from '../../utils/status.js'
import { listText, formatTime } from '../../utils/format.js'
import NotificationDialog from '../../components/NotificationDialog.vue'

const list = ref([])
const statusFilter = ref('waiting_second')
const selected = ref([])
const departmentOptions = ref(['策划部', '执行部', '宣传部'])
const passVisible = ref(false)
const passDepartments = ref([])
const batchMode = ref(false)
const passTarget = ref(null)
const notifyVisible = ref(false)

const iv = (row) => row.secondInterview || {}

const SECOND_STATES = ['waiting_second', 'second_failed', 'department_selection', 'accepted', 'rejected']

const load = async () => {
  try {
    const result = await listApplications({ page: 1, pageSize: 200 })
    let rows = result.data.list || []
    rows = rows.filter((r) => SECOND_STATES.includes(r.status))
    if (statusFilter.value === 'waiting_second') {
      rows = rows.filter((r) => r.status === 'waiting_second')
    } else if (statusFilter.value === 'done') {
      rows = rows.filter((r) => r.status !== 'waiting_second')
    }
    list.value = rows
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

const undoInterviewed = async (row) => {
  try {
    await ElMessageBox.confirm(`撤销「${row.name}」的已面试标记？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await updateInterviewStatus(row._id, 'second', 'pending')
    ElMessage.success('已撤销面试标记')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const passSecond = (row) => {
  batchMode.value = false
  passTarget.value = row
  passDepartments.value = []
  passVisible.value = true
}

const batchPass = () => {
  batchMode.value = true
  passDepartments.value = []
  passVisible.value = true
}

const confirmPass = async () => {
  if (!passDepartments.value.length) {
    ElMessage.warning('请选择通过的部门')
    return
  }
  try {
    if (batchMode.value) {
      const targets = selected.value.filter((r) => r.status === 'waiting_second')
      await Promise.all(targets.map((r) => updateStatus(r._id, 'department_selection', { departments: passDepartments.value })))
      ElMessage.success(`已通过 ${targets.length} 人`)
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
    const targets = selected.value.filter((r) => r.status === 'waiting_second')
    await Promise.all(targets.map((r) => updateStatus(r._id, 'second_failed')))
    ElMessage.success('批量操作完成')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const undoResult = async (row) => {
  const texts = { second_failed: '二面不通过', department_selection: '部门选择', accepted: '已录取', rejected: '拒绝加入' }
  try {
    await ElMessageBox.confirm(
      `确定撤销「${row.name}」的「${texts[row.status]}」状态吗？撤销后将回到等待二面状态。`,
      '提示', { type: 'warning' })
  } catch { return }
  try {
    await updateStatus(row._id, 'waiting_second')
    ElMessage.success('已撤销')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const exportCsv = async () => {
  try {
    const result = await exportData({ status: SECOND_STATES, departments: [] })
    const rows = result.data.data || []
    const header = '姓名,学号,性别,专业班级,宿舍号,手机号,意向部门,申请时间,状态,自我介绍'
    const lines = rows.map((r) => [
      r.name || '', r.student_id || '', r.gender || '', r.major || '', r.dormitory || '',
      r.phone || '', listText(r.departments), formatTime(r.applyTime), getStatusText(r.status),
      (r.introduction || '').replace(/,/g, '，').replace(/\n/g, ' ')
    ].map((c) => `"${c}"`).join(','))
    const csv = '\uFEFF' + [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `二面数据_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
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