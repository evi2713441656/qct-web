// 管理页面公共函数库
import { formatDate, formatDateTime, formatSmartTime, getStatusText, getStatusClass, showToast, showConfirm } from './utils.js'

/**
 * 验证和清理申请数据
 * @param {Array} data 原始申请数据
 * @returns {Array} 清理后的申请数据
 */
export function validateApplicationData(data) {
  return data.map(app => {
    // 创建标准化的数据结构
    const formData = {
      name: app.name || app.formData?.name || '未知姓名',
      studentId: app.student_id || app.formData?.studentId || app.formData?.student_id || '未知学号',
      major: app.major || app.formData?.major || '未知专业',
      phone: app.phone || app.formData?.phone || '未知号码',
      gender: app.gender || app.formData?.gender || '未知性别',
      dormitory: app.dormitory || app.formData?.dormitory || '未知宿舍',
      introduction: app.self_introduction || app.formData?.introduction || app.introduction || '暂无自我介绍'
    }
    
    // 格式化申请时间
    let applyTime = '未知时间'
    const timeField = app.createdAt || app.applyTime
    if (timeField) {
      try {
        const date = new Date(timeField)
              const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      applyTime = `${year}年${month}月${day}日 ${hours}:${minutes}`
      } catch (e) {
        applyTime = '未知时间'
      }
    }
    
    // 处理部门信息
    let departments = '未知部门'
    const firstChoice = app.first_choice || app.departments
    const secondChoice = app.second_choice
    
    if (firstChoice && secondChoice && firstChoice !== secondChoice) {
      departments = `第一志愿：${firstChoice}，第二志愿：${secondChoice}`
    } else if (firstChoice) {
      departments = `${firstChoice}`
    } else if (app.departments) {
      if (Array.isArray(app.departments)) {
        departments = app.departments.join('，')
      } else {
        departments = app.departments.toString()
      }
    }
    
    return {
      id: app._id || app.id || Math.random().toString(36).substr(2, 9),
      formData: formData,
      departments: departments,
      applyTime: applyTime,
      status: app.status || 'waiting_first',
      userId: app.user_id,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      firstInterview: app.firstInterview || null,
      secondInterview: app.secondInterview || null,
      finalDepartment: app.finalDepartment || null
    }
  })
}

/**
 * 筛选申请数据
 * @param {Array} applications 所有申请数据
 * @param {Object} filters 筛选条件
 * @returns {Array} 筛选后的数据
 */
export function filterApplications(applications, filters) {
  let filtered = [...applications]
  
  // 状态筛选
  if (filters.statusIndex > 0) {
    const statusMap = filters.statusOptions
    const targetStatus = statusMap[filters.statusIndex]
    
    // 根据不同的状态文本进行筛选
    if (targetStatus === '等待一面') {
      filtered = filtered.filter(app => app.status === 'waiting_first')
    } else if (targetStatus === '待二面') {
      filtered = filtered.filter(app => app.status === 'waiting_second' && (!app.secondInterview || app.secondInterview.status !== 'completed'))
    } else if (targetStatus === '已面试') {
      filtered = filtered.filter(app => app.status === 'waiting_second' && app.secondInterview && app.secondInterview.status === 'completed')
    } else if (targetStatus === '二面过') {
      filtered = filtered.filter(app => app.status === 'department_selection' || app.status === 'accepted')
    } else if (targetStatus === '二面拒') {
      filtered = filtered.filter(app => app.status === 'second_failed')
    } else if (targetStatus === '拒绝加入') {
      filtered = filtered.filter(app => app.status === 'rejected')
    } else if (targetStatus === '部门选择') {
      filtered = filtered.filter(app => app.status === 'department_selection')
    } else if (targetStatus === '二面落选') {
      filtered = filtered.filter(app => app.status === 'second_failed')
    } else if (targetStatus === '一面未通过') {
      filtered = filtered.filter(app => app.status === 'first_failed')
    } else if (targetStatus === '已录取') {
      filtered = filtered.filter(app => app.status === 'accepted')
    }
  }
  
  // 部门筛选
  if (filters.deptIndex > 0) {
    const targetDept = filters.deptOptions[filters.deptIndex]
    filtered = filtered.filter(app => app.departments.includes(targetDept))
  }
  
  // 关键词搜索
  if (filters.searchKeyword) {
    const keyword = filters.searchKeyword.toLowerCase()
    filtered = filtered.filter(app => {
      const name = (app.formData?.name || '').toLowerCase()
      const studentId = (app.formData?.studentId || '').toLowerCase()
      return name.includes(keyword) || studentId.includes(keyword)
    })
  }
  
  return filtered
}

