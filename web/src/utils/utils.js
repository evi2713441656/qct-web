// 工具函数库
import config from '../config/config.js'
import { 
  checkWechatLoginStatus, 
  getWechatUserInfo, 
  getWechatToken,
  needReLogin 
} from './wechat.js'

/**
 * iOS兼容的日期解析函数
 * iOS只支持 "yyyy/MM/dd"、"yyyy/MM/dd HH:mm:ss"、"yyyy-MM-dd"、"yyyy-MM-ddTHH:mm:ss"、"yyyy-MM-ddTHH:mm:ss+HH:mm" 格式
 * @param {string} dateString 日期字符串
 * @returns {Date} 解析后的日期对象
 */
export function parseDate(dateString) {
	if (!dateString) {
		return new Date()
	}
	
	// 如果已经是标准格式，直接返回
	if (dateString.includes('T') || dateString.includes('/')) {
		return new Date(dateString)
	}
	
	// 处理 "yyyy-MM-dd HH:mm" 格式，转换为 "yyyy-MM-ddTHH:mm:ss"
	if (dateString.includes(' ') && dateString.includes('-')) {
		const parts = dateString.split(' ')
		if (parts.length === 2) {
			const datePart = parts[0]
			let timePart = parts[1]
			
			// 确保时间部分有秒数
			const timeParts = timePart.split(':')
			if (timeParts.length === 2) {
				timePart = timePart + ':00'
			}
			
			return new Date(`${datePart}T${timePart}`)
		}
	}
	
	// 处理 "yyyy-MM-dd" 格式
	if (dateString.includes('-') && !dateString.includes(' ')) {
		return new Date(dateString)
	}
	
	// 其他格式尝试直接解析
	return new Date(dateString)
}

/**
 * 统一的时间格式化工具函数 - 符合中国人阅读习惯
 */

/**
 * 格式化完整日期时间 - 2024年01月01日 12:00
 * @param {Date|string|number} dateInput 日期输入
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(dateInput) {
	if (!dateInput) return '未知时间'
	
	try {
		const date = new Date(dateInput)
		if (isNaN(date.getTime())) return '未知时间'
		
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		
		return `${year}年${month}月${day}日 ${hours}:${minutes}`
	} catch (error) {
		console.error('时间格式化失败:', error)
		return '未知时间'
	}
}

/**
 * 格式化日期 - 2024年01月01日
 * @param {Date|string|number} dateInput 日期输入
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateOnly(dateInput) {
	if (!dateInput) return '未知日期'
	
	try {
		const date = new Date(dateInput)
		if (isNaN(date.getTime())) return '未知日期'
		
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		
		return `${year}年${month}月${day}日`
	} catch (error) {
		console.error('日期格式化失败:', error)
		return '未知日期'
	}
}

/**
 * 格式化时间 - 12:00
 * @param {Date|string|number} dateInput 日期输入
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimeOnly(dateInput) {
	if (!dateInput) return '未知时间'
	
	try {
		const date = new Date(dateInput)
		if (isNaN(date.getTime())) return '未知时间'
		
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		
		return `${hours}:${minutes}`
	} catch (error) {
		console.error('时间格式化失败:', error)
		return '未知时间'
	}
}

/**
 * 智能时间格式化 - 根据时间远近自动选择最合适的显示格式
 * @param {Date|string|number} dateInput 日期输入
 * @returns {string} 格式化后的时间字符串
 */
export function formatSmartTime(dateInput) {
	if (!dateInput) return '未知时间'
	
	try {
		const date = new Date(dateInput)
		if (isNaN(date.getTime())) return '未知时间'
		
		const now = new Date()
		const diffMs = now.getTime() - date.getTime()
		const diffMinutes = Math.floor(diffMs / (1000 * 60))
		const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
		
		// 1分钟内
		if (diffMinutes < 1) {
			return '刚刚'
		}
		// 1小时内
		else if (diffMinutes < 60) {
			return `${diffMinutes}分钟前`
		}
		// 24小时内
		else if (diffHours < 24) {
			return `${diffHours}小时前`
		}
		// 7天内
		else if (diffDays < 7) {
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			if (diffDays === 1) {
				return `昨天 ${hours}:${minutes}`
			} else if (diffDays === 2) {
				return `前天 ${hours}:${minutes}`
			} else {
				return `${diffDays}天前`
			}
		}
		// 超过7天显示完整日期时间
		else {
			return formatDateTime(date)
		}
	} catch (error) {
		console.error('智能时间格式化失败:', error)
		return '未知时间'
	}
}

