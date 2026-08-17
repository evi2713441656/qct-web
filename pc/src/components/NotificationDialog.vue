<template>
  <el-dialog v-model="visible" title="发送通知" width="560px" @open="init">
    <el-form label-width="80px">
      <el-form-item label="标题" required>
        <el-input v-model="form.title" placeholder="通知标题" maxlength="50" />
      </el-form-item>
      <el-form-item label="内容" required>
        <el-input v-model="form.content" type="textarea" :rows="4" placeholder="通知内容" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="目标" required>
        <el-select v-model="form.target" style="width: 100%;">
          <el-option v-for="o in TARGET_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.target === 'selected'" label="指定用户">
        <el-select v-model="form.selectedUsers" multiple filterable placeholder="选择用户" style="width: 100%;">
          <el-option v-for="u in users" :key="u.user_id" :label="`${u.name}（${u.student_id}）`" :value="u.user_id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="sending" @click="send">发送</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { sendNotification, getApplicationUsers } from '../api/admin.js'
import { TARGET_OPTIONS } from '../utils/status.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 页面上下文可选默认目标（如当前筛选状态） */
  defaultTarget: { type: String, default: 'all' }
})
const emit = defineEmits(['update:modelValue', 'sent'])

const innerVisible = ref(props.modelValue)
const visible = computed({
  get: () => innerVisible.value,
  set: (v) => {
    innerVisible.value = v
    emit('update:modelValue', v)
  }
})
watch(() => props.modelValue, (v) => {
  innerVisible.value = v
})

const sending = ref(false)
const users = ref([])
const form = ref({ title: '', content: '', target: 'all', selectedUsers: [] })

const init = async () => {
  form.value = { title: '', content: '', target: props.defaultTarget || 'all', selectedUsers: [] }
  try {
    const result = await getApplicationUsers()
    users.value = result.data || []
  } catch { /* 忽略 */ }
}

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
    visible.value = false
    emit('sent')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    sending.value = false
  }
}
</script>