<template>
  <div class="home-page">
    <header class="hero">
      <div class="hero-inner">
        <div>
          <h1>青创通 · 招新系统</h1>
          <p class="hero-sub">加入我们，让每一份热爱都有回响</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/apply')">立即报名</el-button>
            <el-button size="large" plain @click="$router.push('/user')">我的申请</el-button>
            <el-button size="large" text class="admin-link" @click="$router.push('/admin/login')">管理入口 →</el-button>
          </div>
        </div>
        <div v-if="countdownText" class="countdown card">
          <div class="countdown-title">报名{{ isOpen ? '截止' : '开始' }}倒计时</div>
          <div class="countdown-time">{{ countdownText }}</div>
        </div>
      </div>
    </header>

    <main class="page-container">
      <section v-if="timeline.length" class="card" style="margin-bottom: 16px;">
        <h2 class="section-title">招新时间线</h2>
        <el-steps :active="timeline.length" align-center>
          <el-step v-for="t in timeline" :key="t.label" :title="t.label" :description="t.date" />
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
import { ref, computed, onMounted } from 'vue'
import { getSystemConfig } from '../api/auth.js'
import { getUserInfo } from '../api/auth.js'

const config = ref({})
const departments = ref([])

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

const timeline = computed(() => {
  const t = config.value.recruitmentTime
  if (!t || !t.startDate) return []
  return [
    { label: '报名', date: t.startDate },
    { label: '一面', date: '以通知为准' },
    { label: '二面', date: '以通知为准' },
    { label: '录取', date: t.endDate || '以通知为准' }
  ]
})

const isOpen = ref(false)
const countdownText = ref('')

function calcCountdown() {
  const start = config.value.applicationStartTime
  const end = config.value.applicationEndTime
  if (!start && !end) return
  const now = Date.now()
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

function diffText(ms) {
  if (ms <= 0) return '已结束'
  const day = Math.floor(ms / 86400000)
  const hour = Math.floor((ms % 86400000) / 3600000)
  const minute = Math.floor((ms % 3600000) / 60000)
  if (day > 0) return `${day}天 ${hour}小时`
  if (hour > 0) return `${hour}小时 ${minute}分钟`
  return `${minute}分钟`
}

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
  setInterval(calcCountdown, 60000)
})
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #4f6ef7 0%, #6a8dff 50%, #8ab4ff 100%);
  color: #fff;
  padding: 48px 16px;
}
.hero-inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.hero h1 { font-size: 32px; margin: 0 0 8px; }
.hero-sub { opacity: 0.9; margin: 0 0 24px; }
.countdown { text-align: center; min-width: 200px; }
.countdown-title { color: var(--text-secondary); font-size: 13px; }
.countdown-time { font-size: 26px; font-weight: 700; color: var(--primary); margin-top: 6px; }
.admin-link { color: #fff !important; }
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
</style>