/**
 * 切换选择状态
 * @param {Array} selectedApplications 已选择的申请ID数组
 * @param {String} appId 申请ID
 * @returns {Array} 更新后的选择数组
 */
export function toggleSelect(selectedApplications, appId) {
  const index = selectedApplications.indexOf(appId)
  if (index > -1) {
    return selectedApplications.filter(id => id !== appId)
  } else {
    return [...selectedApplications, appId]
  }
}

/**
 * 切换全选状态
 * @param {Array} filteredApplications 当前显示的申请列表
 * @param {Array} selectedApplications 已选择的申请ID数组
 * @returns {Object} 包含新的选择数组和全选状态
 */
export function toggleSelectAll(filteredApplications, selectedApplications) {
  const allIds = filteredApplications.map(app => app.id)
  const isAllSelected = allIds.every(id => selectedApplications.includes(id))
  
  if (isAllSelected) {
    // 取消全选
    const newSelected = selectedApplications.filter(id => !allIds.includes(id))
    return { selectedApplications: newSelected, isAllSelected: false }
  } else {
    // 全选
    const newSelected = [...new Set([...selectedApplications, ...allIds])]
    return { selectedApplications: newSelected, isAllSelected: true }
  }
}

/**
 * 更新申请状态
 * @param {String} appId 申请ID
 * @param {String} newStatus 新状态
 * @param {Array} departments 部门列表（可选）
 * @returns {Promise} 更新结果
 */
export async function updateApplicationStatus(appId, newStatus, departments = null) {
  try {
    const data = {
      type: 'update_status',
      applicationId: appId,
      status: newStatus
    }
    
    if (departments && departments.length > 0) {
      data.departments = departments
    }
    
    const res = await uniCloud.callFunction({
      name: 'application',
      data: data
    })
    
    if (res.result && res.result.success) {
      return { success: true, data: res.result.data }
    } else {
      throw new Error(res.result?.error || res.result?.message || '更新失败')
    }
  } catch (err) {
    console.error('更新申请状态失败:', err)
    throw err
  }
}

/**
 * 批量更新申请状态
 * @param {Array} appIds 申请ID数组
 * @param {String} newStatus 新状态
 * @param {Array} departments 部门列表（可选）
 * @returns {Promise} 更新结果
 */
export async function batchUpdateApplicationStatus(appIds, newStatus, departments = null) {
  try {
    const results = []
    const errors = []
    
    // 循环调用单个更新
    for (const appId of appIds) {
      try {
        const result = await updateApplicationStatus(appId, newStatus, departments)
        results.push(result)
      } catch (err) {
        errors.push({ appId, error: err.message })
      }
    }
    
    if (errors.length > 0) {
      console.warn('批量更新部分失败:', errors)
      if (errors.length === appIds.length) {
        throw new Error('批量更新全部失败')
      }
    }
    
    return { 
      success: true, 
      data: { 
        successCount: results.length, 
        errorCount: errors.length,
        errors: errors
      } 
    }
  } catch (err) {
    console.error('批量更新申请状态失败:', err)
    throw err
  }
}

/**
 * 发送通知
 * @param {Object} notificationData 通知数据
 * @returns {Promise} 发送结果
 */
export async function sendNotification(notificationData) {
  try {
    const res = await uniCloud.callFunction({
      name: 'admin-api',
      data: {
        type: 'sendNotification',
        ...notificationData
      }
    })
    
    if (res.result && res.result.success) {
      return { success: true, data: res.result.data }
    } else {
      throw new Error(res.result?.message || '发送通知失败')
    }
  } catch (err) {
    console.error('发送通知失败:', err)
    throw err
  }
}

/**
 * 获取通知历史
 * @returns {Promise} 通知历史数据
 */
export async function getNotificationHistory() {
  try {
    const res = await uniCloud.callFunction({
      name: 'admin-api',
      data: {
        type: 'getNotifications'
      }
    })
    
    if (res.result && res.result.success) {
      return { success: true, data: res.result.data }
    } else {
      throw new Error(res.result?.message || '获取通知历史失败')
    }
  } catch (err) {
    console.error('获取通知历史失败:', err)
    throw err
  }
}

/**
 * 导出数据
 * @param {Array} data 要导出的数据
 * @param {String} filename 文件名
 * @returns {Promise} 导出结果
 */
