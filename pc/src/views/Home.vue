<template>
  <div class="home-page">
    <header class="hero">
      <button class="admin-corner" type="button" aria-label="进入管理后台" title="管理后台" @click="$router.push('/admin/login')"></button>
      <div class="hero-inner">
        <img class="association-logo" src="/logo.png" alt="广东工业大学青年创新创业协会徽标" />
        <div class="hero-content">
          <h1>青创通 · 招新系统</h1>
          <p class="hero-sub">加入我们，让每一份热爱都有回响</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="goToApply">立即报名</el-button>
            <el-button size="large" plain @click="goToUser">我的申请</el-button>
          </div>
        </div>
        <div v-if="countdownText" class="countdown card">
          <div class="countdown-title">报名{{ isOpen ? '截止' : '开始' }}倒计时</div>
          <div class="countdown-time">{{ countdownText }}</div>
        </div>
        <div class="auth-actions">
          <el-popover
            v-model:visible="notificationVisible"
            placement="bottom-end"
            trigger="hover"
            :width="360"
            @show="markNotificationsAsRead"
          >
            <template #reference>
              <el-badge class="notification-badge" :is-dot="unreadNotifications > 0">
                <el-button class="notification-trigger" circle text aria-label="信息提示">
                  <el-icon><Bell /></el-icon>
                </el-button>
              </el-badge>
            </template>
            <div class="notification-popover">
              <div class="notification-popover-head">
                <strong>信息提示</strong>
                <span v-if="notifications.length" class="notification-total">{{ notifications.length }} 条</span>
              </div>
              <el-empty v-if="!notifications.length" description="暂无信息" :image-size="58" />
              <div v-else class="notification-list">
                <article v-for="item in notifications" :key="item._id" class="notification-item">
                  <div class="notification-item-head">
                    <span class="notification-item-title">{{ item.title }}</span>
                    <span v-if="!Number(item.is_read)" class="notification-new">未读</span>
                  </div>
                  <div class="notification-item-content">{{ item.content }}</div>
                  <div class="notification-item-time">{{ formatSmartTime(item.createdAt) }}</div>
                </article>
              </div>
              <el-button v-if="user && isLoggedIn()" link type="primary" class="notification-more" @click="$router.push('/user')">查看全部通知 →</el-button>
            </div>
          </el-popover>
          <template v-if="user && isLoggedIn()">
            <span class="welcome-text">你好！{{ user.name }}同学</span>
            <el-button size="small" plain @click="goToUser">个人中心</el-button>
            <el-button size="small" text class="logout-button" @click="handleLogout">退出</el-button>
          </template>
          <template v-else>
            <el-button size="small" plain @click="loginVisible = true">登录</el-button>
            <el-button size="small" type="primary" @click="openRegister">注册</el-button>
          </template>
        </div>
      </div>
    </header>

    <el-dialog v-model="loginVisible" title="用户登录" width="360px" :close-on-click-modal="false">
      <el-form label-width="72px" @submit.prevent="doLogin">
        <el-form-item label="手机号" required>
          <el-input v-model="loginForm.phone" inputmode="numeric" maxlength="11" placeholder="请输入手机号" autocomplete="tel" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" autocomplete="current-password" @keyup.enter="doLogin" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button link type="primary" @click="switchToRegister">还没有账号？立即注册</el-button>
        <span class="dialog-footer-spacer"></span>
        <el-button @click="loginVisible = false">取消</el-button>
        <el-button type="primary" :loading="loggingIn" @click="doLogin">登录</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="registerVisible" title="用户注册" width="380px" :close-on-click-modal="false">
      <el-form label-width="72px" @submit.prevent="doRegister">
        <el-form-item label="姓名" required>
          <el-input v-model="registerForm.name" maxlength="64" placeholder="请输入真实姓名" autocomplete="name" />
        </el-form-item>
        <el-form-item label="手机号" required>
          <el-input v-model="registerForm.phone" inputmode="numeric" maxlength="11" placeholder="请输入手机号" autocomplete="tel" />
        </el-form-item>
        <template v-if="smsEnabled">
          <el-form-item label="验证码" required>
            <div class="verification-row">
              <el-input v-model="registerForm.verificationCode" inputmode="numeric" maxlength="6" placeholder="请输入短信验证码" autocomplete="one-time-code" />
              <el-button :disabled="codeCountdown > 0" :loading="sendingCode" @click="handleSendCode">
                {{ codeCountdown > 0 ? `${codeCountdown}s 后重发` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </template>
        <el-form-item v-else label="安全验证" required>
          <SliderCaptcha
            v-model="sliderVerified"
            :challenge="sliderChallenge"
            @verified="sliderPosition = $event"
            @refresh="loadSliderChallenge"
          />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="registerForm.password" type="password" show-password placeholder="字母和数字组合" autocomplete="new-password" @keyup.enter="doRegister" />
          <div class="password-tip">密码必须同时包含字母和数字</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="registerVisible = false">取消</el-button>
        <el-button type="primary" :loading="registering" @click="doRegister">注册并登录</el-button>
      </template>
    </el-dialog>

    <main class="page-container">
      <section v-if="timelineStages.length" class="card timeline-card">
        <h2 class="section-title">招新时间线</h2>
        <el-steps class="timeline-steps" :active="0" align-center>
          <el-step v-for="(stage, index) in timelineStages" :key="stage.key" :class="['timeline-step', `stage-${stage.state}`, `line-${stage.lineState}`]" :title="stage.label">
            <template #icon>
              <span class="timeline-node">
                <el-icon v-if="stage.state === 'done'"><Check /></el-icon>
                <span v-else>{{ index + 1 }}</span>
              </span>
            </template>
            <template #description>
              <div v-if="stage.date" class="timeline-date">{{ stage.date }}</div>
              <div v-if="stage.detail" class="timeline-result">{{ stage.detail }}</div>
            </template>
          </el-step>
        </el-steps>
      </section>

      <section class="card">
        <h2 class="section-title">三大部门</h2>
        <el-row :gutter="16">
          <el-col v-for="d in departments" :key="d.name" :xs="24" :sm="8">
            <div class="dept-card" :style="{ borderTopColor: d.color }">
              <div class="dept-name">
                <span class="dept-dot" :style="{ background: d.color }"></span>
                {{ d.name }}
              </div>
              <div class="dept-desc">{{ d.description }}</div>
              <div class="dept-intro">{{ d.introduction }}</div>
              <div class="dept-block">
                <div class="dept-block-title">你将获得</div>
                <ul>
                  <li v-for="x in d.duties" :key="x">{{ x }}</li>
                </ul>
              </div>
              <div class="dept-block">
                <div class="dept-block-title">我们寻找</div>
                <ul>
                  <li v-for="x in d.requirements" :key="x">{{ x }}</li>
                </ul>
              </div>
            </div>
          </el-col>
        </el-row>
      </section>
    </main>

    <footer class="footer">青创协会 · 招新系统</footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Bell, Check } from '@element-plus/icons-vue'
import {
  getRegistrationOptions, getSliderChallenge, getSystemConfig, getUserInfo,
  isLoggedIn, login, logout, register, sendSmsCode
} from '../api/auth.js'
import { getApplication } from '../api/application.js'
import { getMyNotifications, getPublicNotifications, markNotificationsRead } from '../api/notification.js'
import { formatSmartTime } from '../utils/format.js'
import { getTimelineStages } from '../utils/timeline.js'
import SliderCaptcha from '../components/SliderCaptcha.vue'

const router = useRouter()
const config = ref({})
const departments = ref([])
const currentTime = ref(Date.now())
const user = ref(getUserInfo())
const application = ref(null)
const loginVisible = ref(false)
const registerVisible = ref(false)
const loggingIn = ref(false)
const registering = ref(false)
const sendingCode = ref(false)
const codeCountdown = ref(0)
const smsEnabled = ref(false)
const sliderChallenge = ref(null)
const sliderVerified = ref(false)
const sliderPosition = ref(null)
let codeTimer = null
const loginForm = ref({ phone: '', password: '' })
const registerForm = ref({ name: '', phone: '', verificationCode: '', password: '' })
const notifications = ref([])
const notificationVisible = ref(false)
const publicReadIds = ref(readPublicNotificationIds())

const unreadNotifications = computed(() => notifications.value.filter((item) => !Number(item.is_read)).length)

const defaultDepartments = [
  {
    name: '策划部',
    color: '#FF6B6B',
    description: '协会的"大脑"',
    introduction: '主导活动方案设计，协调各部门分工，把控每个执行细节，将创意变为现实。',
    duties: ['活动方案设计与策划', '各部门协调与分工安排', '活动执行细节把控', '项目进度管理与风险控制'],
    requirements: ['思维缜密，逻辑清晰', '责任心强，执行力佳', '具备良好的沟通协调能力', '有创新思维和团队合作精神']
  },
  {
    name: '执行部',
    color: '#4ECDC4',
    description: '协会的"行动力"',
    introduction: '参与活动全流程实践，从前期筹备到现场执行，全面提升组织协调与沟通交际能力。',
    duties: ['活动前期筹备与物资准备', '现场执行与协调管理', '主持与现场氛围营造', '突发情况应急处理'],
    requirements: ['责任心强，性格开朗', '具备良好的组织协调能力', '有较强的沟通交际能力', '能够承受一定的工作压力']
  },
  {
    name: '宣传部',
    color: '#45B7D1',
    description: '协会的"信息窗口"',
    introduction: '玩转文字与视觉的艺术，系统掌握新媒体运营全技能，让每一份创意都被看见。',
    duties: ['新媒体内容创作与编辑', '视觉设计与图片处理', '摄影摄像与后期制作', '品牌形象设计与维护'],
    requirements: ['对新媒体运营充满热忱', '具备良好的文字表达能力', '有审美能力和创意思维', '熟悉设计软件或愿意学习']
  }
]

const timelineStages = computed(() => getTimelineStages(application.value, config.value))

const isOpen = ref(false)
const countdownText = ref('')


function calcCountdown() {
  const start = config.value.applicationStartTime
  const end = config.value.applicationEndTime
  currentTime.value = Date.now()
  if (!start && !end) return
  const now = currentTime.value
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  if (isNaN(startTime) || isNaN(endTime)) return
  if (now < startTime) {
    isOpen.value = false
    countdownText.value = diffText(startTime - now)
  } else if (now <= endTime) {
    isOpen.value = true
    countdownText.value = diffText(endTime - now)
  } else {
    isOpen.value = false
    countdownText.value = '已结束'
  }
}

function goToApply() {
  if (isLoggedIn()) {
    router.push('/apply')
  } else {
    loginVisible.value = true
  }
}

function goToUser() {
  if (isLoggedIn()) {
    router.push('/user')
  } else {
    loginVisible.value = true
  }
}

async function openRegister() {
  loginVisible.value = false
  registerVisible.value = true
  await loadRegistrationVerification()
}

function switchToRegister() {
  openRegister()
}

async function loadRegistrationVerification() {
  try {
    const result = await getRegistrationOptions()
    smsEnabled.value = !!result.data?.smsEnabled
  } catch {
    // 无法读取服务能力时默认使用滑块验证，避免前端绕过验证。
    smsEnabled.value = false
  }
  if (!smsEnabled.value) {
    await loadSliderChallenge()
  }
}

async function loadSliderChallenge() {
  sliderVerified.value = false
  sliderPosition.value = null
  try {
    const result = await getSliderChallenge()
    sliderChallenge.value = result.data || null
  } catch (error) {
    sliderChallenge.value = null
    ElMessage.error(error.message)
  }
}

function startCodeCountdown() {
  window.clearInterval(codeTimer)
  codeCountdown.value = 60
  codeTimer = window.setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) {
      window.clearInterval(codeTimer)
      codeTimer = null
    }
  }, 1000)
}

