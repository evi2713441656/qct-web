<template>
  <div class="login-page">
    <div class="login-card">
      <h1>青创通 · 管理后台</h1>
      <p class="sub">请使用管理员账号登录</p>
      <el-form @submit.prevent="handleLogin">
        <el-form-item>
          <el-input v-model="form.username" placeholder="用户名" size="large">
            <template #prefix><el-icon><User /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password @keyup.enter="handleLogin">
            <template #prefix><el-icon><Lock /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-button type="primary" size="large" style="width: 100%;" :loading="loading" @click="handleLogin">
          登录
        </el-button>
      </el-form>
      <div class="back-link">
        <el-button link type="primary" @click="$router.push('/')">← 返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { adminLogin } from '../../api/admin.js'

const router = useRouter()
const form = ref({ username: '', password: '' })
const loading = ref(false)

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    await adminLogin(form.value.username, form.value.password)
    ElMessage.success('登录成功')
    router.push('/admin/dashboard')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4f6ef7 0%, #6a8dff 100%);
  padding: 16px;
}
.login-card {
  width: 380px;
  max-width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 36px 32px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.login-card h1 { font-size: 22px; margin: 0 0 4px; text-align: center; }
.sub { color: var(--text-secondary); text-align: center; font-size: 13px; margin: 0 0 24px; }
.back-link { text-align: center; margin-top: 16px; }
</style>
