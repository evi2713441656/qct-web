<template>
  <div class="page-container apply-page">
    <header class="page-header">
      <div class="page-header-left">
        <el-button link @click="$router.push('/')">← 返回首页</el-button>
        <h1>{{ hasApplied ? '我的申请' : '报名申请' }}</h1>
      </div>
      <div v-if="user" class="user-chip">
        {{ user.name }}（{{ user.phone }}）
        <el-button link type="primary" @click="$router.push('/user')">个人中心</el-button>
      </div>
    </header>

    <div v-if="celebrationVisible" class="celebration-overlay" aria-live="polite">
      <div class="celebration-toast">恭喜你，成功录取！</div>
      <span
        v-for="piece in celebrationPieces"
        :key="piece.id"
        class="celebration-piece"
        :style="{
          '--dx': `${piece.dx}px`,
          '--delay': `${piece.delay}ms`,
          '--duration': `${piece.duration}ms`,
          '--rotation': `${piece.rotation}deg`,
          '--piece-color': piece.color
        }"
      ></span>
    </div>

    <!-- 未登录 -->
    <div v-if="!isLoggedIn" class="card empty-card">
      <p>请先在首页完成登录或注册后再报名</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>

    <template v-else>
      <!-- 已报名：状态卡 -->
      <section v-if="application" class="card application-card progress-card">
        <div class="card-heading">
          <div>
            <p class="card-kicker">APPLICATION</p>
            <h2>报名进度</h2>
          </div>
          <span :class="['status-pill', 'status-' + application.status]">{{ getStatusText(application.status) }}</span>
        </div>
        <el-descriptions class="application-descriptions summary-descriptions" :column="2" border>
          <el-descriptions-item label="当前状态">
            <span :class="['status-pill', 'status-' + application.status]">{{ getStatusText(application.status) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="意向部门">{{ listText(application.departments) }}</el-descriptions-item>
          <el-descriptions-item label="报名时间">{{ formatTime(application.applyTime) }}</el-descriptions-item>
          <el-descriptions-item v-if="application.finalDepartment" label="录取部门">
            <el-tag type="success">{{ application.finalDepartment }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 一面信息 -->
        <div v-if="firstInfo.visible" class="interview-block">
          <h3 class="interview-title">一面信息</h3>
          <el-descriptions class="application-descriptions interview-descriptions" :column="3" border>
            <el-descriptions-item label="时间">{{ firstInfo.time }}</el-descriptions-item>
            <el-descriptions-item label="地点">{{ firstInfo.location }}</el-descriptions-item>
            <el-descriptions-item label="签到">
              <el-button v-if="firstInfo.canCheckIn" type="primary" size="small" :loading="checkingIn === 'first'" @click="handleCheckIn('first')">
                签到
              </el-button>
              <span v-else-if="firstInterview.checkInNumber != null" class="checked-in">已签到 · {{ firstInterview.checkInNumber }} 号</span>
              <span v-else-if="firstInfo.passed" class="checked-in">已完成</span>
              <span v-else class="muted">未开启</span>
            </el-descriptions-item>
          </el-descriptions>
          <div v-if="firstInterview.result === 'pass'" class="pass-tip">一面已通过，通过部门：{{ listText(firstInterview.passedDepartments) }}</div>
          <div v-else-if="firstInterview.result === 'fail'" class="fail-tip">一面未通过，感谢参与。</div>
        </div>

        <!-- 二面信息 -->
        <div v-if="secondInfo.visible" class="interview-block">
          <h3 class="interview-title">二面信息</h3>
          <el-descriptions class="application-descriptions interview-descriptions" :column="3" border>
            <el-descriptions-item label="时间">{{ secondInfo.time }}</el-descriptions-item>
            <el-descriptions-item label="地点">{{ secondInfo.location }}</el-descriptions-item>
            <el-descriptions-item label="签到">
              <el-button v-if="secondInfo.canCheckIn" type="primary" size="small" :loading="checkingIn === 'second'" @click="handleCheckIn('second')">
                签到
              </el-button>
              <span v-else-if="secondInterview.checkInNumber != null" class="checked-in">已签到 · {{ secondInterview.checkInNumber }} 号</span>
              <span v-else-if="secondInfo.passed" class="checked-in">已完成</span>
              <span v-else class="muted">未开启</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 一面通过后操作 -->
        <div v-if="application.status === 'first_passed'" class="action-row">
          <el-button type="primary" @click="handleStatus('waiting_second')">继续参加二面</el-button>
          <el-button type="danger" plain @click="handleStatus('first_reject')">拒绝二面</el-button>
        </div>

        <!-- 选择部门 -->
        <div v-if="application.status === 'department_selection'" class="action-row">
          <span class="action-label">请选择您希望加入的部门：</span>
          <el-radio-group v-model="selectedDepartment">
            <el-radio-button v-for="d in passedDepartments" :key="d" :value="d">{{ d }}</el-radio-button>
          </el-radio-group>
          <el-button type="primary" style="margin-left: 12px;" @click="handleSelectDepartment">确认加入</el-button>
          <el-button type="danger" plain @click="handleRejectDepartment">放弃加入</el-button>
        </div>

        <!-- 编辑/撤销 -->
        <div v-if="canEdit" class="action-row">
          <el-button @click="startEdit">修改报名信息</el-button>
          <el-button type="danger" plain @click="handleDelete">撤销报名</el-button>
        </div>
      </section>

      <!-- 未报名：报名表单 -->
      <section v-else class="card application-card form-card">
        <div class="card-heading">
          <div>
            <p class="card-kicker">APPLICATION</p>
            <h2>{{ editing ? '修改报名信息' : '填写报名信息' }}</h2>
          </div>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="apply-form" @submit.prevent="handleSubmit">
          <el-row :gutter="16">
            <el-col :xs="24" :sm="12">
              <el-form-item label="姓名" prop="name">
                <el-input v-model="form.name" placeholder="你的姓名" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="学号" prop="studentId">
                <el-input v-model="form.studentId" placeholder="学号（用于签到核验）" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="性别" prop="gender">
                <el-radio-group v-model="form.gender">
                  <el-radio value="男">男</el-radio>
                  <el-radio value="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="专业班级" prop="major">
                <el-input v-model="form.major" placeholder="专业 + 班级" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="宿舍号" prop="dormitory">
                <el-input v-model="form.dormitory" placeholder="如 3栋501" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12">
              <el-form-item label="联系方式" prop="phone">
                <el-input v-model="form.phone" placeholder="手机号" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="意向部门" prop="departments">
            <el-checkbox-group v-model="form.departments" :max="2">
              <el-checkbox v-for="d in departmentOptions" :key="d" :value="d">{{ d }}</el-checkbox>
            </el-checkbox-group>
            <div class="muted" style="font-size: 12px;">最多选择 2 个部门</div>
          </el-form-item>
          <el-form-item label="自我介绍" prop="introduction">
            <el-input v-model="form.introduction" type="textarea" :rows="4" placeholder="介绍一下你自己，让我们更了解你" maxlength="1000" show-word-limit />
          </el-form-item>
          <el-form-item prop="hasConsented">
            <el-checkbox v-model="form.hasConsented">
              我已阅读并同意《用户协议》和《隐私政策》
            </el-checkbox>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="submitting" :disabled="!applicationOpen">
              {{ applicationOpen ? '提交报名' : '报名时间未开放' }}
            </el-button>
            <el-button v-if="editing" @click="cancelEdit">取消修改</el-button>
          </el-form-item>
          <div v-if="!applicationOpen" class="muted" style="font-size: 13px;">
            当前不在报名时间内（{{ formatTime(config.applicationStartTime) }} 至 {{ formatTime(config.applicationEndTime) }}）
          </div>
        </el-form>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserInfo, isLoggedIn } from '../api/auth.js'
import {
  submitApplication, getApplication, updateApplication, deleteApplication,
  checkIn, selectDepartment, rejectDepartment, updateStatus
} from '../api/application.js'
import { getStatusText, deriveStatus } from '../utils/status.js'
import { formatTime, listText } from '../utils/format.js'

const user = ref(getUserInfo())
const application = ref(null)
const hasApplied = computed(() => !!application.value)
const editing = ref(false)
const celebrationVisible = ref(false)
const celebrationPieces = [
  { id: 1, dx: -150, delay: 0, duration: 1500, rotation: -35, color: '#4f6ef7' },
  { id: 2, dx: -118, delay: 90, duration: 1700, rotation: 28, color: '#2eaa78' },
  { id: 3, dx: -82, delay: 180, duration: 1450, rotation: -18, color: '#f3a743' },
  { id: 4, dx: -46, delay: 40, duration: 1600, rotation: 42, color: '#e56b7a' },
  { id: 5, dx: -12, delay: 130, duration: 1550, rotation: -24, color: '#4f6ef7' },
  { id: 6, dx: 24, delay: 220, duration: 1750, rotation: 35, color: '#2eaa78' },
  { id: 7, dx: 58, delay: 70, duration: 1450, rotation: -42, color: '#f3a743' },
  { id: 8, dx: 94, delay: 170, duration: 1650, rotation: 22, color: '#e56b7a' },
  { id: 9, dx: 132, delay: 260, duration: 1500, rotation: -32, color: '#4f6ef7' },
  { id: 10, dx: -102, delay: 310, duration: 1750, rotation: 38, color: '#f3a743' },
  { id: 11, dx: -28, delay: 360, duration: 1600, rotation: -18, color: '#2eaa78' },
  { id: 12, dx: 42, delay: 330, duration: 1700, rotation: 28, color: '#e56b7a' }
]

const formRef = ref()
const submitting = ref(false)
const checkingIn = ref('')

const form = ref({
  name: '', studentId: '', gender: '男', major: '', dormitory: '', phone: '',
  departments: [], introduction: '', hasConsented: false
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  departments: [{ required: true, type: 'array', min: 1, message: '请至少选择一个部门', trigger: 'change' }],
  introduction: [{ required: true, message: '请填写自我介绍', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
  hasConsented: [{
    validator: (rule, value, callback) => {
      if (!value) callback(new Error('请先同意用户协议和隐私政策'))
      else callback()
    },
    trigger: 'change'
  }]
}

const applicationOpen = computed(() => {
  const s = config.value.applicationStartTime
  const e = config.value.applicationEndTime
  if (!s || !e) return true
  const now = Date.now()
  return now >= new Date(s).getTime() && now <= new Date(e).getTime()
})

const config = ref({})
const departmentOptions = ref([])
const selectedDepartment = ref('')
const checkInEnabled = ref({ first: false, second: false })

const firstInterview = computed(() => application.value?.firstInterview || {})
const secondInterview = computed(() => application.value?.secondInterview || {})
const passedDepartments = computed(() => {
  const list = secondInterview.value.passedDepartments || []
  return Array.isArray(list) ? list : String(list).split(',').filter(Boolean)
})

function interviewInfo(type) {
  const iv = type === 'first' ? firstInterview.value : secondInterview.value
  const cfg = (config.value.interviewConfig || {})[type === 'first' ? 'firstInterview' : 'secondInterview']
  const configured = !!(cfg && cfg.date && cfg.time && cfg.location)
  if (!configured) {
    return { visible: false, canCheckIn: false, time: '-', location: '-', passed: false }
  }
  const status = application.value.status
  const waiting = type === 'first' ? status === 'waiting_first' : status === 'waiting_second'
  const done = iv.status === 'completed'
  const passed = iv.result === 'pass'
  const canCheckIn = waiting && cfg.checkInEnabled && iv.checkInNumber == null
  return {
    visible: waiting || done,
    canCheckIn,
    passed,
    time: `${cfg.date || ''} ${cfg.time || ''}${cfg.endTime ? ` 至 ${cfg.endTime}` : ''}`.trim() || '-',
    location: cfg.location || '-'
  }
}

const firstInfo = computed(() => interviewInfo('first'))
const secondInfo = computed(() => interviewInfo('second'))

const canEdit = computed(() => {
  if (!application.value) return false
  const s = application.value.status
  if (!['waiting_first', 'first_passed', 'first_failed', 'first_reject', 'waiting_second'].includes(s)) return false
  if (checkInEnabled.value.first && firstInterview.value.checkInNumber != null) return true
  const deadline = config.value.editDeadline
  return deadline ? Date.now() <= new Date(deadline).getTime() : true
})


const loadApplication = async () => {
  if (!isLoggedIn()) return
  try {
    const result = await getApplication()
    application.value = result.data || null
    if (application.value) {
      form.value = {
        name: application.value.name || '',
        studentId: application.value.student_id || '',
        gender: application.value.gender || '男',
        major: application.value.major || '',
        dormitory: application.value.dormitory || '',
        phone: application.value.phone || '',
        departments: application.value.departments || [],
        introduction: application.value.introduction || '',
        hasConsented: true
      }
    } else {
      form.value.name = user.value?.name || ''
      form.value.phone = user.value?.phone || ''
    }
  } catch (e) {
    // 无申请时后端可能报错，视为未报名
    application.value = null
  }
}

const handleSubmit = async () => {
  if (!applicationOpen.value) {
    ElMessage.warning('当前不在报名时间内')
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  submitting.value = true
  try {
    const data = {
      ...form.value,
      name: form.value.name.trim(),
      studentId: form.value.studentId.trim(),
      introduction: form.value.introduction.trim()
    }
    if (application.value) {
      await updateApplication(data, application.value._id)
      ElMessage.success('修改成功')
    } else {
      await submitApplication(data)
      ElMessage.success('报名成功')
    }
    editing.value = false
    await loadApplication()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    submitting.value = false
  }
}

const startEdit = () => {
  editing.value = true
}

const cancelEdit = () => {
  editing.value = false
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm('确定撤销报名吗？撤销后信息将清空。', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteApplication(user.value._id, application.value._id)
    ElMessage.success('已撤销报名')
    application.value = null
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleStatus = async (status) => {
  try {
    await updateStatus(application.value._id, status)
    ElMessage.success(status === 'waiting_second' ? '已确认参加二面' : '已拒绝二面')
    await loadApplication()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleCheckIn = async (type) => {
  checkingIn.value = type
  try {
    await checkIn(type, user.value._id)
    ElMessage.success('签到成功！')
    await loadApplication()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    checkingIn.value = ''
  }
}

const handleSelectDepartment = async () => {
  if (!selectedDepartment.value) {
    ElMessage.warning('请选择部门')
    return
  }
  try {
    await selectDepartment(application.value._id, selectedDepartment.value, user.value._id)
    celebrationVisible.value = true
    window.setTimeout(() => { celebrationVisible.value = false }, 2600)
    ElMessage.success('恭喜您成功加入我们！')
    await loadApplication()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const handleRejectDepartment = async () => {
  try {
    await ElMessageBox.confirm('确定放弃加入吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  try {
    await rejectDepartment(application.value._id, user.value._id)
    ElMessage.success('已拒绝，感谢参与')
    await loadApplication()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(async () => {
  try {
    const result = await import('../api/auth.js').then((m) => m.getSystemConfig())
    config.value = result.data || {}
    const details = config.value.departmentDetails
    departmentOptions.value = details ? Object.keys(details) : ['策划部', '执行部', '宣传部']
    const ic = config.value.interviewConfig || {}
    checkInEnabled.value = {
      first: !!(ic.firstInterview && ic.firstInterview.checkInEnabled),
      second: !!(ic.secondInterview && ic.secondInterview.checkInEnabled)
    }
  } catch {
    departmentOptions.value = ['策划部', '执行部', '宣传部']
  }
  await loadApplication()
  setInterval(loadApplication, 60000)
})
</script>

<style scoped>
.apply-page {
  min-height: calc(100vh - 1px);
  background: #f7f9fc;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.page-header-left { display: flex; align-items: center; gap: 4px; }
.page-header h1 { color: #33415c; font-size: 22px; margin: 0; letter-spacing: 0.02em; }
.celebration-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.celebration-toast {
  position: absolute;
  top: 35%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 14px 22px;
  border: 1px solid #d9e3fa;
  border-radius: 10px;
  color: #315fc9;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8px 22px rgba(43, 76, 145, 0.16);
  font-size: 20px;
  font-weight: 700;
  animation: celebration-toast-in 0.35s ease-out both;
}
.celebration-piece {
  position: absolute;
  top: 34%;
  left: 50%;
  width: 7px;
  height: 14px;
  border-radius: 2px;
  background: var(--piece-color);
  opacity: 0;
  animation: celebration-fall var(--duration) cubic-bezier(0.2, 0.75, 0.35, 1) var(--delay) both;
}
@keyframes celebration-toast-in {
  from { opacity: 0; transform: translate(-50%, -42%) scale(0.94); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@keyframes celebration-fall {
  0% { opacity: 0; transform: translate(-50%, -10px) rotate(0); }
  16% { opacity: 1; }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), 210px) rotate(var(--rotation)); }
}
.user-chip {
  padding: 7px 12px;
  border: 1px solid #e1e7f0;
  border-radius: 20px;
  color: #52627c;
  font-size: 13px;
  background: #fff;
}
.application-card,
.empty-card {
  margin-bottom: 18px;
  padding: 24px;
  border: 1px solid #e7ebf2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 5px rgba(33, 52, 82, 0.08), 0 8px 18px rgba(33, 52, 82, 0.04);
}
.card-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}
.card-heading h2 { margin: 2px 0 0; color: #33415c; font-size: 19px; }
.card-kicker {
  margin: 0;
  color: #8a9ab4;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
}
.application-descriptions { margin-top: 14px; }
:deep(.application-descriptions .el-descriptions__body) { background: transparent; }
:deep(.application-descriptions .el-descriptions__table) { border-color: #e4e9f1; }
:deep(.application-descriptions .el-descriptions__cell) {
  padding: 12px 14px;
  border-color: #e4e9f1 !important;
  background: #fff !important;
}
:deep(.application-descriptions .el-descriptions__label.el-descriptions__cell.is-bordered-label) {
  width: 88px;
  color: #64748b;
  background: #f5f7fb !important;
  font-size: 12px;
  font-weight: 600;
}
:deep(.application-descriptions .el-descriptions__content.el-descriptions__cell.is-bordered-content) {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 11px;
  border-radius: 999px;
  color: #3f5fc8;
  background: #e9efff;
  font-size: 12px;
  font-weight: 700;
}
.status-accepted,
.status-department_selection { color: #269b72; }
.status-first_failed,
.status-second_failed,
.status-first_reject,
.status-rejected { color: #d15c69; }
.interview-block {
  margin-top: 18px;
  padding: 18px;
  border: 1px solid #e5eaf2;
  border-radius: 10px;
  background: #f9fbfe;
}
.interview-title { margin: 0 0 6px; color: #40506c; font-size: 15px; }
.interview-descriptions { margin-top: 2px; }
.checked-in { color: #2eaa7e; font-weight: 700; }
.muted { color: #8491a8; font-size: 12px; }
.pass-tip, .fail-tip {
  margin-top: 10px;
  padding: 9px 11px;
  border-radius: 8px;
  font-size: 13px;
}
.pass-tip { color: #24926a; background: rgba(99, 194, 150, 0.12); }
.fail-tip { color: #cb5664; background: rgba(231, 117, 128, 0.11); }
.action-row { margin-top: 18px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
.action-label { color: #52617b; font-size: 14px; font-weight: 600; }
.apply-form { max-width: 760px; }
:deep(.form-card .el-input__wrapper),
:deep(.form-card .el-textarea__inner) {
  background: #fff;
  box-shadow: 0 1px 2px rgba(32, 51, 80, 0.08);
}
:deep(.form-card .el-input__wrapper.is-focus),
:deep(.form-card .el-textarea__inner:focus) { box-shadow: 0 0 0 2px rgba(79, 110, 247, 0.18); }
.empty-card { text-align: center; padding: 60px 20px; }
.empty-card p { color: #71809a; margin-bottom: 16px; }
@media (max-width: 640px) {
  .application-card, .empty-card { padding: 18px 12px; border-radius: 14px; }
  .page-header h1 { font-size: 19px; }
  .user-chip { width: 100%; text-align: right; }
  :deep(.application-descriptions .el-descriptions__table) { border-spacing: 5px; }
  :deep(.application-descriptions .el-descriptions__cell) { padding: 10px 8px; }
  :deep(.interview-descriptions .el-descriptions__table) { border-spacing: 4px; }
  :deep(.interview-descriptions .el-descriptions__cell) { padding: 9px 6px; }
  .interview-block { padding: 12px; }
}
</style>
