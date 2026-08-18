<template>
  <div class="page-container user-page">
    <header class="page-header">
      <el-button link @click="$router.push('/')">← 返回首页</el-button>
      <h1>个人中心</h1>
      <el-button link type="primary" @click="$router.push('/apply')">我的申请</el-button>
      <el-button link type="danger" @click="handleLogout">退出登录</el-button>
    </header>

    <div v-if="!isLoggedIn" class="card empty-card">
      <p>请先登录</p>
      <el-button type="primary" @click="$router.push('/apply')">去登录</el-button>
    </div>

    <template v-else>
      <section class="card user-card profile-card">
        <div class="card-heading">
          <div>
            <p class="card-kicker">ACCOUNT</p>
            <h2>基本信息</h2>
          </div>
          <el-tag effect="plain" type="success" round>已登录</el-tag>
        </div>
        <el-descriptions class="profile-descriptions" :column="2" border>
          <el-descriptions-item label="姓名">{{ user.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ user.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="user.student_id" label="学号">{{ user.student_id }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ formatTime(user.lastLoginTime) }}</el-descriptions-item>
        </el-descriptions>
      </section>

      <section class="card user-card progress-card">
        <div class="card-heading">
          <div>
            <p class="card-kicker">APPLICATION</p>
            <h2>申请进度</h2>
          </div>
          <el-button link type="primary" @click="$router.push('/apply')">查看详情 →</el-button>
        </div>
        <div v-if="application" class="status-summary">
          <el-steps class="application-steps timeline-steps" :active="0" align-center>
            <el-step v-for="(stage, index) in timelineStages" :key="stage.key" :class="['timeline-step', `stage-${stage.state}`, `line-${stage.lineState}`]" :title="stage.label">
              <template #icon>
                <span class="timeline-node">
                  <el-icon v-if="stage.state === 'done'"><Check /></el-icon>
                  <span v-else>{{ index + 1 }}</span>
                </span>
              </template>
              <template #description>
                <div class="timeline-date">{{ stage.date }}</div>
                <div v-if="stage.detail" class="timeline-result">{{ stage.detail }}</div>
              </template>
            </el-step>
          </el-steps>
          <el-descriptions class="application-descriptions" :column="2" border>
            <el-descriptions-item label="当前状态">
              <span :class="['status-pill', 'status-' + application.status]">{{ getStatusText(application.status) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="意向部门">{{ listText(application.departments) }}</el-descriptions-item>
            <el-descriptions-item v-if="application.finalDepartment" label="录取部门">
              <el-tag type="success" effect="light" round>{{ application.finalDepartment }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="firstInterviewSchedule.isSet || (showSecondInterview && secondInterviewSchedule.isSet)" class="interview-schedule-list">
            <div v-if="firstInterviewSchedule.isSet" class="interview-schedule-item">
              <div class="schedule-title">
                <el-tag type="primary" effect="light" round>一面安排</el-tag>
                <span :class="firstInterviewSchedule.checkInEnabled ? 'checkin-open' : 'checkin-closed'">
                  {{ firstInterviewSchedule.checkInEnabled ? '签到已开启' : '暂未开启签到' }}
                </span>
              </div>
              <div class="schedule-details">
                <span>时间：<strong>{{ interviewDateTime(firstInterviewSchedule) }}</strong></span>
                <span>地点：<strong>{{ firstInterviewSchedule.location }}</strong></span>
              </div>
            </div>
            <div v-if="showSecondInterview && secondInterviewSchedule.isSet" class="interview-schedule-item">
              <div class="schedule-title">
                <el-tag type="success" effect="light" round>二面安排</el-tag>
                <span :class="secondInterviewSchedule.checkInEnabled ? 'checkin-open' : 'checkin-closed'">
                  {{ secondInterviewSchedule.checkInEnabled ? '签到已开启' : '暂未开启签到' }}
                </span>
              </div>
              <div class="schedule-details">
                <span>时间：<strong>{{ interviewDateTime(secondInterviewSchedule) }}</strong></span>
                <span>地点：<strong>{{ secondInterviewSchedule.location }}</strong></span>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="muted">
          暂无申请记录
          <el-button link type="primary" @click="$router.push('/apply')">去报名 →</el-button>
        </div>
      </section>

      <section class="card user-card notifications-card">
        <div class="card-heading">
          <div>
            <p class="card-kicker">NOTIFICATIONS</p>
            <h2>通知消息</h2>
          </div>
          <span v-if="notifications.length" class="notice-count">{{ notifications.length }}</span>
        </div>
        <el-empty v-if="!notifications.length" description="暂无通知" :image-size="80" />
        <div v-else class="notice-list">
          <article v-for="n in notifications" :key="n._id" class="notice-item">
            <div class="notice-head">
              <span class="notice-title">{{ n.title }}</span>
              <span class="notice-time">{{ formatSmartTime(n.createdAt) }}</span>
            </div>
            <div class="notice-content">{{ n.content }}</div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import { getSystemConfig, getUserInfo, isLoggedIn, logout } from '../api/auth.js'
import { getApplication } from '../api/application.js'
import { callCloudOrThrow } from '../api/http.js'
import { getStatusText } from '../utils/status.js'
import { formatTime, formatSmartTime, listText } from '../utils/format.js'
import { getTimelineStages } from '../utils/timeline.js'

const router = useRouter()
const user = ref(getUserInfo())
const application = ref(null)
const notifications = ref([])
const systemConfig = ref({})

const timelineStages = computed(() => getTimelineStages(application.value, systemConfig.value))

function schedule(key) {
  const value = systemConfig.value.interviewConfig?.[key] || {}
  return { ...value, isSet: !!value.isSet }
}

const firstInterviewSchedule = computed(() => schedule('firstInterview'))
const secondInterviewSchedule = computed(() => schedule('secondInterview'))
const showSecondInterview = computed(() => ['waiting_second', 'second_failed', 'department_selection', 'accepted', 'rejected'].includes(application.value?.status))
const interviewDateTime = (item) => {
  const time = [item.time, item.endTime ? `至 ${item.endTime}` : ''].filter(Boolean).join(' ')
  return [item.date, time].filter(Boolean).join(' ') || '-'
}

const loadSystemConfig = async () => {
  try {
    const result = await getSystemConfig()
    systemConfig.value = result.data || {}
  } catch {
    systemConfig.value = {}
  }
}

const loadApplication = async () => {
  try {
    const result = await getApplication()
    application.value = result.data || null
  } catch {
    application.value = null
  }
}

const loadNotifications = async () => {
  try {
    const result = await callCloudOrThrow('application', { type: 'my_notifications' })
    notifications.value = result.data || []
  } catch {
    notifications.value = []
  }
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  logout()
  ElMessage.success('已退出登录')
  router.push('/')
}

onMounted(() => {
  loadApplication().then(loadNotifications)
  loadSystemConfig()
  setInterval(() => {
    loadApplication()
    loadSystemConfig()
  }, 60000)
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.page-header h1 { font-size: 20px; margin: 0; flex: 1; }
.empty-card { text-align: center; padding: 60px 20px; }
.empty-card p { color: var(--text-secondary); margin-bottom: 16px; }
.user-page {
  min-height: calc(100vh - 1px);
  background: #f7f9fc;
}
.user-card {
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
:deep(.profile-descriptions .el-descriptions__body),
:deep(.application-descriptions .el-descriptions__body) { background: transparent; }
:deep(.profile-descriptions .el-descriptions__table),
:deep(.application-descriptions .el-descriptions__table) { border-color: #e4e9f1; }
:deep(.profile-descriptions .el-descriptions__cell),
:deep(.application-descriptions .el-descriptions__cell) {
  padding: 12px 14px;
  border-color: #e4e9f1 !important;
  background: #fff !important;
}
:deep(.profile-descriptions .el-descriptions__label.el-descriptions__cell.is-bordered-label),
:deep(.application-descriptions .el-descriptions__label.el-descriptions__cell.is-bordered-label) {
  width: 98px;
  color: #64748b;
  background: #f5f7fb !important;
  font-size: 12px;
  font-weight: 600;
}
:deep(.profile-descriptions .el-descriptions__content.el-descriptions__cell.is-bordered-content),
:deep(.application-descriptions .el-descriptions__content.el-descriptions__cell.is-bordered-content) {
  color: #334155;
  font-size: 13px;
  font-weight: 600;
}
.application-steps { margin: 5px 8px 26px; }
:deep(.timeline-steps .el-step__line) { top: 17px; background: #d8dee8; }
:deep(.timeline-step .el-step__icon) { width: 36px; height: 36px; border: 0; background: transparent; }
.timeline-node {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid #aeb8c6;
  border-radius: 50%;
  background: #f2f4f7;
  color: #8c98a8;
  font-size: 13px;
  font-weight: 700;
}
:deep(.timeline-step .el-step__title) { margin-top: 5px; color: #60708d; font-size: 13px; font-weight: 700; }
:deep(.timeline-step .el-step__description) { white-space: pre-line; line-height: 1.55; }
:deep(.timeline-step.stage-inactive .timeline-node) { border-color: #cbd2dc; background: #f1f3f5; color: #a5afbd; }
:deep(.timeline-step.stage-inactive .el-step__title),
:deep(.timeline-step.stage-inactive .el-step__description) { color: #a5afbd; }
:deep(.timeline-step.stage-next .timeline-node) { border-color: #263238; background: #fff; color: #263238; }
:deep(.timeline-step.stage-next .el-step__title),
:deep(.timeline-step.stage-next .el-step__description) { color: #263238; }
:deep(.timeline-step.stage-active .timeline-node) {
  border-color: #4f6ef7;
  background: #eaf0ff;
  color: #3560d0;
  animation: user-timeline-pulse 1.7s ease-in-out infinite;
}
:deep(.timeline-step.stage-active .el-step__title) { color: #3560d0; }
:deep(.timeline-step.stage-active .el-step__description) { color: #5670a9; }
:deep(.timeline-step.line-flow .el-step__line) { background: #d8e2ff; }
:deep(.timeline-step.line-flow .el-step__line-inner) {
  width: 100% !important;
  border: 0 !important;
  background-color: #4f6ef7;
  background-image: linear-gradient(90deg, transparent 0%, transparent 38%, rgba(255, 255, 255, 0.34) 50%, transparent 62%, transparent 100%);
  background-size: 220% 100%;
  animation: user-timeline-flow 2.8s linear infinite;
}
:deep(.timeline-step.line-done .el-step__line),
:deep(.timeline-step.line-done .el-step__line-inner) {
  width: 100% !important;
  border: 0 !important;
  background: #2eaa78;
  animation: none;
}
:deep(.timeline-step.stage-done .timeline-node) { border-color: #2eaa78; background: #2eaa78; color: #fff; }
:deep(.timeline-step.stage-done .el-step__title),
:deep(.timeline-step.stage-done .timeline-result) { color: #24926a; font-weight: 700; }
:deep(.timeline-step.stage-failed .timeline-node) { border-color: #263238; background: #263238; color: #fff; }
:deep(.timeline-step.stage-failed .el-step__title),
:deep(.timeline-step.stage-failed .timeline-result) { color: #263238; font-weight: 700; }
.timeline-result { margin-top: 4px; font-size: 12px; }
@keyframes user-timeline-flow {
  from { background-position: 200% 0; }
  to { background-position: 0 0; }
}
@keyframes user-timeline-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79, 110, 247, 0); }
  50% { box-shadow: 0 0 0 7px rgba(79, 110, 247, 0.2); }
}
@media (prefers-reduced-motion: reduce) {
  :deep(.timeline-step.stage-active .timeline-node),
  :deep(.timeline-step.line-flow .el-step__line-inner) { animation: none; }
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
.interview-schedule-list {
  display: grid;
  gap: 10px;
  margin-top: 16px;
}
.interview-schedule-item {
  padding: 14px 16px;
  border: 1px solid #dfe7f3;
  border-left: 3px solid #5d7ce8;
  border-radius: 8px;
  background: #f8faff;
}
.schedule-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.schedule-details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  color: #64748b;
  font-size: 13px;
}
.schedule-details strong { color: #334155; font-weight: 650; }
.checkin-open, .checkin-closed { font-size: 12px; font-weight: 600; }
.checkin-open { color: #24926a; }
.checkin-closed { color: #8a96a8; }
.muted {
  padding: 22px;
  border: 1px dashed #ccd6e5;
  border-radius: 10px;
  color: #748196;
  background: #f8faff;
  font-size: 13px;
  text-align: center;
}
.notice-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 26px;
  padding: 0 8px;
  border-radius: 999px;
  color: #fff;
  background: #f3a743;
  font-size: 12px;
  font-weight: 700;
}
.notice-list { display: grid; gap: 12px; }
.notice-item {
  padding: 15px 16px;
  border: 1px solid #e7ebf2;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(33, 52, 82, 0.07);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.notice-item:hover { transform: translateY(-2px); box-shadow: 0 5px 12px rgba(33, 52, 82, 0.12); }
.notice-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 7px; }
.notice-title { color: #40506c; font-weight: 700; font-size: 14px; }
.notice-time { flex: 0 0 auto; color: #8491a6; font-size: 12px; }
.notice-content { color: #60708b; font-size: 13px; line-height: 1.7; white-space: pre-wrap; }
@media (max-width: 640px) {
  .page-header { gap: 8px; }
  .page-header h1 { font-size: 18px; }
  .user-card { padding: 18px 14px; }
  .card-heading { margin-bottom: 14px; }
  :deep(.profile-descriptions .el-descriptions__cell),
  :deep(.application-descriptions .el-descriptions__cell) { padding: 11px 10px; }
  :deep(.profile-descriptions .el-descriptions__label.el-descriptions__cell.is-bordered-label),
  :deep(.application-descriptions .el-descriptions__label.el-descriptions__cell.is-bordered-label) { width: 76px; }
  .application-steps { margin: 0 0 22px; }
  :deep(.application-steps .el-step__title) { font-size: 11px; }
  .schedule-title { align-items: flex-start; flex-direction: column; gap: 6px; }
  .schedule-details { flex-direction: column; gap: 6px; }
  .notice-head { align-items: flex-start; flex-direction: column; gap: 3px; }
}
</style>
