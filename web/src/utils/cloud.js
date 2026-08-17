/**
 * 云函数调用工具
 */

/**
 * 通用云函数调用方法
 * @param {string} functionName 云函数名称
 * @param {Object} data 请求数据
 * @returns {Promise<Object>}
 */
export const callCloudFunction = async (functionName, data) => {
  try {
    const result = await uniCloud.callFunction({
      name: functionName,
      data: data
    })
    
    console.log(`云函数 ${functionName} 原始返回:`, result)
    
    // 检查云函数调用是否成功
    if (result.result) {
      // 如果云函数返回了结果，直接返回（让调用方处理success字段）
      return result.result
    } else {
      throw new Error('云函数返回结果为空')
    }
  } catch (error) {
    console.error(`调用云函数 ${functionName} 失败:`, error)
    throw error
  }
}

// 云函数调用工具
export default {
	// 微信登录相关
	async wechatLogin(code, userInfo) {
		try {
			console.log('开始调用微信登录云函数，code:', code ? code.substring(0, 10) + '...' : 'null')
			
			const result = await callCloudFunction('wechat-login', {
				type: 'login',
				code,
				userInfo
			})
			
			console.log('微信登录云函数返回结果:', result)
			
			// 检查云函数返回的具体错误
			if (result && result.success) {
				return result
			} else {
				// 处理特定的错误类型
				const errorMsg = result?.error || result?.message || '登录失败'
				console.error('微信登录云函数返回错误:', errorMsg)
				
				if (errorMsg.includes('无效') || errorMsg.includes('过期')) {
					throw new Error('微信登录凭证已过期，请重新登录')
				} else if (errorMsg.includes('微信API错误')) {
					throw new Error('微信服务暂时不可用，请稍后重试')
				} else if (errorMsg.includes('网络')) {
					throw new Error('网络连接失败，请检查网络设置')
				} else {
					throw new Error(errorMsg)
				}
			}
		} catch (error) {
			console.error('微信登录云函数调用失败:', error)
			// 重要：这里不应该返回success: false，而是抛出错误
			// 让调用方能够正确处理错误
			throw error
		}
	},
	
	async getUserInfo(userId) {
		return await callCloudFunction('wechat-login', {
			type: 'userinfo',
			userId
		})
	},
	
	async refreshSession(userId) {
		return await callCloudFunction('wechat-login', {
			type: 'refresh',
			userId
		})
	},
	
	async logout(userId) {
		return await callCloudFunction('wechat-login', {
			type: 'logout',
			userId
		})
	},
	
	// 申请相关
	async submitApplication(applicationData) {
		return await callCloudFunction('application', {
			type: 'submit',
			data: applicationData,
			userId: applicationData.userId
		})
	},
	
	async getApplication(userId) {
		return await callCloudFunction('application', {
			type: 'get',
			userId
		})
	},
	
	async updateApplication(applicationData) {
		return await callCloudFunction('application', {
			type: 'update',
			data: applicationData,
			userId: applicationData.userId,
			applicationId: applicationData._id
		})
	},
	
	async deleteApplication(userId, applicationId) {
		return await callCloudFunction('application', {
			type: 'delete',
			userId,
			applicationId
		})
	},
	
	async listApplications(page = 1, pageSize = 200, filters = {}) {
		return await callCloudFunction('application', {
			type: 'list',
			page,
			pageSize,
			filters
		})
	},
	
	// 管理员相关方法
	async adminLogin(username, password) {
		try {
			const result = await uniCloud.callFunction({
				name: 'admin',
				data: {
					type: 'login',
					username: username,
					password: password
				}
			})
			
			if (result.result && result.result.success) {
				return result.result
			} else {
				throw new Error(result.result?.error || '管理员登录失败')
			}
		} catch (error) {
			console.error('管理员登录失败:', error)
			throw error
		}
	},
	
	async manageInterview(action, applicationId, interviewData) {
		return await callCloudFunction('admin', {
			type: 'interview',
			data: { action, applicationId, interviewData }
		})
	},
	
	async sendNotification(type, targetIds, content) {
		return await callCloudFunction('admin', {
			type: 'notification',
			data: { type, targetIds, content }
		})
	},
	
	async getStatistics() {
		return await callCloudFunction('admin', {
			type: 'statistics'
		})
	},
	
	// 微信推送相关
	async sendInterviewNotice(targetIds, data) {
		return await callCloudFunction('wechat-push', {
			type: 'send_interview_notice',
			targetIds,
			data
		})
	},
	
	async sendResultNotice(targetIds, data) {
		return await callCloudFunction('wechat-push', {
			type: 'send_result_notice',
			targetIds,
			data
		})
	},
	
	// 数据库初始化相关
	async initDatabase() {
		return await callCloudFunction('init-db', {
			type: 'init'
		})
	},
	
	async createCollections() {
		return await callCloudFunction('init-db', {
			type: 'create_collections'
		})
	},
	
	async insertSampleData() {
		return await callCloudFunction('init-db', {
			type: 'insert_sample_data'
		})
	},
	
	async clearData() {
		return await callCloudFunction('init-db', {
			type: 'clear_data'
		})
	}
}