async function handleSendCode() {
  const phone = registerForm.value.phone.trim()
  if (!isValidPhone(phone)) {
    ElMessage.warning('请输入正确的手机号后再获取验证码')
    return
  }
  sendingCode.value = true
  try {
    const result = await sendSmsCode(phone)
    startCodeCountdown()
    const debugCode = result.data?.debugCode
    if (debugCode) {
      ElMessage.info(`开发模式验证码：${debugCode}`)
    } else {
      ElMessage.success('验证码已发送，请注意查收短信')
    }
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    sendingCode.value = false
  }
}

function diffText(ms) {
  if (ms <= 0) return '已结束'
  const day = Math.floor(ms / 86400000)
  const hour = Math.floor((ms % 86400000) / 3600000)
  const minute = Math.floor((ms % 3600000) / 60000)
  if (day > 0) return `${day}天 ${hour}小时`
  if (hour > 0) return `${hour}小时 ${minute}分钟`
  return `${minute}分钟`
}

function readPublicNotificationIds() {
  try {
    return JSON.parse(localStorage.getItem('qctPublicReadNotifications') || '[]')
  } catch {
    return []
  }
}

async function loadNotifications() {
  try {
    const result = isLoggedIn() ? await getMyNotifications() : await getPublicNotifications()
    const readIds = new Set(publicReadIds.value)
    notifications.value = (result.data || []).map((item) => ({
      ...item,
      is_read: isLoggedIn() ? item.is_read : (readIds.has(String(item.notification_id)) ? 1 : 0)
    }))
  } catch {
    notifications.value = []
  }
}

