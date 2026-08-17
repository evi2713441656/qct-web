<template>
  <div>
    <div class="card" style="margin-bottom: 16px;">
      <h2 class="section-title">发送通知</h2>
      <el-form label-width="80px" style="max-width: 640px;">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="通知标题" maxlength="50" />
        </el-form-item>
        <el-form-item label="内容" required>
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="通知内容" maxlength="500" show-word-limit />
        </el-form-item>
        <el-form-item label="目标" required>
          <el-radio-group v-model="form.target">
            <el-radio v-for="o in TARGET_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.target === 'selected'" label="指定用户">
          <el-select v-model="form.selectedUsers" multiple filterable placeholder="选择用户" style="width: 100%;">
            <el-option v-for="u in users" :key="u.user_id" :label="`${u.name}（${u.student_id}）`" :value="u.user_id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="sending" @click="send">发送通知</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card">
      <h2 class="section-title">通知历史</h2>
      <el-table :data="history" border stripe size="small">
        <el-table-column prop="title" label="标题" width="160" />
        <el-table-column label="目标" width="110">
          <template #default="{ row }">{{ getTargetText(row.type) }}</template>
        </el-table-column>
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="editVisible" title="编辑通知" width="520px">
      <el-form label-width="70px">
        <el-form-item label="标题"><el-input v-model="editForm.title" /></el-form-item>
        <el-form-item label="内容">
          <el-input v-model="editForm.content" type="textarea" :rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  sendNotification, getNotificationHistory, updateNotification, deleteNotification, getApplicationUsers
} from '../../api/admin.js'
import { TARGET_OPTIONS, getTargetText } from '../../utils/status.js'
import { formatTime } from '../../utils/format.js'

const form = ref({ title: '', content: '', target: 'all', selectedUsers: [] })
const users = ref([])
const history = ref([])
const sending = ref(false)

const editVisible = ref(false)
const editForm = ref({ title: '', content: '' })
const editingId = ref('')

const send = async () => {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  if (form.value.target === 'selected' && !form.value.selectedUsers.length) {
    ElMessage.warning('请选择目标用户')
    return
  }
  sending.value = true
  try {
    await sendNotification(form.value)
    ElMessage.success('发送成功')
    form.value = { title: '', content: '', target: 'all', selectedUsers: [] }
    loadHistory()
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    sending.value = false
  }
}

const loadHistory = async () => {
  try {
    const result = await getNotificationHistory()
    history.value = result.data || []
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const openEdit = (row) => {
  editingId.value = row._id
  editForm.value = { title: row.title, content: row.content }
  editVisible.value = true
}

const saveEdit = async () => {
  try {
    await updateNotification(editingId.value, { title: editForm.value.title, content: editForm.value.content })
    ElMessage.success('保存成功')
    editVisible.value = false
    loadHistory()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

const remove = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除通知「${row.title}」吗？`, '提示', { type: 'warning' })
  } catch { return }
  try {
    await deleteNotification(row._id)
    ElMessage.success('已删除')
    loadHistory()
  } catch (e) {
    ElMessage.error(e.message)
  }
}

onMounted(async () => {
  loadHistory()
  try {
    const result = await getApplicationUsers()
    users.value = result.data || []
  } catch { /* 忽略 */ }
})
</script>
