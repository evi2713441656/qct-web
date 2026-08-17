import { callCloudOrThrow } from './http.js'

/** 提交报名 */
export function submitApplication(data) {
  return callCloudOrThrow('application', { type: 'submit', data })
}

/** 获取本人申请（传 userId 或由 token 推导） */
export function getApplication(userId) {
  return callCloudOrThrow('application', { type: 'get', userId })
}

/** 修改报名 */
export function updateApplication(data, applicationId) {
  return callCloudOrThrow('application', { type: 'update', data, applicationId })
}

/** 删除申请 */
export function deleteApplication(userId, applicationId) {
  return callCloudOrThrow('application', { type: 'delete', userId, applicationId })
}

/** 管理员：分页列表 */
export function listApplications(params = {}) {
  return callCloudOrThrow('application', { type: 'list', ...params })
}

/** 管理员：状态流转 */
export function updateStatus(applicationId, status, extra = {}) {
  return callCloudOrThrow('application', { type: 'update_status', applicationId, status, ...extra })
}

/** 面试状态（管理端标记已面试） */
export function updateInterviewStatus(applicationId, interviewType, status) {
  return callCloudOrThrow('application', {
    type: 'update_interview_status',
    applicationId,
    interviewType,
    status
  })
}

/** 管理端改报名信息 */
export function updateApplicationInfo(applicationId, updateData) {
  return callCloudOrThrow('application', { type: 'update_application_info', applicationId, updateData })
}

/** 面试签到（用户端） */
export function checkIn(interviewType, userId) {
  return callCloudOrThrow('application', { type: 'check_in', interviewType, userId })
}

/** 选择录取部门 */
export function selectDepartment(applicationId, department, userId) {
  return callCloudOrThrow('application', { type: 'select_department', applicationId, department, userId })
}

/** 拒绝录取 */
export function rejectDepartment(applicationId, userId) {
  return callCloudOrThrow('application', { type: 'reject_department', applicationId, userId })
}
