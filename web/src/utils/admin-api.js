/**
 * 管理员API封装
 * 提供管理员登录、数据统计、面试管理等功能的API调用
 */

import apiService from './api.js'

/**
 * 管理员登录
 * @param {Object} loginData - 登录数据
 * @param {string} loginData.username - 管理员用户名
 * @param {string} loginData.password - 管理员密码
 * @returns {Promise<Object>} 登录结果
 */
export async function adminLogin(loginData) {
	return await apiService.adminLogin(loginData.username, loginData.password)
}

/**
 * 获取统计数据
 * @returns {Promise<Object>} 统计数据
 */
export async function getStatistics() {
	try {
		const result = await uniCloud.callFunction({
			name: 'admin',
			data: {
				type: 'statistics'
			}
		})
		
		if (result.result && result.result.success) {
			return result.result
		} else {
			throw new Error(result.result?.error || '获取统计数据失败')
		}
	} catch (error) {
		console.error('获取统计数据失败:', error)
		throw error
	}
}

/**
 * 管理面试
 * @param {Object} interviewData - 面试数据
 * @param {string} interviewData.action - 操作类型：schedule_first, schedule_second, result_first, result_second
 * @param {string} interviewData.applicationId - 申请ID
 * @param {Object} interviewData.interviewData - 面试详情
 * @returns {Promise<Object>} 操作结果
 */
export async function manageInterview(interviewData) {
	try {
		const result = await uniCloud.callFunction({
			name: 'admin',
			data: {
				type: 'interview',
				...interviewData
			}
		})
		
		if (result.result && result.result.success) {
			return result.result
		} else {
			throw new Error(result.result?.error || '管理面试失败')
		}
	} catch (error) {
		console.error('管理面试失败:', error)
		throw error
	}
}

/**
 * 发送通知
 * @param {Object} notificationData - 通知数据
 * @param {string} notificationData.title - 通知标题
 * @param {string} notificationData.content - 通知内容
 * @param {string} notificationData.type - 通知类型：all, specific
 * @param {Array} notificationData.targets - 目标用户ID数组（当type为specific时）
 * @returns {Promise<Object>} 发送结果
 */
export async function sendNotification(notificationData) {
	try {
		const result = await uniCloud.callFunction({
			name: 'admin',
			data: {
				type: 'notification',
				...notificationData
			}
		})
		
		if (result.result && result.result.success) {
			return result.result
		} else {
			throw new Error(result.result?.error || '发送通知失败')
		}
	} catch (error) {
		console.error('发送通知失败:', error)
		throw error
	}
}

/**
 * 获取所有报名申请
 * @param {Object} params - 查询参数
 * @param {string} params.status - 申请状态筛选
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 * @returns {Promise<Object>} 申请列表
 */
export async function getApplications(params = {}) {
	return await apiService.getApplications(params)
}

/**
 * 更新申请状态
 * @param {string} applicationId - 申请ID
 * @param {string} status - 新状态
 * @param {Object} extraData - 额外数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateApplicationStatus(applicationId, status, extraData = {}) {
	return await apiService.updateApplicationStatus(applicationId, status, extraData)
}

/**
 * 获取申请详情
 * @param {string} applicationId - 申请ID
 * @returns {Promise<Object>} 申请详情
 */
export async function getApplicationDetail(applicationId) {
	try {
		const result = await uniCloud.callFunction({
			name: 'application',
			data: {
				type: 'get',
				applicationId: applicationId
			}
		})
		
		if (result.result && result.result.success) {
			return result.result
		} else {
			throw new Error(result.result?.error || '获取申请详情失败')
		}
	} catch (error) {
		console.error('获取申请详情失败:', error)
		throw error
	}
}

/**
 * 导出申请数据
 * @param {Object} params - 导出参数
 * @param {string} params.format - 导出格式：csv, excel
 * @param {string} params.status - 状态筛选
 * @returns {Promise<Object>} 导出结果
 */
export async function exportApplications(params = {}) {
	try {
		const result = await uniCloud.callFunction({
			name: 'admin',
			data: {
				type: 'export',
				...params
			}
		})
		
		if (result.result && result.result.success) {
			return result.result
		} else {
			throw new Error(result.result?.error || '导出申请数据失败')
		}
	} catch (error) {
		console.error('导出申请数据失败:', error)
		throw error
	}
}

/**
 * 获取系统配置（管理员）
 * @returns {Promise<Object>} 系统配置
 */
export async function getSystemConfigAdmin() {
	return await apiService.getSystemConfigAdmin()
}

/**
 * 更新系统配置
 * @param {Object} configData - 配置数据
 * @returns {Promise<Object>} 更新结果
 */
export async function updateSystemConfig(configData) {
	return await apiService.updateSystemConfig(configData)
}