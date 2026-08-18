export const STATUS_MAP = {
  registered: { text: '报名成功', color: '#67c23a' },
  waiting_first: { text: '等待一面', color: '#409eff' },
  interviewed: { text: '已面试', color: '#409eff' },
  first_passed: { text: '一面通过', color: '#e6a23c' },
  first_failed: { text: '一面未通过', color: '#f56c6c' },
  first_reject: { text: '一面拒绝', color: '#909399' },
  waiting_second: { text: '等待二面', color: '#409eff' },
  second_failed: { text: '二面未通过', color: '#f56c6c' },
  department_selection: { text: '选择部门', color: '#67c23a' },
  accepted: { text: '已录取', color: '#67c23a' },
  rejected: { text: '已拒绝', color: '#909399' }
}

export const STATUS_OPTIONS = [
  { value: 'all', label: '全部状态' },
  ...Object.entries(STATUS_MAP).map(([value, s]) => ({ value, label: s.text }))
]

export function getStatusText(status) {
  return (STATUS_MAP[status] || { text: status || '未知' }).text
}

export function isInterviewPublished(config, type) {
  const schedule = config?.interviewConfig?.[type === 'first' ? 'firstInterview' : 'secondInterview']
  return !!(schedule?.date && schedule?.time)
}

/** 展示用状态：时间尚未公布时保留“报名成功/一面通过”语义。 */
export function getDisplayStatus(app, config = {}) {
  if (!app) return ''
  if (app.status === 'registered') return 'registered'
  if (app.status === 'waiting_first' && !isInterviewPublished(config, 'first')) return 'registered'
  if (app.status === 'first_passed' && !isInterviewPublished(config, 'second')) return 'first_passed'
  return app.status
}

export function getDisplayStatusText(app, config = {}) {
  return getStatusText(getDisplayStatus(app, config))
}

export function getStatusColor(status) {
  return (STATUS_MAP[status] || { color: '#909399' }).color
}

/** 派生状态：waiting_first + 一面 completed = 已面试 */
export function deriveStatus(app) {
  if (app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed') {
    return 'interviewed'
  }
  return app.status
}

export const TARGET_OPTIONS = [
  { value: 'all', label: '全部用户' },
  { value: 'registered', label: '报名成功' },
  { value: 'waiting_first', label: '等待一面' },
  { value: 'interviewed', label: '已面试' },
  { value: 'first_passed', label: '一面通过' },
  { value: 'first_failed', label: '一面未通过' },
  { value: 'first_reject', label: '一面拒绝' },
  { value: 'waiting_second', label: '等待二面' },
  { value: 'second_failed', label: '二面未通过' },
  { value: 'department_selection', label: '选择部门' },
  { value: 'accepted', label: '已录取' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'selected', label: '指定用户' }
]

export function getTargetText(type) {
  const t = TARGET_OPTIONS.find((o) => o.value === type)
  return t ? t.label : type || '全部用户'
}
