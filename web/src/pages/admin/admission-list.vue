<template>
	<view class="container">
		<!-- 下拉刷新容器 -->
		<scroll-view 
			class="scroll-container" 
			scroll-y="true" 
			refresher-enabled="true"
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
			@refresherrestore="onRefreshRestore"
			@refresherabort="onRefreshAbort"
		>
				<!-- 筛选栏 -->
	<view class="filter-section">
		<view class="filter-card">
			<view class="filter-row">
				<view class="filter-item">
					<text class="filter-label">状态筛选</text>
					<picker :value="statusIndex" :range="statusOptions" @change="onStatusChange" class="filter-picker">
						<text class="picker-text">{{ statusOptions[statusIndex] }}</text>
					</picker>
				</view>
				<view class="filter-item">
					<text class="filter-label">部门筛选</text>
					<picker :value="deptIndex" :range="deptOptions" @change="onDeptChange" class="filter-picker">
						<text class="picker-text">{{ deptOptions[deptIndex] }}</text>
					</picker>
				</view>
			</view>
			<view class="search-box">
				<input class="search-input" v-model="searchKeyword" placeholder="搜索姓名或学号" @input="handleSearchInput" />
				<button class="search-btn" @click="handleSearch">搜索</button>
			</view>
		</view>
	</view>

	<!-- 统计信息 -->
	<view class="stats-section">
		<view class="stats-card">
			<view class="stats-item">
				<text class="stats-number">{{ filteredAdmissions.length }}</text>
				<text class="stats-label">当前显示</text>
			</view>
			<view class="stats-item">
				<text class="stats-number">{{ totalAdmitted }}</text>
				<text class="stats-label">总录取人数</text>
			</view>
			<view class="stats-item">
				<text class="stats-number">{{ pendingConfirmCount }}</text>
				<text class="stats-label">待用户确认</text>
			</view>
		</view>
	</view>

	<!-- 快捷操作 -->
	<view class="quick-actions-section">
		<view class="quick-actions-card">
			<view class="quick-actions-header">
				<text class="quick-actions-title">快捷操作</text>
				<view class="header-actions">
					<view class="refresh-btn" @click="manualRefresh">
						<text class="refresh-text">刷新数据</text>
					</view>
				</view>
			</view>
			<view class="quick-actions-content">
				<!-- 通知管理 -->
				<view class="action-group">
					<text class="action-group-title">通知管理</text>
					<view class="action-buttons">
						<button class="btn-primary action-btn" @click="showSendNotification">发送通知</button>
						<button class="btn-secondary action-btn" @click="showNotificationHistory">查看历史通知</button>
					</view>
				</view>
			</view>
		</view>
	</view>

		<!-- 录取名单 -->
		<view class="admission-section">
			<view v-if="filteredAdmissions.length === 0" class="empty-state">
				<view class="empty-logo">
					<image src="/static/logo.png" mode="aspectFit" class="logo-image"></image>
				</view>
				<view class="empty-content">
					<text class="empty-title">暂无录取数据</text>
				</view>
			</view>
			<view v-else class="admission-list">
				<view 
					v-for="admission in filteredAdmissions" 
					:key="admission._id" 
					class="admission-card"
				>
					<view class="admission-header">
						<view class="admission-info">
							<text v-if="admission.name" class="admission-name">{{ admission.name }}</text>
							<text v-if="admission.student_id" class="admission-student-id">{{ admission.student_id }}</text>
						</view>
						<view class="admission-status">
							<view class="status-badge" :class="getStatusClass(admission.status)">
								{{ getStatusText(admission.status) }}
							</view>
						</view>
					</view>
					<view class="admission-details">
						<view v-if="admission.major" class="detail-row">
							<text class="detail-label">专业班级：</text>
							<text class="detail-value">{{ admission.major }}</text>
						</view>
						<view v-if="admission.phone" class="detail-row">
							<text class="detail-label">联系方式：</text>
							<text class="detail-value">{{ admission.phone }}</text>
						</view>
						<view v-if="getFirstPassedDepartments(admission)" class="detail-row">
							<text class="detail-label">一面通过部门：</text>
							<text class="detail-value first-passed-departments">{{ getFirstPassedDepartments(admission) }}</text>
						</view>
						<view v-if="getSecondPassedDepartments(admission)" class="detail-row">
							<text class="detail-label">二面通过部门：</text>
							<text class="detail-value second-passed-departments">{{ getSecondPassedDepartments(admission) }}</text>
						</view>
						<view v-if="admission.finalDepartment" class="detail-row">
							<text class="detail-label">最终选择部门：</text>
							<text class="detail-value final-department">{{ admission.finalDepartment }}</text>
						</view>
						<view v-if="formatTime(admission.secondInterview?.completedAt)" class="detail-row">
							<text class="detail-label">录取时间：</text>
							<text class="detail-value">{{ formatTime(admission.secondInterview?.completedAt) }}</text>
						</view>
					</view>
					<view class="admission-actions">
						<button class="action-btn view-btn" @click="viewDetail(admission)">查看详情</button>
						<button v-if="admission.status === 'department_selection'" class="action-btn remind-btn" @click="remindUser(admission)">提醒确认</button>
					</view>
				</view>
			</view>
		</view>
		</scroll-view>

		<!-- 发送通知弹窗 -->
		<view v-if="showNotificationModal" class="modal-overlay" @click="closeNotificationModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">发送通知</text>
					<text class="modal-close" @click="closeNotificationModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-group">
						<text class="form-label">通知标题</text>
						<input class="form-input" v-model="notificationForm.title" placeholder="请输入通知标题" />
					</view>
					<view class="form-group">
						<text class="form-label">通知内容</text>
						<textarea class="form-textarea" v-model="notificationForm.content" placeholder="请输入通知内容"></textarea>
					</view>
					<view class="form-group">
						<text class="form-label">发送对象</text>
						<picker @change="onNotificationTargetChange" :value="notificationTargetIndex" :range="notificationTargetOptions">
							<view class="picker-display">
								<text>{{notificationTargetOptions[notificationTargetIndex]}}</text>
								<text class="picker-arrow">▼</text>
							</view>
						</picker>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn-secondary" @click="closeNotificationModal">取消</button>
					<button class="btn-primary" @click="sendNotification">发送</button>
				</view>
			</view>
		</view>
		
		<!-- 历史通知弹窗 -->
		<view v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
			<view class="modal-content large-modal" @click.stop>
				<view class="modal-header">
					<text class="modal-title">历史通知</text>
					<text class="modal-close" @click="closeHistoryModal">×</text>
				</view>
				<view class="modal-body">
					<view v-if="notifications.length === 0" class="empty-state">
						<text>暂无历史通知</text>
					</view>
					<view v-else class="notification-list">
						<view v-for="notification in notifications" :key="notification._id" class="notification-item">
							<view class="notification-header">
								<text class="notification-title">{{notification.title}}</text>
								<text class="notification-time">{{formatTime(notification.createdAt)}}</text>
							</view>
							<view class="notification-content">
								<text>{{notification.content}}</text>
							</view>
							<view class="notification-footer">
								<text class="notification-type">{{getTargetText(notification.type)}}</text>
								<view class="notification-actions">
									<text class="action-btn edit-btn" @click="editNotification(notification)">编辑</text>
									<text class="action-btn delete-btn" @click="deleteNotification(notification._id)">删除</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 编辑通知弹窗 -->
		<view v-if="showEditNotificationModal" class="modal-overlay" @click="closeEditNotificationModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">编辑通知</text>
					<text class="modal-close" @click="closeEditNotificationModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-group">
						<text class="form-label">通知标题</text>
						<input class="form-input" v-model="editingNotification.title" placeholder="请输入通知标题" />
					</view>
					<view class="form-group">
						<text class="form-label">通知内容</text>
						<textarea class="form-textarea" v-model="editingNotification.content" placeholder="请输入通知内容"></textarea>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn-secondary" @click="closeEditNotificationModal">取消</button>
					<button class="btn-primary" @click="updateNotification">保存</button>
				</view>
			</view>
		</view>

		<!-- 详情弹窗 -->
		<application-detail-modal
			:visible="showDetail"
			:application="selectedAdmission"
			@close="closeDetail"
		/>
	</view>
