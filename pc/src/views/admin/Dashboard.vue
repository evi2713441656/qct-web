<template>
  <div>
    <el-row :gutter="16">
      <el-col v-for="card in statCards" :key="card.label" :xs="12" :sm="8" :md="4">
        <div class="stat-card" :style="{ borderTopColor: card.color }">
          <div class="stat-value">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px;">
      <el-col :xs="24" :md="12">
        <div class="card">
          <h2 class="section-title">状态分布</h2>
          <el-table :data="byStatus" size="small" border>
            <el-table-column prop="_id" label="状态" width="180">
              <template #default="{ row }">
                <span :class="'status-' + row._id">{{ getStatusText(row._id) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="人数" width="100" />
            <el-table-column label="占比">
              <template #default="{ row }">
                <el-progress :percentage="percent(row.count)" :show-text="false" :stroke-width="10" />
                <span style="font-size: 12px; color: var(--text-secondary);">{{ percent(row.count) }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :md="12">
        <div class="card">
          <h2 class="section-title">部门分布</h2>
          <el-table :data="byDepartment" size="small" border>
            <el-table-column prop="_id" label="部门" />
            <el-table-column prop="count" label="报名人数" width="120" />
            <el-table-column label="占比">
              <template #default="{ row }">
                <el-progress :percentage="percent(row.count)" :show-text="false" :stroke-width="10" />
                <span style="font-size: 12px; color: var(--text-secondary);">{{ percent(row.count) }}%</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="card" style="margin-top: 16px;">
      <h2 class="section-title">快捷入口</h2>
      <div class="quick-links">
        <el-button type="primary" @click="$router.push('/admin/applications')">报名管理</el-button>
        <el-button type="success" @click="$router.push('/admin/second-interview')">二面管理</el-button>
        <el-button type="warning" @click="$router.push('/admin/admissions')">录取名单</el-button>
        <el-button @click="$router.push('/admin/notifications')">通知管理</el-button>
        <el-button @click="$router.push('/admin/settings')">系统设置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getStatistics } from '../../api/admin.js'
import { getStatusText } from '../../utils/status.js'

const stats = ref({ byStatus: [], byDepartment: [] })

const statCards = computed(() => [
  { label: '总报名', value: stats.value.total ?? '-', color: '#409eff' },
  { label: '今日新增', value: stats.value.today ?? '-', color: '#67c23a' },
  { label: '一面通过', value: stats.value.first_passed ?? '-', color: '#e6a23c' },
  { label: '进入二面', value: stats.value.entered_second ?? '-', color: '#f56c6c' },
  { label: '二面通过', value: stats.value.second_passed ?? '-', color: '#8e44ad' },
  { label: '已录取', value: stats.value.joined_us ?? '-', color: '#67c23a' }
])

const byStatus = computed(() => stats.value.byStatus || [])
const byDepartment = computed(() => stats.value.byDepartment || [])

const percent = (count) => {
  const total = stats.value.total || 0
  return total ? Math.round((count / total) * 100) : 0
}

onMounted(async () => {
  try {
    const result = await getStatistics()
    stats.value = result.data || {}
  } catch (e) {
    ElMessage.error(e.message)
  }
})
</script>

<style scoped>
.stat-card {
  position: relative;
  overflow: hidden;
  padding: 18px 16px;
  border: 1px solid #e5eaf1;
  border-top: 3px solid;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(32, 52, 84, 0.07), 0 6px 16px rgba(32, 52, 84, 0.035);
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  margin-bottom: 16px;
}
.stat-card:hover { transform: translateY(-2px); box-shadow: 0 5px 14px rgba(32, 52, 84, 0.11); }
.stat-value { color: #26364f; font-size: 28px; font-weight: 700; line-height: 1.1; }
.stat-label { color: #718097; font-size: 13px; margin-top: 7px; }
.quick-links { display: flex; gap: 10px; flex-wrap: wrap; }
</style>