async function markNotificationsAsRead() {
  const unread = notifications.value.filter((item) => !Number(item.is_read))
  if (!unread.length) return
  if (isLoggedIn()) {
    try {
      await markNotificationsRead(unread.map((item) => item.notification_id))
    } catch { /* 不阻塞信息提示 */ }
  } else {
    const ids = new Set(publicReadIds.value)
    unread.forEach((item) => ids.add(String(item.notification_id)))
    publicReadIds.value = Array.from(ids).slice(-200)
    localStorage.setItem('qctPublicReadNotifications', JSON.stringify(publicReadIds.value))
  }
  notifications.value = notifications.value.map((item) => ({ ...item, is_read: 1 }))
}

async function loadApplication() {
  if (!isLoggedIn()) {
    application.value = null
    return
  }
  try {
    const result = await getApplication()
    application.value = result.data || null
  } catch {
    application.value = null
  }
}

function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone.trim())
}

function isValidPassword(password) {
  return /[A-Za-z]/.test(password) && /\d/.test(password)
}

async function doLogin() {
  if (!isValidPhone(loginForm.value.phone) || !loginForm.value.password) {
    ElMessage.warning('请输入正确的手机号和密码')
    return
  }
  loggingIn.value = true
  try {
    const data = await login(loginForm.value.phone.trim(), loginForm.value.password)
    user.value = data.userInfo
    await loadApplication()
    await loadNotifications()
    loginForm.value = { phone: '', password: '' }
    loginVisible.value = false
    ElMessage.success('登录成功')
  } catch (error) {
    ElMessage.error(error.message)
  } finally {
    loggingIn.value = false
  }
}