</template>

<script>
	import { showToast, showLoading, hideLoading } from '@/utils/utils.js'
	import { formatTime } from '@/utils/admin-common.js'
	import ApplicationDetailModal from '@/components/application-detail-modal.vue'
	
	export default {
		components: {
			ApplicationDetailModal
		},
		data() {
			return {
				admissions: [],
				filteredAdmissions: [],
				searchKeyword: '',
				statusIndex: 0,
				statusOptions: ['全部', '已确认', '待确认'],
				deptIndex: 0,
				deptOptions: ['全部'],
				showDetail: false,
				selectedAdmission: null,
				
				// 通知相关
				showNotificationModal: false,
				notificationForm: {
					title: '',
					content: '',
					target: 'all'
				},
				notificationTargetIndex: 0,
				notificationTargetOptions: ['全体用户', '等待一面', '一面通过', '等待二面', '一面未通过', '部门选择', '二面未通过', '已录取'],
				
				// 历史通知相关
				showHistoryModal: false,
				notifications: [],
				showEditNotificationModal: false,
				editingNotification: {
					_id: '',
					title: '',
					content: ''
				},
				
				// 下拉刷新状态
				isRefreshing: false,
				
				// 自动刷新定时器
				autoRefreshTimer: null,
				
				// 搜索防抖定时器
				searchTimer: null
			}
		},
		computed: {
			totalAdmitted() {
				return this.admissions.length
			},
			confirmedCount() {
				return this.admissions.filter(admission => admission.finalDepartment).length
			},
			pendingConfirmCount() {
				// 待用户确认：状态为department_selection的用户
				return this.admissions.filter(admission => admission.status === 'department_selection').length
			}
		},
		onLoad() {
			this.loadAdmissions()
			this.startAutoRefresh()
		},
		onShow() {
			// 页面显示时重新启动自动刷新
			this.startAutoRefresh()
		},
		onHide() {
			// 页面隐藏时清除自动刷新定时器
			this.clearAutoRefresh()
		},
		onUnload() {
			// 页面卸载时清除自动刷新定时器
			this.clearAutoRefresh()
			// 清除搜索防抖定时器
			if (this.searchTimer) {
				clearTimeout(this.searchTimer)
				this.searchTimer = null
			}
		},
		methods: {
			// 启动自动刷新定时器
			startAutoRefresh() {
				// 先清除现有定时器
				this.clearAutoRefresh()
				// 设置3分钟（180000毫秒）自动刷新
				this.autoRefreshTimer = setInterval(() => {
					console.log('自动刷新录取数据...')
					this.loadAdmissions()
				}, 180000) // 3分钟 = 180000毫秒
			},
			
			// 清除自动刷新定时器
			clearAutoRefresh() {
				if (this.autoRefreshTimer) {
					clearInterval(this.autoRefreshTimer)
					this.autoRefreshTimer = null
				}
			},
			
			// 手动刷新数据
			async manualRefresh() {
				try {
					showLoading('刷新中...')
					await this.loadAdmissions()
					// 手动刷新后重新启动自动刷新定时器
					this.startAutoRefresh()
					showToast('刷新成功')
				} catch (error) {
					console.error('手动刷新失败:', error)
					showToast('刷新失败')
				} finally {
					hideLoading()
				}
			},
			
			// 下拉刷新处理
			async onRefresh() {
				this.isRefreshing = true
				try {
					await this.loadAdmissions()
					// 手动刷新后重新启动自动刷新定时器
					this.startAutoRefresh()
				} catch (err) {
					showToast('刷新失败')
				} finally {
					this.isRefreshing = false
				}
			},
			
			onRefreshRestore() {
				console.log('下拉刷新复位')
			},
			
			onRefreshAbort() {
				console.log('下拉刷新中止')
				this.isRefreshing = false
			},
			
			// 加载录取数据
			async loadAdmissions() {
				try {
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'getAdmissions'
						}
					})
					
					if (result.result && result.result.success) {
						this.admissions = result.result.data || []
						this.updateDepartmentOptions()
						this.updateFilteredAdmissions()
					} else {
						showToast(result.result?.error || '加载数据失败')
						this.admissions = []
					}
				} catch (error) {
					console.error('加载录取数据失败:', error)
					showToast('加载数据失败')
					this.admissions = []
				}
			},
			
			// 更新筛选结果
			updateFilteredAdmissions() {
				let filtered = [...this.admissions]
				
				// 状态筛选
				if (this.statusIndex === 1) { // 已确认部门
					filtered = filtered.filter(admission => admission.finalDepartment)
				} else if (this.statusIndex === 2) { // 待确认部门
					filtered = filtered.filter(admission => !admission.finalDepartment)
				}
				
				// 部门筛选 - 基于最终录取部门或二面通过部门
				if (this.deptIndex > 0) {
					const selectedDept = this.deptOptions[this.deptIndex]
					filtered = filtered.filter(admission => {
						const finalDept = admission.finalDepartment
						const secondPassedDepts = this.getSecondPassedDepartmentsArray(admission)
						
						// 优先匹配最终录取部门
						if (finalDept && finalDept.trim() === selectedDept) {
							return true
						}
						
						// 如果没有最终录取部门，则匹配二面通过的部门
						if (!finalDept && secondPassedDepts.includes(selectedDept)) {
							return true
						}
						
						return false
					})
				}
				
				// 搜索筛选
				if (this.searchKeyword.trim()) {
					const keyword = this.searchKeyword.trim().toLowerCase()
					filtered = filtered.filter(admission => {
						const name = (admission.name || '').toLowerCase()
						const studentId = (admission.student_id || '').toLowerCase()
						return name.includes(keyword) || studentId.includes(keyword)
					})
				}
				
				this.filteredAdmissions = filtered
			},
			
			// 状态筛选变化
			onStatusChange(e) {
				this.statusIndex = e.detail.value
				this.updateFilteredAdmissions()
			},
			
			// 部门筛选变化
			onDeptChange(e) {
				this.deptIndex = e.detail.value
				this.updateFilteredAdmissions()
			},
			
			// 搜索输入处理（带防抖）
			handleSearchInput() {
				// 清除之前的定时器
				if (this.searchTimer) {
					clearTimeout(this.searchTimer)
				}
				
				// 设置新的定时器，300ms后执行搜索
				this.searchTimer = setTimeout(() => {
					this.updateFilteredAdmissions()
				}, 300)
			},
			
			// 搜索处理
			handleSearch() {
				// 清除防抖定时器，立即执行搜索
				if (this.searchTimer) {
					clearTimeout(this.searchTimer)
					this.searchTimer = null
				}
				this.updateFilteredAdmissions()
			},
			
			// 获取一面通过部门
			getFirstPassedDepartments(admission) {
				if (admission.firstInterview && admission.firstInterview.passedDepartments) {
					if (Array.isArray(admission.firstInterview.passedDepartments)) {
						return admission.firstInterview.passedDepartments.join('、')
					}
					return admission.firstInterview.passedDepartments
				}
				return ''
			},
			
			// 获取二面通过部门
			getSecondPassedDepartments(admission) {
				if (admission.secondInterview && admission.secondInterview.passedDepartments) {
					if (Array.isArray(admission.secondInterview.passedDepartments)) {
						return admission.secondInterview.passedDepartments.join('、')
					}
					return admission.secondInterview.passedDepartments
				}
				return ''
			},
			
			// 获取二面通过部门数组
			getSecondPassedDepartmentsArray(admission) {
				if (admission.secondInterview && admission.secondInterview.passedDepartments) {
					if (Array.isArray(admission.secondInterview.passedDepartments)) {
						return admission.secondInterview.passedDepartments
					}
					if (typeof admission.secondInterview.passedDepartments === 'string') {
						return admission.secondInterview.passedDepartments.split(/[、,，]/).map(d => d.trim()).filter(d => d)
					}
				}
				return []
			},
			
			// 更新部门选项（基于所有可能的部门）
			updateDepartmentOptions() {
				const allDepartments = new Set()
				
				// 收集所有最终录取的部门
				this.admissions.forEach(admission => {
					if (admission.finalDepartment) {
						allDepartments.add(admission.finalDepartment.trim())
					}
				})
				
				// 同时收集二面通过的部门（包括未确认的）
				this.admissions.forEach(admission => {
					const secondPassedDepts = this.getSecondPassedDepartmentsArray(admission)
					secondPassedDepts.forEach(dept => {
						if (dept && dept.trim()) {
							allDepartments.add(dept.trim())
						}
					})
				})
				
				// 构建部门选项数组
				this.deptOptions = ['全部', ...Array.from(allDepartments).sort()]
				
				// 如果当前选择的部门不在新选项中，重置为"全部"
				if (this.deptIndex >= this.deptOptions.length) {
					this.deptIndex = 0
				}
			},
			
			// 格式化时间
			formatTime,
			
			// 获取状态文本
			getStatusText(status) {
				if (status === 'department_selection') {
					return '待确认部门'
				} else if (status === 'accepted') {
					return '已确认部门'
				}
				return '未知状态'
			},
			
			// 获取状态样式类
			getStatusClass(status) {
				const classMap = {
					'accepted': 'status-accepted',
					'department_selection': 'status-pending'
				}
				return classMap[status] || 'status-default'
			},
			
			// 查看详情
			viewDetail(admission) {
				this.selectedAdmission = admission
				this.showDetail = true
			},
			
			// 关闭详情
			closeDetail() {
				this.showDetail = false
				this.selectedAdmission = null
			},
			
			// 提醒用户确认部门
			async remindUser(admission) {
				try {
					showLoading('发送提醒中...')
					
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'remindDepartmentSelection',
							userId: admission.user_id,
							userName: admission.name
						}
					})
					
					if (result.result && result.result.success) {
						showToast('提醒发送成功')
					} else {
						showToast(result.result?.error || '提醒发送失败')
					}
				} catch (error) {
					console.error('发送提醒失败:', error)
					showToast('提醒发送失败')
				} finally {
					hideLoading()
				}
			},
			
			// ========== 通知功能 ==========
			// 显示发送通知弹窗
			showSendNotification() {
				this.showNotificationModal = true
				this.notificationForm = {
					title: '',
					content: '',
					target: 'all'
				}
				this.notificationTargetIndex = 0
			},
			
			// 关闭发送通知弹窗
			closeNotificationModal() {
				this.showNotificationModal = false
				this.notificationForm = {
					title: '',
					content: '',
					target: 'all'
				}
			},
			
			// 通知目标变化
			onNotificationTargetChange(e) {
				this.notificationTargetIndex = e.detail.value
				const targets = ['all', 'waiting_first', 'first_passed', 'waiting_second', 'first_failed', 'department_selection', 'second_failed', 'accepted']
				this.notificationForm.target = targets[e.detail.value]
			},
			
			// 发送通知
			async sendNotification() {
				if (!this.notificationForm.title || !this.notificationForm.content) {
					uni.showToast({ title: '请填写通知标题和内容', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '发送中...' })
				
				try {
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'sendNotification',
							notification: {
								...this.notificationForm
							}
						}
					})
					
					uni.hideLoading()
					
					if (result.result && result.result.success) {
						uni.showToast({ title: '通知发送成功', icon: 'success' })
						this.closeNotificationModal()
					} else {
						uni.showToast({ title: result.result?.error || '发送失败', icon: 'none' })
					}
				} catch (error) {
					uni.hideLoading()
					console.error('发送通知失败:', error)
					uni.showToast({ title: '发送失败，请重试', icon: 'none' })
				}
			},
			
			// 显示历史通知
			showNotificationHistory() {
				this.showHistoryModal = true
				this.loadNotificationHistory()
			},
			
			// 关闭历史通知弹窗
			closeHistoryModal() {
				this.showHistoryModal = false
			},
			
			// 加载历史通知
			async loadNotificationHistory() {
				try {
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'getNotificationHistory'
						}
					})
					
					if (result.result && result.result.success) {
						this.notifications = result.result.data || []
					}
				} catch (error) {
					console.error('加载历史通知失败:', error)
				}
			},
			
			// 获取目标文本
			getTargetText(type) {
				const typeMap = {
					all: '全体用户',
					waiting_first: '等待一面',
					first_passed: '一面通过',
					waiting_second: '等待二面',
					first_failed: '一面未通过',
					department_selection: '部门选择',
					second_failed: '二面未通过',
					accepted: '已录取',
					selected: '选择用户'
				}
				return typeMap[type] || '未知'
			},
			
			// 编辑通知
			editNotification(notification) {
				this.editingNotification = {
					_id: notification._id,
					title: notification.title,
					content: notification.content
				}
				this.showEditNotificationModal = true
			},
			
			// 关闭编辑通知弹窗
			closeEditNotificationModal() {
				this.showEditNotificationModal = false
				this.editingNotification = {
					_id: '',
					title: '',
					content: ''
				}
			},
			
			// 更新通知
			async updateNotification() {
				if (!this.editingNotification.title || !this.editingNotification.content) {
					uni.showToast({ title: '请填写通知标题和内容', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '更新中...' })
				
				try {
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'updateNotification',
							notificationId: this.editingNotification._id,
							updateData: {
								title: this.editingNotification.title,
								content: this.editingNotification.content
							}
						}
					})
					
					uni.hideLoading()
					
					if (result.result && result.result.success) {
						uni.showToast({ title: '更新成功', icon: 'success' })
						this.closeEditNotificationModal()
						this.loadNotificationHistory()
					} else {
						uni.showToast({ title: result.result?.error || '更新失败', icon: 'none' })
					}
				} catch (error) {
					uni.hideLoading()
					console.error('更新通知失败:', error)
					uni.showToast({ title: '更新失败，请重试', icon: 'none' })
				}
			},
			
			// 删除通知
			async deleteNotification(notificationId) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条通知吗？',
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '删除中...' })
							
							try {
								const result = await uniCloud.callFunction({
									name: 'admin-api',
									data: {
										action: 'deleteNotification',
										notificationId
									}
								})
								
								uni.hideLoading()
								
								if (result.result && result.result.success) {
									uni.showToast({ title: '删除成功', icon: 'success' })
									this.loadNotificationHistory()
								} else {
									uni.showToast({ title: result.result?.error || '删除失败', icon: 'none' })
								}
							} catch (error) {
								uni.hideLoading()
								console.error('删除通知失败:', error)
								uni.showToast({ title: '删除失败，请重试', icon: 'none' })
							}
						}
					}
				})
			}
		}
	}
