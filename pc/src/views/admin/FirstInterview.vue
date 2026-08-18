<template>
  <div>
    <div class="card">
      <div class="page-heading">
        <div>
          <h2 class="section-title">一面管理</h2>
          <p class="page-tip">统一处理一面签到、面试标记和一面结果；报名管理仅用于查看全部报名状态。</p>
        </div>
      </div>

      <div class="toolbar">
        <el-select v-model="statusFilter" style="width: 150px;" @change="load">
          <el-option v-for="item in FIRST_STATUS_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-model="keyword" clearable placeholder="搜索姓名 / 学号" style="width: 200px;" />
        <el-button type="primary" @click="load">刷新</el-button>
        <el-button type="success" plain @click="exportCsv">导出 CSV</el-button>
        <el-button type="warning" plain @click="notifyVisible = true">发送通知</el-button>
      </div>

      <el-table :data="visibleList" border stripe size="small">
        <el-table-column prop="name" label="姓名" width="90" fixed />
        <el-table-column prop="student_id" label="学号" width="110" />
        <el-table-column label="意向部门" width="140">
          <template #default="{ row }">{{ listText(row.departments) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <span :class="'status-' + getDisplayStatus(row, systemConfig)">{{ getDisplayStatusText(row, systemConfig) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="一面签到号" width="110" align="center">
          <template #default="{ row }">
            <el-tag v-if="iv(row).checkInNumber != null" type="success" size="small">{{ iv(row).checkInNumber }} 号</el-tag>
            <span v-else class="muted">未签到</span>
          </template>
        </el-table-column>
        <el-table-column label="面试状态" width="95" align="center">
          <template #default="{ row }">
            <el-tag v-if="iv(row).status === 'completed'" type="info" size="small">已面试</el-tag>
            <span v-else class="muted">待面试</span>
          </template>
        </el-table-column>
        <el-table-column prop="major" label="专业班级" width="130" />
        <el-table-column prop="phone" label="联系方式" width="120" />
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <template v-if="canInterview(row)">
              <el-button v-if="iv(row).status !== 'completed'" link type="primary" size="small" @click="markInterviewed(row)">标记已面试</el-button>
              <el-button v-else link type="warning" size="small" @click="undoInterviewed(row)">撤销面试标记</el-button>
              <el-button link type="success" size="small" @click="passFirst(row)">一面通过</el-button>
              <el-button link type="danger" size="small" @click="failFirst(row)">一面不通过</el-button>
            </template>
            <el-button v-if="canUndo(row)" link type="warning" size="small" @click="undoResult(row)">撤销结果</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="detailVisible" title="申请详情" width="620px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ detail.student_id }}</el-descriptions-item>
          <el-descriptions-item label="专业班级">{{ detail.major || '-' }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ detail.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="意向部门">{{ listText(detail.departments) }}</el-descriptions-item>
          <el-descriptions-item label="一面签到号">{{ iv(detail).checkInNumber ?? '-' }}</el-descriptions-item>
          <el-descriptions-item label="报名时间">{{ formatTime(detail.applyTime) }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">{{ getDisplayStatusText(detail, systemConfig) }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-block">
          <div class="detail-label">自我介绍</div>
          <div class="detail-text">{{ detail.introduction || '-' }}</div>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="passVisible" title="一面通过" width="440px">
      <p class="muted" style="margin-top: 0;">请选择通过的部门（最多 2 个）</p>
      <el-checkbox-group v-model="passDepartments" :max="2">
        <el-checkbox v-for="department in departmentOptions" :key="department" :value="department">{{ department }}</el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="passVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPass">确认</el-button>
      </template>
    </el-dialog>

    <NotificationDialog v-model="notifyVisible" default-target="waiting_first" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listApplications, updateInterviewStatus, updateStatus } from '../../api/application.js'
import { exportData, getSystemConfigAdmin } from '../../api/admin.js'
import NotificationDialog from '../../components/NotificationDialog.vue'
import { formatTime, listText } from '../../utils/format.js'
import { getDisplayStatus, getDisplayStatusText, getStatusText, deriveStatus } from '../../utils/status.js'

const FIRST_STATUS_OPTIONS = [
  { value: 'all', label: '全部一面状态' },
  { value: 'registered', label: '报名成功' },
  { value: 'waiting_first', label: '等待一面' },
  { value: 'interviewed', label: '已面试' },
  { value: 'first_passed', label: '一面通过' },
  { value: 'first_failed', label: '一面未通过' },
  { value: 'first_reject', label: '一面拒绝' },
  { value: 'waiting_second', label: '等待二面' }
]
const FIRST_STATES = ['registered', 'waiting_first', 'first_passed', 'first_failed', 'first_reject', 'waiting_second']

const list = ref([])
const statusFilter = ref('all')
const keyword = ref('')
const systemConfig = ref({})
const departmentOptions = ref(['策划部', '执行部', '宣传部'])
const detailVisible = ref(false)
const detail = ref(null)
const passVisible = ref(false)
const passTarget = ref(null)
const passDepartments = ref([])
const notifyVisible = ref(false)

const iv = (row) => row?.firstInterview || {}
const visibleList = computed(() => list.value.filter((row) => {
  const status = deriveStatus(row)
  const matchesStatus = statusFilter.value === 'all' || status === statusFilter.value || row.status === statusFilter.value
  const text = `${row.name || ''} ${row.student_id || ''}`
  return matchesStatus && (!keyword.value.trim() || text.includes(keyword.value.trim()))
}))

const load = async () => {
  try {
    const result = await listApplications({ page: 1, pageSize: 500 })
    list.value = (result.data.list || []).filter((row) => FIRST_STATES.includes(row.status))
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const canInterview = (row) => row.status === 'waiting_first'
const canUndo = (row) => ['first_passed', 'first_failed', 'first_reject'].includes(row.status)

const openDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

const markInterviewed = async (row) => {
  try {
    await updateInterviewStatus(row._id, 'first', 'completed')
    ElMessage.success('已标记一面完成')
    await load()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const undoInterviewed = async (row) => {
  try {
    await updateInterviewStatus(row._id, 'first', 'pending')
    ElMessage.success('已撤销面试标记')
    await load()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const passFirst = (row) => {
  passTarget.value = row
  passDepartments.value = []
  passVisible.value = true
}

const confirmPass = async () => {
  if (!passDepartments.value.length) {
    ElMessage.warning('请至少选择一个通过部门')
    return
  }
  try {
    await updateStatus(passTarget.value._id, 'first_passed', { departments: passDepartments.value })
    ElMessage.success('已标记一面通过')
    passVisible.value = false
    await load()
  } catch (error) {
    ElMessage.error(error.message)
  }
}

const failFirst = async (row) => {
  try {
    await ElMessageBox.confirm(`确定将「${row.name}」的一面标记为不通过吗？`, '提示', { type: 'warning' })
    await updateStatus(row._id, 'first_failed')
    ElMessage.success('已标记一面不通过')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message)
  }
}

const undoResult = async (row) => {
  try {
    await ElMessageBox.confirm(`确定撤销「${row.name}」的一面结果吗？`, '提示', { type: 'warning' })
    await updateStatus(row._id, 'waiting_first')
    ElMessage.success('已撤销一面结果')
    await load()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.message)
  }
}

const exportCsv = async () => {
  try {
    const result = await exportData({ status: FIRST_STATES, departments: [] })
    const rows = result.data.data || []
    const header = '姓名,学号,意向部门,状态,一面签到号,报名时间,专业班级,手机号'
    const lines = rows.map((row) => [
      row.name || '', row.student_id || '', listText(row.departments), getStatusText(row.status),
      iv(row).checkInNumber ?? '', formatTime(row.applyTime), row.major || '', row.phone || ''
    ].map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
    const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `一面数据_${new Date().toISOString().slice(0, 10)}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    ElMessage.error(error.message)
  }
}

onMounted(async () => {
  try {
    const result = await getSystemConfigAdmin()
    systemConfig.value = result.data || {}
    const details = systemConfig.value.departmentDetails
    if (details) departmentOptions.value = Object.keys(details)
  } catch { /* 使用默认部门 */ }
  load()
})
</script>

<style scoped>
.page-heading { display: flex; align-items: flex-start; justify-content: space-between; }
.page-tip { margin: -8px 0 14px; color: var(--text-secondary); font-size: 12px; }
.toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 14px; }
.muted { color: var(--text-secondary); }
.detail-block { margin-top: 12px; }
.detail-label { margin-bottom: 4px; color: var(--text-secondary); font-size: 13px; }
.detail-text { padding: 10px; border-radius: 6px; background: #f8f9fc; white-space: pre-wrap; line-height: 1.7; font-size: 13px; }
</style>
