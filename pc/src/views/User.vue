<template>
  <div class="page-container">
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
      <div class="card" style="margin-bottom: 16px;">
        <h2 class="section-title">基本信息</h2>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="姓名">{{ user.name }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ user.student_id }}</el-descriptions-item>
          <el-descriptions-item label="最近登录">{{ formatTime(user.lastLoginTime) }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="card" style="margin-bottom: 16px;">
        <h2 class="section-title">申请进度</h2>
        <div v-if="application" class="status-summary">
          <el-steps :active="stepActive" align-center finish-status="success" style="margin: 12px 0 20px;">
            <el-step title="报名" />
            <el-step title="一面" />
            <el-step title="二面" />
            <el-step title="录取" />
          </el-steps>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="状态">
              <span :class="'status-' + application.status" style="font-weight: 600;">
                {{ getStatusText(application.status) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="意向部门">{{ listText(application.departments) }}</el-descriptions-item>
            <el-descriptions-item v-if="application.finalDepartment" label="录取部门">
              <el-tag type="success">{{ application.finalDepartment }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-else class="muted">
          暂无申请记录
          <el-button link type="primary" @click="$router.push('/apply')">去报名 →</el-button>
        </div>
      </div>

      <div class="card">
        <h2 class="section-title">通知消息</h2>
        <el-empty v-if="!notifications.length" description="暂无通知" :image-size="80" />
        <div v-else>
          <div v-for="n in notifications" :key="n._id" class="notice-item">
            <div class="notice-head">
              <span class="notice-title">{{ n.title }}</span>
              <span class="notice-time">{{ formatSmartTime(n.createdAt) }}</span>
            </div>
            <div class="notice-content">{{ n.content }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserInfo, isLoggedIn, logout } from '../api/auth.js'
import { getApplication } from '../api/application.js'
import { callCloudOrThrow } from '../api/http.js'
import { getStatusText } from '../utils/status.js'
import { formatTime, formatSmartTime, listText } from '../utils/format.js'

const router = useRouter()
const user = ref(getUserInfo())
const application = ref(null)
const notifications = ref([])

const stepActive = computed(() => {
  const s = application.value?.status
  if (!s) return 0
  if (s === 'waiting_first') return 1
  if (['first_passed', 'first_failed', 'first_reject', 'waiting_second'].includes(s)) return 2
  if (['second_failed', 'department_selection', 'accepted', 'rejected'].includes(s)) return 3
  return 1
})

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
  setInterval(loadApplication, 60000)
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
.muted { color: var(--text-secondary); font-size: 13px; }
.notice-item {
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.notice-item:last-child { border-bottom: none; }
.notice-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.notice-title { font-weight: 600; font-size: 14px; }
.notice-time { color: var(--text-secondary); font-size: 12px; }
.notice-content { font-size: 13px; color: var(--text-regular); line-height: 1.7; white-space: pre-wrap; }
</style>
