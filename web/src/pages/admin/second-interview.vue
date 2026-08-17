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
						<picker mode="selector" :value="statusIndex" :range="statusOptions" @change="onStatusChange">
							<view class="filter-picker">
								<text class="picker-text">{{ statusOptions[statusIndex] }}</text>
							</view>
						</picker>
					</view>
					<view class="filter-item">
						<text class="filter-label">部门筛选</text>
						<picker mode="selector" :value="deptIndex" :range="deptOptions" @change="onDeptChange">
							<view class="filter-picker">
								<text class="picker-text">{{ deptOptions[deptIndex] }}</text>
							</view>
						</picker>
					</view>
				</view>
				<view class="search-box">
					<input class="search-input" v-model="searchKeyword" placeholder="搜索姓名或学号" @input="handleSearch" />
					<button class="search-btn" @click="handleSearch">搜索</button>
				</view>
			</view>
		</view>

		<!-- 统计信息 -->
		<view class="stats-section">
			<view class="stats-card">
				<view class="stats-item">
					<text class="stats-number">{{ filteredApplications.length }}</text>
					<text class="stats-label">当前显示</text>
				</view>
				<view class="stats-item">
					<text class="stats-number">{{ totalSecondInterviewCount }}</text>
					<text class="stats-label">总二面数</text>
				</view>
				<view class="stats-item">
					<text class="stats-number">{{ pendingCount }}</text>
					<text class="stats-label">待处理</text>
				</view>
			</view>
		</view>

		<!-- 快捷操作 -->
		<view class="batch-section">
			<view class="batch-card">
				<view class="batch-header">
					<text class="batch-title">快捷操作</text>
					<view class="header-actions">
						<view class="refresh-btn" @click="handleManualRefresh">
							<text class="refresh-text">刷新数据</text>
						</view>
						<view class="select-all" @click="handleToggleSelectAll">
							<text class="select-text">{{ isAllSelected ? '取消全选' : '全选' }}</text>
						</view>
					</view>
				</view>
				
				<view class="quick-actions">
					<!-- 数据导出 -->
					<view class="action-group">
						<text class="action-group-title">数据导出</text>
						<view class="action-buttons">
							<button class="btn-secondary action-btn" @click="handleExportAll">导出全部数据</button>
							<button class="btn-secondary action-btn" @click="showExportModal = true">按条件导出</button>
						</view>
					</view>
					
					<!-- 通知管理 -->
					<view class="action-group">
						<text class="action-group-title">通知管理</text>
						<view class="action-buttons">
							<button class="btn-primary action-btn" @click="showNotificationModal = true">发送通知</button>
							<button class="btn-secondary action-btn" @click="handleShowNotificationHistory">查看历史通知</button>
						</view>
					</view>
					
					<!-- 批量操作 -->
					<view class="action-group" v-if="selectedApplications.length > 0">
						<text class="action-group-title">批量操作 ({{selectedApplications.length}}项)</text>
						<view class="action-buttons">
							<button class="btn-secondary action-btn" @click="handleBatchPass">批量通过</button>
							<button class="btn-secondary action-btn" @click="handleBatchReject">批量拒绝</button>
						</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 申请列表 -->
		<view class="applications-section">
			<view v-if="filteredApplications.length === 0" class="empty-state">
				<view class="empty-logo">
					<image src="/static/logo.png" mode="aspectFit" class="logo-image"></image>
				</view>
				<view class="empty-content">
					<text class="empty-title">暂无二面数据</text>
				</view>
			</view>
			<view v-else class="applications-list">
				<view 
					v-for="app in filteredApplications" 
					:key="app.id" 
					class="application-card"
					:class="{ selected: selectedApplications.includes(app.id) }"
					@click="handleToggleSelect(app.id)"
				>
					<view class="app-header">
						<view class="app-info">
							<text class="app-name">{{ app.formData?.name || '未知姓名' }}</text>
							<text class="app-student-id">{{ app.formData?.studentId || '未知学号' }}</text>
						</view>
						<view class="app-status">
							<!-- 状态标签在上面 -->
							<view class="status-badge" :class="getStatusClass(app.status, app)">
								{{ getSecondInterviewStatusText(app.status, app) }}
							</view>
							<!-- 签到序号显示在下面 -->
							<view v-if="app.secondInterview?.checkInNumber" class="checkin-number-badge">
								<text class="checkin-number-text">签到序号 #{{app.secondInterview.checkInNumber}}</text>
							</view>
						</view>
					</view>
					<view class="app-details">
						<view class="detail-row">
							<text class="detail-label">专业班级：</text>
							<text class="detail-value">{{ app.formData?.major || '未知专业' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">意向部门：</text>
							<text class="detail-value">{{ app.departments || '未知部门' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">一面通过：</text>
							<text class="detail-value">{{ getFirstPassedDepartments(app) || '无' }}</text>
						</view>
						<view v-if="getSecondPassedDepartments(app)" class="detail-row">
							<text class="detail-label">二面通过：</text>
							<text class="detail-value second-passed-dept">{{ getSecondPassedDepartments(app) }}</text>
						</view>
						<view v-if="app.status === 'accepted' || app.status === 'department_selection'" class="detail-row">
							<text class="detail-label">最终部门：</text>
							<text class="detail-value final-dept">{{ getFinalDepartment(app) || '待用户确认' }}</text>
						</view>
						<view class="detail-row">
							<text class="detail-label">申请时间：</text>
							<text class="detail-value">{{ app.applyTime || '未知时间' }}</text>
						</view>
					</view>
					<view class="app-actions">
						<button class="action-btn view-btn" @click.stop="viewDetail(app)">详情</button>

						<button v-if="app.status === 'waiting_second' && (!app.secondInterview || app.secondInterview.status !== 'completed')" class="action-btn interview-btn" @click.stop="handleMarkAsInterviewed(app)">已面试</button>
						<button v-if="app.status === 'waiting_second' && app.secondInterview && app.secondInterview.status === 'completed'" class="action-btn pass-btn" @click.stop="handlePassApplication(app)">通过</button>
						<button v-if="app.status === 'waiting_second' && app.secondInterview && app.secondInterview.status === 'completed'" class="action-btn reject-btn" @click.stop="handleRejectApplication(app)">拒绝</button>
						<button v-if="app.status === 'second_failed' || app.status === 'department_selection' || app.status === 'accepted' || app.status === 'rejected' || (app.status === 'waiting_second' && app.secondInterview && app.secondInterview.status === 'completed')" class="action-btn undo-btn" @click.stop="handleUndoApplication(app)">撤销</button>
					</view>
				</view>
			</view>
		</view>
		</scroll-view>

		<!-- 详情弹窗 -->
		<application-detail-modal
			:visible="showDetail"
			:application="selectedApp"
			@close="closeDetail"
			@undo="handleUndoFromDetail"
		/>

		<!-- 导出选项弹窗 -->
		<export-modal 
			v-if="showExportModal"
			:visible="showExportModal"
			:applications="filteredApplications"
			:selected-applications="selectedApplications"
			@close="showExportModal = false"
			@export="handleExport"
		/>

		<!-- 通知弹窗 -->
		<notification-modal
			v-if="showNotificationModal"
			:visible="showNotificationModal"
			@close="showNotificationModal = false"
			@send="handleSendNotification"
		/>

		<!-- 通知历史弹窗 -->
		<notification-history-modal
			v-if="showHistoryModal"
			:visible="showHistoryModal"
			:history="notificationHistory"
			@close="showHistoryModal = false"
			@edit="handleEditNotification"
			@delete="handleDeleteNotification"
		/>

		<!-- 部门选择弹窗 -->
		<department-modal
			v-if="showDepartmentModal"
			:visible="showDepartmentModal"
			:application="pendingApplication"
			:is-batch="isBatchOperation"
			:selected-count="selectedApplications.length"
			@close="showDepartmentModal = false"
			@confirm="handleConfirmPass"
		/>
	</view>
</template>

<script>
	import { 
		validateApplicationData, 
		filterApplications, 
		toggleSelect, 
		toggleSelectAll,
		updateApplicationStatus,
		batchUpdateApplicationStatus,
		sendNotification,
		getNotificationHistory,
		exportData,
		formatTime,
		getTargetText,
		getAvailableDepartments
	} from '@/utils/admin-common.js'
	import { getStatusText, getStatusClass, showToast, showConfirm, showLoading, hideLoading } from '@/utils/utils.js'
	import ExportModal from '@/components/export-modal.vue'
	import NotificationModal from '@/components/notification-modal.vue'
	import NotificationHistoryModal from '@/components/notification-history-modal.vue'
	import DepartmentModal from '@/components/department-modal.vue'
	import ApplicationDetailModal from '@/components/application-detail-modal.vue'
	
	export default {
		components: {
			ExportModal,
			NotificationModal,
			NotificationHistoryModal,
			DepartmentModal,
			ApplicationDetailModal
		},
		data() {
			return {
				// 基础数据
				applications: [],
				filteredApplications: [],
				selectedApplications: [],
				isAllSelected: false,
				searchKeyword: '',
				
				// 筛选选项
				statusIndex: 0,
				statusOptions: ['全部状态', '待二面', '已面试', '二面过', '二面拒', '拒绝加入'],
				deptIndex: 0,
				deptOptions: ['全部'],
				
				// 弹窗状态
				showDetail: false,
				selectedApp: null,
				showExportModal: false,
				showNotificationModal: false,
				showHistoryModal: false,
				showDepartmentModal: false,
				
				// 通知相关
				notificationHistory: [],
				
				// 部门选择相关
				pendingApplication: null,
				isBatchOperation: false,
				
				// 下拉刷新状态
				isRefreshing: false,
				
				// 自动刷新相关
				autoRefreshTimer: null,
				lastRefreshTime: 0,
				refreshInterval: 3 * 60 * 1000 // 3分钟
			}
		},
		computed: {
			// 总二面数：包括等待二面、二面通过、二面未通过、拒绝加入的人数
			totalSecondInterviewCount() {
				return this.applications.filter(app => 
					app.status === 'waiting_second' || 
					app.status === 'department_selection' ||
					app.status === 'accepted' ||
					app.status === 'second_failed' ||
					app.status === 'rejected'
				).length
			},
			// 待处理数：等待二面且未完成面试的人数
			pendingCount() {
				return this.applications.filter(app => 
					app.status === 'waiting_second' && 
					(!app.secondInterview || app.secondInterview.status !== 'completed')
				).length
			}
		},
		onLoad() {
			this.loadApplications()
			this.startAutoRefresh()
		},
		onShow() {
			this.loadApplications()
			this.startAutoRefresh()
		},
		onHide() {
			this.stopAutoRefresh()
		},
		onUnload() {
			this.stopAutoRefresh()
		},
		methods: {
			// 安全的loading状态管理
			safeHideLoading() {
				try {
					hideLoading()
				} catch (error) {
					console.warn('hideLoading failed:', error)
				}
			},
			
			// 获取二面管理界面专用的状态文本
			getSecondInterviewStatusText(status, app = null) {
				// 特殊处理：如果用户是等待二面且secondInterview.status为completed，显示为已面试
				if (status === 'waiting_second' && app && app.secondInterview && app.secondInterview.status === 'completed') {
					return '已面试'
				}
				
				// 在二面管理界面中，department_selection 和 accepted 都显示为"二面通过"
				if (status === 'department_selection' || status === 'accepted') {
					return '二面通过'
				}
				return getStatusText(status)
			},
			
			// 获取一面通过的部门
			getFirstPassedDepartments(app) {
				// 优先从firstInterview.passedDepartments获取
				if (app.firstInterview && app.firstInterview.passedDepartments) {
					if (Array.isArray(app.firstInterview.passedDepartments)) {
						return app.firstInterview.passedDepartments.join('、')
					}
					if (typeof app.firstInterview.passedDepartments === 'string') {
						return app.firstInterview.passedDepartments
					}
				}
				
				// 如果没有firstInterview.passedDepartments，但状态表明已通过一面
				// 这种情况下应该显示"未知"而不是申请的所有部门
				if (app.status === 'waiting_second' || 
					app.status === 'department_selection' || 
					app.status === 'accepted' || 
					app.status === 'second_failed' ||
					app.status === 'first_reject' ||
					app.status === 'rejected') {
					return '未知'
				}
				
				return '无'
			},
			
			// 获取二面通过的部门
			getSecondPassedDepartments(app) {
				// 只有二面通过的状态才显示，包括用户拒绝后的状态
				if (app.status !== 'department_selection' && 
					app.status !== 'accepted' && 
					app.status !== 'rejected') {
					return ''
				}
				
				// 统一使用secondInterview.passedDepartments
				if (app.secondInterview && app.secondInterview.passedDepartments) {
					if (Array.isArray(app.secondInterview.passedDepartments) && app.secondInterview.passedDepartments.length > 0) {
						return app.secondInterview.passedDepartments.join('、')
					}
					if (typeof app.secondInterview.passedDepartments === 'string' && app.secondInterview.passedDepartments.trim()) {
						return app.secondInterview.passedDepartments
					}
				}
				
				// 如果状态表明已通过二面，但没有具体部门信息
				return '已通过（部门信息缺失）'
			},
			
			// 获取最终录取部门
			getFinalDepartment(app) {
				if (app.status === 'accepted' && app.finalDepartment) {
					return app.finalDepartment
				}
				// 如果状态是department_selection但没有finalDepartment，说明用户还未确认
				if (app.status === 'department_selection') {
					return '待用户确认'
				}
				return ''
			},
			
			// 二面管理专用的筛选函数
			filterSecondInterviewApplications(applications, filters) {
				let filtered = [...applications]
				
				// 状态筛选
				if (filters.statusIndex > 0) {
					const statusMap = filters.statusOptions
					const targetStatus = statusMap[filters.statusIndex]
					
					// 根据不同的状态文本进行筛选
					if (targetStatus === '待二面') {
						filtered = filtered.filter(app => app.status === 'waiting_second' && (!app.secondInterview || app.secondInterview.status !== 'completed'))
					} else if (targetStatus === '已面试') {
						filtered = filtered.filter(app => app.status === 'waiting_second' && app.secondInterview && app.secondInterview.status === 'completed')
					} else if (targetStatus === '二面过') {
						filtered = filtered.filter(app => app.status === 'department_selection' || app.status === 'accepted')
					} else if (targetStatus === '二面拒') {
						filtered = filtered.filter(app => app.status === 'second_failed')
					} else if (targetStatus === '拒绝加入') {
						filtered = filtered.filter(app => app.status === 'rejected')
					}
				}
				
				// 部门筛选 - 基于一面通过的部门
				if (filters.deptIndex > 0) {
					const targetDept = filters.deptOptions[filters.deptIndex]
					filtered = filtered.filter(app => {
						// 内联获取一面通过的部门数组
						let firstPassedDepts = []
						if (app.firstInterview && app.firstInterview.passedDepartments) {
							if (Array.isArray(app.firstInterview.passedDepartments)) {
								firstPassedDepts = app.firstInterview.passedDepartments
							} else if (typeof app.firstInterview.passedDepartments === 'string') {
								firstPassedDepts = app.firstInterview.passedDepartments.split(/[、,，]/).map(d => d.trim()).filter(d => d)
							}
						}
						return firstPassedDepts.includes(targetDept)
					})
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
			},
			
			// 获取一面通过的部门数组
			getFirstPassedDepartmentsArray(app) {
				// 优先从firstInterview.passedDepartments获取
				if (app.firstInterview && app.firstInterview.passedDepartments) {
					if (Array.isArray(app.firstInterview.passedDepartments)) {
						return app.firstInterview.passedDepartments
					}
					if (typeof app.firstInterview.passedDepartments === 'string') {
						return app.firstInterview.passedDepartments.split(/[、,，]/).map(d => d.trim()).filter(d => d)
					}
				}
				
				// 如果没有firstInterview.passedDepartments，但状态表明已通过一面
				// 这种情况下返回空数组，表示无法确定具体部门
				return []
			},
			
			// 更新部门选项（基于实际有一面通过人员的部门）
			updateDepartmentOptions() {
				const allDepartments = new Set()
				
				// 收集所有一面通过的部门
				this.applications.forEach(app => {
					const firstPassedDepts = this.getFirstPassedDepartmentsArray(app)
					firstPassedDepts.forEach(dept => {
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
			
			// 加载二面申请数据
			async loadApplications(isAutoRefresh = false) {
				try {
					let page = 1
					const pageSize = 100
					let total = 0
					const all = []

					do {
						const res = await uniCloud.callFunction({
							name: 'application',
							data: {
								type: 'list',
								page,
								pageSize
							}
						})
						if (res.result && res.result.success) {
							const list = res.result.data?.list || []
							total = res.result.data?.total || 0
							all.push(...list)
							page += 1
						} else {
							break
						}
					} while (all.length < total)

					const secondInterviewApps = all.filter(app =>
						app.status === 'waiting_second' ||
						app.status === 'second_failed' ||
						app.status === 'department_selection' ||
						app.status === 'accepted' ||
						app.status === 'rejected'
					)
					this.applications = validateApplicationData(secondInterviewApps)
					this.updateDepartmentOptions()
					this.updateFilteredApplications()
					
					// 更新最后刷新时间
					this.lastRefreshTime = Date.now()
					
					// 如果是自动刷新，显示提示
					if (isAutoRefresh) {
						showToast('数据已更新')
					}
				} catch (err) {
					this.applications = []
					if (!isAutoRefresh) {
						showToast('加载数据失败')
					}
				} finally {
					this.safeHideLoading()
				}
			},
			
			// 更新筛选结果
			updateFilteredApplications() {
				const filters = {
					statusIndex: this.statusIndex,
					statusOptions: this.statusOptions,
					deptIndex: this.deptIndex,
					deptOptions: this.deptOptions,
					searchKeyword: this.searchKeyword
				}
				let filtered = this.filterSecondInterviewApplications(this.applications, filters)
				
				// 按签到序号排序：有签到的按序号从小到大排序，没有签到的保持默认顺序
				filtered.sort((a, b) => {
					const aHasCheckIn = a.secondInterview?.checkInNumber
					const bHasCheckIn = b.secondInterview?.checkInNumber
					
					// 如果都有签到，按序号排序
					if (aHasCheckIn && bHasCheckIn) {
						return a.secondInterview.checkInNumber - b.secondInterview.checkInNumber
					}
					// 如果只有a有签到，a排在前面
					if (aHasCheckIn && !bHasCheckIn) {
						return -1
					}
					// 如果只有b有签到，b排在前面
					if (!aHasCheckIn && bHasCheckIn) {
						return 1
					}
					// 都没有签到，保持原有顺序
					return 0
				})
				
				this.filteredApplications = filtered
			},
			
			// 状态筛选
			onStatusChange(e) {
				this.statusIndex = e.detail.value
				this.updateFilteredApplications()
			},
			
			// 部门筛选
			onDeptChange(e) {
				this.deptIndex = e.detail.value
				this.updateFilteredApplications()
			},
			
			// 搜索
			handleSearch() {
				this.updateFilteredApplications()
			},
			
			// 切换选择
			handleToggleSelect(appId) {
				this.selectedApplications = toggleSelect(this.selectedApplications, appId)
				this.updateSelectAllStatus()
			},
			
			// 手动刷新数据
			async handleManualRefresh() {
				try {
					await this.loadApplications()
					// 手动刷新不重新启动自动刷新定时器
					showToast('刷新成功')
				} catch (err) {
					console.error('手动刷新失败:', err)
					showToast('刷新失败')
				}
			},
			
			// 切换全选
			handleToggleSelectAll() {
				const result = toggleSelectAll(this.filteredApplications, this.selectedApplications)
				this.selectedApplications = result.selectedApplications
				this.isAllSelected = result.isAllSelected
				// 全选操作不触发自动刷新
			},
			
			// 更新全选状态
			updateSelectAllStatus() {
				const allIds = this.filteredApplications.map(app => app.id)
				this.isAllSelected = allIds.length > 0 && allIds.every(id => this.selectedApplications.includes(id))
			},
			
			// 查看详情
			viewDetail(app) {
				// 转换数据格式以匹配详情弹窗的期望格式
				const formattedApp = {
					id: app.id,
					name: app.formData?.name || app.name || '未知姓名',
					studentId: app.formData?.studentId || app.student_id || '未知学号',
					phone: app.formData?.phone || app.phone || '未知手机号',
					email: app.formData?.email || app.email || '',
					major: app.formData?.major || app.major || '',
					grade: app.formData?.grade || app.grade || '',
					gender: app.formData?.gender || app.gender || '',
					dormitory: app.formData?.dormitory || app.dormitory || '',
					departments: app.departments,
					createTime: app.createTime || app.applyTime,
					status: app.status,
					introduction: app.formData?.introduction || app.introduction || '',
					firstInterview: app.firstInterview || null,
					secondInterview: app.secondInterview || null
				}
				this.selectedApp = formattedApp
				this.showDetail = true
			},
			
			// 关闭详情
			closeDetail() {
				this.showDetail = false
				this.selectedApp = null
			},
			
			// 从详情弹窗中撤销操作
			async handleUndoFromDetail(application) {
				await this.handleUndoApplication(application)
			},
			
			// 进入二面
			async handleEnterSecondInterview(app) {
				const confirmed = await showConfirm('确认进入二面', '确定让这个申请者进入二面吗？')
				if (!confirmed) return
				
				try {
					await updateApplicationStatus(app.id, 'waiting_second')
					showToast('操作成功')
					this.loadApplications()
					this.closeDetail()
				} catch (err) {
					showToast('操作失败')
				}
			},
			
			// 标记为已面试
			async handleMarkAsInterviewed(app) {
				try {
					showLoading('处理中...')
					await uniCloud.callFunction({
						name: 'application',
						data: { 
							type: 'update_interview_status',
							applicationId: app.id, 
							interviewType: 'second',
							status: 'completed'
						}
					})
					showToast('标记成功')
					await this.refreshAfterOperation()
					this.closeDetail()
				} catch (err) {
					console.error('标记已面试失败:', err)
					showToast('操作失败')
				} finally {
					hideLoading()
				}
			},
			
			// 通过申请
			async handlePassApplication(app) {
				this.pendingApplication = app
				this.isBatchOperation = false
				this.showDepartmentModal = true
			},
			
			// 拒绝申请
			async handleRejectApplication(app) {
				const confirmed = await showConfirm('确认拒绝', '确定要拒绝这个申请吗？')
				if (!confirmed) return
				
				try {
					await updateApplicationStatus(app.id, 'second_failed')
					showToast('操作成功')
					await this.refreshAfterOperation()
					this.closeDetail()
				} catch (err) {
					showToast('操作失败')
				}
			},
			
			// 撤销操作
			async handleUndoApplication(app) {
				let statusText = '操作'
				let isInterviewed = false
				
				if (app.status === 'second_failed') {
					statusText = '二面不通过'
				} else if (app.status === 'department_selection') {
					statusText = '部门选择'
				} else if (app.status === 'accepted') {
					statusText = '已录取'
				} else if (app.status === 'rejected') {
					statusText = '拒绝加入'
				} else if (app.status === 'waiting_second' && app.secondInterview && app.secondInterview.status === 'completed') {
					statusText = '已面试'
					isInterviewed = true
				}
				
				// 根据状态确定撤销后的目标状态
				let targetStatus = 'waiting_second'
				let targetStatusText = '等待二面状态'
				
				// 对于二面相关状态，撤销后应该回到已面试状态
				if (['second_failed', 'department_selection', 'accepted', 'rejected'].includes(app.status)) {
					targetStatus = 'waiting_second'
					targetStatusText = '已面试状态'
				}
				
				const confirmed = await showConfirm('确认撤销', `确定要撤销 ${app.formData?.name || '该用户'} 的${statusText}状态吗？撤销后将重新回到${targetStatusText}。`)
				if (!confirmed) return
				
				try {
					showLoading('处理中...')
					
					if (isInterviewed) {
						// 对于已经是waiting_second状态但已面试的情况，撤销面试状态为pending
						await uniCloud.callFunction({
							name: 'application',
							data: { 
								type: 'update_interview_status',
								applicationId: app.id, 
								interviewType: 'second',
								status: 'pending'
							}
						})
					} else {
						// 对于二面相关状态的撤销，只改变申请状态为waiting_second，保持secondInterview.status为completed
						await updateApplicationStatus(app.id, targetStatus)
					}
					
					showToast('撤销成功')
					await this.refreshAfterOperation()
					this.closeDetail()
				} catch (err) {
					console.error('撤销操作失败:', err)
					showToast('撤销失败')
				} finally {
					hideLoading()
				}
			},
			
			// 批量通过
			async handleBatchPass() {
				if (this.selectedApplications.length === 0) {
					showToast('请先选择要操作的申请')
					return
				}
				this.isBatchOperation = true
				this.showDepartmentModal = true
			},
			
			// 批量拒绝
			async handleBatchReject() {
				if (this.selectedApplications.length === 0) {
					showToast('请先选择要操作的申请')
					return
				}
				
				const confirmed = await showConfirm('确认批量拒绝', `确定要拒绝选中的 ${this.selectedApplications.length} 个申请吗？`)
				if (!confirmed) return
				
				try {
					await batchUpdateApplicationStatus(this.selectedApplications, 'second_failed')
					showToast('批量操作成功')
					this.selectedApplications = []
					await this.refreshAfterOperation()
				} catch (err) {
					showToast('批量操作失败')
				}
			},
			
			// 确认通过（部门选择后）
			async handleConfirmPass(departments) {
				try {
					if (this.isBatchOperation) {
						await batchUpdateApplicationStatus(this.selectedApplications, 'department_selection', departments)
						this.selectedApplications = []
					} else {
						await updateApplicationStatus(this.pendingApplication.id, 'department_selection', departments)
					}
					showToast('操作成功')
					await this.refreshAfterOperation()
					this.closeDetail()
				} catch (err) {
					showToast('操作失败')
				}
				this.showDepartmentModal = false
			},
			
			// 导出全部数据
			async handleExportAll() {
				try {
					showLoading('导出中...')
					
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'exportData',
							exportOptions: {
								status: ['waiting_second', 'second_failed', 'department_selection', 'accepted'],
								departments: []
							}
						}
					})
					
					if (result.result && result.result.success) {
						const { csvData, filename } = result.result
						
						// 在微信小程序中，保存到用户可访问的位置
						// #ifdef MP-WEIXIN
						// 直接保存文件，不需要特殊权限
						this.safeHideLoading()
						this.saveFileToAlbum(csvData, filename)
						// #endif
						
						// 在其他平台中，显示数据内容供复制
						// #ifndef MP-WEIXIN
						this.safeHideLoading()
						uni.showModal({
							title: '导出成功',
							content: `文件已生成：${filename}\n\n请点击确定复制数据内容`,
							success: () => {
								uni.setClipboardData({
									data: '\uFEFF' + csvData,
									success: () => {
										showToast('数据已复制到剪贴板')
									},
									fail: () => {
										showToast('复制失败')
									}
								})
							}
						})
						// #endif
						
					} else {
						this.safeHideLoading()
						showToast('导出失败：' + (result.result?.error || '未知错误'))
					}
				} catch (err) {
					this.safeHideLoading()
					console.error('导出失败:', err)
					showToast('导出失败：' + (err.message || '网络错误'))
				}
			},
			
			// 按条件导出
			async handleExport(data) {
				try {
					showLoading('导出中...')
					
					// 从export-modal组件传递的数据中提取筛选条件
					const exportOptions = {
						status: data.status || ['waiting_second', 'second_failed', 'department_selection', 'accepted'],
						departments: data.departments || []
					}
					
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'exportData',
							exportOptions: exportOptions
						}
					})
					
					if (result.result && result.result.success) {
						const { csvData, filename } = result.result
						
						// 在微信小程序中，保存到用户可访问的位置
						// #ifdef MP-WEIXIN
						// 直接保存文件，不需要特殊权限
						this.safeHideLoading()
						this.saveFileToAlbum(csvData, filename)
						// #endif
						
						// 在其他平台中，显示数据内容供复制
						// #ifndef MP-WEIXIN
						this.safeHideLoading()
						uni.showModal({
							title: '导出成功',
							content: `文件已生成：${filename}\n\n请点击确定复制数据内容`,
							success: () => {
								uni.setClipboardData({
									data: '\uFEFF' + csvData,
									success: () => {
										showToast('数据已复制到剪贴板')
									},
									fail: () => {
										showToast('复制失败')
									}
								})
							}
						})
						// #endif
						
					} else {
						this.safeHideLoading()
						showToast('导出失败：' + (result.result?.error || '未知错误'))
					}
				} catch (err) {
					this.safeHideLoading()
					console.error('导出失败:', err)
					showToast('导出失败：' + (err.message || '网络错误'))
				}
			},
			
			// 保存文件到下载目录
			saveFileToAlbum(csvData, filename) {
				// 使用uni.downloadFile下载文件到用户可访问的位置
				// 先将CSV数据转换为Blob URL
				const BOM = '\uFEFF'
				const csvContent = BOM + csvData
				
				// 创建临时文件
				const fs = uni.getFileSystemManager()
				const tempFilePath = `${uni.env.USER_DATA_PATH}/${filename}`
				
				fs.writeFile({
					filePath: tempFilePath,
					data: csvContent,
					encoding: 'utf8',
					success: () => {
						// 使用uni.saveFile保存到用户可访问的位置
						uni.saveFile({
							tempFilePath: tempFilePath,
							success: (saveRes) => {
								// 提示用户文件已保存
								uni.showModal({
									title: '导出成功',
									content: `文件已保存到：${saveRes.savedFilePath}\n\n您可以在微信的文件管理中找到此文件`,
									showCancel: false,
									success: () => {
										showToast('文件保存成功', 'success')
									}
								})
								console.log('文件保存路径:', saveRes.savedFilePath)
							},
							fail: (err) => {
								console.error('保存文件失败:', err)
								// 如果保存失败，提供复制选项
								uni.showModal({
									title: '文件保存失败',
									content: '无法直接保存文件到本地，是否复制数据内容到剪贴板？',
									success: (res) => {
										if (res.confirm) {
											uni.setClipboardData({
												data: csvContent,
												success: () => {
													showToast('数据已复制到剪贴板', 'success')
												},
												fail: () => {
													showToast('复制失败', 'none')
												}
											})
										}
									}
								})
							}
						})
					},
					fail: (err) => {
						console.error('写入文件失败:', err)
						// 如果写入失败，直接提供复制选项
						uni.showModal({
							title: '文件生成失败',
							content: '无法生成文件，是否复制数据内容到剪贴板？',
							success: (res) => {
								if (res.confirm) {
									uni.setClipboardData({
										data: csvContent,
										success: () => {
											showToast('数据已复制到剪贴板', 'success')
										},
										fail: () => {
											showToast('复制失败', 'none')
										}
									})
								}
							}
						})
					}
				})
			},
			
			// 发送通知
			async handleSendNotification(notificationData) {
				if (!notificationData.title || !notificationData.content) {
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
								...notificationData
							}
						}
					})
					
					this.safeHideLoading()
					
					if (result.result && result.result.success) {
						uni.showToast({ title: '通知发送成功', icon: 'success' })
						this.showNotificationModal = false
					} else {
						uni.showToast({ title: result.result?.error || '发送失败', icon: 'none' })
					}
				} catch (error) {
					this.safeHideLoading()
					// 发送通知失败
					uni.showToast({ title: '发送失败，请重试', icon: 'none' })
				}
			},
			
			// 显示通知历史
			async handleShowNotificationHistory() {
				try {
					const result = await getNotificationHistory()
					this.notificationHistory = result.data || []
					this.showHistoryModal = true
				} catch (err) {
					showToast('获取通知历史失败')
				}
			},
			
			// 编辑通知
			handleEditNotification(notification) {
				// 实现编辑通知逻辑
				// 编辑通知
			},
			
			// 删除通知
			async handleDeleteNotification(notificationId) {
				const confirmed = await showConfirm('确认删除', '确定要删除这条通知吗？')
				if (!confirmed) return
				
				try {
					// 调用删除通知的云函数
					showToast('删除成功')
					this.handleShowNotificationHistory() // 刷新列表
				} catch (err) {
					showToast('删除失败')
				}
			},
			
			// 下拉刷新处理
			async onRefresh() {
				this.isRefreshing = true
				try {
					await this.loadApplications()
					// 重置定时器
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
			
			// 开始自动刷新
			startAutoRefresh() {
				// 清除现有定时器
				this.stopAutoRefresh()
				
				// 设置定时器
				this.autoRefreshTimer = setInterval(() => {
					// 检查是否需要刷新（距离上次刷新超过3分钟）
					const now = Date.now()
					if (now - this.lastRefreshTime >= this.refreshInterval) {
						console.log('执行定时自动刷新')
						this.loadApplications(true)
					}
				}, 30000) // 每30秒检查一次
				
				console.log('自动刷新已启动')
			},
			
			// 停止自动刷新
			stopAutoRefresh() {
				if (this.autoRefreshTimer) {
					clearInterval(this.autoRefreshTimer)
					this.autoRefreshTimer = null
					console.log('自动刷新已停止')
				}
			},
			
			// 手动刷新（操作后调用）
			async refreshAfterOperation(restartAutoRefresh = true) {
				try {
					await this.loadApplications()
					// 根据参数决定是否重置定时器
					if (restartAutoRefresh) {
						this.startAutoRefresh()
					}
				} catch (err) {
					console.error('操作后刷新失败:', err)
				}
			},
			
			// 工具函数
			getStatusText,
			getStatusClass(status) {
				// 在二面管理界面中，department_selection 和 accepted 都应该显示为绿色背景
				if (status === 'department_selection' || status === 'accepted') {
					return 'status-passed'
				}
				// 其他状态使用默认的样式类名
				const classMap = {
					waiting_first: 'status-pending',
					first_failed: 'status-failed',
					waiting_second: 'status-interview',
					second_failed: 'status-failed',
					rejected: 'status-failed'
				}
				return classMap[status] || 'status-pending'
			},
			formatTime,
			getTargetText
		}
	}
</script>

<style scoped>
	/* 基础样式 */
	.container {
		background: #f5f5f5;
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
	
	.scroll-container .batch-section {
		padding: 0 20px;
	}
	
	.scroll-container .applications-section {
		padding: 0 20px 20px 20px;
	}
	
	/* 筛选栏样式 */
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
		border-radius: 6px;
		padding: 0 10px;
		border: 1px solid #e9ecef;
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
		font-size: 13px;
		height: 36px;
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
	
	/* 统计信息样式 */
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
	}
	
	.stats-number {
		font-size: 24px;
		font-weight: 600;
		color: #007bff;
		display: block;
		margin-bottom: 4px;
	}
	
	.stats-label {
		font-size: 12px;
		color: #666;
	}
	
	/* 快捷操作样式 */
	.batch-section {
		margin-bottom: 20px;
	}
	
	.batch-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.batch-header {
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
	
	.batch-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
	}
	
	.select-all {
		padding: 8px 16px;
		background: #f8f9fa;
		border-radius: 6px;
		cursor: pointer;
	}
	
	.select-text {
		font-size: 14px;
		color: #007bff;
	}
	
	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.action-group {
		border-bottom: 1px solid #f0f0f0;
		padding-bottom: 16px;
	}
	
	.action-group:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}
	
	.action-group-title {
		font-size: 14px;
		font-weight: 600;
		color: #666;
		margin-bottom: 12px;
		display: block;
	}
	
	.action-buttons {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
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
	}
	
	.btn-primary {
		background: #4A90E2;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	
	.btn-secondary {
		background: #6c757d;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	
	/* 申请列表样式 */
	.applications-section {
		margin-bottom: 20px;
	}
	
	.empty-state {
		background: white;
		border-radius: 12px;
		padding: 60px 20px;
		text-align: center;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.empty-text {
		font-size: 16px;
		color: #999;
	}
	
	.applications-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.application-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		border: 2px solid transparent;
		transition: all 0.3s ease;
	}
	
	.application-card.selected {
		border-color: #4A90E2;
		background: #f0f8ff;
	}
	
	.app-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}
	
	.app-info {
		flex: 1;
	}
	
	
	.app-name {
		font-size: 18px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 4px;
	}
	
	.app-student-id {
		font-size: 14px;
		color: #7f8c8d;
	}
	
	.app-status {
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		align-items: flex-end;
		gap: 6px;
	}
	
	/* 签到序号徽章样式 - 重新设计为更协调的样式 */
	.checkin-number-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px 16px;
		background: linear-gradient(135deg, #667eea, #764ba2);
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
		border: none;
		position: relative;
		overflow: hidden;
		min-width: 80px;
		text-align: center;
	}
	
	.checkin-number-badge::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}
	
	.checkin-number-badge:active::before {
		left: 100%;
	}
	
	.checkin-number-text {
		font-size: 13px;
		color: white;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	
	.status-badge {
		padding: 6px 16px;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 500;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
		min-width: 80px;
		text-align: center;
	}
	
	.status-pending {
		background: #fff3cd;
		color: #856404;
	}
	
	.status-interview {
		background: #d1ecf1;
		color: #0c5460;
	}
	
	.status-passed {
		background: #d4edda;
		color: #155724;
	}
	
	.status-failed {
		background: #f8d7da;
		color: #721c24;
	}
	
	.app-details {
		margin-bottom: 16px;
	}
	
	.detail-row {
		display: flex;
		margin-bottom: 8px;
	}
	
	.detail-label {
		font-size: 14px;
		color: #7f8c8d;
		width: 80px;
	}
	
	.detail-value {
		font-size: 14px;
		color: #2c3e50;
		flex: 1;
	}
	
	.app-actions {
		display: flex;
		gap: 12px;
	}
	
	.view-btn {
		background: #f8f9fa;
		color: #6c757d;
	}
	
	.pass-btn {
		background: #d4edda;
		color: #155724;
	}
	
	.reject-btn {
		background: #f8d7da;
		color: #721c24;
	}
	
	.undo-btn {
		background: #fff3cd;
		color: #856404;
	}
	
	.second-passed-dept {
		color: #28a745 !important;
		font-weight: 500;
	}
	
	.final-dept {
		color: #dc3545 !important;
		font-weight: 600;
		background: #fff5f5;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #fecaca;
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