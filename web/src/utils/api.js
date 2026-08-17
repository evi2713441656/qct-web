import cloud from './cloud.js'
import config from '../config/config.js'
import cloudApiService from './cloud-api.js'

// API服务类
class ApiService {
	constructor() {
		this.cache = new Map()
		this.cacheTimeout = 5 * 60 * 1000 // 5分钟缓存
	}
	
	// 获取缓存数据
	getCache(key) {
		const cached = this.cache.get(key)
		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return cached.data
		}
		return null
	}
	
	// 设置缓存数据
	setCache(key, data) {
		this.cache.set(key, {
			data,
			timestamp: Date.now()
		})
	}
	
	// 获取系统配置
	async getSystemConfig() {
		const cacheKey = 'system_config'
		const cached = this.getCache(cacheKey)
		if (cached) {
			return cached
		}
		
		try {
			// 调用云函数获取配置
			const result = await uniCloud.callFunction({
				name: 'admin',
				data: {
					type: 'getSystemConfig'
				}
			})
			
			if (result.result && result.result.success && result.result.data) {
				const systemConfig = {
					...config,
					...result.result.data
				}
				
				this.setCache(cacheKey, systemConfig)
				return systemConfig
			} else {
				throw new Error(result.result?.error || '获取系统配置失败')
			}
		} catch (error) {
			console.error('获取系统配置失败:', error)
			// 返回本地配置作为备用
			return config
		}
	}
	
	// 获取部门列表
	async getDepartments() {
		const cacheKey = 'departments'
		const cached = this.getCache(cacheKey)
		if (cached) {
			return cached
		}
		
		try {
			const systemConfig = await this.getSystemConfig()
			const departments = systemConfig.departments || []
			
			this.setCache(cacheKey, departments)
			return departments
		} catch (error) {
			console.error('获取部门列表失败:', error)
			// 返回默认部门列表
			return config.departments || []
		}
	}
	
	// 获取部门详情
	async getDepartmentDetails() {
		const cacheKey = 'department_details'
		const cached = this.getCache(cacheKey)
		if (cached) {
			return cached
		}
		
		try {
			// 使用安全的云数据库API
			const systemConfig = await cloudApiService.getSystemConfig()
			
			if (systemConfig && systemConfig.departmentDetails) {
				const departmentDetails = systemConfig.departmentDetails
				this.setCache(cacheKey, departmentDetails)
				return departmentDetails
			} else {
				// 如果数据库中没有，使用本地配置
				const departmentDetails = {
					'策划部': {
						name: '策划部',
						description: '协会的"大脑"',
						introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！',
						duties: ['活动方案设计与策划', '各部门协调与分工安排', '活动执行细节把控', '项目进度管理与风险控制'],
						requirements: ['思维缜密，逻辑清晰', '责任心强，执行力佳', '具备良好的沟通协调能力', '有创新思维和团队合作精神']
					},
					'执行部': {
						name: '执行部',
						description: '协会的"行动力"',
						introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！',
						duties: ['活动前期筹备与物资准备', '现场执行与协调管理', '主持与现场氛围营造', '突发情况应急处理'],
						requirements: ['责任心强，性格开朗', '具备良好的组织协调能力', '有较强的沟通交际能力', '能够承受一定的工作压力']
					},
					'宣传部': {
						name: '宣传部',
						description: '协会的"信息窗口"',
						introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！',
						duties: ['新媒体内容创作与编辑', '视觉设计与图片处理', '摄影摄像与后期制作', '品牌形象设计与维护'],
						requirements: ['对新媒体运营充满热忱', '具备良好的文字表达能力', '有审美能力和创意思维', '熟悉设计软件或愿意学习']
					}
				}
				
				this.setCache(cacheKey, departmentDetails)
				return departmentDetails
			}
		} catch (error) {
			console.error('获取部门详情失败:', error)
			// 返回默认部门详情
			const departmentDetails = {
				'策划部': {
					name: '策划部',
					description: '协会的"大脑"',
					introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！',
					duties: ['活动方案设计与策划', '各部门协调与分工安排', '活动执行细节把控', '项目进度管理与风险控制'],
					requirements: ['思维缜密，逻辑清晰', '责任心强，执行力佳', '具备良好的沟通协调能力', '有创新思维和团队合作精神']
				},
				'执行部': {
					name: '执行部',
					description: '协会的"行动力"',
					introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！',
					duties: ['活动前期筹备与物资准备', '现场执行与协调管理', '主持与现场氛围营造', '突发情况应急处理'],
					requirements: ['责任心强，性格开朗', '具备良好的组织协调能力', '有较强的沟通交际能力', '能够承受一定的工作压力']
				},
				'宣传部': {
					name: '宣传部',
					description: '协会的"信息窗口"',
					introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！',
					duties: ['新媒体内容创作与编辑', '视觉设计与图片处理', '摄影摄像与后期制作', '品牌形象设计与维护'],
					requirements: ['对新媒体运营充满热忱', '具备良好的文字表达能力', '有审美能力和创意思维', '熟悉设计软件或愿意学习']
				}
			}
			
			this.setCache(cacheKey, departmentDetails)
			return departmentDetails
		}
	}
	
	// 获取招聘时间线
	async getRecruitmentTimeline() {
		const cacheKey = 'recruitment_timeline'
		const cached = this.getCache(cacheKey)
		if (cached) {
			return cached
		}
		
		try {
			const systemConfig = await this.getSystemConfig()
			const timeline = systemConfig.recruitmentTimeline || config.recruitmentTimeline
			
			this.setCache(cacheKey, timeline)
			return timeline
		} catch (error) {
			console.error('获取招聘时间线失败:', error)
			return config.recruitmentTimeline || []
		}
	}
	
	// 检查是否在报名时间内
	async isApplicationOpen() {
		try {
			const systemConfig = await this.getSystemConfig()
			const now = new Date()
			const startTime = new Date(systemConfig.applicationStartTime || config.applicationStartTime)
			const endTime = new Date(systemConfig.applicationEndTime || config.applicationEndTime)
			
			return now >= startTime && now <= endTime
		} catch (error) {
			console.error('检查报名时间失败:', error)
			return false
		}
	}
	
	// 检查是否可以修改申请
	async canEditApplication() {
		try {
			const systemConfig = await this.getSystemConfig()
			const now = new Date()
			
			// 检查面试配置
			const interviewConfig = systemConfig.interviewConfig
			if (interviewConfig && interviewConfig.firstInterview && interviewConfig.firstInterview.checkInEnabled) {
				// 如果一面签到已开启，则允许修改报名信息
				console.log('一面签到已开启，允许修改报名信息')
				return true
			}
			
			// iOS兼容的日期格式处理
			let editDeadline
			const deadlineStr = systemConfig.editDeadline || config.editDeadline
			
			if (deadlineStr) {
				// 将 "yyyy-MM-dd HH:mm:ss" 格式转换为 "yyyy-MM-ddTHH:mm:ss" 格式
				const isoDeadline = deadlineStr.replace(' ', 'T')
				editDeadline = new Date(isoDeadline)
			} else {
				// 默认截止日期
				editDeadline = new Date('2025-12-31T23:59:59')
			}
			
			return now <= editDeadline
		} catch (error) {
			console.error('检查修改时间失败:', error)
			return false
		}
	}
	
	// 用户相关API
	async login(code, userInfo) {
		try {
			console.log('api.js: 开始处理登录，用户信息:', userInfo ? '已获取' : '未获取')
			
			// 如果已经有用户信息，直接返回成功
			// 因为用户信息已经通过wechatLoginSimple获取
			if (userInfo && userInfo.openid) {
				console.log('api.js: 使用已获取的用户信息，跳过云函数调用')
				
				// 保存用户信息到本地存储
				uni.setStorageSync('userInfo', userInfo)
				
				return {
					success: true,
					data: {
						userInfo: userInfo
					}
				}
			}
			
			// 如果没有用户信息，返回错误
			console.error('api.js: 缺少用户信息')
			return {
				success: false,
				message: '缺少用户信息'
			}
		} catch (error) {
			console.error('api.js: 登录失败:', error)
			
			// 处理特定的错误类型
			let errorMessage = '登录失败'
			if (error.message && error.message.includes('无效')) {
				errorMessage = '微信登录凭证已过期，请重新登录'
			} else if (error.message && error.message.includes('过期')) {
				errorMessage = '微信登录凭证已过期，请重新登录'
			} else if (error.message && error.message.includes('微信API错误')) {
				errorMessage = '微信服务暂时不可用，请稍后重试'
			} else if (error.message && error.message.includes('网络')) {
				errorMessage = '网络连接失败，请检查网络设置'
			} else {
				errorMessage = error.message || '登录失败'
			}
			
			return {
				success: false,
				message: errorMessage
			}
		}
	}
	
	async logout() {
		try {
			const userInfo = uni.getStorageSync('userInfo')
			if (userInfo && userInfo._id) {
				await cloud.logout(userInfo._id)
			}
			
			// 清除本地存储
			uni.removeStorageSync('userToken')
			uni.removeStorageSync('userInfo')
			
			return { success: true }
		} catch (error) {
			console.error('登出失败:', error)
			// 即使云端登出失败，也要清除本地存储
			uni.removeStorageSync('userToken')
			uni.removeStorageSync('userInfo')
			return { success: true }
		}
	}
	
	// 申请相关API
	async submitApplication(applicationData) {
		try {
			const userInfo = uni.getStorageSync('userInfo')
			if (!userInfo || !userInfo._id) {
				throw new Error('用户未登录')
			}
			
			const data = {
				...applicationData,
				userId: userInfo._id
			}
			
			return await cloud.submitApplication(data)
		} catch (error) {
			console.error('提交申请失败:', error)
			throw error
		}
	}
	
	async getApplication(userId) {
		try {
			// 如果没有传入userId，从本地存储获取
			if (!userId) {
				const userInfo = uni.getStorageSync('userInfo')
				if (!userInfo || !userInfo._id) {
					throw new Error('用户未登录')
				}
				userId = userInfo._id
			}
			
			return await cloud.getApplication(userId)
		} catch (error) {
			console.error('获取申请失败:', error)
			throw error
		}
	}
	
	async updateApplication(applicationData) {
		try {
			const userInfo = uni.getStorageSync('userInfo')
			if (!userInfo || !userInfo._id) {
				throw new Error('用户未登录')
			}
			
			// 如果没有传入applicationId，先获取用户的申请信息
			if (!applicationData._id) {
				const applicationResult = await this.getApplication()
				if (applicationResult.success && applicationResult.data) {
					applicationData._id = applicationResult.data._id
				} else {
					throw new Error('未找到申请信息')
				}
			}
			
			const data = {
				...applicationData,
				userId: userInfo._id,
				applicationId: applicationData._id
			}
			
			return await cloud.updateApplication(data)
		} catch (error) {
			console.error('更新申请失败:', error)
			throw error
		}
	}
	
	async deleteApplication(applicationId) {
		try {
			const userInfo = uni.getStorageSync('userInfo')
			if (!userInfo || !userInfo._id) {
				throw new Error('用户未登录')
			}
			
			// 如果没有传入applicationId，先获取用户的申请信息
			if (!applicationId) {
				const applicationResult = await this.getApplication()
				if (applicationResult.success && applicationResult.data) {
					applicationId = applicationResult.data._id
				} else {
					throw new Error('未找到申请信息')
				}
			}
			
			return await cloud.deleteApplication(userInfo._id, applicationId)
		} catch (error) {
			console.error('删除申请失败:', error)
			throw error
		}
	}
	
	// 管理员相关API
	async adminLogin(username, password) {
		try {
			const result = await cloud.adminLogin(username, password)
			if (result.success) {
				// 保存管理员信息到本地存储
				uni.setStorageSync('adminInfo', result.data.adminInfo)
				// 保存管理员登录凭证（网页版后端鉴权用）
				if (result.data.token) {
					uni.setStorageSync('adminToken', result.data.token)
				}
			}
			return result
		} catch (error) {
			console.error('管理员登录失败:', error)
			throw error
		}
	}
	
	// 管理员系统配置相关API
	async getSystemConfigAdmin() {
		try {
			console.log('准备获取系统配置')
			
			const result = await uniCloud.callFunction({
				name: 'admin',
				data: {
					type: 'getSystemConfigAdmin'
				}
			})
			
			console.log('获取系统配置返回结果:', result)
			
			// 添加更安全的错误处理
			if (!result) {
				throw new Error('云函数调用失败')
			}
			
			if (!result.result) {
				throw new Error('云函数返回结果为空')
			}
			
			if (result.result.success) {
				return result.result
			} else {
				throw new Error(result.result.error || '获取系统配置失败')
			}
		} catch (error) {
			console.error('获取管理员系统配置失败:', error)
			throw error
		}
	}
	
	async updateSystemConfig(configData) {
		try {
			console.log('准备调用云函数，配置数据:', configData)
			
			const result = await uniCloud.callFunction({
				name: 'admin',
				data: {
					type: 'updateSystemConfig',
					configData: configData
				}
			})
			
			console.log('云函数返回结果:', result)
			
			// 添加更安全的错误处理
			if (!result) {
				throw new Error('云函数调用失败')
			}
			
			if (!result.result) {
				throw new Error('云函数返回结果为空')
			}
			
			if (result.result.success) {
				return result.result
			} else {
				throw new Error(result.result.error || '更新系统配置失败')
			}
		} catch (error) {
			console.error('更新系统配置失败:', error)
			throw error
		}
	}
	
	// 管理员申请管理API
	async getApplications(params = {}) {
		try {
			const result = await uniCloud.callFunction({
				name: 'application',
				data: {
					type: 'list',
					...params
				}
			})
			
			if (result.result && result.result.success) {
				return result.result
			} else {
				throw new Error(result.result?.error || '获取申请列表失败')
			}
		} catch (error) {
			console.error('获取申请列表失败:', error)
			throw error
		}
	}
	
	async updateApplicationStatus(applicationId, status, extraData = {}) {
		try {
			const result = await uniCloud.callFunction({
				name: 'application',
				data: {
					type: 'update_status',
					applicationId: applicationId,
					status: status,
					...extraData
				}
			})
			
			if (result.result && result.result.success) {
				return result.result
			} else {
				throw new Error(result.result?.error || '更新申请状态失败')
			}
		} catch (error) {
			console.error('更新申请状态失败:', error)
			throw error
		}
	}
	
	// 清除缓存
	clearCache() {
		this.cache.clear()
	}
}

// 创建单例实例
const apiService = new ApiService()

export default apiService