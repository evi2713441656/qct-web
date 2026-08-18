<template>
  <el-container class="admin-layout">
    <el-aside width="200px" class="admin-aside">
      <div class="admin-logo">青创通 · 管理后台</div>
      <el-menu :default-active="route.path" router class="admin-menu">
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据总览</span>
        </el-menu-item>
        <el-menu-item index="/admin/applications">
          <el-icon><Document /></el-icon>
          <span>报名管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/first-interview">
          <el-icon><ChatDotSquare /></el-icon>
          <span>一面管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/second-interview">
          <el-icon><ChatDotSquare /></el-icon>
          <span>二面管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/admissions">
          <el-icon><Medal /></el-icon>
          <span>录取名单</span>
        </el-menu-item>
        <el-menu-item index="/admin/notifications">
          <el-icon><Bell /></el-icon>
          <span>通知管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="admin-header">
        <span class="admin-page-title">管理中心</span>
        <div class="admin-account">
          <span class="admin-avatar">{{ (adminInfo?.name || adminInfo?.username || '管').slice(0, 1) }}</span>
          <span>{{ adminInfo ? adminInfo.name || adminInfo.username : '管理员' }}</span>
          <el-button link type="primary" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="admin-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { DataAnalysis, Document, ChatDotSquare, Medal, Bell, Setting } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || 'null')

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定退出登录吗？', '提示', { type: 'warning' })
  } catch {
    return
  }
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminInfo')
  router.push('/admin/login')
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background: #f6f8fc;
  --admin-primary: #3f6ee8;
}
.admin-aside {
  background: #fff;
  border-right: 1px solid #e6ebf2;
  box-shadow: 2px 0 8px rgba(32, 52, 84, 0.05);
}
.admin-logo {
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 22px;
  color: #234aaf;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.02em;
  border-bottom: 1px solid #e8edf4;
}
.admin-menu {
  --el-menu-bg-color: transparent;
  --el-menu-text-color: #59677e;
  --el-menu-active-color: #315fd2;
  border-right: 0;
  padding: 12px 8px;
}
:deep(.admin-menu .el-menu-item) {
  height: 46px;
  margin: 4px 0;
  border-radius: 8px;
  font-size: 14px;
}
:deep(.admin-menu .el-menu-item:hover) { background: #f1f5ff; color: #315fd2; }
:deep(.admin-menu .el-menu-item.is-active) {
  color: #315fd2;
  background: #e9efff;
  font-weight: 650;
}
.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #fff;
  border-bottom: 1px solid #e6ebf2;
  box-shadow: 0 1px 3px rgba(32, 52, 84, 0.05);
}
.admin-page-title { color: #27364f; font-size: 16px; font-weight: 650; }
.admin-account { display: flex; align-items: center; gap: 10px; color: #52627b; font-size: 14px; }
.admin-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #315fd2;
  background: #e9efff;
  font-size: 13px;
  font-weight: 700;
}
.admin-main { padding: 24px; background: #f6f8fc; }
.admin-main :deep(.card) {
  padding: 22px;
  border: 1px solid #e5eaf1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(32, 52, 84, 0.07), 0 6px 16px rgba(32, 52, 84, 0.035);
}
.admin-main :deep(.section-title) { margin-bottom: 18px; color: #27364f; font-size: 18px; }
.admin-main :deep(.section-title::before) { width: 4px; height: 20px; border-radius: 4px; background: var(--admin-primary); }
.admin-main :deep(.toolbar) {
  padding: 12px;
  border: 1px solid #e5eaf1;
  border-radius: 10px;
  background: #f8faff;
}
.admin-main :deep(.batch-bar) {
  padding: 10px 12px;
  border: 1px solid #cfdcff;
  border-radius: 8px;
  background: #edf3ff;
  color: #355fc6;
}
.admin-main :deep(.el-table) {
  --el-table-border-color: #e6ebf2;
  --el-table-header-bg-color: #f6f8fc;
  --el-table-row-hover-bg-color: #f5f8ff;
  overflow: hidden;
  border-radius: 10px;
}
.admin-main :deep(.el-table th.el-table__cell) { color: #52627b; font-size: 13px; font-weight: 650; }
.admin-main :deep(.el-table td.el-table__cell) { color: #37465e; }
.admin-main :deep(.el-input__wrapper),
.admin-main :deep(.el-select__wrapper) { box-shadow: 0 0 0 1px #dce3ed inset; }
.admin-main :deep(.el-input__wrapper.is-focus),
.admin-main :deep(.el-select__wrapper.is-focused) { box-shadow: 0 0 0 2px rgba(63, 110, 232, 0.2) inset; }
.admin-main :deep(.detail-text) { border: 1px solid #e5eaf1; background: #f8faff; }
.admin-main :deep(.interview-config) { border: 1px solid #e5eaf1; background: #f8faff; }
@media (max-width: 768px) {
  .admin-aside { width: 64px !important; }
  .admin-logo { justify-content: center; padding: 0; font-size: 0; }
  .admin-logo::first-letter { font-size: 18px; }
  :deep(.admin-menu .el-menu-item) { justify-content: center; padding: 0 !important; }
  :deep(.admin-menu .el-menu-item span) { display: none; }
  .admin-main { padding: 14px; }
  .admin-page-title { display: none; }
}
</style>
