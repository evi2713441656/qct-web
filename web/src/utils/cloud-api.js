/**
 * 云数据库API工具
 * 提供安全的数据库访问方法，避免schema错误影响用户体验
 */

class CloudApiService {
	constructor() {
	}
	
	// 安全获取系统配置
	async getSystemConfig() {
		try {
			console.log('开始从云数据库获取系统配置...')
			
			// 调用云函数获取系统配置
			const result = await uniCloud.callFunction({
				name: 'admin',
				data: {
					type: 'getSystemConfig'
				}
			})
			
			console.log('云函数返回结果:', result)
			
			if (result && result.result && result.result.success && result.result.data) {
				const config = result.result.data
				console.log('成功获取云数据库配置:', config)
				
				// 转换配置格式为首页需要的格式，直接使用新的字段名
				return {
					applicationStartTime: config.applicationStartTime || '2024-10-01T00:00:00',
					applicationEndTime: config.applicationEndTime || '2025-09-14T23:59:59',
					editDeadline: config.editDeadline || '2025-09-14T23:59:59',
					departmentDetails: config.departmentDetails || {
						'策划部': {
							name: '策划部',
							shortName: '策划',
							color: '#FF6B6B',
							description: '协会的"大脑"',
							introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！',
							duties: ['活动方案设计与策划', '各部门协调与分工安排', '活动执行细节把控', '项目进度管理与风险控制'],
							requirements: ['思维缜密，逻辑清晰', '责任心强，执行力佳', '具备良好的沟通协调能力', '有创新思维和团队合作精神']
						},
						'执行部': {
							name: '执行部',
							shortName: '执行',
							color: '#4ECDC4',
							description: '协会的"行动力"',
							introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！',
							duties: ['活动前期筹备与物资准备', '现场执行与协调管理', '主持与现场氛围营造', '突发情况应急处理'],
							requirements: ['责任心强，性格开朗', '具备良好的组织协调能力', '有较强的沟通交际能力', '能够承受一定的工作压力']
						},
						'宣传部': {
							name: '宣传部',
							shortName: '宣传',
							color: '#45B7D1',
							description: '协会的"信息窗口"',
							introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！',
							duties: ['新媒体内容创作与编辑', '视觉设计与图片处理', '摄影摄像与后期制作', '品牌形象设计与维护'],
							requirements: ['对新媒体运营充满热忱', '具备良好的文字表达能力', '有审美能力和创意思维', '熟悉设计软件或愿意学习']
						}
					},
					// 添加面试配置信息
					interviewConfig: config.interviewConfig || null
				}
			} else {
				console.warn('云数据库配置获取失败，使用默认配置')
				throw new Error('云数据库配置获取失败')
			}
		} catch (error) {
			console.error('获取系统配置失败:', error)
			
			// 如果云数据库获取失败，尝试从本地存储读取
			try {
				const localConfig = uni.getStorageSync('systemConfig')
				if (localConfig && localConfig.recruitmentTime) {
					console.log('使用本地存储的配置:', localConfig)
					
					// 正确处理时间格式
					let applicationStartTime = localConfig.applicationStartTime
					let applicationEndTime = localConfig.applicationEndTime
					
					// 如果没有applicationStartTime，从recruitmentTime.startDate构造
					if (!applicationStartTime && localConfig.recruitmentTime.startDate) {
						let startDateStr = localConfig.recruitmentTime.startDate
						if (!startDateStr.includes('T') && !startDateStr.includes(' ')) {
							applicationStartTime = startDateStr + 'T00:00:00'
						} else if (startDateStr.includes(' ')) {
							applicationStartTime = startDateStr.replace(' ', 'T') + ':00'
						} else {
							applicationStartTime = startDateStr
						}
					}
					
					// 如果没有applicationEndTime，从recruitmentTime.endDate构造
					if (!applicationEndTime && localConfig.recruitmentTime.endDate) {
						let endDateStr = localConfig.recruitmentTime.endDate
						if (!endDateStr.includes('T') && !endDateStr.includes(' ')) {
							applicationEndTime = endDateStr + 'T23:59:59'
						} else if (endDateStr.includes(' ')) {
							applicationEndTime = endDateStr.replace(' ', 'T') + ':59'
						} else {
							applicationEndTime = endDateStr
						}
					}
					
					return {
						applicationStartTime: applicationStartTime || '2025-08-01T00:00:00',
						applicationEndTime: applicationEndTime || '2025-10-15T23:59:59',
						editDeadline: applicationEndTime || '2025-10-15T23:59:59',
						recruitmentTime: localConfig.recruitmentTime,
						departmentDetails: localConfig.departmentDetails || {
							'策划部': {
								name: '策划部',
								shortName: '策划',
								color: '#FF6B6B',
								description: '协会的"大脑"',
								introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！',
								duties: ['活动方案设计与策划', '各部门协调与分工安排', '活动执行细节把控', '项目进度管理与风险控制'],
								requirements: ['思维缜密，逻辑清晰', '责任心强，执行力佳', '具备良好的沟通协调能力', '有创新思维和团队合作精神']
							},
							'执行部': {
								name: '执行部',
								shortName: '执行',
								color: '#4ECDC4',
								description: '协会的"行动力"',
								introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！',
								duties: ['活动前期筹备与物资准备', '现场执行与协调管理', '主持与现场氛围营造', '突发情况应急处理'],
								requirements: ['责任心强，性格开朗', '具备良好的组织协调能力', '有较强的沟通交际能力', '能够承受一定的工作压力']
							},
							'宣传部': {
								name: '宣传部',
								shortName: '宣传',
								color: '#45B7D1',
								description: '协会的"信息窗口"',
								introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！',
								duties: ['新媒体内容创作与编辑', '视觉设计与图片处理', '摄影摄像与后期制作', '品牌形象设计与维护'],
								requirements: ['对新媒体运营充满热忱', '具备良好的文字表达能力', '有审美能力和创意思维', '熟悉设计软件或愿意学习']
							}
						}
					}
				}
			} catch (localError) {
				console.error('读取本地配置也失败:', localError)
			}
			
			// 最后使用默认配置
			console.log('使用默认配置')
			return {
				applicationStartTime: '2025-08-01T00:00:00',
				applicationEndTime: '2025-10-15T23:59:59',
				editDeadline: '2025-10-15T23:59:59',
				recruitmentTime: {
					startDate: '2025-08-01',
					endDate: '2025-10-15',
					endTime: '23:59'
				},
				departmentDetails: {
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
				},
				// 添加默认面试配置
				interviewConfig: null
			}
		}
	}

	// 智能数据库初始化（只在需要时初始化）
	async ensureDatabaseInitialized() {
		try {
			// 首先检查数据库状态
			const checkResult = await uniCloud.callFunction({
				name: 'init-db',
				data: { type: 'check' }
			})
			
			if (checkResult.result && checkResult.result.initialized) {
				console.log('数据库已初始化，无需重复初始化')
				return { success: true, message: '数据库已初始化' }
			}
			
			// 如果未初始化，则进行初始化
			console.log('数据库未初始化，开始初始化...')
			const initResult = await uniCloud.callFunction({
				name: 'init-db',
				data: { type: 'init' }
			})
			
			return initResult.result
		} catch (error) {
			console.error('数据库初始化检查失败:', error)
			return { success: false, error: error.message }
		}
	}
}

// 创建单例实例
const cloudApiService = new CloudApiService()

export default cloudApiService
