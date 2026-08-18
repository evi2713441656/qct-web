<template>
  <div>
    <div class="card" style="margin-bottom: 16px;">
      <h2 class="section-title">报名时间设置</h2>
      <el-form label-width="90px" style="max-width: 560px;">
        <el-form-item label="开始日期">
          <el-date-picker v-model="config.recruitmentTime.startDate" type="date" value-format="YYYY-MM-DD"
            style="width: 200px;" />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker v-model="config.recruitmentTime.endDate" type="date" value-format="YYYY-MM-DD"
            style="width: 200px;" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker v-model="config.recruitmentTime.endTime" format="HH:mm" value-format="HH:mm"
            style="width: 200px;" />
        </el-form-item>
      </el-form>
    </div>

    <div class="card" style="margin-bottom: 16px;">
      <h2 class="section-title">面试安排</h2>
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <div class="interview-config">
            <h3>一面</h3>
            <el-form label-width="70px" size="small">
              <el-form-item label="日期">
                <el-date-picker v-model="first.date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="开始时间">
                <el-time-picker v-model="first.time" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="结束时间">
                <el-time-picker v-model="first.endTime" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="地点">
                <el-input v-model="first.location" />
              </el-form-item>
              <el-form-item label="签到">
                <el-switch v-model="first.checkInEnabled" active-text="开启" />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="interview-config">
            <h3>二面</h3>
            <el-form label-width="70px" size="small">
              <el-form-item label="日期">
                <el-date-picker v-model="second.date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="开始时间">
                <el-time-picker v-model="second.time" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="结束时间">
                <el-time-picker v-model="second.endTime" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
              </el-form-item>
              <el-form-item label="地点">
                <el-input v-model="second.location" />
              </el-form-item>
              <el-form-item label="签到">
                <el-switch v-model="second.checkInEnabled" active-text="开启" />
              </el-form-item>
            </el-form>
          </div>
        </el-col>
      </el-row>
      <el-button type="primary" :loading="saving" @click="save">保存设置</el-button>
    </div>

    <div class="card">
      <h2 class="section-title">部门详情</h2>
      <el-tabs v-model="activeDept">
        <el-tab-pane v-for="d in deptKeys" :key="d" :label="d" :name="d" />
      </el-tabs>
      <template v-if="activeDept">
        <el-form label-width="80px" style="max-width: 720px;">
          <el-form-item label="名称">
            <el-input v-model="deptForm.name" />
          </el-form-item>
          <el-form-item label="简称">
            <el-input v-model="deptForm.shortName" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="deptForm.description" />
          </el-form-item>
          <el-form-item label="颜色">
            <el-color-picker v-model="deptForm.color" />
          </el-form-item>
          <el-form-item label="介绍">
            <el-input v-model="deptForm.introduction" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="职责">
            <el-input v-model="deptDutiesText" type="textarea" :rows="3" placeholder="每行一条" />
          </el-form-item>
          <el-form-item label="要求">
            <el-input v-model="deptRequirementsText" type="textarea" :rows="3" placeholder="每行一条" />
          </el-form-item>
        </el-form>
      </template>
      <el-button type="primary" :loading="saving" @click="save">保存全部设置</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSystemConfigAdmin, updateSystemConfig } from '../../api/admin.js'

const config = reactive({
  recruitmentTime: { startDate: '', endDate: '', endTime: '23:59' },
  interviewConfig: { firstInterview: {}, secondInterview: {} },
  departmentDetails: {}
})

const first = computed(() => config.interviewConfig.firstInterview)
const second = computed(() => config.interviewConfig.secondInterview)
const deptKeys = computed(() => Object.keys(config.departmentDetails || {}))
const activeDept = ref('')
const saving = ref(false)

const deptForm = reactive({ name: '', shortName: '', color: '', description: '', introduction: '' })
const deptDutiesText = ref('')
const deptRequirementsText = ref('')

watch(activeDept, (key) => {
  if (!key) return
  const d = config.departmentDetails[key] || {}
  Object.assign(deptForm, {
    name: d.name || key,
    shortName: d.shortName || '',
    color: d.color || '#4f6ef7',
    description: d.description || '',
    introduction: d.introduction || ''
  })
  deptDutiesText.value = (d.duties || []).join('\n')
  deptRequirementsText.value = (d.requirements || []).join('\n')
})

const save = async () => {
  saving.value = true
  try {
    const data = {
      recruitmentTime: { ...config.recruitmentTime },
      interviewConfig: {
        firstInterview: {
          date: first.value.date || '',
          time: first.value.time || '',
          endTime: first.value.endTime || '',
          location: first.value.location || '',
          isSet: !!(first.value.date && first.value.time && first.value.location),
          checkInEnabled: !!first.value.checkInEnabled
        },
        secondInterview: {
          date: second.value.date || '',
          time: second.value.time || '',
          endTime: second.value.endTime || '',
          location: second.value.location || '',
          isSet: !!(second.value.date && second.value.time && second.value.location),
          checkInEnabled: !!second.value.checkInEnabled
        }
      },
      departmentDetails: config.departmentDetails
    }
    if (activeDept.value) {
      data.departmentDetails[activeDept.value] = {
        ...config.departmentDetails[activeDept.value],
        name: deptForm.name,
        shortName: deptForm.shortName,
        color: deptForm.color,
        description: deptForm.description,
        introduction: deptForm.introduction,
        duties: deptDutiesText.value.split('\n').map((s) => s.trim()).filter(Boolean),
        requirements: deptRequirementsText.value.split('\n').map((s) => s.trim()).filter(Boolean)
      }
    }
    await updateSystemConfig(data)
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error(e.message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    const result = await getSystemConfigAdmin()
    const d = result.data || {}
    Object.assign(config.recruitmentTime, d.recruitmentTime || {})
    const ic = d.interviewConfig || {}
    config.interviewConfig = {
      firstInterview: { date: '', time: '', endTime: '', location: '', isSet: false, checkInEnabled: false, ...(ic.firstInterview || {}) },
      secondInterview: { date: '', time: '', endTime: '', location: '', isSet: false, checkInEnabled: false, ...(ic.secondInterview || {}) }
    }
    config.departmentDetails = d.departmentDetails || {}
    if (deptKeys.value.length) activeDept.value = deptKeys.value[0]
  } catch (e) {
    ElMessage.error(e.message)
  }
})
</script>

<style scoped>
.interview-config {
  padding: 18px;
  border: 1px solid #e5eaf1;
  border-radius: 10px;
  background: #f8faff;
  margin-bottom: 12px;
}
.interview-config h3 { margin: 0 0 14px; color: #33445f; font-size: 15px; }
</style>
