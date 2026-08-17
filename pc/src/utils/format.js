/** 毫秒/ISO -> 本地展示 */
export function formatTime(value) {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 智能相对时间 */
export function formatSmartTime(value) {
  if (!value) return '-'
  const time = new Date(value).getTime()
  if (isNaN(time)) return String(value)
  const diff = Date.now() - time
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + '分钟前'
  if (diff < day) return Math.floor(diff / hour) + '小时前'
  if (diff < 2 * day) return '昨天 ' + formatTime(value).slice(11)
  if (diff < 7 * day) return Math.floor(diff / day) + '天前'
  const d = new Date(time)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${formatTime(value).slice(11)}`
}

/** 列表转逗号字符串 */
export function listText(arr) {
  if (!arr) return '-'
  if (typeof arr === 'string') return arr
  if (Array.isArray(arr)) return arr.join('、')
  return String(arr)
}