async function doRegister() {
  const { name, phone, verificationCode, password } = registerForm.value
  if (!name.trim() || !isValidPhone(phone)) {
    ElMessage.warning('请输入姓名和正确的手机号')
    return
  }
  if (smsEnabled.value) {
    if (!/^\d{6}$/.test(verificationCode.trim())) {
      ElMessage.warning('请输入 6 位短信验证码')
      return
    }
  } else if (!sliderVerified.value || !sliderChallenge.value || sliderPosition.value == null) {
    ElMessage.warning('请先完成图块滑动验证')
    return
  }
  if (!isValidPassword(password)) {
    ElMessage.warning('密码必须同时包含字母和数字')
    return
  }
  registering.value = true
  try {
    const captcha = smsEnabled.value
      ? {}
      : { sliderChallengeId: sliderChallenge.value.challengeId, sliderPosition: sliderPosition.value }
    const data = await register(name.trim(), phone.trim(), password, smsEnabled.value ? verificationCode.trim() : '', captcha)
    user.value = data.userInfo
    await loadApplication()
    await loadNotifications()
    registerForm.value = { name: '', phone: '', verificationCode: '', password: '' }
    window.clearInterval(codeTimer)
    codeTimer = null
    codeCountdown.value = 0
    registerVisible.value = false
    ElMessage.success('注册成功，已自动登录')
  } catch (error) {
    ElMessage.error(error.message)
    if (!smsEnabled.value) await loadSliderChallenge()
  } finally {
    registering.value = false
  }
}

function handleLogout() {
  logout()
  user.value = null
  application.value = null
  loadNotifications()
  ElMessage.success('已退出登录')
}

onUnmounted(() => {
  window.clearInterval(codeTimer)
})

onMounted(async () => {
  try {
    const result = await getSystemConfig()
    config.value = result.data || {}
    departments.value = config.value.departmentDetails
      ? Object.values(config.value.departmentDetails)
      : defaultDepartments
  } catch (e) {
    departments.value = defaultDepartments
  }
  calcCountdown()
  await loadApplication()
  await loadNotifications()
  setInterval(() => {
    calcCountdown()
    loadApplication()
    loadNotifications()
  }, 60000)
})
</script>

