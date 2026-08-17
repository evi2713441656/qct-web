<template>
  <div class="page-container apply-page">
    <header class="page-header">
      <div class="page-header-left">
        <el-button link @click="$router.push('/')">← 返回首页</el-button>
        <h1>{{ hasApplied ? '我的申请' : '报名申请' }}</h1>
      </div>
      <div v-if="user" class="user-chip">
        {{ user.name }}（{{ user.student_id }}）
        <el-button link type="primary" @click="$router.push('/user')">个人中心</el-button>
        <el-button v-if="!isLoggedIn" link type="primary" @click="showLoginDialog">登录</el-button>
      </div>
    </header>

    <!-- 登录弹窗 -->
    <el-dialog v-model="loginVisible" title="登录" width="360px">
      <el-form label-width="70px" @submit.prevent="doLogin">
        <el-form-item label="学号" required>
          <el-input v-model="loginForm.studentId" placeholder="请输入学号" />
        </el-form-item>
        <el-form-item label="姓名" required>
          <el-input v-model="loginForm.name" placeholder="请输入姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="loggingIn" @click="doLogin">登录</el-button>
      </template>
    </el-dialog>

    <!-- 未登录 -->
    <div v-if="!isLoggedIn" class="card empty-card">
      <p>请先登录后报名</p>
      <el-button type="primary" @click="showLoginDialog">立即登录</el-button>
    </div>

    <template v-else>
      <!-- 已报名：状态卡 -->
      <div v-if="application" class="card" style="margin-bottom: 16px;">
        <h2 class="section-title">报名进度</h2>
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="状态">
            <span :class="'status-' + application.status" style="font-weight: 600;">
              {{ getStatusText(application.status) }}
            </span>
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
          <el-descriptions :column="3" size="small" border>
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
          <el-descriptions :column="3" size="small" border>
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
      </div>

      <!-- 未报名：报名表单 -->
      <div v-else class="card">
        <h2 class="section-title">{{ editing ? '修改报名信息' : '填写报名信息' }}</h2>
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
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="submitting">提交报名</el-button>
            <el-button v-if="editing" @click="cancelEdit">取消修改</el-button>
          </el-form-item>
        </el-form>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { login, getUserInfo, isLoggedIn } from '../api/auth.js'
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

const loginVisible = ref(false)
const loggingIn = ref(false)
const loginForm = ref({ studentId: '', name: '' })

const formRef = ref()
const submitting = ref(false)
const checkingIn = ref('')

const form = ref({
  name: '', studentId: '', gender: '男', major: '', dormitory: '', phone: '',
  departments: [], introduction: ''
})

const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  studentId: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  departments: [{ required: true, type: 'array', min: 1, message: '请至少选择一个部门', trigger: 'change' }],
  introduction: [{ required: true, message: '请填写自我介绍', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }]
}

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
  if (!cfg || !cfg.isSet) {
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
    time: `${cfg.date || ''} ${cfg.time || ''}`.trim() || '-',
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

const doLogin = async () => {
  if (!loginForm.value.studentId || !loginForm.value.name) {
    ElMessage.warning('请输入学号和姓名')
    return
  }
  loggingIn.value = true
  try {
    const data = await login(loginForm.value.studentId, loginForm.value.name)
    user.value = data.userInfo
    loginVisible.value = false
    ElMessage.success('登录成功')
    await loadApplication()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loggingIn.value = false
  }
}

const showLoginDialog = () => {
  loginVisible.value = true
}

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
        introduction: application.value.introduction || ''
      }
    }
  } catch (e) {
    // 无申请时后端可能报错，视为未报名
    application.value = null
  }
}

const handleSubmit = async () => {
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
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}
.page-header-left { display: flex; align-items: center; gap: 4px; }
.page-header h1 { font-size: 20px; margin: 0; }
.user-chip { color: var(--text-regular); font-size: 13px; }
.apply-form { max-width: 760px; }
.interview-block {
  background: #f8f9fc;
  border-radius: 8px;
  padding: 14px;
  margin-top: 12px;
}
.interview-title { margin: 0 0 10px; font-size: 15px; }
.checked-in { color: var(--success); font-weight: 600; }
.muted { color: var(--text-secondary); font-size: 12px; }
.pass-tip { color: var(--success); margin-top: 10px; font-size: 13px; }
.fail-tip { color: var(--danger); margin-top: 10px; font-size: 13px; }
.action-row { margin-top: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.action-label { font-size: 14px; }
.empty-card { text-align: center; padding: 60px 20px; }
.empty-card p { color: var(--text-secondary); margin-bottom: 16px; }
</style>
