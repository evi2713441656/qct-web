<template>
	<view class="container">
		<!-- 下拉刷新容器 -->
		<scroll-view 
			class="scroll-container"
			scroll-y="true"
			:refresher-enabled="true"
			:refresher-triggered="refresherTriggered"
			@refresherrefresh="onRefresherRefresh"
			@refresherrestore="onRefresherRestore"
			@refresherabort="onRefresherAbort">
			
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-container">
				<uni-load-more status="loading" :content-text="{
					contentdown: '加载中...',
					contentrefresh: '加载中...',
					contentnomore: '加载中...'
				}"></uni-load-more>
			</view>
			
			<!-- 内容区域 -->
			<view v-else>
				<!-- 未登录状态 -->
				<view v-if="!isLoggedIn" class="login-prompt">
					<image src="/static/logo.png" class="login-icon" mode="aspectFit"></image>
					<text class="login-title">请先登录</text>
					<text class="login-desc">登录后可以查看您的报名状态和相关信息</text>
					<button class="btn-primary login-btn" @click="handleLogin">微信登录</button>
				</view>
				
				<!-- 已登录状态 -->
				<view v-else>
					<!-- 报名状态 -->
					<view v-if="application" class="status-card">
						<view class="status-header">
							<text class="status-title">我的报名</text>
							<view class="status-badge" :class="getStatusClass(application.status)">
								{{getStatusText(application.status)}}
							</view>
						</view>
						
						<view class="status-details">
							<view class="detail-row">
								<text class="detail-label">报名时间：</text>
								<text class="detail-value">{{formatDate(application.createdAt || application.applyTime)}}</text>
							</view>
							<view class="detail-row">
								<text class="detail-label">意向部门：</text>
								<text class="detail-value">{{formatDepartments(application)}}</text>
							</view>
							<view class="detail-row">
								<text class="detail-label">姓名：</text>
								<text class="detail-value">{{application.name || '未填写'}}</text>
							</view>
							<view class="detail-row">
								<text class="detail-label">学号：</text>
								<text class="detail-value">{{application.student_id || application.studentId || '未填写'}}</text>
							</view>
							<!-- 一面通过部门 -->
							<view v-if="getFirstPassedDepartments(application)" class="detail-row">
								<text class="detail-label">一面通过部门：</text>
								<text class="detail-value passed-departments">{{getFirstPassedDepartments(application)}}</text>
							</view>
							<!-- 二面通过部门 -->
							<view v-if="getSecondPassedDepartments(application)" class="detail-row">
								<text class="detail-label">二面通过部门：</text>
								<text class="detail-value passed-departments">{{getSecondPassedDepartments(application)}}</text>
							</view>
							<!-- 最终录取部门 -->
							<view v-if="getFinalDepartment(application)" class="detail-row">
								<text class="detail-label">录取部门：</text>
								<text class="detail-value final-department">{{getFinalDepartment(application)}}</text>
							</view>
						</view>
					</view>
					
					<!-- 未报名状态 -->
					<view v-if="!application" class="no-application">
						<image src="/static/logo.png" class="no-app-icon" mode="aspectFit"></image>
						<text class="no-app-title">您还没有报名</text>
						<text class="no-app-desc">点击下方按钮开始报名申请</text>
						<button class="btn-primary apply-btn" @click="goToApply">立即报名</button>
					</view>
					
					<!-- 功能菜单 -->
					<view class="menu-section">
						<view class="menu-card">
							<view class="menu-item" @click="goToApply">
								<view class="menu-icon apply-icon">📝</view>
								<text class="menu-text">报名申请</text>
								<text class="menu-arrow">></text>
							</view>
							<view class="menu-item" @click="showNotificationHistory">
								<view class="menu-icon notification-icon">🔔</view>
								<text class="menu-text">历史通知</text>
								<text class="menu-arrow">></text>
							</view>
							<view class="menu-item" @click="refreshData">
								<view class="menu-icon refresh-icon">🔄</view>
								<text class="menu-text">刷新状态</text>
								<text class="menu-arrow">></text>
							</view>
							<view class="menu-item" @click="contactUs">
								<view class="menu-icon contact-icon">📞</view>
								<text class="menu-text">联系我们</text>
								<text class="menu-arrow">></text>
							</view>
						</view>
					</view>
					
					<!-- 退出登录 -->
					<view class="logout-section">
						<button class="btn-secondary logout-btn" @click="logout">退出登录</button>
					</view>
				</view>
			</view>
		</scroll-view>
		
		<!-- 历史通知弹窗 -->
		<view v-if="showNotificationModal" class="modal-overlay" @click="closeNotificationModal">
			<view class="modal-content large-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">历史通知</text>
					<text class="close-btn" @click="closeNotificationModal">×</text>
				</view>
				<view class="modal-body">
					<view v-if="loadingNotifications" class="loading-container">
						<uni-load-more status="loading"></uni-load-more>
					</view>
					<view v-else-if="notifications.length === 0" class="no-notifications">
						<text class="no-data-text">暂无通知</text>
					</view>
					<view v-else class="notification-list">
						<view v-for="notification in notifications" :key="notification._id" class="notification-item">
							<view class="notification-header">
								<text class="notification-title">{{notification.title}}</text>
								<text class="notification-time">{{formatTime(notification.createdAt)}}</text>
							</view>
							<view class="notification-content">{{notification.content}}</view>
							<view class="notification-footer">
								<text class="notification-type">{{getNotificationTypeText(notification.type)}}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import apiService from '../../utils/api.js'
	import { formatDateTime, formatSmartTime } from '../../utils/utils.js'
	import authManager from '../../utils/auth.js'
	
	export default {
		data() {
			return {
				userInfo: {
					avatar: '/static/logo.png',
					nickname: '微信用户'
				},
				application: null,
				loading: true,
				isLoggedIn: false,
				showNotificationModal: false,
				notifications: [],
				loadingNotifications: false,
				selectedDepartment: '',
				submittingSelection: false,
				// 下拉刷新相关数据
				refresherTriggered: false
			}
		},
		
		async onLoad() {
			// 添加登录状态监听器
			authManager.addListener(this.onAuthStateChanged)
			await this.loadUserData()
		},
		
		async onShow() {
			await this.loadUserData()
		},
		
		onUnload() {
			// 移除登录状态监听器
			authManager.removeListener(this.onAuthStateChanged)
		},
		
		methods: {
			// 登录状态变化回调
			onAuthStateChanged(authState) {
				this.isLoggedIn = authState.isLoggedIn
				this.userInfo = authState.userInfo || {
					avatar: '/static/logo.png',
					nickname: '微信用户'
				}
				
				if (this.isLoggedIn) {
					this.loadApplicationData()
				} else {
					this.application = null
				}
			},
			
			async loadUserData() {
				try {
					this.loading = true
					
					// 使用全局登录状态管理
					const authState = authManager.getLoginStatus()
					this.isLoggedIn = authState.isLoggedIn
					this.userInfo = authState.userInfo || {
						avatar: '/static/logo.png',
						nickname: '微信用户'
					}
					
					if (this.isLoggedIn) {
						await this.loadApplicationData()
					} else {
						this.application = null
					}
				} catch (error) {
					// 加载用户数据失败
					uni.showToast({
						title: '加载数据失败',
						icon: 'none'
					})
					// 设置默认用户信息
					this.userInfo = {
						avatar: '/static/logo.png',
						nickname: '微信用户'
					}
					this.isLoggedIn = false
				} finally {
					this.loading = false
				}
			},
			
			// 处理登录
			async handleLogin() {
				try {
					const result = await authManager.login()
					
					if (result.success) {
						// 登录成功，状态会自动更新
										// 登录成功
			} else {
				// 登录失败
			}
		} catch (error) {
			// 登录失败
					uni.showToast({
						title: error.message || '登录失败',
						icon: 'none'
					})
				}
			},
			
			async loadApplicationData() {
				try {
					if (!this.userInfo || !this.userInfo._id) {
						// 用户信息不存在，无法加载申请数据
						this.application = null
						return
					}
					
					const result = await apiService.getApplication()
					
					if (result.success && result.data) {
						this.application = result.data
						
						// 更新用户信息中的hasApplied字段
						const updatedUserInfo = {
							...this.userInfo,
							hasApplied: true
						}
						this.userInfo = updatedUserInfo
						uni.setStorageSync('userInfo', updatedUserInfo)
					} else {
						this.application = null
						
						// 更新用户信息中的hasApplied字段
						const updatedUserInfo = {
							...this.userInfo,
							hasApplied: false
						}
						this.userInfo = updatedUserInfo
						uni.setStorageSync('userInfo', updatedUserInfo)
					}
				} catch (error) {
					// 加载申请数据失败
					this.application = null
					
					// 更新用户信息中的hasApplied字段
					const updatedUserInfo = {
						...this.userInfo,
						hasApplied: false
					}
					this.userInfo = updatedUserInfo
					uni.setStorageSync('userInfo', updatedUserInfo)
				}
			},
			
			goToApply() {
				if (!this.isLoggedIn) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				uni.switchTab({
					url: '/pages/apply/apply'
				})
			},
			
			async refreshData() {
				if (!this.isLoggedIn) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				try {
					await this.loadUserData()
				} catch (error) {
					// 刷新失败
					uni.showToast({
						title: '刷新失败',
						icon: 'none'
					})
				}
			},
			
			contactUs() {
				uni.showModal({
					title: '联系我们',
					content: '如有问题，请联系：\n\n邮箱：ymxc152@qq.com',
					showCancel: false
				})
			},
			
			async logout() {
				try {
					const result = await new Promise((resolve) => {
						uni.showModal({
							title: '确认退出',
							content: '确定要退出登录吗？',
							success: (res) => {
								resolve(res.confirm)
							}
						})
					})
					
					if (result) {
						await authManager.logout()
						// 登出后状态会自动更新
					}
				} catch (error) {
					// 退出登录失败
					uni.showToast({
						title: '退出失败',
						icon: 'none'
					})
				}
			},
			
			// 获取状态样式
			getStatusClass(status) {
				const classMap = {
					waiting_first: 'status-pending',
					first_failed: 'status-failed',
					waiting_second: 'status-interview',
					second_failed: 'status-failed',
					department_selection: 'status-selection',
					accepted: 'status-passed'
				}
				return classMap[status] || 'status-pending'
			},
			
			// 获取状态文本
			getStatusText(status) {
				const statusMap = {
					waiting_first: '等待一面',
					first_failed: '一面落选',
					waiting_second: '等待二面',
					second_failed: '二面落选',
					department_selection: '部门选择',
					accepted: '已录取'
				}
				return statusMap[status] || '未知状态'
			},
			
			// 获取面试状态样式
			getInterviewStatusClass(status) {
				const classMap = {
					pending: 'status-pending',
					passed: 'status-passed',
					failed: 'status-failed',
					scheduled: 'status-scheduled'
				}
				return classMap[status] || 'status-pending'
			},
			
			// 获取面试状态文本
			getInterviewStatusText(status) {
				const statusMap = {
					pending: '待安排',
					scheduled: '已安排',
					passed: '通过',
					failed: '未通过'
				}
				return statusMap[status] || '待安排'
			},
			
			// 格式化日期
			formatDate(dateString) {
				if (!dateString) return '未填写'
				return formatDateTime(dateString) || '未填写'
			},
			
			// 格式化部门信息
			formatDepartments(application) {
				if (!application) return '未选择'
				
				// 处理新的数据库字段格式
				if (application.first_choice || application.second_choice) {
					const departments = []
					if (application.first_choice) departments.push(application.first_choice)
					if (application.second_choice) departments.push(application.second_choice)
					return departments.length > 0 ? departments.join('、') : '未选择'
				}
				
				// 兼容旧的departments字段
				if (application.departments) {
					if (Array.isArray(application.departments)) {
						return application.departments.length > 0 ? application.departments.join('、') : '未选择'
					}
					return application.departments || '未选择'
				}
				
				return '未选择'
			},
			
			// 显示历史通知
			async showNotificationHistory() {
				if (!this.isLoggedIn) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				this.showNotificationModal = true
				await this.loadNotifications()
			},
			
			// 关闭通知弹窗
			closeNotificationModal() {
				this.showNotificationModal = false
			},
			
			// 加载通知数据
			async loadNotifications() {
				try {
					this.loadingNotifications = true
					
					// 获取当前用户ID
					const currentUser = uni.getStorageSync('userInfo')
					const userId = currentUser ? currentUser.openid : null
					// 当前用户信息
					// 用户ID (openid)
					
					// 获取所有通知
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'getNotificationHistory'
						}
					})
					
					if (result.result.success) {
						// 获取到的所有通知
						
						// 过滤出用户应该看到的通知
						this.notifications = result.result.data.filter(notification => {
							// 检查通知
							
							// 全体通知
							if (notification.type === 'all' || 
								(notification.targetIds && notification.targetIds.includes('all'))) {
								// 匹配全体通知
								return true
							}
							
							// 指定用户通知
							if (userId && notification.targetIds && Array.isArray(notification.targetIds)) {
								const isMatch = notification.targetIds.includes(userId)
								// 检查用户匹配
								if (isMatch) return true
							}
							
							// 基于用户状态的通知匹配
							if (this.application && userId) {
								const userStatus = this.application.status
								// 用户当前状态
								
								// 状态匹配规则（用户能看到当前状态及之前所有状态的消息）
								const statusMatches = {
									'waiting_first': ['waiting_first'],
									'first_passed': ['waiting_first', 'first_passed'],
									'waiting_second': ['waiting_first', 'first_passed', 'waiting_second'],
									'first_failed': ['waiting_first', 'first_failed'],
									'second_failed': ['waiting_first', 'first_passed', 'waiting_second', 'second_failed'],
									'department_selection': ['waiting_first', 'first_passed', 'waiting_second', 'department_selection'],
									'accepted': ['waiting_first', 'first_passed', 'waiting_second', 'department_selection', 'accepted']
								}
								
								const matchingTypes = statusMatches[userStatus] || []
								if (matchingTypes.includes(notification.type)) {
									// 状态匹配通知
									return true
								}
							}
							
							// 不匹配任何条件
							return false
						})
						
						// 加载了通知
					} else {
						// 获取通知失败
						uni.showToast({
							title: '加载通知失败',
							icon: 'none'
						})
					}
				} catch (error) {
					// 加载通知失败
					uni.showToast({
						title: '加载通知失败',
						icon: 'none'
					})
				} finally {
					this.loadingNotifications = false
				}
			},
			
			// 格式化时间 - 通知用智能时间显示
			formatTime(dateString) {
				if (!dateString) return ''
				return formatSmartTime(dateString) || ''
			},
			
			// 获取通知类型文本
			getNotificationTypeText(type) {
				const typeMap = {
					all: '全体通知',
					waiting_first: '等待一面通知',
					first_passed: '一面通过通知',
					waiting_second: '等待二面通知',
					first_failed: '一面未通过通知',
					second_failed: '二面未通过通知',
					department_selection: '部门选择通知',
					accepted: '录取通知',
					department: '部门通知',
					individual: '个人通知',
					selected: '个人通知'
				}
				return typeMap[type] || '通知'
			},
			
			// 获取可选择的部门列表
			getAvailableDepartments() {
				if (!this.application) return []
				
				// 从二面结果中获取通过的部门
				if (this.application.secondInterview && this.application.secondInterview.passedDepartments) {
					return this.application.secondInterview.passedDepartments
				}
				
				// 如果没有二面结果，从一面结果中获取
				if (this.application.firstInterview && this.application.firstInterview.passedDepartments) {
					return this.application.firstInterview.passedDepartments
				}
				
				return []
			},
			
			// 选择部门
			selectDepartment(department) {
				this.selectedDepartment = department
			},
			
			// 确认部门选择（多个部门时）
			async confirmDepartmentSelection() {
				if (!this.selectedDepartment) {
					uni.showToast({
						title: '请选择一个部门',
						icon: 'none'
					})
					return
				}
				
				try {
					this.submittingSelection = true
					
					const result = await uniCloud.callFunction({
						name: 'application',
						data: {
							type: 'select_department',
							applicationId: this.application._id,
							department: this.selectedDepartment,
							userId: this.userInfo._id
						}
					})
					
					if (result.result.success) {
						uni.showToast({
							title: '选择成功！',
							icon: 'success'
						})
						
						// 刷新申请数据
						await this.loadApplicationData()
						this.selectedDepartment = ''
					} else {
						uni.showToast({
							title: result.result.error || '选择失败',
							icon: 'none'
						})
					}
				} catch (error) {
					// 确认部门选择失败
					uni.showToast({
						title: '选择失败，请重试',
						icon: 'none'
					})
				} finally {
					this.submittingSelection = false
				}
			},
			
			// 确认加入单个部门
			async acceptSingleDepartment() {
				const availableDepts = this.getAvailableDepartments()
				if (availableDepts.length !== 1) {
					uni.showToast({
						title: '系统错误，请刷新重试',
						icon: 'none'
					})
					return
				}
				
				try {
					this.submittingSelection = true
					
					const result = await uniCloud.callFunction({
						name: 'application',
						data: {
							type: 'select_department',
							applicationId: this.application._id,
							department: availableDepts[0],
							userId: this.userInfo._id
						}
					})
					
					if (result.result.success) {
						uni.showToast({
							title: '确认成功！欢迎加入' + availableDepts[0],
							icon: 'success'
						})
						
						// 刷新申请数据
						await this.loadApplicationData()
					} else {
						uni.showToast({
							title: result.result.error || '确认失败',
							icon: 'none'
						})
					}
				} catch (error) {
					// 确认加入失败
					uni.showToast({
						title: '确认失败，请重试',
						icon: 'none'
					})
				} finally {
					this.submittingSelection = false
				}
			},
			
			// 拒绝部门录取
			async rejectDepartment() {
				const availableDepts = this.getAvailableDepartments()
				if (availableDepts.length === 0) {
					uni.showToast({
						title: '系统错误，请刷新重试',
						icon: 'none'
					})
					return
				}
				
				// 确认对话框
				const deptText = availableDepts.length === 1 ? availableDepts[0] : '所有部门'
				const confirmResult = await new Promise((resolve) => {
					uni.showModal({
						title: '确认拒绝',
						content: `确定要拒绝${deptText}的录取吗？此操作不可撤销。`,
						success: (res) => {
							resolve(res.confirm)
						},
						fail: () => {
							resolve(false)
						}
					})
				})
				
				if (!confirmResult) {
					return
				}
				
				try {
					this.submittingSelection = true
					
					const result = await uniCloud.callFunction({
						name: 'application',
						data: {
							type: 'reject_department',
							applicationId: this.application._id,
							userId: this.userInfo._id
						}
					})
					
					if (result.result.success) {
						uni.showToast({
							title: '已拒绝录取',
							icon: 'success'
						})
						
						// 刷新申请数据
						await this.loadApplicationData()
					} else {
						uni.showToast({
							title: result.result.error || '操作失败',
							icon: 'none'
						})
					}
				} catch (error) {
					// 拒绝录取失败
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					})
				} finally {
					this.submittingSelection = false
				}
			},
			
			// 获取一面通过部门
			getFirstPassedDepartments(applicationData) {
				if (!applicationData || !applicationData.firstInterview) return ''
				
				// 如果当前状态是等待一面，不显示一面通过部门信息
				if (applicationData.status === 'waiting_first') return ''
				
				const passedDepartments = applicationData.firstInterview.passedDepartments
				if (!passedDepartments || passedDepartments.length === 0) return ''
				
				if (Array.isArray(passedDepartments)) {
					return passedDepartments.join('、')
				}
				return passedDepartments
			},
			
			// 获取二面通过部门
			getSecondPassedDepartments(applicationData) {
				if (!applicationData || !applicationData.secondInterview) return ''
				
				// 如果当前状态是等待二面，不显示二面通过部门信息
				if (applicationData.status === 'waiting_second') return ''
				
				const passedDepartments = applicationData.secondInterview.passedDepartments
				if (!passedDepartments || passedDepartments.length === 0) return ''
				
				if (Array.isArray(passedDepartments)) {
					return passedDepartments.join('、')
				}
				return passedDepartments
			},
			
			// 获取最终录取部门
			getFinalDepartment(applicationData) {
				if (!applicationData) return ''
				
				// 如果状态是已录取，显示最终选择的部门
				if (applicationData.status === 'accepted' && applicationData.finalDepartment) {
					return applicationData.finalDepartment
				}
				
				return ''
			},
			
			// 下拉刷新相关方法
			async onRefresherRefresh() {
				try {
					this.refresherTriggered = true
					await this.loadUserData()
				} catch (error) {
					// 静默处理错误，不显示弹窗
				} finally {
					this.refresherTriggered = false
				}
			},
			
			onRefresherRestore() {
				// 刷新器状态恢复
			},
			
			onRefresherAbort() {
				// 刷新器状态中止
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20px;
		background: #f5f5f5;
		min-height: 100vh;
	}
	
	.scroll-container {
		height: 100vh;
		box-sizing: border-box;
	}
	
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}
	
	/* 登录提示样式 */
	.login-prompt {
		background: white;
		border-radius: 12px;
		padding: 40px 20px;
		text-align: center;
		margin-bottom: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.login-icon {
		width: 80px;
		height: 80px;
		margin-bottom: 16px;
		opacity: 0.6;
	}
	
	.login-title {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 8px;
	}
	
	.login-desc {
		font-size: 14px;
		color: #7f8c8d;
		margin-bottom: 24px;
		line-height: 1.5;
	}
	
	.login-btn {
		width: 200px;
		height: 45px;
		border-radius: 22px;
	}
	

	
	.status-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	
	.status-title {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
	}
	
	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}
	
	.status-details {
		border-top: 1px solid #ecf0f1;
		padding-top: 16px;
	}
	
	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	
	.detail-label {
		font-size: 14px;
		color: #7f8c8d;
	}
	
	.detail-value {
		font-size: 14px;
		color: #2c3e50;
		font-weight: 500;
	}
	
	.passed-departments {
		color: #27ae60;
		font-weight: 600;
	}
	
	.final-department {
		color: #e74c3c;
		font-weight: 700;
		font-size: 16px;
	}
	

	
	.no-application {
		background: white;
		border-radius: 12px;
		padding: 40px 20px;
		text-align: center;
		margin-bottom: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.no-app-icon {
		width: 80px;
		height: 80px;
		margin-bottom: 16px;
		opacity: 0.6;
	}
	
	.no-app-title {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 8px;
	}
	
	.no-app-desc {
		font-size: 14px;
		color: #7f8c8d;
		margin-bottom: 24px;
	}
	
	.apply-btn {
		width: 200px;
		height: 45px;
		border-radius: 22px;
	}
	
	.menu-section {
		margin-bottom: 20px;
	}
	
	.menu-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}
	
	.menu-item {
		display: flex;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid #f1f2f6;
		transition: background-color 0.3s ease;
	}
	
	.menu-item:last-child {
		border-bottom: none;
	}
	
	.menu-item:active {
		background-color: #f8f9fa;
	}
	
	.menu-icon {
		width: 40px;
		height: 40px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16px;
		font-size: 20px;
	}
	
	.apply-icon {
		background: #e3f2fd;
	}
	
	.refresh-icon {
		background: #f3e5f5;
	}
	
	.contact-icon {
		background: #e8f5e8;
	}
	
	.menu-text {
		flex: 1;
		font-size: 16px;
		color: #2c3e50;
	}
	
	.menu-arrow {
		font-size: 16px;
		color: #bdc3c7;
	}
	
	.logout-section {
		text-align: center;
	}
	
	.logout-btn {
		width: 200px;
		height: 45px;
		border-radius: 22px;
	}
	
	.status-pending {
		background: #fff3cd;
		color: #856404;
	}
	
	.status-passed {
		background: #d4edda;
		color: #155724;
	}
	
	.status-failed {
		background: #f8d7da;
		color: #721c24;
	}
	
	.status-scheduled {
		background: #e3f2fd;
		color: #1976d2;
	}
	
	.status-interview {
		background: #e8f5e8;
		color: #2e7d32;
	}
	
	.status-selection {
		background: #fff3e0;
		color: #f57c00;
	}
	
	/* 部门选择样式 */
	.department-selection-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.selection-header {
		text-align: center;
		margin-bottom: 20px;
	}
	
	.selection-title {
		font-size: 20px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 8px;
	}
	
	.selection-subtitle {
		font-size: 14px;
		color: #7f8c8d;
	}
	
	.department-list {
		margin-bottom: 20px;
	}
	
	.department-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		border: 2px solid #ecf0f1;
		border-radius: 8px;
		margin-bottom: 12px;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.department-option:last-child {
		margin-bottom: 0;
	}
	
	.department-option:hover {
		border-color: #3498db;
		background-color: #f8f9fa;
	}
	
	.department-option.selected {
		border-color: #3498db;
		background-color: #e3f2fd;
	}
	
	.dept-name {
		font-size: 16px;
		font-weight: 500;
		color: #2c3e50;
	}
	
	.dept-check {
		font-size: 18px;
		color: #3498db;
		font-weight: bold;
	}
	
	/* 单个部门确认样式 */
	.single-department-info {
		margin-bottom: 20px;
	}
	
	.dept-card {
		display: flex;
		align-items: center;
		padding: 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 12px;
		color: white;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}
	
	.dept-icon {
		font-size: 32px;
		margin-right: 16px;
		opacity: 0.9;
	}
	
	.dept-details {
		flex: 1;
	}
	
	.dept-name-large {
		font-size: 20px;
		font-weight: 600;
		display: block;
		margin-bottom: 6px;
	}
	
	.dept-desc {
		font-size: 14px;
		opacity: 0.9;
		line-height: 1.4;
	}
	
	/* 操作按钮样式 */
	.action-buttons {
		margin-top: 20px;
	}
	
	.confirm-btn {
		height: 45px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		border: none;
		transition: all 0.3s ease;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}
	
	.confirm-btn.disabled {
		opacity: 0.6;
		background: #bdc3c7 !important;
	}
	
	.single-dept-buttons, .multi-dept-buttons {
		display: flex;
		gap: 12px;
	}
	
	.multi-dept-buttons .confirm-btn {
		flex: 1;
	}
	
	.reject-btn, .accept-btn, .confirm-btn {
		flex: 1;
		height: 45px;
		border-radius: 8px;
		font-size: 16px;
		font-weight: 500;
		border: none;
		transition: all 0.3s ease;
	}
	
	.reject-btn {
		background: #f8f9fa;
		color: #6c757d;
		border: 1px solid #dee2e6;
	}
	
	.reject-btn:hover {
		background: #e9ecef;
		color: #495057;
	}
	
	.accept-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}
	
	.accept-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}
	
	.notification-icon {
		background: #fff3e0;
	}
	
	/* 弹窗样式 */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
	}
	
	.large-modal {
		max-width: 700px;
		max-height: 90vh;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #e9ecef;
	}
	
	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
	}
	
	.close-btn {
		font-size: 24px;
		color: #7f8c8d;
		cursor: pointer;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: #f8f9fa;
	}
	
	.modal-body {
		padding: 20px;
		max-height: 60vh;
		overflow-y: auto;
	}
	
	.no-notifications {
		text-align: center;
		padding: 40px 20px;
	}
	
	.no-data-text {
		font-size: 16px;
		color: #7f8c8d;
	}
	
	/* 通知列表样式 */
	.notification-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.notification-item {
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 16px;
		background: #f8f9fa;
	}
	
	.notification-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 8px;
	}
	
	.notification-title {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
		flex: 1;
		margin-right: 12px;
	}
	
	.notification-time {
		font-size: 12px;
		color: #7f8c8d;
		white-space: nowrap;
	}
	
	.notification-content {
		margin-bottom: 12px;
		line-height: 1.5;
		color: #2c3e50;
		font-size: 14px;
	}
	
	.notification-footer {
		display: flex;
		justify-content: flex-end;
	}
	
	.notification-type {
		font-size: 12px;
		color: #7f8c8d;
		background: #e9ecef;
		padding: 2px 8px;
		border-radius: 12px;
	}
</style>