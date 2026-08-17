<template>
	<view class="container">
		<!-- 未登录状态 -->
		<view v-if="!isLoggedIn" class="login-section">
			<view class="login-card">
				<image src="/static/logo.png" class="login-logo" mode="aspectFit"></image>
				<text class="login-title">管理员登录</text>
				<text class="login-desc">请输入管理员账号和密码</text>
				
				<view class="input-group">
					<text class="input-label">管理员账号</text>
					<input class="input-field" v-model="loginForm.username" placeholder="请输入管理员账号" />
				</view>
				
				<view class="input-group">
					<text class="input-label">密码</text>
					<input class="input-field" v-model="loginForm.password" placeholder="请输入密码" type="password" />
				</view>
				
				<button class="btn-primary login-btn" @click="adminLogin">
					<text class="login-btn-text">登录</text>
				</button>
			</view>
		</view>
		
		<!-- 已登录状态 -->
		<view v-else class="admin-section">
			<!-- 下拉刷新容器 -->
			<scroll-view 
				class="scroll-container" 
				:scroll-y="!isScrollLocked" 
				refresher-enabled="true"
				:refresher-triggered="isRefreshing"
				@refresherrefresh="onRefresh"
				@refresherrestore="onRefreshRestore"
				@refresherabort="onRefreshAbort"
			>
				<!-- 管理员信息 -->
				<view class="admin-card">
				<view class="admin-header">
					<image src="/static/logo.png" class="admin-avatar" mode="aspectFit"></image>
					<view class="admin-info">
						<text class="admin-name">{{adminInfo.name}}</text>
						<text class="admin-role">{{adminInfo.role}}</text>
					</view>
				</view>
			</view>
			
			<!-- 统计信息 -->
			<view class="stats-section">
				<view class="stats-card">
					<view class="stats-item">
						<text class="stats-number">{{statistics.total}}</text>
						<text class="stats-label">总申请</text>
					</view>
					<view class="stats-item">
						<text class="stats-number">{{statistics.firstPassed}}</text>
						<text class="stats-label">一面过</text>
					</view>
					<view class="stats-item">
						<text class="stats-number">{{statistics.enteredSecond}}</text>
						<text class="stats-label">进二面</text>
					</view>
					<view class="stats-item">
						<text class="stats-number">{{statistics.secondPassed}}</text>
						<text class="stats-label">二面通</text>
					</view>
					<view class="stats-item">
						<text class="stats-number">{{statistics.joinedUs}}</text>
						<text class="stats-label">加入</text>
					</view>
				</view>
			</view>
			
			<!-- 功能菜单 -->
			<view class="menu-section">
				<view class="menu-card">
					<view class="menu-item" @click="goToApplications">
						<view class="menu-icon applications-icon">📋</view>
						<view class="menu-content">
							<text class="menu-title">一面管理</text>
							<text class="menu-desc">查看和管理一面申请和结果</text>
						</view>
						<text class="menu-arrow">></text>
					</view>
					
					<view class="menu-item" @click="goToSecondInterview">
						<view class="menu-icon interview-icon">🎯</view>
						<view class="menu-content">
							<text class="menu-title">二面管理</text>
							<text class="menu-desc">查看和管理二面申请和结果</text>
						</view>
						<text class="menu-arrow">></text>
					</view>
					
					<view class="menu-item" @click="goToAdmissionList">
						<view class="menu-icon admission-icon">🎓</view>
						<view class="menu-content">
							<text class="menu-title">录取名单</text>
							<text class="menu-desc">查看通过二面的录取人员名单</text>
						</view>
						<text class="menu-arrow">></text>
					</view>
					
					<view class="menu-item" @click="goToSettings">
						<view class="menu-icon settings-icon">⚙️</view>
						<view class="menu-content">
							<text class="menu-title">系统设置</text>
							<text class="menu-desc">管理招新时间和系统配置</text>
						</view>
						<text class="menu-arrow">></text>
					</view>
				</view>
			</view>
			
			<!-- 快捷操作 -->
			<view class="quick-actions">
				<text class="section-title">快捷操作</text>
				<view class="actions-grid">
					<view class="action-item" @click="showSendNotification">
						<view class="action-icon">📢</view>
						<text class="action-text">发送通知</text>
					</view>
					<view class="action-item" @click="showExportOptions">
						<view class="action-icon">📤</view>
						<text class="action-text">导出数据</text>
					</view>
					<view class="action-item" @click="showNotificationHistory">
						<view class="action-icon">📋</view>
						<text class="action-text">历史通知</text>
					</view>
					<view class="action-item" @click="refreshData">
						<view class="action-icon">🔄</view>
						<text class="action-text">刷新数据</text>
					</view>
				</view>
			</view>
			
			
			
			
			
			<!-- 退出登录 -->
			<view class="logout-section">
				<button class="btn-secondary logout-btn" @click="logout">退出登录</button>
			</view>
		</scroll-view>
		</view>
		
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
		
		<!-- 导出数据弹窗 -->
		<view v-if="showExportModal" class="modal-overlay" @click="closeExportModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">导出数据</text>
					<text class="modal-close" @click="closeExportModal">×</text>
				</view>
				<view class="modal-body">
					<view class="form-group">
						<text class="form-label">状态筛选</text>
						<view class="status-filter-container">
							<view class="all-status-section">
								<view class="checkbox-item all-status-item" @click="toggleAllStatus">
									<text class="checkbox">{{isAllStatusSelected ? '☑️' : '☐'}}</text>
									<text class="checkbox-label all-status-label">所有状态</text>
								</view>
							</view>
							<view class="status-grid">
								<view v-for="status in exportStatusOptions" :key="status.value" class="status-item" @click="toggleExportStatus(status.value)">
									<text class="checkbox">{{exportForm.status.includes(status.value) ? '☑️' : '☐'}}</text>
									<text class="checkbox-label">{{status.label}}</text>
								</view>
							</view>
						</view>
					</view>
					<view class="form-group">
						<text class="form-label">部门筛选</text>
						<view class="checkbox-group">
							<view v-for="dept in exportDeptOptions" :key="dept" class="checkbox-item" @click="toggleExportDept(dept)">
								<text class="checkbox">{{exportForm.departments.includes(dept) ? '☑️' : '☐'}}</text>
								<text class="checkbox-label">{{dept}}</text>
							</view>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<button class="btn-secondary" @click="closeExportModal">取消</button>
					<button class="btn-primary" @click="executeExport">导出</button>
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
	</view>
