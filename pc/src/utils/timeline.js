const FIRST_PASS_STATES = ['first_passed', 'waiting_second', 'second_failed', 'department_selection', 'accepted', 'rejected']
const SECOND_PASS_STATES = ['department_selection', 'accepted', 'rejected']

function hasSchedule(config, key) {
  const item = config?.interviewConfig?.[key]
  // 时间公布以日期和开始时间为准，地点可以稍后补充。
  return !!(item && item.date && item.time)
}

export function formatInterviewSchedule(schedule) {
  if (!schedule || !schedule.date || !schedule.time) return '时间待定'
  const time = [schedule.time, schedule.endTime ? `至 ${schedule.endTime}` : ''].filter(Boolean).join(' ')
  return [`${schedule.date} ${time}`.trim(), schedule.location].filter(Boolean).join('\n')
}

export function getTimelineStages(application, config = {}) {
  const recruitment = config.recruitmentTime || {}
  const first = application?.firstInterview || {}
  const second = application?.secondInterview || {}
  const status = application?.status
  const registered = !!application
  const firstScheduleSet = hasSchedule(config, 'firstInterview')
  const secondScheduleSet = hasSchedule(config, 'secondInterview')
  const firstPassed = first.result === 'pass' || ['first_passed', 'waiting_second', ...SECOND_PASS_STATES].includes(status)
  const secondPassed = second.result === 'pass' || ['department_selection', 'accepted', 'rejected'].includes(status)

  let signupState = registered ? 'done' : 'active'
  let signupDetail = registered ? '已提交报名' : '请完成报名'

  let firstState = 'inactive'
  let firstDetail = ''
  if (!registered) {
    firstState = 'inactive'
  } else if (first.result === 'pass') {
    firstState = 'done'
    firstDetail = '一面通过'
  } else if (first.result === 'fail' || first.result === 'reject') {
    firstState = 'failed'
    firstDetail = '一面未通过'
  } else if ((status === 'waiting_first' || status === 'registered') && firstScheduleSet) {
    firstState = 'active'
  } else if (status === 'registered') {
    firstState = 'inactive'
    firstDetail = '等待公布一面时间'
  } else {
    firstState = 'next'
  }

  let secondState = 'inactive'
  let secondDetail = ''
  if (second.result === 'pass') {
    secondState = 'done'
    secondDetail = '二面通过'
  } else if (second.result === 'fail') {
    secondState = 'failed'
    secondDetail = '二面未通过'
  } else if ((status === 'waiting_second' || status === 'first_passed') && secondScheduleSet) {
    secondState = 'active'
  } else if (registered && firstPassed) {
    secondState = 'next'
  }

  let admissionState = 'inactive'
  let admissionDetail = ''
  if (status === 'accepted') {
    admissionState = 'done'
    admissionDetail = '已录取'
  } else if (status === 'rejected') {
    admissionState = 'failed'
    admissionDetail = '未录取'
  } else if (status === 'department_selection') {
    admissionState = 'active'
    admissionDetail = '请选择录取部门'
  } else if (registered && secondPassed) {
    admissionState = 'next'
  }

  const stages = [
    { key: 'signup', label: '报名', date: recruitment.startDate || '以通知为准', state: signupState, detail: signupDetail },
    { key: 'first', label: '一面', date: formatInterviewSchedule(config.interviewConfig?.firstInterview), state: firstState, detail: firstDetail },
    { key: 'second', label: '二面', date: formatInterviewSchedule(config.interviewConfig?.secondInterview), state: secondState, detail: secondDetail },
    // 录取确认截止时间不等同于报名截止时间，时间线上的录取节点不展示报名日期。
    { key: 'admission', label: '录取', date: '', state: admissionState, detail: admissionDetail }
  ]

  return stages.map((stage, index) => {
    const next = stages[index + 1]
    const lineState = next?.state === 'active'
      ? 'flow'
      : stage.state === 'done' && next?.state === 'done' ? 'done' : 'idle'
    return { ...stage, lineState }
  })
}
