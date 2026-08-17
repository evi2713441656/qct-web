<template>
  <el-container class="admin-layout">
    <el-aside width="200px" class="admin-aside">
      <div class="admin-logo">青创通 · 管理后台</div>
      <el-menu :default-active="route.path" router background-color="#1f2d3d" text-color="#c0c4cc"
        active-text-color="#fff" class="admin-menu">
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据总览</span>
        </el-menu-item>
        <el-menu-item index="/admin/applications">
          <el-icon><Document /></el-icon>
          <span>报名管理</span>
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
        <span>{{ adminInfo ? adminInfo.name || adminInfo.username : '管理员' }}</span>
        <el-button link type="primary" @click="handleLogout">退出登录</el-button>
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
.admin-layout { height: 100vh; }
.admin-aside { background: #1f2d3d; }
.admin-logo {
  height: 56px;
  line-height: 56px;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
  background: #182432;
}
.admin-menu { border-right: none; }
.admin-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: #fff;
  border-bottom: 1px solid var(--border);
}
.admin-main { background: var(--bg); }
</style>