</template>

<script>
	import { adminLogin, getStatistics } from '@/utils/admin-api.js'
	import { showToast, showLoading, hideLoading, formatSmartTime } from '@/utils/utils.js'
	
	// 安全的loading状态管理
	const safeHideLoading = () => {
		try {
			hideLoading()
		} catch (error) {
			console.warn('hideLoading failed:', error)
		}
	}
	
	export default {
		data() {
			return {
				isLoggedIn: false,
				adminInfo: null,
				loginForm: {
					username: '',
					password: ''
				},
				statistics: {
					total: 0,
					firstPassed: 0,
					enteredSecond: 0,
					secondPassed: 0,
					joinedUs: 0
				},
				// 通知相关
				showNotificationModal: false,
				notificationForm: {
					title: '',
					content: '',
					target: 'all'
				},
				notificationTargetIndex: 0,
				notificationTargetOptions: ['全体用户', '等待一面', '一面通过', '等待二面', '一面未通过', '部门选择', '二面未通过', '已录取'],

				// 导出相关
				showExportModal: false,
				exportForm: {
					status: ['waiting_first', 'first_passed', 'first_failed', 'waiting_second', 'second_failed', 'department_selection', 'accepted'],
					departments: ['宣传部', '策划部', '执行部']
				},
				exportStatusOptions: [
					{ value: 'waiting_first', label: '等待一面' },
					{ value: 'first_passed', label: '一面通过' },
					{ value: 'first_failed', label: '一面未通过' },
					{ value: 'waiting_second', label: '等待二面' },
					{ value: 'second_failed', label: '二面未通过' },
					{ value: 'department_selection', label: '选择部门' },
					{ value: 'accepted', label: '已录取' }
				],
				exportDeptOptions: ['宣传部', '策划部', '执行部'],
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
				
				// 滚动锁定状态
				isScrollLocked: false
			}
		},
		computed: {
			isAllStatusSelected() {
				return this.exportStatusOptions.every(status => this.exportForm.status.includes(status.value))
			}
		},
		onLoad() {
			this.checkLoginStatus()
			this.loadStatistics()
		},
		
		onShow() {
			// 每次页面显示时自动刷新统计信息（静默模式，不显示加载提示）
			if (this.isLoggedIn) {
				this.loadStatistics(true)
			}
		},
		
		onFocus() {
			// 页面获得焦点时也刷新统计信息（静默模式，不显示加载提示）
			if (this.isLoggedIn) {
				this.loadStatistics(true)
			}
		},
		methods: {
			// 检查登录状态
			checkLoginStatus() {
				const adminInfo = uni.getStorageSync('adminInfo')
				if (adminInfo) {
					this.isLoggedIn = true
					this.adminInfo = adminInfo
				}
			},
			
			// 管理员登录
			async adminLogin() {
				if (!this.loginForm.username || !this.loginForm.password) {
					showToast('请输入账号和密码')
					return
				}
				
				showLoading('登录中...')
				
				try {
					const result = await adminLogin({
						username: this.loginForm.username,
						password: this.loginForm.password
					})
					
					if (result.success) {
						const { adminInfo } = result.data
						
						uni.setStorageSync('adminInfo', adminInfo)
						this.isLoggedIn = true
						this.adminInfo = adminInfo
						
						safeHideLoading()
						showToast('登录成功', 'success')
						
						// 登录成功后立即加载统计数据
						await this.loadStatistics()
					} else {
						safeHideLoading()
						showToast(result.error || '登录失败')
					}
				} catch (error) {
					safeHideLoading()
					console.error('管理员登录失败:', error)
					showToast('登录失败，请检查网络连接')
				}
			},
			
			// 加载统计数据
			async loadStatistics(silent = false) {
				if (!this.isLoggedIn) {
					return
				}			
				try {
					const result = await getStatistics()
					if (result.success && result.data) {
						// 转换数据格式以匹配页面期望的格式
						const stats = result.data
						this.statistics = {
							total: stats.total || 0,
							firstPassed: stats.first_passed || 0,
							enteredSecond: stats.entered_second || 0,
							secondPassed: stats.second_passed || 0,
							joinedUs: stats.joined_us || 0
						}
					} else {
						// 使用默认数据
						this.statistics = {
							total: 0,
							firstPassed: 0,
							enteredSecond: 0,
							secondPassed: 0,
							joinedUs: 0
						}
					}
				} catch (error) {
					console.error('加载统计数据失败:', error)
					this.statistics = {
						total: 0,
						firstPassed: 0,
						enteredSecond: 0,
						secondPassed: 0,
						joinedUs: 0
					}
				} finally {
					// 如果不是静默模式，隐藏加载提示
					if (!silent) {
						safeHideLoading()
					}
				}
			},
			
			// 跳转到一面管理
			goToApplications() {
				uni.navigateTo({
					url: '/pages/admin/applications'
				})
			},
			
			// 跳转到二面管理
			goToSecondInterview() {
				uni.navigateTo({
					url: '/pages/admin/second-interview'
				})
			},
			

			
			// 跳转到录取名单
			goToAdmissionList() {
				uni.navigateTo({
					url: '/pages/admin/admission-list'
				})
			},
			
			// 跳转到系统设置
			goToSettings() {
				uni.navigateTo({
					url: '/pages/admin/settings'
				})
			},
			
			// 显示发送通知弹窗
			showSendNotification() {
				this.showNotificationModal = true
				this.lockBodyScroll()
			},
			
			// 关闭发送通知弹窗
			closeNotificationModal() {
				this.showNotificationModal = false
				this.unlockBodyScroll()
				this.notificationForm = {
					title: '',
					content: '',
					target: 'all'
				}
				this.notificationTargetIndex = 0
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
					showToast('请填写通知标题和内容')
					return
				}
				
				showLoading('发送中...')
				
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
					
					safeHideLoading()
					
					if (result.result && result.result.success) {
						showToast('通知发送成功', 'success')
						this.closeNotificationModal()
					} else {
						showToast(result.result?.error || '发送失败')
					}
				} catch (error) {
					safeHideLoading()
					console.error('发送通知失败:', error)
					showToast('发送失败，请重试')
				}
			},
			
			// 显示导出选项
			showExportOptions() {
				this.showExportModal = true
				this.lockBodyScroll()
			},
			
			// 关闭导出弹窗
			closeExportModal() {
				this.showExportModal = false
				this.unlockBodyScroll()
			},
			
			
			// 切换导出状态
			toggleExportStatus(status) {
				const index = this.exportForm.status.indexOf(status)
				if (index > -1) {
					this.exportForm.status.splice(index, 1)
				} else {
					this.exportForm.status.push(status)
				}
			},
			
			// 切换导出部门
			toggleExportDept(dept) {
				const index = this.exportForm.departments.indexOf(dept)
				if (index > -1) {
					this.exportForm.departments.splice(index, 1)
				} else {
					this.exportForm.departments.push(dept)
				}
			},
			
			// 切换所有状态
			toggleAllStatus() {
				if (this.isAllStatusSelected) {
					// 如果全部选中，则取消所有选择
					this.exportForm.status = []
				} else {
					// 如果未全部选中，则选择所有状态
					this.exportForm.status = this.exportStatusOptions.map(status => status.value)
				}
			},
			
			// 执行导出
			async executeExport() {
				if (this.exportForm.status.length === 0) {
					showToast('请至少选择一个状态')
					return
				}
				
				if (this.exportForm.departments.length === 0) {
					showToast('请至少选择一个部门')
					return
				}
				
				showLoading('导出中...')
				
				try {
					const result = await uniCloud.callFunction({
						name: 'admin-api',
						data: {
							action: 'exportData',
							exportOptions: this.exportForm
						}
					})
					
					if (result.result && result.result.success) {
						// 处理CSV数据下载
						const csvData = result.result.data
						const filename = result.result.filename || '管理员数据导出.csv'
						
						// 在微信小程序中，保存到用户可访问的位置
						// #ifdef MP-WEIXIN
						// 直接保存文件，不需要特殊权限
						safeHideLoading()
						this.saveFileToAlbum(csvData, filename)
						this.closeExportModal()
						// #endif
						
						// 在其他平台中，显示数据内容供复制
						// #ifndef MP-WEIXIN
						safeHideLoading()
						uni.showModal({
							title: '导出成功',
							content: `文件已生成：${filename}\n\n请点击确定复制数据内容`,
							success: (res) => {
								if (res.confirm) {
									uni.setClipboardData({
										data: '\uFEFF' + csvData,
										success: () => {
											showToast('数据已复制到剪贴板', 'success')
										},
										fail: () => {
											showToast('复制失败，请重试', 'none')
										}
									})
								}
							}
						})
						this.closeExportModal()
						// #endif
					} else {
						safeHideLoading()
						showToast(result.result?.error || '导出失败')
					}
				} catch (error) {
					safeHideLoading()
					console.error('导出数据失败:', error)
					showToast('导出失败，请重试')
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
			
			// 显示历史通知
			showNotificationHistory() {
				this.showHistoryModal = true
				this.lockBodyScroll()
				this.loadNotificationHistory()
			},
			
			// 关闭历史通知弹窗
			closeHistoryModal() {
				this.showHistoryModal = false
				this.unlockBodyScroll()
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
			
			// 格式化时间 - 使用智能时间显示
			formatTime(timestamp) {
				if (!timestamp) return '未知时间'
				return formatSmartTime(timestamp) || '未知时间'
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
				this.lockBodyScroll()
			},
			
			// 关闭编辑通知弹窗
			closeEditNotificationModal() {
				this.showEditNotificationModal = false
				this.unlockBodyScroll()
				this.editingNotification = {
					_id: '',
					title: '',
					content: ''
				}
			},
			
			// 更新通知
			async updateNotification() {
				if (!this.editingNotification.title || !this.editingNotification.content) {
					showToast('请填写通知标题和内容')
					return
				}
				
				showLoading('更新中...')
				
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
					
					safeHideLoading()
					
					if (result.result && result.result.success) {
						showToast('更新成功', 'success')
						this.closeEditNotificationModal()
						this.loadNotificationHistory()
					} else {
						showToast(result.result?.error || '更新失败')
					}
				} catch (error) {
					safeHideLoading()
					console.error('更新通知失败:', error)
					showToast('更新失败，请重试')
				}
			},
			
			// 删除通知
			async deleteNotification(notificationId) {
				uni.showModal({
					title: '确认删除',
					content: '确定要删除这条通知吗？',
					success: async (res) => {
						if (res.confirm) {
							showLoading('删除中...')
							
							try {
								const result = await uniCloud.callFunction({
									name: 'admin-api',
									data: {
										action: 'deleteNotification',
										notificationId
									}
								})
								
								safeHideLoading()
								
								if (result.result && result.result.success) {
									showToast('删除成功', 'success')
									this.loadNotificationHistory()
								} else {
									showToast(result.result?.error || '删除失败')
								}
							} catch (error) {
								safeHideLoading()
								console.error('删除通知失败:', error)
								showToast('删除失败，请重试')
							}
						}
					}
				})
			},
			
			// 下拉刷新处理
			async onRefresh() {
				this.isRefreshing = true
				try {
					await this.loadStatistics()
				} catch (error) {
					console.error('下拉刷新失败:', error)
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
			
			// 刷新数据
			async refreshData() {
				try {
					await this.loadStatistics()
				} catch (error) {
					console.error('刷新数据失败:', error)
					showToast('刷新失败，请重试')
				}
			},
			
			// 退出登录
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出管理员登录吗？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('adminInfo')
							this.isLoggedIn = false
							this.adminInfo = null
							this.loginForm = {
								username: '',
								password: ''
							}
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 锁定页面滚动
			lockBodyScroll() {
				// 在uni-app中，通过动态修改scroll-view的属性来禁用滚动
				this.isScrollLocked = true
			},
			
			// 解锁页面滚动
			unlockBodyScroll() {
				// 恢复scroll-view的滚动
				this.isScrollLocked = false
			}
		}
	}
</script>

<style scoped>
	.container {
		background: #f5f5f5;
		min-height: 100vh;
	}
	
	.scroll-container {
		height: 100vh;
	}
	
	.scroll-container .admin-card {
		margin: 20px 20px 0 20px;
	}
	
	.scroll-container .stats-section {
		margin: 20px 20px 20px 20px;
	}
	
	.scroll-container .menu-section {
		margin: 0 20px 20px 20px;
	}
	
	.scroll-container .quick-actions {
		margin: 0 20px 20px 20px;
	}
	
	.scroll-container .logout-section {
		margin: 0 20px 20px 20px;
	}
	
	.login-section {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		min-height: 100vh;
		padding: 15vh 20px 20px 20px;
		box-sizing: border-box;
		background: #f5f5f5;
	}
	
	.login-card {
		background: white;
		border-radius: 16px;
		padding: 40px 30px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		width: calc(100% - 40px);
		max-width: 350px;
		margin: 0 auto;
		position: relative;
		box-sizing: border-box;
	}
	
	.login-logo {
		width: 80px;
		height: 80px;
		margin: 0 auto 20px;
		display: block;
	}
	
	.login-title {
		font-size: 20px;
		font-weight: 600;
		color: #2c3e50;
		text-align: center;
		display: block;
		margin-bottom: 8px;
	}
	
	.login-desc {
		font-size: 14px;
		color: #7f8c8d;
		text-align: center;
		margin-bottom: 30px;
	}
	
	.input-group {
		margin-bottom: 20px;
	}
	
	.input-label {
		font-size: 14px;
		color: #2c3e50;
		display: block;
		margin-bottom: 8px;
	}
	
	.input-field {
		width: 100%;
		height: 44px;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 0 16px;
		font-size: 16px;
		box-sizing: border-box;
	}
	
	.login-btn {
		width: 100%;
		height: 45px;
		border-radius: 22px;
	}
	
	.admin-card {
		background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 20px;
		box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
	}
	
	.admin-header {
		display: flex;
		align-items: center;
	}
	
	.admin-avatar {
		width: 60px;
		height: 60px;
		border-radius: 30px;
		margin-right: 16px;
		border: 3px solid rgba(255, 255, 255, 0.3);
	}
	
	.admin-info {
		flex: 1;
	}
	
	.admin-name {
		font-size: 20px;
		font-weight: 600;
		color: white;
		display: block;
		margin-bottom: 4px;
	}
	
	.admin-role {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.stats-section {
		margin-bottom: 20px;
	}
	
	.stats-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 16px;
	}
	
	.stats-item {
		text-align: center;
		flex: 1;
	}
	
	.stats-number {
		font-size: 24px;
		font-weight: 600;
		color: #4A90E2;
		display: block;
		margin-bottom: 4px;
	}
	
	.stats-label {
		font-size: 12px;
		color: #7f8c8d;
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
		padding: 20px;
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
		width: 50px;
		height: 50px;
		border-radius: 25px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 16px;
		font-size: 24px;
	}
	
	.applications-icon {
		background: #e3f2fd;
	}
	
	.interview-icon {
		background: #f3e5f5;
	}
	
	.statistics-icon {
		background: #e8f5e8;
	}
	
	.settings-icon {
		background: #fff3e0;
	}
	
	.menu-content {
		flex: 1;
	}
	
	.menu-title {
		font-size: 16px;
		font-weight: 500;
		color: #2c3e50;
		display: block;
		margin-bottom: 4px;
	}
	
	.menu-desc {
		font-size: 12px;
		color: #7f8c8d;
	}
	
	.menu-arrow {
		font-size: 16px;
		color: #bdc3c7;
	}
	
	.quick-actions {
		margin-bottom: 20px;
	}
	
	.section-title {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
		margin-bottom: 16px;
		display: block;
	}
	
	.actions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}
	
	.action-item {
		background: white;
		border-radius: 12px;
		padding: 20px;
		text-align: center;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s ease;
	}
	
	.action-item:active {
		transform: scale(0.95);
	}
	
	.action-icon {
		font-size: 32px;
		margin-bottom: 8px;
	}
	
	.action-text {
		font-size: 14px;
		color: #2c3e50;
		font-weight: 500;
	}
	
	.logout-section {
		text-align: center;
	}
	
	.logout-btn {
		width: 200px;
		height: 45px;
		border-radius: 22px;
	}
	
	/* 弹窗样式 */
	.modal-overlay {
		position: fixed !important;
		top: 0 !important;
		left: 0 !important;
		right: 0 !important;
		bottom: 0 !important;
		width: 100vw !important;
		height: 100vh !important;
		background: rgba(0, 0, 0, 0.5);
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		z-index: 9999 !important;
		/* 确保弹窗始终在视口中央 */
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		/* 防止滚动穿透 */
		overflow: hidden;
	}
	
	.modal-content {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 85vh;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
		/* 确保弹窗内容在视口中央 */
		position: relative;
		margin: 0 auto;
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		/* 确保弹窗内容不会超出视口 */
		max-height: calc(100vh - 40px);
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
		border-bottom: 1px solid #e9ecef;
		flex-shrink: 0;
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
		transition: background-color 0.2s ease;
	}
	
	.modal-close:hover {
		background: #e0e0e0;
	}
	
	.modal-body {
		padding: 20px;
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e9ecef;
		flex-shrink: 0;
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
	
	.form-input:focus {
		border-color: #007aff;
		outline: none;
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
	
	.form-textarea:focus {
		border-color: #007aff;
		outline: none;
	}
	
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
	
	/* 复选框组 */
	.checkbox-group {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	
	.status-filter-container {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.all-status-section {
		padding: 12px;
		background: #e3f2fd;
		border-radius: 8px;
		border: 1px solid #4A90E2;
	}
	
	.status-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
	
	.checkbox-item {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: #fff;
		min-width: 80px;
		cursor: pointer;
	}
	
	.status-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: #fff;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 40px;
	}
	
	.checkbox-item:active, .status-item:active {
		background: #f0f0f0;
	}
	
	.status-item:hover {
		background: #f8f9fa;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.checkbox {
		font-size: 14px;
		min-width: 16px;
	}
	
	.checkbox-label {
		font-size: 13px;
		color: #333;
		flex: 1;
	}
	
	.all-status-item {
		background: transparent;
		border: none;
		padding: 0;
	}
	
	.all-status-label {
		font-weight: 600;
		color: #4A90E2;
		font-size: 14px;
	}
	
	/* 用户列表 */
	.user-list {
		max-height: 200px;
		overflow-y: auto;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: #fff;
	}
	
	.user-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px;
		border-bottom: 1px solid #f0f0f0;
		cursor: pointer;
	}
	
	.user-item:last-child {
		border-bottom: none;
	}
	
	.user-item:active {
		background: #f0f0f0;
	}
	
	.user-checkbox {
		font-size: 12px;
	}
	
	.user-name {
		font-size: 13px;
		color: #333;
	}
	
	/* 按钮样式 */
	.btn-primary {
		flex: 1;
		background: linear-gradient(135deg, #007aff, #0056cc);
		color: white;
		border: none;
		border-radius: 6px;
		padding: 12px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}
	
	.btn-secondary {
		flex: 1;
		background: #f0f0f0;
		color: #666;
		border: none;
		border-radius: 6px;
		padding: 12px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
	}
	
	/* 通知列表 */
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
	
	/* 空状态 */
	.empty-state {
		text-align: center;
		padding: 40px;
		color: #999;
		font-size: 14px;
	}
	
	.login-btn-text {
		font-size: 16px;
		font-weight: 600;
		color: white;
	}
	
	/* 响应式设计 */
	@media screen and (max-width: 480px) {
		.login-section {
			padding: 12vh 15px 15px 15px;
		}
		
		.login-card {
			width: calc(100% - 30px);
			padding: 30px 20px;
		}
	}
	
	@media screen and (max-width: 360px) {
		.login-section {
			padding: 10vh 10px 10px 10px;
		}
		
		.login-card {
			width: calc(100% - 20px);
			padding: 25px 15px;
		}
	}
</style>