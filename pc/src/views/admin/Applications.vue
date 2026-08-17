<template>
  <div>
    <div class="card">
      <h2 class="section-title">报名管理</h2>

      <div class="toolbar">
        <el-select v-model="filters.status" style="width: 140px;" @change="load(1)">
          <el-option v-for="o in STATUS_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
        <el-select v-model="filters.department" placeholder="部门" clearable style="width: 130px;" @change="load(1)">
          <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
        </el-select>
        <el-input v-model="filters.keyword" placeholder="搜索姓名 / 学号" clearable style="width: 200px;" @input="onSearch" />
        <el-button type="primary" @click="exportCsv">导出 CSV</el-button>
        <el-button type="warning" @click="notifyVisible = true">发送通知</el-button>
        <el-button @click="load()">刷新</el-button>
      </div>

      <el-table :data="list" border stripe size="small" @selection-change="onSelectionChange">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="name" label="姓名" width="90" fixed />
        <el-table-column prop="student_id" label="学号" width="110" />
        <el-table-column label="意向部门" width="140">
          <template #default="{ row }">{{ listText(row.departments) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <span :class="'status-' + deriveStatus(row)">{{ getStatusText(deriveStatus(row)) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="一面" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.firstInterview && row.firstInterview.status === 'completed'" size="small" type="info">已面试</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="二面" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.secondInterview && row.secondInterview.status === 'completed'" size="small" type="info">已完成</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="major" label="专业班级" width="130" />
        <el-table-column prop="phone" label="联系方式" width="120" />
        <el-table-column label="报名时间" width="130">
          <template #default="{ row }">{{ formatTime(row.applyTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <template v-if="canFirstPass(row)">
              <el-button link type="success" size="small" @click="passFirst(row)">一面通过</el-button>
              <el-button link type="danger" size="small" @click="failFirst(row)">一面不通过</el-button>
            </template>
            <template v-if="canUndo(row)">
              <el-button link type="warning" size="small" @click="undo(row)">撤销</el-button>
            </template>
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="batch-bar" v-if="selected.length">
        已选 {{ selected.length }} 条：
        <el-button type="success" size="small" @click="batchPassFirst">批量一面通过</el-button>
        <el-button type="danger" size="small" @click="batchFailFirst">批量一面不通过</el-button>
      </div>

      <el-pagination
        v-model:current-page="page" :page-size="pageSize" :total="total"
        layout="total, prev, pager, next" style="margin-top: 12px; justify-content: flex-end;"
        @current-change="load" />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="申请详情" width="640px">
      <template v-if="detail">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ detail.student_id }}</el-descriptions-item>
          <el-descriptions-item label="性别">{{ detail.gender }}</el-descriptions-item>
          <el-descriptions-item label="专业班级">{{ detail.major }}</el-descriptions-item>
          <el-descriptions-item label="宿舍号">{{ detail.dormitory }}</el-descriptions-item>
          <el-descriptions-item label="联系方式">{{ detail.phone }}</el-descriptions-item>
          <el-descriptions-item label="意向部门">{{ listText(detail.departments) }}</el-descriptions-item>
          <el-descriptions-item label="报名时间">{{ formatTime(detail.applyTime) }}</el-descriptions-item>
        </el-descriptions>
        <div class="detail-block">
          <div class="detail-label">自我介绍</div>
          <div class="detail-text">{{ detail.introduction }}</div>
        </div>
        <div v-if="detail.firstInterview && detail.firstInterview.result" class="detail-block">
          <div class="detail-label">一面结果</div>
          <div class="detail-text">
            {{ detail.firstInterview.result === 'pass' ? '通过' : detail.firstInterview.result === 'fail' ? '不通过' : '拒绝' }}
            <span v-if="detail.firstInterview.passedDepartments?.length">（{{ listText(detail.firstInterview.passedDepartments) }}）</span>
            <span v-if="detail.firstInterview.feedback"> · {{ detail.firstInterview.feedback }}</span>
          </div>
        </div>
        <div v-if="detail.secondInterview && detail.secondInterview.result" class="detail-block">
          <div class="detail-label">二面结果</div>
          <div class="detail-text">
            {{ detail.secondInterview.result === 'pass' ? '通过' : '不通过' }}
            <span v-if="detail.secondInterview.passedDepartments?.length">（{{ listText(detail.secondInterview.passedDepartments) }}）</span>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" title="编辑报名信息" width="600px">
      <el-form label-width="90px">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="姓名"><el-input v-model="editForm.name" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号"><el-input v-model="editForm.studentId" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-radio-group v-model="editForm.gender">
                <el-radio value="男">男</el-radio>
                <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="专业班级"><el-input v-model="editForm.major" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="宿舍号"><el-input v-model="editForm.dormitory" /></el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式"><el-input v-model="editForm.phone" /></el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="意向部门">
          <el-checkbox-group v-model="editForm.departments" :max="2">
            <el-checkbox v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="自我介绍">
          <el-input v-model="editForm.introduction" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 一面通过部门选择 -->
    <el-dialog v-model="passVisible" :title="passBatch ? '批量一面通过' : '一面通过'" width="440px">
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
import { listApplications, updateStatus, updateApplicationInfo } from '../../api/application.js'
import { getSystemConfigAdmin } from '../../api/admin.js'
import { STATUS_OPTIONS, getStatusText, deriveStatus } from '../../utils/status.js'
import { formatTime, listText } from '../../utils/format.js'
import NotificationDialog from '../../components/NotificationDialog.vue'