</script>

<style scoped>
	.container {
		background-color: #f5f7fa;
		min-height: 100vh;
	}
	
	.scroll-container {
		height: 100vh;
	}
	
	.scroll-container .filter-section {
		padding: 20px 20px 0 20px;
	}
	
	.scroll-container .stats-section {
		padding: 0 20px;
	}
	
	.scroll-container .quick-actions-section {
		padding: 0 20px;
	}
	
	.scroll-container .admission-section {
		padding: 0 20px 20px 20px;
	}
	
	.stats-section {
		margin-bottom: 20px;
	}
	
	.stats-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		display: flex;
		justify-content: space-around;
	}
	
	.stats-item {
		text-align: center;
		flex: 1;
	}
	
	.stats-number {
		font-size: 28px;
		font-weight: bold;
		color: #3498db;
		display: block;
		margin-bottom: 5px;
	}
	
	.stats-label {
		font-size: 14px;
		color: #7f8c8d;
	}
	
	.filter-section {
		margin-bottom: 20px;
	}
	
	.filter-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.filter-row {
		display: flex;
		gap: 12px;
		margin-bottom: 16px;
		flex-wrap: wrap;
	}
	
	.filter-item {
		flex: 1;
		min-width: 120px;
	}
	
	.filter-label {
		font-size: 13px;
		color: #2c3e50;
		margin-bottom: 6px;
		display: block;
		font-weight: 500;
	}
	
	.filter-picker {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 0 10px;
		height: 36px;
		display: flex;
		align-items: center;
		box-sizing: border-box;
	}
	
	.picker-text {
		color: #2c3e50;
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}
	
	.search-box {
		display: flex;
		gap: 10px;
		margin-top: 8px;
	}
	
	.search-input {
		flex: 1;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 0 10px;
		height: 36px;
		font-size: 13px;
		box-sizing: border-box;
	}
	
	.search-btn {
		background: #4A90E2;
		color: white;
		border: none;
		border-radius: 6px;
		width: 70px;
		height: 36px;
		font-size: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	
	/* 快捷操作样式 */
	.quick-actions-section {
		margin-bottom: 20px;
	}
	
	.quick-actions-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.quick-actions-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	
	.refresh-btn {
		padding: 8px 16px;
		background: #f8f9fa;
		border-radius: 6px;
		cursor: pointer;
	}
	
	.refresh-text {
		font-size: 14px;
		color: #007bff;
	}
	
	.quick-actions-title {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
	}
	
	.action-group {
		margin-bottom: 16px;
	}
	
	.action-group:last-child {
		margin-bottom: 0;
	}
	
	.action-group-title {
		font-size: 14px;
		font-weight: 500;
		color: #7f8c8d;
		margin-bottom: 8px;
		display: block;
	}
	
	.action-buttons {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}
	
	.action-btn {
		padding: 8px 16px;
		border: none;
		border-radius: 6px;
		font-size: 13px;
		cursor: pointer;
		min-width: 80px;
	}
	
	.btn-primary {
		background: #007bff;
		color: white;
	}
	
	.btn-secondary {
		background: #6c757d;
		color: white;
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
		max-width: 400px;
		max-height: 80vh;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}
	
	.large-modal {
		max-width: 500px;
		max-height: 85vh;
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #f0f0f0;
		background: #f8f9fa;
	}
	
	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: #333;
	}
	
	.modal-close {
		font-size: 20px;
		color: #999;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: #f0f0f0;
		cursor: pointer;
	}
	
	.modal-body {
		padding: 20px;
		max-height: 60vh;
		overflow-y: auto;
	}
	
	.modal-footer {
		display: flex;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #f0f0f0;
		background: #f8f9fa;
	}
	
	/* 表单样式 */
	.form-group {
		margin-bottom: 20px;
	}
	
	.form-label {
		display: block;
		font-size: 14px;
		color: #333;
		margin-bottom: 8px;
		font-weight: 500;
	}
	
	.form-input {
		width: 100%;
		padding: 12px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		font-size: 14px;
		background: #fff;
		box-sizing: border-box;
		min-height: 44px;
	}
	
	.form-textarea {
		width: 100%;
		min-height: 80px;
		padding: 12px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		font-size: 14px;
		background: #fff;
		resize: vertical;
		box-sizing: border-box;
	}
	
	/* Picker样式 */
	.picker-display {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
	}
	
	.picker-arrow {
		color: #999;
		font-size: 12px;
	}
	
	/* 通知列表样式 */
	.notification-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.notification-item {
		padding: 16px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fff;
	}
	
	.notification-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}
	
	.notification-title {
		font-size: 15px;
		font-weight: 600;
		color: #333;
		flex: 1;
	}
	
	.notification-time {
		font-size: 12px;
		color: #999;
	}
	
	.notification-content {
		margin-bottom: 8px;
		font-size: 13px;
		color: #666;
		line-height: 1.5;
	}
	
	.notification-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.notification-type {
		font-size: 12px;
		color: #007aff;
		background: #e6f3ff;
		padding: 4px 8px;
		border-radius: 12px;
	}
	
	.notification-actions {
		display: flex;
		gap: 8px;
	}
	
	.action-btn {
		font-size: 12px;
		padding: 4px 8px;
		border-radius: 4px;
		color: white;
		cursor: pointer;
	}
	
	.edit-btn {
		background: #28a745;
	}
	
	.delete-btn {
		background: #dc3545;
	}
	
	.admission-section {
		margin-bottom: 20px;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		margin: 20px 0;
	}
	
	.empty-text {
		color: #7f8c8d;
		font-size: 16px;
	}
	
	.admission-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.admission-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}
	
	.admission-card:hover {
		transform: translateY(-2px);
	}
	
	.admission-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	}
	
	.admission-info {
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	
	.admission-name {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
	}
	
	.admission-student-id {
		font-size: 14px;
		color: #7f8c8d;
	}
	
	.status-badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}
	
	.status-accepted {
		background: #d4edda;
		color: #155724;
	}
	
	.status-pending {
		background: #fff3cd;
		color: #856404;
	}
	
	.status-default {
		background: #f8f9fa;
		color: #6c757d;
	}
	
	.admission-details {
		margin-bottom: 15px;
	}
	
	.detail-row {
		display: flex;
		margin-bottom: 8px;
		align-items: flex-start;
	}
	
	.detail-label {
		font-size: 14px;
		color: #7f8c8d;
		min-width: 100px;
		flex-shrink: 0;
	}
	
	.detail-value {
		font-size: 14px;
		color: #2c3e50;
		flex: 1;
	}
	
	.passed-departments {
		color: #27ae60;
		font-weight: 500;
	}
	
	.final-department {
		color: #3498db;
		font-weight: 500;
	}
	
	.final-department.not-selected {
		color: #e74c3c;
		font-style: italic;
	}
	
	.admission-actions {
		display: flex;
		gap: 12px;
	}
	
	.action-btn {
		flex: 1;
		height: 36px;
		border-radius: 8px;
		font-size: 14px;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	
	.view-btn {
		background: #f8f9fa;
		color: #6c757d;
	}
	
	.view-btn:hover {
		background: #e9ecef;
	}
	
	.remind-btn {
		background: #fff3cd;
		color: #856404;
	}
	
	.remind-btn:hover {
		background: #ffeaa7;
	}
	
	/* 面试结果样式 */
	.first-passed-departments {
		color: #28a745;
		font-weight: 500;
	}
	
	.second-passed-departments {
		color: #007bff;
		font-weight: 500;
	}
	
	.final-department {
		color: #dc3545;
		font-weight: 600;
	}
	
	.final-department.not-selected {
		color: #ffc107;
		font-style: italic;
	}
	
	/* 空数据状态样式 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		margin: 20px 0;
	}
	
	.empty-logo {
		margin-bottom: 30px;
	}
	
	.logo-image {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
	}
	
	.empty-content {
		text-align: center;
	}
	
	.empty-title {
		font-size: 18px;
		color: #7f8c8d;
		font-weight: 500;
	}
</style>