export async function exportData(data, filename = '申请数据') {
  try {
    // 构建CSV内容
    const headers = ['姓名', '学号', '性别', '专业班级', '宿舍号', '手机号', '意向部门', '申请时间', '状态', '自我介绍']
    const csvContent = [
      headers.join(','),
      ...data.map(app => [
        app.formData?.name || '',
        app.formData?.studentId || '',
        app.formData?.gender || '',
        app.formData?.major || '',
        app.formData?.dormitory || '',
        app.formData?.phone || '',
        app.departments || '',
        app.applyTime || '',
        getStatusText(app.status) || '',
        (app.formData?.introduction || '').replace(/,/g, '，').replace(/\n/g, ' ')
      ].map(field => `"${field}"`).join(','))
    ].join('\n')
    
    // 添加BOM以支持中文
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    // 在微信小程序中，使用uni.downloadFile
    // #ifdef MP-WEIXIN
    return new Promise((resolve, reject) => {
      uni.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            uni.saveFile({
              tempFilePath: res.tempFilePath,
              success: (saveRes) => {
                uni.showToast({ title: '文件已保存到相册', icon: 'success' })
                resolve({ success: true })
              },
              fail: (err) => {
                console.error('保存文件失败:', err)
                uni.showToast({ title: '保存失败，请重试', icon: 'none' })
                reject(err)
              }
            })
          } else {
            reject(new Error('下载失败'))
          }
        },
        fail: (err) => {
          console.error('下载文件失败:', err)
          uni.showToast({ title: '下载失败，请重试', icon: 'none' })
          reject(err)
        }
      })
    })
    // #endif
    
    // 在其他平台中，显示下载链接
    // #ifndef MP-WEIXIN
    return new Promise((resolve, reject) => {
      uni.showModal({
        title: '导出成功',
        content: '数据已生成，点击确定复制下载链接',
        success: (res) => {
          if (res.confirm) {
            uni.setClipboardData({
              data: url,
              success: () => {
                uni.showToast({ title: '下载链接已复制', icon: 'success' })
                resolve({ success: true })
              },
              fail: (err) => {
                console.error('复制链接失败:', err)
                reject(err)
              }
            })
          } else {
            resolve({ success: true })
          }
        }
      })
    })
    // #endif
  } catch (err) {
    console.error('导出数据失败:', err)
    throw err
  }
}

/**
 * 格式化时间显示 - 使用统一的中国人习惯格式
 * @param {String|Date} time 时间
 * @returns {String} 格式化后的时间字符串
 */
export function formatTime(time) {
  return formatDateTime(time)
}

/**
 * 智能时间显示 - 根据时间远近选择合适格式 (用于通知等场景)
 * @param {String|Date} time 时间
 * @returns {String} 格式化后的时间字符串
 */
export function formatSmartTimeDisplay(time) {
  return formatSmartTime(time)
}

/**
 * 获取目标文本
 * @param {String} target 目标类型
 * @returns {String} 目标文本
 */
export function getTargetText(target) {
  const targetMap = {
    all: '全体用户',
    waiting_first: '等待一面',
    first_passed: '一面通过',
    waiting_second: '等待二面',
    first_failed: '一面未通过',
    department_selection: '部门选择',
    second_failed: '二面未通过',
    accepted: '已录取',
    applicants: '申请者',
    first_interview: '一面申请者',
    second_interview: '二面申请者'
  }
  return targetMap[target] || '未知对象'
}

/**
 * 获取可用部门列表（基于一面通过的部门）
 * @param {Object} application 申请对象
 * @returns {Array} 可用部门列表
 */
export function getAvailableDepartments(application) {
  if (!application) {
    return []
  }
  
  // 优先从firstInterview.passedDepartments获取
  if (application.firstInterview && application.firstInterview.passedDepartments) {
    return application.firstInterview.passedDepartments
  }
  
  // 如果没有明确的一面通过部门信息，从申请状态和部门信息推断
  if (application.status === 'waiting_second' || application.status === 'department_selection' || application.status === 'second_failed') {
    const departments = application.departments || ''
    const allDepts = ['宣传部', '执行部', '策划部', '技术部', '外联部']
    
    // 如果申请中包含部门名称，则认为该部门一面通过
    const passedDepts = allDepts.filter(dept => departments.includes(dept))
    
    // 如果没有找到匹配的部门，返回申请的所有部门（分割处理）
    if (passedDepts.length === 0 && departments) {
      const deptArray = departments.split(/[、,，]/).map(d => d.trim()).filter(d => d)
      return deptArray.filter(dept => allDepts.includes(dept))
    }
    
    return passedDepts
  }
  
  return []
}