<style scoped>
.hero {
  position: relative;
  background: linear-gradient(135deg, #4f6ef7 0%, #6a8dff 50%, #8ab4ff 100%);
  color: #fff;
  padding: 64px 16px 48px;
}
.admin-corner {
  position: absolute;
  z-index: 2;
  top: 14px;
  left: 14px;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  background: rgba(255, 255, 255, 0.16);
  clip-path: polygon(0 0, 100% 0, 0 100%);
  cursor: pointer;
  opacity: 0.42;
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.admin-corner:hover,
.admin-corner:focus-visible {
  opacity: 0.9;
  transform: scale(1.15);
  outline: none;
}
.admin-corner:focus-visible {
  clip-path: none;
  border: 2px solid #fff;
  border-radius: 4px;
}
.hero-inner {
  position: relative;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.association-logo {
  width: 148px;
  height: 148px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: #fff;
}
.hero-content { flex: 1 1 360px; }
.auth-actions {
  position: absolute;
  top: -40px;
  right: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.welcome-text { font-size: 14px; font-weight: 600; }
.notification-badge { display: inline-flex; }
.notification-trigger { color: #fff !important; font-size: 18px; }
.notification-badge :deep(.el-badge__content.is-dot) { top: 3px; right: 3px; border: 2px solid #6a8dff; }
.notification-popover { max-height: 390px; overflow: auto; }
.notification-popover-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; color: #33415c; }
.notification-total, .notification-item-time { color: #8a9ab4; font-size: 12px; }
.notification-list { display: grid; gap: 8px; }
.notification-item { padding: 10px; border-radius: 8px; background: #f7f9fd; }
.notification-item-head { display: flex; align-items: center; gap: 6px; }
.notification-item-title { flex: 1; font-size: 13px; font-weight: 700; color: #33415c; }
.notification-new { color: #fff; background: #f56c6c; border-radius: 8px; padding: 1px 5px; font-size: 10px; }
.notification-item-content { margin: 5px 0; color: #5c6b82; font-size: 12px; line-height: 1.55; white-space: pre-wrap; }
.notification-more { display: block; margin: 8px auto 0; }
.logout-button { color: #fff !important; }
.password-tip { width: 100%; margin-top: 4px; font-size: 12px; line-height: 1.4; color: var(--text-secondary); }
.dialog-footer-spacer { flex: 1; }
.verification-row { display: flex; width: 100%; gap: 8px; }
.verification-row .el-input { flex: 1; }
.verification-row .el-button { flex: 0 0 auto; }
.hero h1 { font-size: 32px; margin: 0 0 8px; }
.hero-sub { opacity: 0.9; margin: 0 0 24px; }
.countdown { text-align: center; min-width: 200px; }
.countdown-title { color: var(--text-secondary); font-size: 13px; }
.countdown-time { font-size: 26px; font-weight: 700; color: var(--primary); margin-top: 6px; }
.timeline-card { margin-bottom: 16px; }
:deep(.timeline-steps .el-step__line) { top: 17px; background: #d8dee8; }
:deep(.timeline-step .el-step__icon) {
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
}
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
:deep(.timeline-step .el-step__title) { margin-top: 5px; font-size: 13px; font-weight: 700; }
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
  animation: timeline-active-pulse 1.7s ease-in-out infinite;
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
  animation: timeline-flow 2.8s linear infinite;
}
:deep(.timeline-step.line-done .el-step__line),
:deep(.timeline-step.line-done .el-step__line-inner) {
  width: 100% !important;
  border: 0 !important;
  background: #2eaa78;
  animation: none;
}
:deep(.timeline-step.stage-done .timeline-node) { border-color: #2eaa78; background: #2eaa78; color: #fff; }
:deep(.timeline-step.stage-done .el-step__title) { color: #24926a; }
:deep(.timeline-step.stage-done .timeline-result) { color: #24926a; font-weight: 700; }
:deep(.timeline-step.stage-failed .timeline-node) { border-color: #263238; background: #263238; color: #fff; }
:deep(.timeline-step.stage-failed .el-step__title),
:deep(.timeline-step.stage-failed .timeline-result) { color: #263238; font-weight: 700; }
.timeline-result { margin-top: 4px; font-size: 12px; }
@keyframes timeline-flow {
  from { background-position: 200% 0; }
  to { background-position: 0 0; }
}
@keyframes timeline-active-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(79, 110, 247, 0); }
  50% { box-shadow: 0 0 0 7px rgba(79, 110, 247, 0.2); }
}
@media (prefers-reduced-motion: reduce) {
  :deep(.timeline-step.stage-active .timeline-node),
  :deep(.timeline-step.line-flow .el-step__line-inner) { animation: none; }
}
.dept-card {
  border-top: 4px solid;
  background: #fafbfc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  height: 100%;
}
.dept-name { font-size: 18px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.dept-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dept-desc { color: var(--primary); font-size: 13px; margin: 6px 0 10px; }
.dept-intro { color: var(--text-regular); font-size: 13px; line-height: 1.7; }
.dept-block-title { font-size: 13px; font-weight: 600; margin: 12px 0 6px; color: var(--text-main); }
.dept-block ul { margin: 0; padding-left: 18px; font-size: 13px; color: var(--text-regular); line-height: 1.9; }
.footer { text-align: center; color: var(--text-secondary); font-size: 13px; padding: 24px; }
@media (max-width: 640px) {
  .hero { padding-top: 72px; }
  .hero-inner { justify-content: center; text-align: center; }
  .association-logo { width: 112px; height: 112px; }
  .hero-actions { justify-content: center; }
  .auth-actions { top: -48px; right: 50%; transform: translateX(50%); white-space: nowrap; }
}
</style>