const list = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const filters = ref({ status: 'all', department: '', keyword: '' })
const selected = ref([])
const departmentOptions = ref(['策划部', '执行部', '宣传部'])

const detailVisible = ref(false)
const detail = ref(null)
const editVisible = ref(false)
const editForm = ref({})
const editingId = ref('')
const passVisible = ref(false)
const passBatch = ref(false)
const passDepartments = ref([])
const passTarget = ref(null)
const notifyVisible = ref(false)

const load = async (p) => {
  if (p) page.value = p
  try {
    const params = {
      page: page.value,
      pageSize,
      status: filters.value.status !== 'all' ? filters.value.status : undefined,
      department: filters.value.department || undefined
    }
    const result = await listApplications(params)
    list.value = result.data.list || []
    total.value = result.data.total || 0
    if (filters.value.keyword) {
      list.value = list.value.filter((x) =>
        (x.name || '').includes(filters.value.keyword) || (x.student_id || '').includes(filters.value.keyword))
    }
  } catch (e) {
    ElMessage.error(e.message)
  }
}

let searchTimer = null
const onSearch = () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => load(1), 300)
}

const onSelectionChange = (rows) => {
  selected.value = rows
}

const canFirstPass = (row) => {
  const s = deriveStatus(row)
  return s === 'waiting_first' || s === 'interviewed'
}

const canUndo = (row) => {
  return ['first_passed', 'first_failed', 'first_reject', 'waiting_second'].includes(row.status)
}

const passFirst = (row) => {
  passBatch.value = false
  passTarget.value = row
  passDepartments.value = []
  passVisible.value = true
}

const failFirst = async (row) => {
  try {
    await ElMessageBox.confirm(`确定将「${row.name}」的一面标记为不通过吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await updateStatus(row._id, 'first_failed')
    ElMessage.success('已标记一面不通过')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const confirmPass = async () => {
  if (!passDepartments.value.length) {
    ElMessage.warning('请选择通过的部门')
    return
  }
  try {
    if (passBatch.value) {
      await Promise.all(selected.value
        .filter((r) => canFirstPass(r))
        .map((r) => updateStatus(r._id, 'first_passed', { departments: passDepartments.value })))
      ElMessage.success(`已通过 ${selected.value.length} 人`)
    } else {
      await updateStatus(passTarget.value._id, 'first_passed', { departments: passDepartments.value })
      ElMessage.success('已标记一面通过')
    }
    passVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const batchPassFirst = () => {
  if (!selected.value.length) return
  passBatch.value = true
  passDepartments.value = []
  passVisible.value = true
}

const batchFailFirst = async () => {
  try {
    await ElMessageBox.confirm(`确定将选中的 ${selected.value.length} 人一面标记为不通过吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await Promise.all(selected.value
      .filter((r) => canFirstPass(r))
      .map((r) => updateStatus(r._id, 'first_failed')))
    ElMessage.success('批量操作完成')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const undo = async (row) => {
  try {
    await ElMessageBox.confirm('确定撤销该状态吗？（回到一面待定）', '提示', { type: 'warning' })
  } catch { return }
  try {
    await updateStatus(row._id, 'waiting_first')
    ElMessage.success('已撤销')
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const openDetail = (row) => {
  detail.value = row
  detailVisible.value = true
}

const openEdit = (row) => {
  editingId.value = row._id
  editForm.value = {
    name: row.name || '',
    studentId: row.student_id || '',
    gender: row.gender || '',
    major: row.major || '',
    dormitory: row.dormitory || '',
    phone: row.phone || '',
    departments: row.departments || [],
    introduction: row.introduction || ''
  }
  editVisible.value = true
}

const saveEdit = async () => {
  try {
    await updateApplicationInfo(editingId.value, {
      name: editForm.value.name,
      studentId: editForm.value.studentId,
      gender: editForm.value.gender,
      major: editForm.value.major,
      dormitory: editForm.value.dormitory,
      phone: editForm.value.phone,
      introduction: editForm.value.introduction,
      departments: editForm.value.departments
    })
    ElMessage.success('保存成功')
    editVisible.value = false
    load()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const exportCsv = async () => {
  try {
    const result = await import('../../api/admin.js').then((m) => m.exportData({
      status: filters.value.status !== 'all' ? [filters.value.status] : [],
      departments: filters.value.department ? [filters.value.department] : []
    }))
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
    a.download = `报名导出_${new Date().toISOString().slice(0, 10)}.csv`
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
.toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
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
.detail-block { margin-top: 12px; }
.detail-label { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
.detail-text {
  background: #f8f9fc;
  border-radius: 6px;
  padding: 10px;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>
