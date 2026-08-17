import { callCloudOrThrow } from './http.js'

/** 管理员登录 */
export async function adminLogin(username, password) {
  const result = await callCloudOrThrow('admin', { type: 'login', username, password })
  const { adminInfo, token } = result.data
  localStorage.setItem('adminInfo', JSON.stringify(adminInfo))
  if (token) localStorage.setItem('adminToken', token)
  return result.data
}

export function isAdminLoggedIn() {
  return !!localStorage.getItem('adminToken')
}

export function adminLogout() {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminInfo')
}

/** 统计 */
export function getStatistics() {
  return callCloudOrThrow('admin', { type: 'statistics' })
}

/** 系统配置（管理） */
export function getSystemConfigAdmin() {
  return callCloudOrThrow('admin', { type: 'getSystemConfigAdmin' })
}

/** 更新系统配置 */
export function updateSystemConfig(configData) {
  return callCloudOrThrow('admin', { type: 'updateSystemConfig', configData })
}

/** 发送通知（扁平字段） */
export function sendNotification({ title, content, target, selectedUsers }) {
  return callCloudOrThrow('admin', { type: 'send_notification', title, content, target, selectedUsers })
}

/** 通知历史 */
export function getNotificationHistory() {
  return callCloudOrThrow('admin', { type: 'getNotificationHistory' })
}

/** 编辑通知 */
export function updateNotification(notificationId, updateData) {
  return callCloudOrThrow('admin', { type: 'updateNotification', notificationId, updateData })
}

/** 删除通知 */
export function deleteNotification(notificationId) {
  return callCloudOrThrow('admin', { type: 'deleteNotification', notificationId })
}

/** 导出数据（服务端过滤） */
export function exportData({ status = [], departments = [] }) {
  return callCloudOrThrow('admin-api', { action: 'exportData', exportOptions: { status, departments } })
}

/** 报名用户列表（通知选人用） */
export function getApplicationUsers() {
  return callCloudOrThrow('admin-api', { action: 'getApplicationUsers' })
}

/** 提醒确认部门 */
export function remindDepartmentSelection(userId, userName) {
  return callCloudOrThrow('admin-api', { action: 'remindDepartmentSelection', userId, userName })
}

/** 录取名单 */
export function getAdmissions() {
  return callCloudOrThrow('admin-api', { action: 'getAdmissions' })
}
