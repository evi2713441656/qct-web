<template>
	<view class="container">
		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<uni-load-more status="loading" :content-text="{
				contentdown: '加载中...',
				contentrefresh: '加载中...',
				contentnomore: '加载完成'
			}"></uni-load-more>
		</view>
		
		<view v-else class="content-wrapper">
			<!-- 顶部横幅 -->
			<view class="banner">
				<image src="/static/logo.png" mode="aspectFill" class="banner-image"></image>
				<view class="banner-overlay">
					<view class="banner-content">
						<image src="/static/logo.png" class="banner-logo" @click="goToAdmin"></image>
						<view class="banner-text">
							<text class="banner-title">青创通</text>
							<text class="banner-subtitle">青年创新创业协会</text>
						</view>
					</view>
				</view>
			</view>
		
			<!-- 社团介绍 -->
			<view class="section-card intro-card">
				<view class="card-header">
					<text class="section-title">关于我们</text>
				</view>
				<view class="card-content">
					<view class="intro-layout">
						<view class="intro-text-section">
							<text class="intro-text">
								青年创新创业协会是一个致力于培养大学生创新创业能力的学生组织。我们为有志于创新创业的同学提供学习、实践和交流的平台，通过举办各类活动、比赛和培训，帮助同学们提升创新思维和创业技能。
							</text>
						</view>
					</view>
					<view class="intro-image-container">
						<image src="/static/合照.jpg" mode="aspectFill" class="intro-image"></image>
					</view>
				</view>
			</view>
			
			<!-- 部门介绍 -->
			<view class="section-card departments-section">
				<view class="card-header">
					<text class="section-title">招新部门</text>
				</view>
				<view class="card-content">
					<view class="department-card" v-for="(dept, index) in departments" :key="dept.id">
						<view class="dept-header" @click="toggleDepartment(dept.id)">
							<view class="dept-icon" :style="{backgroundColor: dept.color}">
								<text class="dept-icon-text">{{dept.shortName}}</text>
							</view>
							<view class="dept-info">
								<text class="dept-name">{{dept.name}}</text>
								<text class="dept-desc">{{dept.description}}</text>
							</view>
							<view class="expand-icon" :class="{ expanded: dept.expanded }">
								<text class="expand-arrow">▼</text>
							</view>
						</view>
						
						<view class="dept-details" v-if="dept.expanded" :class="{ expanded: dept.expanded }">
							<view class="detail-section">
								<text class="detail-title">部门介绍：</text>
								<text class="detail-content">{{dept.introduction}}</text>
							</view>
							
							<view class="detail-section" v-if="dept.duties && dept.duties.length > 0">
								<text class="detail-title">主要职责：</text>
								<view class="detail-list">
									<text class="detail-item" v-for="(duty, dutyIndex) in dept.duties" :key="dutyIndex">
										• {{duty}}
									</text>
								</view>
							</view>
							
							<view class="detail-section" v-if="dept.requirements && dept.requirements.length > 0">
								<text class="detail-title">招新要求：</text>
								<view class="detail-list">
									<text class="detail-item" v-for="(requirement, reqIndex) in dept.requirements" :key="reqIndex">
										• {{requirement}}
									</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 底部按钮 -->
			<view class="bottom-actions">
				<button 
					class="apply-btn" 
					:class="{ disabled: !isApplicationOpen, 'not-started': !isApplicationOpen && !hasApplicationStarted }"
					@click="goToApply"
				>
					<view v-if="isApplicationOpen" class="btn-content">
						<view class="btn-main-text">立即报名</view>
						<view v-if="countdownText" class="btn-countdown">{{ countdownText }}</view>
					</view>
					<view v-else-if="!hasApplicationStarted" class="btn-content">
						<view class="btn-main-text">报名未开始</view>
						<view v-if="startDate" class="btn-start-time">开始时间：{{ formatChineseDateTime(startDate) }}</view>
					</view>
					<view v-else class="btn-content">
						<view class="btn-main-text">报名已截止</view>
						<view v-if="deadlineDate" class="btn-deadline">截止时间：{{ formatChineseDateTime(deadlineDate) }}</view>
					</view>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import apiService from '../../utils/api.js'

	import cloudApiService from '../../utils/cloud-api.js'
	
	export default {
		data() {
		return {
			userInfo: null,
			departments: [
				{
					id: 0,
					name: '策划部',
					shortName: '策划',
					color: '#FF6B6B',
					description: '协会的"大脑"',
					expanded: false,
					introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！'
				},
				{
					id: 1,
					name: '执行部',
					shortName: '执行',
					color: '#4ECDC4',
					description: '协会的"行动力"',
					expanded: false,
					introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！'
				},
				{
					id: 2,
					name: '宣传部',
					shortName: '宣传',
					color: '#45B7D1',
					description: '协会的"信息窗口"',
					expanded: false,
					introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！'
				}
			],
			timeline: [],
			loading: true,
			isApplicationOpen: false,
			deadlineDate: null,
			startDate: null, // 新增：报名开始时间
			hasApplicationStarted: false, // 新增：是否已经开始报名
			// 添加定时器ID和刷新间隔
			refreshTimer: null,
			refreshInterval: 60000, // 60秒检查一次
			countdownText: '', // 新增倒计时文本
			countdownInterval: null // 新增倒计时定时器
		}
	},
		async onLoad() {
			await this.loadData()
		},
		
		// 添加页面显示时的刷新逻辑
		async onShow() {
			// 首页显示，开始自动刷新
			// 每次显示页面时，完整刷新一次数据
			await this.loadData()
			// 启动定时刷新（每60秒检查一次报名状态）
			this.startAutoRefresh()
		},
		
		// 添加页面隐藏时的清理逻辑
		onHide() {
			// 首页隐藏，停止自动刷新
			this.stopAutoRefresh()
		},
		
		// 添加页面卸载时的清理逻辑
		onUnload() {
			// 首页卸载，清理所有定时器
			this.stopAutoRefresh()
			this.stopCountdown()
		},
		
		// 添加下拉刷新处理
		async onPullDownRefresh() {
			// 用户下拉刷新
			try {
				await this.loadData()
			} catch (error) {
				// 下拉刷新失败
				uni.showToast({
					title: '刷新失败',
					icon: 'none'
				})
			} finally {
				// 停止下拉刷新动画
				uni.stopPullDownRefresh()
			}
		},
		
		methods: {
			// 启动自动刷新
			startAutoRefresh() {
				this.stopAutoRefresh() // 先清除之前的定时器
				
				// 状态检查定时器
				this.refreshTimer = setInterval(async () => {
					// 定时检查报名状态
					// 定时刷新只检查报名状态，不重新加载所有数据
					await this.refreshApplicationStatus()
				}, this.refreshInterval)
			},
			
			// 停止自动刷新
			stopAutoRefresh() {
				if (this.refreshTimer) {
					clearInterval(this.refreshTimer)
					this.refreshTimer = null
				}
			},
			
			// 刷新报名状态（不重新加载所有数据）
			async refreshApplicationStatus() {
				try {
					// 开始刷新报名状态
					const systemConfig = await cloudApiService.getSystemConfig()
					
					if (systemConfig) {
						// 只更新报名时间相关的状态
						this.setApplicationTime(systemConfig)
						// 报名状态刷新完成
					}
				} catch (error) {
					// 刷新报名状态失败
					// 刷新失败时不影响现有状态
				}
			},
			
			async loadData() {
				try {
					this.loading = true
					
					// 获取系统配置（包括部门信息和时间配置）
					await this.loadSystemConfig()
					
					// 获取其他数据
					try {
						const timeline = await apiService.getRecruitmentTimeline()
						this.timeline = timeline
					} catch (error) {
						// 获取时间线失败
					}
					
					// 检查用户登录状态
					this.userInfo = uni.getStorageSync('userInfo')
					
				} catch (error) {
					// 加载数据失败
					uni.showToast({
						title: '加载数据失败',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			},
			
			// 统一加载系统配置
			async loadSystemConfig() {
				try {
					// 开始加载系统配置
					// 使用安全的云数据库API
					const systemConfig = await cloudApiService.getSystemConfig()
					
					if (systemConfig) {
						// 1. 设置报名时间
						this.setApplicationTime(systemConfig)
						
						// 2. 更新部门信息（如果云端有配置）
						this.updateDepartmentsFromCloud(systemConfig)
						
						// 系统配置加载完成
					} else {
						this.setDefaultApplicationTime()
					}
					
				} catch (error) {
					// 加载系统配置失败，使用默认配置
					this.setDefaultApplicationTime()
				}
			},
			
			// 设置报名时间
			setApplicationTime(systemConfig) {
				try {
					// 直接使用新的时间字段
					const startTime = systemConfig.applicationStartTime ? new Date(systemConfig.applicationStartTime) : null
					const endTime = systemConfig.applicationEndTime ? new Date(systemConfig.applicationEndTime) : null
					
					// 设置开始时间和截止时间
					if (startTime) {
						this.startDate = startTime
					} else {
						this.startDate = new Date('2025-09-01T00:00:00') // 默认开始时间
					}
					
					if (endTime) {
						this.deadlineDate = endTime
					} else {
						this.deadlineDate = new Date('2025-10-15T23:59:59')
					}
					
					// 判断报名状态
					const now = new Date()
					
					// 判断是否已经开始报名
					this.hasApplicationStarted = startTime ? now >= startTime : true
					
					// 判断是否在报名时间内
					if (startTime) {
						this.isApplicationOpen = now >= startTime && now < this.deadlineDate
					} else {
						// 如果没有开始时间，只判断结束时间
						this.isApplicationOpen = now < this.deadlineDate
					}
					
					// 启动倒计时
					this.startCountdown()
					
					// 报名时间配置已设置
					
				} catch (error) {
					// 设置报名时间失败
					this.setDefaultApplicationTime()
				}
			},
			
			// 设置默认报名时间
			setDefaultApplicationTime() {
				this.startDate = new Date('2025-09-01T00:00:00') // 默认开始时间
				this.deadlineDate = new Date('2025-10-15T23:59:59')
				const now = new Date()
				
				// 判断报名状态
				this.hasApplicationStarted = now >= this.startDate
				this.isApplicationOpen = now >= this.startDate && now < this.deadlineDate
				
				// 启动倒计时
				this.startCountdown()
			},
			
			// 获取部门默认颜色
			getDepartmentColor(deptName) {
				const colors = {
					'策划部': '#FF6B6B',
					'执行部': '#4ECDC4',
					'宣传部': '#45B7D1'
				}
				return colors[deptName] || '#999'
			},
			
			// 从云端更新部门信息
			updateDepartmentsFromCloud(systemConfig) {
				try {
					if (systemConfig.departmentDetails) {
						// 发现云端部门配置，开始更新
						const cloudDepts = systemConfig.departmentDetails
						
						// 保留当前的展开状态
						const currentStates = {}
						this.departments.forEach(dept => {
							currentStates[dept.name] = dept.expanded
						})
						

						

						
						// 构建新的部门数组
						const newDepartments = []
						
						// 直接使用云端返回的部门信息
						Object.keys(cloudDepts).forEach((deptName, index) => {
							const cloudDept = cloudDepts[deptName]
							

							
							newDepartments.push({
								id: index,
								name: cloudDept.name || deptName,
								shortName: cloudDept.shortName || deptName.charAt(0),
								color: cloudDept.color || this.getDepartmentColor(deptName),
								description: cloudDept.description || '',
								expanded: currentStates[deptName] || false,
								introduction: cloudDept.introduction || '',
								duties: cloudDept.duties || null,
								requirements: cloudDept.requirements || null
							})
						})
						
						if (newDepartments.length > 0) {
							this.departments = newDepartments
							// 部门信息已从云端更新
						}
					} else {
						// 云端暂无部门配置，使用本地数据
					}
				} catch (error) {
					// 更新云端部门信息失败
				}
			},
			
			async getDeadlineDate() {
				// 这个方法已被 loadSystemConfig 替代，保留以防其他地方调用
				await this.loadSystemConfig()
			},
			
			async goToApply() {
				// 检查是否已经开始报名
				if (!this.hasApplicationStarted) {
					const startStr = this.startDate ? 
						this.formatChineseDateTime(this.startDate) : '2025年09月01日 00:00'
					
					// 显示报名未开始的提示
					uni.showModal({
						title: '报名未开始',
						content: `招新报名还未开始！\n\n开始时间：${startStr}\n\n请耐心等待，我们会在报名开始时通知大家。`,
						showCancel: false,
						confirmText: '我知道了',
						confirmColor: '#667eea'
					})
					return
				}
				
				// 检查是否在报名时间内
				if (!this.isApplicationOpen) {
					const deadlineStr = this.deadlineDate ? 
						this.formatChineseDateTime(this.deadlineDate) : '2025年09月14日 23:59'
					
					// 使用更详细的弹窗显示截止时间
					uni.showModal({
						title: '报名已截止',
						content: `很抱歉，招新报名已经截止了！\n\n截止时间：${deadlineStr}\n\n如果您对青创感兴趣，欢迎关注我们后续的活动信息。`,
						showCancel: false,
						confirmText: '我知道了',
						confirmColor: '#667eea'
					})
					return
				}
				
				// 使用switchTab跳转到tabBar页面
				uni.switchTab({
					url: '/pages/apply/apply'
				})
			},
			
			goToAdmin() {
				uni.navigateTo({
					url: '/pages/admin/admin'
				})
			},
			
			// 刷新数据
			async onRefresh() {
				await this.loadData()
			},
			
			// 切换部门展开/折叠状态
			toggleDepartment(deptId) {
				const dept = this.departments.find(d => d.id === deptId)
				if (dept) {
					dept.expanded = !dept.expanded
				}
			},
			
			// 格式化中文日期时间
			formatChineseDateTime(date) {
				if (!date) return '未知时间'
				try {
					const d = new Date(date)
					const year = d.getFullYear()
					const month = String(d.getMonth() + 1).padStart(2, '0')
					const day = String(d.getDate()).padStart(2, '0')
					const hours = String(d.getHours()).padStart(2, '0')
					const minutes = String(d.getMinutes()).padStart(2, '0')
					return `${year}年${month}月${day}日 ${hours}:${minutes}`
				} catch (e) {
					return '未知时间'
				}
			},
			
			// 格式化中文日期
			formatChineseDateOnly(date) {
				if (!date) return '未知日期'
				try {
					const d = new Date(date)
					const year = d.getFullYear()
					const month = String(d.getMonth() + 1).padStart(2, '0')
					const day = String(d.getDate()).padStart(2, '0')
					return `${year}年${month}月${day}日`
				} catch (e) {
					return '未知日期'
				}
			},
			
			// 启动倒计时
			startCountdown() {
				// 先停止之前的倒计时
				this.stopCountdown()
				
				// 如果报名已截止，不需要倒计时
				if (!this.isApplicationOpen && this.hasApplicationStarted) {
					this.countdownText = ''
					return
				}
				
				// 立即更新一次倒计时
				this.updateCountdown()
				
				// 启动定时器，每秒更新一次
				this.countdownInterval = setInterval(() => {
					this.updateCountdown()
				}, 1000)
			},
			
			// 更新倒计时
			updateCountdown() {
				const now = new Date()
				
				// 如果报名未开始，显示距离开始时间的倒计时
				if (!this.hasApplicationStarted && this.startDate) {
					const startTime = new Date(this.startDate)
					const diff = startTime.getTime() - now.getTime()
					
					if (diff <= 0) {
						// 开始时间已到，更新状态
						this.hasApplicationStarted = true
						this.isApplicationOpen = true
						this.countdownText = ''
						// 重新启动倒计时（现在显示距离截止时间的倒计时）
						this.startCountdown()
						return
					}
					
					// 计算距离开始时间的剩余时间
					const days = Math.floor(diff / (1000 * 60 * 60 * 24))
					const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
					const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
					const seconds = Math.floor((diff % (1000 * 60)) / 1000)
					
					// 格式化倒计时文本
					if (days > 0) {
						this.countdownText = `距离开始 ${days}天${hours}小时`
					} else if (hours > 0) {
						this.countdownText = `距离开始 ${hours}小时${minutes}分钟`
					} else if (minutes > 0) {
						this.countdownText = `距离开始 ${minutes}分钟${seconds}秒`
					} else {
						this.countdownText = `距离开始 ${seconds}秒`
					}
					return
				}
				
				// 如果报名已开始，显示距离截止时间的倒计时
				if (!this.deadlineDate || !this.isApplicationOpen) {
					this.countdownText = ''
					return
				}
				
				const deadline = new Date(this.deadlineDate)
				const diff = deadline.getTime() - now.getTime()
				
				if (diff <= 0) {
					// 时间已到，停止倒计时
					this.countdownText = ''
					this.isApplicationOpen = false
					this.stopCountdown()
					return
				}
				
				// 计算剩余时间
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
				const seconds = Math.floor((diff % (1000 * 60)) / 1000)
				
				// 格式化倒计时文本
				if (days > 0) {
					this.countdownText = `剩余 ${days}天${hours}小时`
				} else if (hours > 0) {
					this.countdownText = `剩余 ${hours}小时${minutes}分钟`
				} else if (minutes > 0) {
					this.countdownText = `剩余 ${minutes}分钟${seconds}秒`
				} else {
					this.countdownText = `剩余 ${seconds}秒`
				}
			},
			
			// 停止倒计时
			stopCountdown() {
				if (this.countdownInterval) {
					clearInterval(this.countdownInterval)
					this.countdownInterval = null
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		min-height: 100vh;
		padding: 0;
	}
	
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background: rgba(255, 255, 255, 0.9);
	}
	
	.content-wrapper {
		padding: 20px;
		max-width: 800px;
		margin: 0 auto;
	}
	
	/* 横幅样式 */
	.banner {
		position: relative;
		height: 200px;
		border-radius: 20px;
		overflow: hidden;
		margin-bottom: 30px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
	}
	
	.banner-image {
		width: 100%;
		height: 100%;
	}
	
	.banner-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8));
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.banner-content {
		display: flex;
		align-items: center;
		text-align: center;
	}
	
	.banner-logo {
		width: 80px;
		height: 80px;
		margin-right: 20px;
		border-radius: 50%;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
	}
	
	.banner-text {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}
	
	.banner-title {
		font-size: 32px;
		font-weight: 700;
		color: white;
		margin-bottom: 8px;
		text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
	}
	
	.banner-subtitle {
		font-size: 16px;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 400;
	}
	
	/* 卡片通用样式 */
	.section-card {
		background: white;
		border-radius: 20px;
		margin-bottom: 30px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}
	
	.card-header {
		background: linear-gradient(135deg, #667eea, #764ba2);
		padding: 20px 24px;
		text-align: center;
	}
	
	.section-title {
		font-size: 20px;
		font-weight: 600;
		color: white;
	}
	
	.card-content {
		padding: 24px;
	}
	
	/* 介绍卡片 */
	.intro-layout {
		display: flex;
		flex-direction: column; /* Changed to column to stack text and image */
		gap: 24px;
		align-items: flex-start;
	}
	
	.intro-text-section {
		flex: 1;
	}
	
	.intro-image-container {
		width: 100%;
		height: 200px; /* Fixed height for the image container */
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
	}
	
	.intro-image {
		width: 100%;
		height: 100%;
		object-fit: cover; /* Ensure image covers the container */
	}
	
	.intro-text {
		font-size: 16px;
		line-height: 1.8;
		color: #34495e;
		text-align: justify;
	}
	
	/* 部门卡片 */
	.department-card {
		background: #f8f9fa;
		border-radius: 16px;
		padding: 20px;
		margin-bottom: 20px;
		border: 1px solid #e9ecef;
		transition: all 0.3s ease;
	}
	
	.department-card:last-child {
		margin-bottom: 0;
	}
	
	.dept-header {
		display: flex;
		align-items: center;
		margin-bottom: 0;
		cursor: pointer;
		transition: all 0.3s ease;
		padding: 4px;
		border-radius: 12px;
	}
	
	.dept-header:active {
		background: rgba(0, 0, 0, 0.05);
		transform: scale(0.98);
	}
	
	.dept-icon {
		width: 70px;
		height: 70px;
		border-radius: 35px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}
	
	.dept-icon-text {
		color: white;
		font-size: 18px;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 60px;
		text-align: center;
	}
	
	.dept-info {
		flex: 1;
	}
	
	.dept-name {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 6px;
	}
	
	.dept-desc {
		font-size: 14px;
		color: #6c757d;
		line-height: 1.4;
	}
	
	.expand-icon {
		margin-left: auto;
		padding: 8px;
		transition: transform 0.3s ease;
	}
	
	.expand-icon.expanded {
		transform: rotate(180deg);
	}
	
	.expand-arrow {
		font-size: 16px;
		color: #6c757d;
		font-weight: bold;
	}
	
	.dept-details {
		border-top: 1px solid #dee2e6;
		padding-top: 20px;
		margin-top: 20px;
		animation: slideDown 0.3s ease;
		overflow: hidden;
	}
	
	.dept-details.expanded {
		animation: slideDown 0.3s ease;
	}
	
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
			max-height: 0;
		}
		to {
			opacity: 1;
			transform: translateY(0);
			max-height: 1000px;
		}
	}
	
	.detail-section {
		margin-bottom: 20px;
	}
	
	.detail-section:last-child {
		margin-bottom: 0;
	}
	
	.detail-title {
		font-size: 16px;
		font-weight: 600;
		color: #495057;
		display: block;
		margin-bottom: 12px;
	}
	
	.detail-content {
		font-size: 14px;
		color: #6c757d;
		line-height: 1.8;
		text-align: justify;
		margin-bottom: 16px;
	}
	
	.detail-list {
		padding-left: 8px;
	}
	
	.detail-item {
		font-size: 14px;
		color: #6c757d;
		line-height: 1.6;
		display: block;
		margin-bottom: 6px;
	}
	

	
	/* 底部按钮 */
	.bottom-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		margin-top: 40px;
		margin-bottom: 40px;
	}
	
	.apply-btn {
		width: 80%;
		max-width: 400px;
		min-height: 50px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 25px;
		font-size: 16px;
		font-weight: 600;
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 12px 16px;
	}
	
	.apply-btn:active {
		transform: translateY(2px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}
	
	.apply-btn.disabled {
		background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
		box-shadow: none;
	}

	.apply-btn.not-started {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		box-shadow: 0 8px 24px rgba(245, 158, 11, 0.4);
	}

	.apply-btn.not-started:active {
		transform: translateY(2px);
		box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
	}

	.btn-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
	}

	.btn-main-text {
		font-size: 16px;
		font-weight: 600;
		color: white;
		line-height: 1.2;
		margin-bottom: 3px;
	}

	.btn-countdown {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.2;
	}

	.btn-deadline {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.2;
	}

	.btn-start-time {
		font-size: 13px;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.2;
	}
	

</style>