/**
 * 兼容旧版本的格式化日期函数 (保持向后兼容)
 * @param {Date} date 日期对象
 * @param {string} format 格式字符串，默认为 'yyyy-MM-dd HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'yyyy-MM-dd HH:mm:ss') {
	if (!date) {
		return ''
	}
	
	const d = new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	const hours = String(d.getHours()).padStart(2, '0')
	const minutes = String(d.getMinutes()).padStart(2, '0')
	const seconds = String(d.getSeconds()).padStart(2, '0')
	
	return format
		.replace('yyyy', year)
		.replace('MM', month)
		.replace('dd', day)
		.replace('HH', hours)
		.replace('mm', minutes)
		.replace('ss', seconds)
}

// 获取状态文本
export function getStatusText(status, type = 'application') {
  const statusMap = {
    application: {
      waiting_first: '等待一面',
      first_failed: '一面落选',
      waiting_second: '等待二面',
      second_failed: '二面落选',
      department_selection: '部门选择',
      accepted: '已录取',
      rejected: '拒绝加入'
    },
    interview: {
      pending: '待面试',
      completed: '已完成'
    }
  }
  
  return statusMap[type]?.[status] || '未知状态'
}

// 获取状态样式类名
export function getStatusClass(status, type = 'application') {
  const classMap = {
    application: {
      waiting_first: 'status-pending',
      first_failed: 'status-failed',
      waiting_second: 'status-interview',
      second_failed: 'status-failed',
      department_selection: 'status-selection',
      accepted: 'status-passed',
      rejected: 'status-failed'
    },
    interview: {
      pending: 'status-pending',
      completed: 'status-completed'
    }
  }
  
  return classMap[type]?.[status] || 'status-pending'
}

// 验证手机号
export function validatePhone(phone) {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 验证学号
export function validateStudentId(studentId) {
  // 假设学号是8-12位数字
  const studentIdRegex = /^\d{8,12}$/
  return studentIdRegex.test(studentId)
}

// 检查是否在可编辑时间内
export function canEdit() {
  const now = new Date()
  const deadline = new Date(config.recruitmentTime.endDate)
  return now < deadline
}

// 生成唯一ID
export function generateId() {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 深拷贝对象
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
}

// 防抖函数
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// 显示提示信息
export function showToast(title, icon = 'none') {
  uni.showToast({
    title,
    icon,
    duration: 2000
  })
}

// 显示确认对话框
export function showConfirm(title, content) {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 显示加载提示
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载提示
export function hideLoading() {
  uni.hideLoading()
}

// 获取部门信息
export function getDepartmentInfo(departmentName) {
  return config.departments.find(dept => dept.name === departmentName)
}

// 获取部门颜色
export function getDepartmentColor(departmentName) {
  const dept = getDepartmentInfo(departmentName)
  return dept ? dept.color : '#666666'
}

// 验证表单数据
export function validateFormData(formData) {
  const errors = []
  
  if (!formData.name?.trim()) {
    errors.push('请输入姓名')
  }
  
  if (!formData.studentId?.trim()) {
    errors.push('请输入学号')
  } else if (!validateStudentId(formData.studentId)) {
    errors.push('请输入正确的学号格式')
  }
  
  if (!formData.gender || formData.gender === '性别') {
    errors.push('请选择性别')
  }
  
  if (!formData.major?.trim()) {
    errors.push('请输入专业班级')
  }
  
  if (!formData.dormitory?.trim()) {
    errors.push('请输入宿舍号')
  }
  
  if (!formData.phone?.trim()) {
    errors.push('请输入手机号码')
  } else if (!validatePhone(formData.phone)) {
    errors.push('请输入正确的手机号码')
  }
  
  if (!formData.introduction?.trim()) {
    errors.push('请输入自我介绍')
  } else if (formData.introduction.length < config.settings.minIntroductionLength) {
    errors.push(`自我介绍至少${config.settings.minIntroductionLength}字`)
  }
  
  return errors
}

// 本地存储操作
export const storage = {
  set(key, value) {
    try {
      uni.setStorageSync(key, value)
    } catch (e) {
      console.error('存储失败:', e)
    }
  },
  
  get(key) {
    try {
      return uni.getStorageSync(key)
    } catch (e) {
      console.error('读取失败:', e)
      return null
    }
  },
  
  remove(key) {
    try {
      uni.removeStorageSync(key)
    } catch (e) {
      console.error('删除失败:', e)
    }
  },
  
  clear() {
    try {
      uni.clearStorageSync()
    } catch (e) {
      console.error('清空失败:', e)
    }
  }
}

// 微信登录相关工具函数
export const wechatUtils = {
  // 检查是否已登录
  isLoggedIn() {
    const token = getWechatToken()
    const userInfo = getWechatUserInfo()
    return !!(token && userInfo)
  },
  
  // 获取当前用户信息
  getCurrentUser() {
    return getWechatUserInfo()
  },
  
  // 检查登录状态（异步）
  async checkLoginStatus() {
    return await checkWechatLoginStatus()
  },
  
  // 检查是否需要重新登录
  shouldReLogin() {
    return needReLogin()
  },
  
  // 获取用户openid
  getOpenid() {
    const userInfo = getWechatUserInfo()
    return userInfo ? userInfo.openid : null
  },
  
  // 获取用户昵称
  getNickname() {
    const userInfo = getWechatUserInfo()
    return userInfo ? userInfo.nickname : '微信用户'
  },
  
  // 获取用户头像
  getAvatar() {
    const userInfo = getWechatUserInfo()
    return userInfo ? userInfo.avatar : '/static/default-avatar.png'
  }
}

// 微信登录错误处理工具
export const wechatErrorUtils = {
  // 解析微信登录错误信息
  parseLoginError(error) {
    if (!error || !error.message) {
      return '登录失败，请重试'
    }
    
    const message = error.message.toLowerCase()
    
    if (message.includes('invalid code')) {
      return '微信登录凭证已过期，请重新登录'
    } else if (message.includes('微信api错误')) {
      return '微信服务暂时不可用，请稍后重试'
    } else if (message.includes('网络')) {
      return '网络连接失败，请检查网络设置'
    } else if (message.includes('permission denied')) {
      return '用户拒绝授权，无法获取用户信息'
    } else if (message.includes('timeout')) {
      return '登录超时，请重试'
    } else {
      return error.message || '登录失败，请重试'
    }
  },
  
  // 显示登录错误提示
  showLoginError(error) {
    const message = this.parseLoginError(error)
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000
    })
  },
  
  // 检查是否为可重试的错误
  isRetryableError(error) {
    if (!error || !error.message) {
      return false
    }
    
    const message = error.message.toLowerCase()
    return message.includes('网络') || message.includes('timeout') || message.includes('微信服务暂时不可用')
  }
}