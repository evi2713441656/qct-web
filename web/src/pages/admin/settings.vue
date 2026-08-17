<template>
	<view class="container">
		<!-- 页面标题 -->
		<view class="page-header">
			<text class="page-title">⚙️ 系统设置</text>
			<text class="page-subtitle">管理招新时间、面试时间地点和部门信息</text>
		</view>
		
		<!-- 设置表单 -->
		<view class="settings-form">
			<!-- 招新时间设置 -->
			<view class="form-section">
				<view class="section-header" @click="toggleRecruitmentSection">
					<text class="section-title">📅 招新时间设置</text>
					<view class="collapse-icon" :class="{ 'collapsed': !recruitmentExpanded }">
						<text class="collapse-arrow">{{ recruitmentExpanded ? '▼' : '▶' }}</text>
					</view>
				</view>
				
				<view class="section-content" :class="{ 'collapsed': !recruitmentExpanded }">
					<view class="form-group">
						<text class="form-label">报名开始时间</text>
						<picker mode="date" :value="formData.recruitmentTime.startDate" @change="onStartDateChange">
							<view class="picker-input">
								<text class="picker-text">{{formData.recruitmentTime.startDate || '请选择开始时间'}}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
					
					<view class="form-group">
						<text class="form-label">报名结束时间</text>
						<picker mode="date" :value="formData.recruitmentTime.endDate" @change="onEndDateChange">
							<view class="picker-input">
								<text class="picker-text">{{formData.recruitmentTime.endDate || '请选择结束时间'}}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
					
					<view class="form-group">
						<text class="form-label">结束时间（具体时间）</text>
						<picker mode="time" :value="formData.recruitmentTime.endTime" @change="onEndTimeChange">
							<view class="picker-input">
								<text class="picker-text">{{formData.recruitmentTime.endTime || '23:59'}}</text>
								<text class="picker-arrow">></text>
							</view>
						</picker>
					</view>
					
					<!-- 当前状态显示 -->
					<view class="status-section">
						<text class="section-title">📊 当前状态</text>
						<view class="status-card">
							<view class="status-item">
								<text class="status-label">报名状态</text>
								<text class="status-value" :class="applicationStatus.class">{{applicationStatus.text}}</text>
							</view>
							<view class="status-item">
								<text class="status-label">当前时间</text>
								<text class="status-value">{{currentTime}}</text>
							</view>
							<view class="status-item">
								<text class="status-label">剩余时间</text>
								<text class="status-value">{{remainingTime}}</text>
							</view>
						</view>
					</view>
					
					<!-- 招新时间操作按钮 -->
					<view class="section-actions">
						<button class="btn-secondary btn-section" @click="resetRecruitmentTime">
							<text class="btn-text">重置时间</text>
						</button>
						<button class="btn-primary btn-section" @click="saveRecruitmentTime" :disabled="savingRecruitment">
							<text class="btn-text">{{savingRecruitment ? '保存中...' : '保存时间'}}</text>
						</button>
					</view>
				</view>
			</view>
			
			<!-- 面试设置 -->
			<view class="form-section interview-section">
				<view class="section-header" @click="toggleInterviewSection">
					<text class="section-title">🎯 面试设置</text>
					<text class="section-subtitle">设置第一轮和第二轮面试的时间地点</text>
					<view class="collapse-icon" :class="{ 'collapsed': !interviewExpanded }">
						<text class="collapse-arrow">{{ interviewExpanded ? '▼' : '▶' }}</text>
					</view>
				</view>
				
				<view class="section-content" :class="{ 'collapsed': !interviewExpanded }">
					<!-- 一面设置 -->
					<view class="interview-group">
						<view class="interview-header" @click="toggleFirstInterview">
							<text class="interview-title">第一轮面试</text>
							<view class="collapse-icon" :class="{ 'collapsed': !firstInterviewExpanded }">
								<text class="collapse-arrow">{{ firstInterviewExpanded ? '▼' : '▶' }}</text>
							</view>
						</view>
						
						<view class="interview-content" :class="{ 'collapsed': !firstInterviewExpanded }">
							<view class="form-group">
								<text class="form-label">面试日期</text>
								<picker mode="date" :value="formData.interviewConfig?.firstInterview?.date || ''" @change="onFirstInterviewDateChange">
									<view class="picker-input">
										<text class="picker-text">{{formData.interviewConfig?.firstInterview?.date || '请选择面试日期'}}</text>
										<text class="picker-arrow">></text>
									</view>
								</picker>
							</view>
							
							<view class="form-group">
								<text class="form-label">面试时间</text>
								<picker mode="time" :value="formData.interviewConfig?.firstInterview?.time || ''" @change="onFirstInterviewTimeChange">
									<view class="picker-input">
										<text class="picker-text">{{formData.interviewConfig?.firstInterview?.time || '请选择面试时间'}}</text>
										<text class="picker-arrow">></text>
									</view>
								</picker>
							</view>
							
							<view class="form-group">
								<text class="form-label">面试地点</text>
								<input class="input-field interview-location" v-model="firstInterviewLocation" placeholder="请输入面试地点" @input="onFirstInterviewLocationInput" />
							</view>
							
							<!-- 签到设置 -->
							<view class="form-group">
								<text class="form-label">签到功能</text>
								<view class="checkin-toggle">
									<switch :checked="formData.interviewConfig?.firstInterview?.checkInEnabled" @change="onFirstInterviewCheckInChange" />
									<text class="toggle-label">{{formData.interviewConfig?.firstInterview?.checkInEnabled ? '已开启' : '已关闭'}}</text>
								</view>
							</view>
							
							<view class="interview-actions">
								<button class="btn-secondary btn-small" @click="clearFirstInterview" :disabled="!formData.interviewConfig?.firstInterview?.isSet">
									撤销设置
								</button>
								<button class="btn-primary btn-small" @click="saveFirstInterview" :disabled="savingFirstInterview">
									{{savingFirstInterview ? '保存中...' : '保存一面'}}
								</button>
							</view>
						</view>
					</view>
					
					<!-- 二面设置 -->
					<view class="interview-group">
						<view class="interview-header" @click="toggleSecondInterview">
							<text class="interview-title">第二轮面试</text>
							<view class="collapse-icon" :class="{ 'collapsed': !secondInterviewExpanded }">
								<text class="collapse-arrow">{{ secondInterviewExpanded ? '▼' : '▶' }}</text>
							</view>
						</view>
						
						<view class="interview-content" :class="{ 'collapsed': !secondInterviewExpanded }">
							<view class="form-group">
								<text class="form-label">面试日期</text>
								<picker mode="date" :value="formData.interviewConfig?.secondInterview?.date || ''" @change="onSecondInterviewDateChange">
									<view class="picker-input">
										<text class="picker-text">{{formData.interviewConfig?.secondInterview?.date || '请选择面试日期'}}</text>
										<text class="picker-arrow">></text>
									</view>
								</picker>
							</view>
							
							<view class="form-group">
								<text class="form-label">面试时间</text>
								<picker mode="time" :value="formData.interviewConfig?.secondInterview?.time || ''" @change="onSecondInterviewTimeChange">
									<view class="picker-input">
										<text class="picker-text">{{formData.interviewConfig?.secondInterview?.time || '请选择面试时间'}}</text>
										<text class="picker-arrow">></text>
									</view>
								</picker>
							</view>
							
							<view class="form-group">
								<text class="form-label">面试地点</text>
								<input class="input-field interview-location" v-model="secondInterviewLocation" placeholder="请输入面试地点" @input="onSecondInterviewLocationInput" />
							</view>
							
							<!-- 签到设置 -->
							<view class="form-group">
								<text class="form-label">签到功能</text>
								<view class="checkin-toggle">
									<switch :checked="formData.interviewConfig?.secondInterview?.checkInEnabled" @change="onSecondInterviewCheckInChange" />
									<text class="toggle-label">{{formData.interviewConfig?.secondInterview?.checkInEnabled ? '已开启' : '已关闭'}}</text>
								</view>
							</view>
							
							<view class="interview-actions">
								<button class="btn-secondary btn-small" @click="clearSecondInterview" :disabled="!formData.interviewConfig?.secondInterview?.isSet">
									撤销设置
								</button>
								<button class="btn-primary btn-small" @click="saveSecondInterview" :disabled="savingSecondInterview">
									{{savingSecondInterview ? '保存中...' : '保存二面'}}
								</button>
							</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 部门信息管理 -->
			<view class="form-section department-section">
				<view class="section-header" @click="toggleDepartmentSection">
					<text class="section-title">🏢 部门信息管理</text>
					<text class="section-subtitle">修改各部门的介绍信息、职责和要求</text>
					<view class="collapse-icon" :class="{ 'collapsed': !departmentExpanded }">
						<text class="collapse-arrow">{{ departmentExpanded ? '▼' : '▶' }}</text>
					</view>
				</view>
				
				<view class="section-content" :class="{ 'collapsed': !departmentExpanded }">
					<!-- 部门列表 -->
					<view class="department-list">
						<view 
							v-for="(dept, deptKey) in formData.departmentDetails" 
							:key="deptKey"
							class="department-item"
							:style="{ borderLeftColor: dept.color }"
						>
							<view class="department-header" @click="toggleDepartmentEdit(deptKey)">
								<view class="department-info">
									<view class="department-name" :style="{ color: dept.color }">{{ dept.name }}</view>
									<view class="department-short">{{ dept.shortName }}</view>
								</view>
								<view class="department-status">
									<text class="status-badge" :class="{ 'editing': editingDepartments.includes(deptKey) }">
										{{ editingDepartments.includes(deptKey) ? '编辑中' : '点击编辑' }}
									</text>
									<view class="collapse-icon" :class="{ 'collapsed': !editingDepartments.includes(deptKey) }">
										<text class="collapse-arrow">{{ editingDepartments.includes(deptKey) ? '▼' : '▶' }}</text>
									</view>
								</view>
							</view>
							
							<view class="department-edit" :class="{ 'collapsed': !editingDepartments.includes(deptKey) }">
								<view class="edit-form">
									<view class="form-group">
										<text class="form-label">部门名称</text>
										<input 
											class="input-field" 
											v-model="dept.name" 
											placeholder="请输入部门名称" 
											maxlength="100"
											:maxlength="100"
										/>
									</view>
									
									<view class="form-group">
										<text class="form-label">部门简称</text>
										<input 
											class="input-field" 
											v-model="dept.shortName" 
											placeholder="请输入部门简称" 
											maxlength="50"
											:maxlength="50"
										/>
									</view>
									
									<view class="form-group">
										<text class="form-label">部门描述</text>
										<input 
											class="input-field" 
											v-model="dept.description" 
											placeholder="请输入部门描述（可为空）" 
											maxlength="200"
											:maxlength="200"
										/>
										<text class="form-hint">部门描述为可选字段，留空则不显示</text>
									</view>
									
									<view class="form-group">
										<text class="form-label">部门介绍</text>
										<textarea 
											class="textarea-field introduction-field" 
											v-model="dept.introduction" 
											placeholder="请输入部门详细介绍" 
											rows="8"
											maxlength="9999"
											:maxlength="9999"
											show-word-limit
											:show-word-limit="true"
										/>
										<text class="form-hint">字数限制：9999字（当前：{{dept.introduction ? dept.introduction.length : 0}}字）</text>
									</view>
									
									<view class="form-group">
										<text class="form-label">部门职责</text>
										<textarea 
											class="textarea-field duties-field" 
											v-model="dept.dutiesText" 
											placeholder="请输入部门职责，每行一个（可为空）" 
											rows="5"
											maxlength="9999"
											:maxlength="9999"
											show-word-limit
											:show-word-limit="true"
										/>
										<text class="form-hint">每行输入一个职责，留空则不显示</text>
										<text class="form-hint">字数限制：9999字（当前：{{dept.dutiesText ? dept.dutiesText.length : 0}}字）</text>
									</view>
									
									<view class="form-group">
										<text class="form-label">部门要求</text>
										<textarea 
											class="textarea-field requirements-field" 
											v-model="dept.requirementsText" 
											placeholder="请输入部门要求，每行一个（可为空）" 
											rows="5"
											maxlength="9999"
											:maxlength="9999"
											show-word-limit
											:show-word-limit="true"
										/>
										<text class="form-hint">每行输入一个要求，留空则不显示</text>
										<text class="form-hint">字数限制：9999字（当前：{{dept.requirementsText ? dept.requirementsText.length : 0}}字）</text>
									</view>
									
									<view class="department-actions">
										<button class="btn-secondary btn-small" @click="cancelDepartmentEdit(deptKey)">
											取消
										</button>
										<button class="btn-primary btn-small" @click="saveDepartmentEdit(deptKey)" :disabled="savingDepartment === deptKey">
											{{savingDepartment === deptKey ? '保存中...' : '保存'}}
										</button>
									</view>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 批量操作按钮 -->
					<view class="batch-actions" v-if="departmentExpanded">
						<button class="btn-secondary btn-batch" @click="expandAllDepartments" :disabled="editingDepartments.length === Object.keys(formData.departmentDetails).length">
							<text class="btn-text">展开所有部门</text>
						</button>
						<button class="btn-primary btn-batch" @click="saveAllDepartments" :disabled="savingAllDepartments">
							<text class="btn-text">{{savingAllDepartments ? '保存中...' : '保存所有信息'}}</text>
						</button>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import apiService from '../../utils/api.js'
	import { parseDate } from '../../utils/utils.js'
	
	export default {
		data() {
			return {
				saving: false,
				savingRecruitment: false,
				savingFirstInterview: false,
				savingSecondInterview: false,
				currentTime: '',
				// 折叠状态管理 - 默认为折叠状态
				recruitmentExpanded: false,
				interviewExpanded: false,
				firstInterviewExpanded: true, // 默认展开
				secondInterviewExpanded: true, // 默认展开
				departmentExpanded: false, // 部门信息管理卡片默认折叠
				editingDepartments: [], // 当前正在编辑的部门key数组，支持多个部门同时展开
				savingDepartment: null, // 当前正在保存的部门key
				savingAllDepartments: false, // 批量保存状态
				formData: {
					recruitmentTime: {
						startDate: '',
						endDate: '',
						endTime: '23:59'
					},
					interviewConfig: {
						firstInterview: {
							date: '',
							time: '',
							location: '',
							isSet: false,
							checkInEnabled: false
						},
						secondInterview: {
							date: '',
							time: '',
							location: '',
							isSet: false,
							checkInEnabled: false
						}
					},
					departmentDetails: {} // 部门详细信息，将从数据库加载
				}
			}
		},
		
		computed: {
			applicationStatus() {
				const now = new Date()
				const startTime = parseDate(this.formData.recruitmentTime.startDate)
				const endTime = parseDate(this.formData.recruitmentTime.endDate + ' ' + this.formData.recruitmentTime.endTime)
				
				if (now < startTime) {
					return {
						text: '未开始',
						class: 'status-pending'
					}
				} else if (now >= startTime && now <= endTime) {
					return {
						text: '进行中',
						class: 'status-active'
					}
				} else {
					return {
						text: '已结束',
						class: 'status-ended'
					}
				}
			},
			
			remainingTime() {
				const now = new Date()
				const endTime = parseDate(this.formData.recruitmentTime.endDate + ' ' + this.formData.recruitmentTime.endTime)
				
				if (now > endTime) {
					return '已结束'
				}
				
				const diff = endTime - now
				const days = Math.floor(diff / (1000 * 60 * 60 * 24))
				const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
				const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
				
				if (days > 0) {
					return `${days}天${hours}小时${minutes}分钟`
				} else if (hours > 0) {
					return `${hours}小时${minutes}分钟`
				} else {
					return `${minutes}分钟`
				}
			},
			
			firstInterviewLocation: {
				get() {
					return this.formData.interviewConfig?.firstInterview?.location || ''
				},
				set(value) {
									if (!this.formData.interviewConfig) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.firstInterview) {
					this.formData.interviewConfig.firstInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
					this.formData.interviewConfig.firstInterview.location = value
				}
			},
			
			secondInterviewLocation: {
				get() {
					return this.formData.interviewConfig?.secondInterview?.location || ''
				},
				set(value) {
									if (!this.formData.interviewConfig) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.secondInterview) {
					this.formData.interviewConfig.secondInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
					this.formData.interviewConfig.secondInterview.location = value
				}
			}
		},
		
		async onLoad() {
			// 检查登录状态
			if (!this.checkLoginStatus()) {
				return
			}
			
			// 只有在有有效token时才加载设置
			try {
				await this.loadSettings()
				this.startTimer()
			} catch (error) {
				console.error('加载设置失败:', error)
				// 如果加载失败，可能是token过期，清除token并跳转到登录页面
				uni.removeStorageSync('adminInfo')
				uni.showToast({
					title: '登录已过期，请重新登录',
					icon: 'none',
					duration: 2000
				})
				setTimeout(() => {
					uni.navigateTo({
						url: '/pages/admin/admin'
					})
				}, 1500)
			}
		},
		
		onUnload() {
			this.stopTimer()
		},
		
		methods: {
			// 检查登录状态
			checkLoginStatus() {
				const adminInfo = uni.getStorageSync('adminInfo')
				if (!adminInfo) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					uni.navigateBack()
					return false
				}
				return true
			},
			
			// 退出登录
			logout() {
				uni.showModal({
					title: '确认退出',
					content: '确定要退出管理员登录吗？',
					success: (res) => {
						if (res.confirm) {
							uni.removeStorageSync('adminInfo')
							uni.showToast({
								title: '已退出登录',
								icon: 'success'
							})
							uni.navigateBack()
						}
					}
				})
			},
			
			// 检查管理员权限
			checkAdminPermission() {
				const adminInfo = uni.getStorageSync('adminInfo')
				if (!adminInfo) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return false
				}
				return true
			},
			
			async loadSettings() {
				try {
					// 再次检查token是否存在
					const adminInfo = uni.getStorageSync('adminInfo')
					if (!adminInfo) {
						throw new Error('管理员未登录')
					}
					
					try {
						const result = await apiService.getSystemConfigAdmin()
						if (result.success && result.data) {
							const rawData = result.data
							
							// 详细检查每个部门的字段
							if (rawData.departmentDetails) {
								for (const deptKey in rawData.departmentDetails) {
									const dept = rawData.departmentDetails[deptKey]
								}
							}
							
							// 处理数据结构差异
							if (rawData.recruitmentTime) {
								// 如果数据已经是正确的格式，先保存当前的时间设置
								const currentEndTime = this.formData.recruitmentTime?.endTime
								console.log('加载设置时的调试信息:')
								console.log('当前endTime:', currentEndTime)
								console.log('数据库中的rawData.recruitmentTime:', rawData.recruitmentTime)
								console.log('数据库中的endTime:', rawData.recruitmentTime.endTime)
								
								this.formData = rawData
								
								// 如果当前有设置的时间且数据库中没有时间，保持当前设置
								if (currentEndTime && !this.formData.recruitmentTime.endTime) {
									console.log('保持当前设置的时间:', currentEndTime)
									this.formData.recruitmentTime.endTime = currentEndTime
								}
								
								// 确保面试配置存在
								if (!this.formData.interviewConfig) {
									this.formData.interviewConfig = {
										firstInterview: {
											date: '',
											time: '',
											location: '',
											isSet: false
										},
										secondInterview: {
											date: '',
											time: '',
											location: '',
											isSet: false
										}
									}
								}
								
								// 确保部门配置存在
								if (!this.formData.departmentDetails) {
									this.formData.departmentDetails = {}
								}
								
								// 如果部门信息为空，尝试从原始数据获取
								if (Object.keys(this.formData.departmentDetails).length === 0 && rawData.departmentDetails) {
									this.formData.departmentDetails = rawData.departmentDetails
								}
								
								// 初始化部门信息（如果仍然为空）
								if (Object.keys(this.formData.departmentDetails).length === 0) {
									this.initDepartmentDetails()
								} else {
									// 为每个部门添加文本格式的字段，方便编辑
									for (const deptKey in this.formData.departmentDetails) {
										const dept = this.formData.departmentDetails[deptKey]
										
										if (dept.duties && Array.isArray(dept.duties)) {
											dept.dutiesText = dept.duties.join('\n')
										} else {
											dept.dutiesText = ''
										}
										if (dept.requirements && Array.isArray(dept.requirements)) {
											dept.requirementsText = dept.requirements.join('\n')
										} else {
											dept.requirementsText = ''
										}
									}
								}
								
								// 处理结束时间，支持多种格式
								if (this.formData.recruitmentTime.endDate) {
									if (this.formData.recruitmentTime.endDate.includes(' ')) {
										// 如果包含空格，说明是 "日期 时间" 格式
										const parts = this.formData.recruitmentTime.endDate.split(' ')
										this.formData.recruitmentTime.endDate = parts[0]
										// 只有当endTime不存在时才设置，避免覆盖用户已设置的时间
										if (!this.formData.recruitmentTime.endTime) {
											this.formData.recruitmentTime.endTime = parts[1]
										}
									} else if (this.formData.recruitmentTime.endDate.includes('T')) {
										// 如果包含T，说明是ISO格式
										const date = new Date(this.formData.recruitmentTime.endDate)
										this.formData.recruitmentTime.endDate = date.toISOString().split('T')[0]
										// 只有当endTime不存在时才设置，避免覆盖用户已设置的时间
										if (!this.formData.recruitmentTime.endTime) {
											this.formData.recruitmentTime.endTime = date.toTimeString().substring(0, 5)
										}
									} else {
										// 如果只是日期，且endTime不存在，才设置默认时间
										if (!this.formData.recruitmentTime.endTime) {
											this.formData.recruitmentTime.endTime = '23:59'
										}
									}
								}
							} else if (rawData.applicationStartTime && rawData.applicationEndTime) {
								// 如果数据是旧格式，需要转换
								
								// 解析开始时间
								const startDate = new Date(rawData.applicationStartTime)
								const startDateStr = startDate.toISOString().split('T')[0]
								
								// 解析结束时间
								const endDate = new Date(rawData.applicationEndTime)
								const endDateStr = endDate.toISOString().split('T')[0]
								const endTimeStr = endDate.toTimeString().substring(0, 5)
								
								// 验证时间有效性
								if (isNaN(endDate.getTime())) {
									// 结束时间格式无效，使用默认值
									endDateStr = '2025-10-15'
									endTimeStr = '23:59'
								}
								
								this.formData = {
									recruitmentTime: {
										startDate: startDateStr,
										endDate: endDateStr,
										endTime: endTimeStr
									},
									// 保留面试配置和其他字段
									interviewConfig: rawData.interviewConfig || {
										firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
										secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
									},
									departmentDetails: rawData.departmentDetails || {}
								}
								
								// 如果部门信息为空，尝试从原始数据获取
								if (Object.keys(this.formData.departmentDetails).length === 0 && rawData.departmentDetails) {
									this.formData.departmentDetails = rawData.departmentDetails
									// 为每个部门添加文本格式的字段
									for (const deptKey in this.formData.departmentDetails) {
										const dept = this.formData.departmentDetails[deptKey]
										if (dept.duties && Array.isArray(dept.duties)) {
											dept.dutiesText = dept.duties.join('\n')
										} else {
											dept.dutiesText = ''
										}
										if (dept.requirements && Array.isArray(dept.requirements)) {
											dept.requirementsText = dept.requirements.join('\n')
										} else {
											dept.requirementsText = ''
										}
									}
								}
							} else {
								// 如果数据格式不正确，使用默认值
								this.formData = {
									recruitmentTime: {
										startDate: '2025-08-15',
										endDate: '2025-10-15',
										endTime: '23:59'
									},
									interviewConfig: {
										firstInterview: {
											date: '',
											time: '',
											location: '',
											isSet: false,
											checkInEnabled: false
										},
										secondInterview: {
											date: '',
											time: '',
											location: '',
											isSet: false,
											checkInEnabled: false
										}
									}
								}
								
								// 尝试从原始数据获取部门信息
								if (rawData.departmentDetails) {
									this.formData.departmentDetails = rawData.departmentDetails
									// 为每个部门添加文本格式的字段
									for (const deptKey in this.formData.departmentDetails) {
										const dept = this.formData.departmentDetails[deptKey]
										if (dept.duties && Array.isArray(dept.duties)) {
											dept.dutiesText = dept.duties.join('\n')
										} else {
											dept.dutiesText = ''
										}
										if (dept.requirements && Array.isArray(dept.requirements)) {
											dept.requirementsText = dept.requirements.join('\n')
										} else {
											dept.requirementsText = ''
										}
									}
								} else {
									// 初始化部门信息（如果仍然为空）
									this.initDepartmentDetails()
								}
							}
							
							// 同时更新本地存储作为备份
							try {
								uni.setStorageSync('systemConfig', this.formData)
							} catch (localError) {
								console.error('同步到本地存储失败:', localError)
							}
						} else {
							throw new Error(result.error || '获取配置失败')
						}
					} catch (apiError) {
						console.error('从云数据库加载配置失败:', apiError)
						
						// 尝试从本地存储读取配置
						try {
							const localConfig = uni.getStorageSync('systemConfig')
							if (localConfig && localConfig.recruitmentTime) {
								this.formData = localConfig
								uni.showToast({
									title: '使用本地配置',
									icon: 'none',
									duration: 2000
								})
							} else {
								throw new Error('本地也没有配置')
							}
						} catch (localError) {
							console.error('从本地存储加载配置也失败:', localError)
							// 使用默认配置
							this.formData = {
								recruitmentTime: {
									startDate: '2025-08-15',
									endDate: '2025-10-15',
									endTime: '23:59'
								},
								interviewConfig: {
									firstInterview: {
										date: '',
										time: '',
										location: '',
										isSet: false,
										checkInEnabled: false
									},
									secondInterview: {
										date: '',
										time: '',
										location: '',
										isSet: false,
										checkInEnabled: false
									}
								},
								departmentDetails: {}
							}
							
							// 初始化部门信息
							this.initDepartmentDetails()
							uni.showToast({
								title: '使用默认配置',
								icon: 'none',
								duration: 2000
							})
						}
					}
				} catch (error) {
					console.error('加载设置失败:', error)
					// 重新抛出错误，让上层处理
					throw error
				}
			},
			
			// 保存招新时间设置
			async saveRecruitmentTime() {
				try {
					this.savingRecruitment = true
					
					// 验证必填字段
					if (!this.formData.recruitmentTime.startDate) {
						throw new Error('请选择开始时间')
					}
					if (!this.formData.recruitmentTime.endDate) {
						throw new Error('请选择结束时间')
					}
					if (!this.formData.recruitmentTime.endTime) {
						throw new Error('请选择结束时间（具体时间）')
					}
					
					// 组合结束时间，确保格式一致
					const endDateTime = this.formData.recruitmentTime.endDate + ' ' + this.formData.recruitmentTime.endTime
					
					console.log('保存招新时间时的调试信息:')
					console.log('endDate:', this.formData.recruitmentTime.endDate)
					console.log('endTime:', this.formData.recruitmentTime.endTime)
					console.log('endDateTime:', endDateTime)
					
					// 只保存招新时间配置
					const configData = {
						recruitmentTime: {
							startDate: this.formData.recruitmentTime.startDate,
							endDate: endDateTime,
							endTime: this.formData.recruitmentTime.endTime
						}
					}
					
					console.log('发送到云函数的configData:', configData)
					
					// 保留现有的面试配置和其他字段
					const currentConfig = uni.getStorageSync('systemConfig') || {}
					if (currentConfig.interviewConfig) {
						configData.interviewConfig = currentConfig.interviewConfig
					}
					if (currentConfig.departmentDetails) {
						configData.departmentDetails = currentConfig.departmentDetails
					}
					
					try {
						const result = await apiService.updateSystemConfig(configData)
						if (result.success) {
							uni.showToast({
								title: '招新时间已保存',
								icon: 'success'
							})
							
							// 更新本地存储
							try {
								uni.setStorageSync('systemConfig', configData)
							} catch (localError) {
								console.error('同步到本地存储失败:', localError)
							}
						} else {
							throw new Error(result.error)
						}
					} catch (apiError) {
						console.error('保存招新时间到云数据库失败:', apiError)
						
						// 保存到本地存储作为备用
						try {
							uni.setStorageSync('systemConfig', configData)
							uni.showToast({
								title: '招新时间已保存到本地（云数据库连接失败）',
								icon: 'success'
							})
						} catch (localError) {
							console.error('保存到本地存储也失败:', localError)
							uni.showToast({
								title: '保存失败，请检查网络连接',
								icon: 'none'
							})
						}
					}
				} catch (error) {
					console.error('保存招新时间失败:', error)
					uni.showToast({
						title: error.message || '保存招新时间失败',
						icon: 'none'
					})
				} finally {
					this.savingRecruitment = false
				}
			},
			
			// 重置招新时间设置
			resetRecruitmentTime() {
				uni.showModal({
					title: '确认重置',
					content: '确定要重置招新时间设置吗？',
					success: (res) => {
						if (res.confirm) {
							// 重置为默认值
							this.formData.recruitmentTime = {
								startDate: '2025-08-15',
								endDate: '2025-10-15',
								endTime: '23:59'
							}
							uni.showToast({
								title: '招新时间已重置',
								icon: 'success'
							})
						}
					}
				})
			},
			
			// 保存第一轮面试设置
			async saveFirstInterview() {
				try {
					this.savingFirstInterview = true
					
					// 获取当前配置，确保包含最新的招新时间设置
					const currentConfig = uni.getStorageSync('systemConfig') || {}
					
					// 确保招新时间配置是最新的
					if (this.formData.recruitmentTime) {
						currentConfig.recruitmentTime = this.formData.recruitmentTime
					}
					
					// 确保面试配置存在
					if (!currentConfig.interviewConfig) {
						currentConfig.interviewConfig = {
							firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
							secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
						}
					}
					
					// 更新第一轮面试配置
					const configData = {
						...currentConfig,
						interviewConfig: {
							...currentConfig.interviewConfig,
							firstInterview: {
								date: this.formData.interviewConfig.firstInterview?.date || '',
								time: this.formData.interviewConfig.firstInterview?.time || '',
								location: this.formData.interviewConfig.firstInterview?.location || '',
								isSet: !!(this.formData.interviewConfig.firstInterview?.date && 
									this.formData.interviewConfig.firstInterview?.time && 
									this.formData.interviewConfig.firstInterview?.location),
								checkInEnabled: this.formData.interviewConfig.firstInterview?.checkInEnabled || false
							}
						}
					}
					
					// 确保第二轮面试配置存在
					if (!configData.interviewConfig.secondInterview) {
						configData.interviewConfig.secondInterview = {
							date: '',
							time: '',
							location: '',
							isSet: false,
							checkInEnabled: false
						}
					}
					
					// 确保部门配置存在
					if (!configData.departmentDetails) {
						configData.departmentDetails = {}
					}
					
					try {
						const result = await apiService.updateSystemConfig(configData)
						if (result.success) {
							uni.showToast({
								title: '第一轮面试设置已保存',
								icon: 'success'
							})
							
							// 更新本地存储和当前表单数据
							uni.setStorageSync('systemConfig', configData)
							this.formData.interviewConfig = configData.interviewConfig
							
							// 更新部门信息
							if (configData.departmentDetails) {
								this.formData.departmentDetails = {
									...this.formData.departmentDetails,
									...configData.departmentDetails
								}
							}
						} else {
							throw new Error(result.error)
						}
					} catch (apiError) {
						console.error('保存第一轮面试到云数据库失败:', apiError)
						
						// 保存到本地存储作为备用
						uni.setStorageSync('systemConfig', configData)
						this.formData.interviewConfig = configData.interviewConfig
						
						// 更新部门信息
						if (configData.departmentDetails) {
							this.formData.departmentDetails = {
								...this.formData.departmentDetails,
								...configData.departmentDetails
							}
						}
						uni.showToast({
							title: '第一轮面试设置已保存到本地（云数据库连接失败）',
							icon: 'success'
						})
					}
				} catch (error) {
					console.error('保存第一轮面试失败:', error)
					uni.showToast({
						title: error.message || '保存第一轮面试失败',
						icon: 'none'
					})
				} finally {
					this.savingFirstInterview = false
				}
			},
			
			// 保存第二轮面试设置
			async saveSecondInterview() {
				try {
					this.savingSecondInterview = true
					
					// 获取当前配置，确保包含最新的招新时间设置
					const currentConfig = uni.getStorageSync('systemConfig') || {}
					
					// 确保招新时间配置是最新的
					if (this.formData.recruitmentTime) {
						currentConfig.recruitmentTime = this.formData.recruitmentTime
					}
					
					// 确保面试配置存在
					if (!currentConfig.interviewConfig) {
						currentConfig.interviewConfig = {
							firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
							secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
						}
					}
					
					// 更新第二轮面试配置
					const configData = {
						...currentConfig,
						interviewConfig: {
							...currentConfig.interviewConfig,
							secondInterview: {
								date: this.formData.interviewConfig.secondInterview?.date || '',
								time: this.formData.interviewConfig.secondInterview?.time || '',
								location: this.formData.interviewConfig.secondInterview?.location || '',
								isSet: !!(this.formData.interviewConfig.secondInterview?.date && 
									this.formData.interviewConfig.secondInterview?.time && 
									this.formData.interviewConfig.secondInterview?.location),
								checkInEnabled: this.formData.interviewConfig.secondInterview?.checkInEnabled || false
							}
						}
					}
					
					// 确保第一轮面试配置存在
					if (!configData.interviewConfig.firstInterview) {
						configData.interviewConfig.firstInterview = {
							date: '',
							time: '',
							location: '',
							isSet: false,
							checkInEnabled: false
						}
					}
					
					// 确保部门配置存在
					if (!configData.departmentDetails) {
						configData.departmentDetails = {}
					}
					
					try {
						const result = await apiService.updateSystemConfig(configData)
						if (result.success) {
							uni.showToast({
								title: '第二轮面试设置已保存',
								icon: 'success'
							})
							
							// 更新本地存储和当前表单数据
							uni.setStorageSync('systemConfig', configData)
							this.formData.interviewConfig = configData.interviewConfig
							
							// 更新部门信息
							if (configData.departmentDetails) {
								this.formData.departmentDetails = {
									...this.formData.departmentDetails,
									...configData.departmentDetails
								}
							}
						} else {
							throw new Error(result.error)
						}
					} catch (apiError) {
						console.error('保存第二轮面试到云数据库失败:', apiError)
						
						// 保存到本地存储作为备用
						uni.setStorageSync('systemConfig', configData)
						this.formData.interviewConfig = configData.interviewConfig
						
						// 更新部门信息
						if (configData.departmentDetails) {
							this.formData.departmentDetails = {
								...this.formData.departmentDetails,
								...configData.departmentDetails
							}
						}
						uni.showToast({
							title: '第二轮面试设置已保存到本地（云数据库连接失败）',
							icon: 'success'
						})
					}
				} catch (error) {
					console.error('保存第二轮面试失败:', error)
					uni.showToast({
						title: error.message || '保存第二轮面试失败',
						icon: 'none'
					})
				} finally {
					this.savingSecondInterview = false
				}
			},
			
			// 时间选择器事件
			onStartDateChange(e) {
				this.formData.recruitmentTime.startDate = e.detail.value
			},
			
			onEndDateChange(e) {
				this.formData.recruitmentTime.endDate = e.detail.value
			},
			
			onEndTimeChange(e) {
				this.formData.recruitmentTime.endTime = e.detail.value
			},
			
			// 一面面试设置事件
			onFirstInterviewDateChange(e) {
				if (!this.formData.interviewConfig) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.firstInterview) {
					this.formData.interviewConfig.firstInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
				this.formData.interviewConfig.firstInterview.date = e.detail.value
				this.updateFirstInterviewStatus()
			},
			
			onFirstInterviewTimeChange(e) {
				if (!this.formData.interviewConfig) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.firstInterview) {
					this.formData.interviewConfig.firstInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
				this.formData.interviewConfig.firstInterview.time = e.detail.value
				this.updateFirstInterviewStatus()
			},
			
			// 二面面试设置事件
			onSecondInterviewDateChange(e) {
				if (!this.formData.interviewConfig) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.secondInterview) {
					this.formData.interviewConfig.secondInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
				this.formData.interviewConfig.secondInterview.date = e.detail.value
				this.updateSecondInterviewStatus()
			},
			
			onSecondInterviewTimeChange(e) {
				if (!this.formData.interviewConfig) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.secondInterview) {
					this.formData.interviewConfig.secondInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
				this.formData.interviewConfig.secondInterview.time = e.detail.value
				this.updateSecondInterviewStatus()
			},
			
			// 面试地点输入事件
			onFirstInterviewLocationInput(e) {
				this.firstInterviewLocation = e.detail.value
				this.updateFirstInterviewStatus()
			},
			
			onSecondInterviewLocationInput(e) {
				this.secondInterviewLocation = e.detail.value
				this.updateSecondInterviewStatus()
			},
			
			// 更新面试设置状态
			updateFirstInterviewStatus() {
				if (!this.formData.interviewConfig?.firstInterview) return
				const config = this.formData.interviewConfig.firstInterview
				config.isSet = !!(config.date && config.time && config.location)
			},
			
			// 签到功能开关事件
			onFirstInterviewCheckInChange(e) {
				if (!this.formData.interviewConfig?.firstInterview) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.firstInterview) {
					this.formData.interviewConfig.firstInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
				this.formData.interviewConfig.firstInterview.checkInEnabled = e.detail.value
			},
			
			onSecondInterviewCheckInChange(e) {
				if (!this.formData.interviewConfig?.secondInterview) {
					this.formData.interviewConfig = {
						firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
						secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
					}
				}
				if (!this.formData.interviewConfig.secondInterview) {
					this.formData.interviewConfig.secondInterview = { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
				}
				this.formData.interviewConfig.secondInterview.checkInEnabled = e.detail.value
			},
			
			updateSecondInterviewStatus() {
				if (!this.formData.interviewConfig?.secondInterview) return
				const config = this.formData.interviewConfig.secondInterview
				config.isSet = !!(config.date && config.time && config.location)
			},
			
			// 撤销面试设置
			async clearFirstInterview() {
				uni.showModal({
					title: '确认撤销',
					content: '确定要撤销第一轮面试设置吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								// 重置第一轮面试配置
								this.formData.interviewConfig.firstInterview = {
									date: '',
									time: '',
									location: '',
									isSet: false,
									checkInEnabled: false
								}
								
								// 获取当前配置，确保包含最新的招新时间设置
								const currentConfig = uni.getStorageSync('systemConfig') || {}
								
								// 确保招新时间配置是最新的
								if (this.formData.recruitmentTime) {
									currentConfig.recruitmentTime = this.formData.recruitmentTime
								}
								
								// 确保面试配置存在
								if (!currentConfig.interviewConfig) {
									currentConfig.interviewConfig = {
										firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
										secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
									}
								}
								
								// 更新配置
								const configData = {
									...currentConfig,
									interviewConfig: {
										...currentConfig.interviewConfig,
										firstInterview: {
											date: '',
											time: '',
											location: '',
											isSet: false,
											checkInEnabled: false
										}
									}
								}
								
								// 确保第二轮面试配置存在
								if (!configData.interviewConfig.secondInterview) {
									configData.interviewConfig.secondInterview = {
										date: '',
										time: '',
										location: '',
										isSet: false,
										checkInEnabled: false
									}
								}
								
								// 确保部门配置存在
								if (!configData.departmentDetails) {
									configData.departmentDetails = {}
								}
								
								try {
									const result = await apiService.updateSystemConfig(configData)
									if (result.success) {
										uni.showToast({
											title: '第一轮面试设置已撤销',
											icon: 'success'
										})
										
										// 更新本地存储
										uni.setStorageSync('systemConfig', configData)
									} else {
										throw new Error(result.error)
									}
								} catch (apiError) {
									console.error('撤销第一轮面试到云数据库失败:', apiError)
									
									// 保存到本地存储作为备用
									uni.setStorageSync('systemConfig', configData)
									uni.showToast({
										title: '第一轮面试设置已撤销到本地（云数据库连接失败）',
										icon: 'success'
									})
								}
							} catch (error) {
								console.error('撤销第一轮面试失败:', error)
								uni.showToast({
									title: error.message || '撤销第一轮面试失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			
			async clearSecondInterview() {
				uni.showModal({
					title: '确认撤销',
					content: '确定要撤销第二轮面试设置吗？',
					success: async (res) => {
						if (res.confirm) {
							try {
								// 重置第二轮面试配置
								this.formData.interviewConfig.secondInterview = {
									date: '',
									time: '',
									location: '',
									isSet: false,
									checkInEnabled: false
								}
								
								// 获取当前配置，确保包含最新的招新时间设置
								const currentConfig = uni.getStorageSync('systemConfig') || {}
								
								// 确保招新时间配置是最新的
								if (this.formData.recruitmentTime) {
									currentConfig.recruitmentTime = this.formData.recruitmentTime
								}
								
								// 确保面试配置存在
								if (!currentConfig.interviewConfig) {
									currentConfig.interviewConfig = {
										firstInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false },
										secondInterview: { date: '', time: '', location: '', isSet: false, checkInEnabled: false }
									}
								}
								
								// 更新配置
								const configData = {
									...currentConfig,
									interviewConfig: {
										...currentConfig.interviewConfig,
										secondInterview: {
											date: '',
											time: '',
											location: '',
											isSet: false,
											checkInEnabled: false
										}
									}
								}
								
								// 确保第一轮面试配置存在
								if (!configData.interviewConfig.firstInterview) {
									configData.interviewConfig.firstInterview = {
										date: '',
										time: '',
										location: '',
										isSet: false,
										checkInEnabled: false
									}
								}
								
								// 确保部门配置存在
								if (!configData.departmentDetails) {
									configData.departmentDetails = {}
								}
								
								try {
									const result = await apiService.updateSystemConfig(configData)
									if (result.success) {
										uni.showToast({
											title: '第二轮面试设置已撤销',
											icon: 'success'
										})
										
										// 更新本地存储
										uni.setStorageSync('systemConfig', configData)
									} else {
										throw new Error(result.error)
									}
								} catch (apiError) {
									console.error('撤销第二轮面试到云数据库失败:', apiError)
									
									// 保存到本地存储作为备用
									uni.setStorageSync('systemConfig', configData)
									uni.showToast({
										title: '第二轮面试设置已撤销到本地（云数据库连接失败）',
										icon: 'success'
									})
								}
							} catch (error) {
								console.error('撤销第二轮面试失败:', error)
								uni.showToast({
									title: error.message || '撤销第二轮面试失败',
									icon: 'none'
								})
							}
						}
					}
				})
			},
			
			
			// 定时器
			startTimer() {
				this.updateCurrentTime()
				this.timer = setInterval(() => {
					this.updateCurrentTime()
				}, 1000)
			},
			
			stopTimer() {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
			},
			
			updateCurrentTime() {
				const now = new Date()
				const year = now.getFullYear()
				const month = String(now.getMonth() + 1).padStart(2, '0')
				const day = String(now.getDate()).padStart(2, '0')
				const hours = String(now.getHours()).padStart(2, '0')
				const minutes = String(now.getMinutes()).padStart(2, '0')
				this.currentTime = `${year}年${month}月${day}日 ${hours}:${minutes}`
			},
			
			// 折叠控制方法
			toggleRecruitmentSection() {
				this.recruitmentExpanded = !this.recruitmentExpanded
				uni.showToast({
					title: `招新时间: ${this.recruitmentExpanded ? '展开' : '折叠'}`,
					icon: 'none',
					duration: 1000
				})
			},
			
			toggleInterviewSection() {
				this.interviewExpanded = !this.interviewExpanded
				uni.showToast({
					title: `面试设置: ${this.interviewExpanded ? '展开' : '折叠'}`,
					icon: 'none',
					duration: 1000
				})
			},
			
			toggleFirstInterview() {
				this.firstInterviewExpanded = !this.firstInterviewExpanded
				uni.showToast({
					title: `第一轮面试: ${this.firstInterviewExpanded ? '展开' : '折叠'}`,
					icon: 'none',
					duration: 1000
				})
			},
			
			toggleSecondInterview() {
				this.secondInterviewExpanded = !this.secondInterviewExpanded
				uni.showToast({
					title: `第二轮面试: ${this.secondInterviewExpanded ? '展开' : '折叠'}`,
					icon: 'none',
					duration: 1000
				})
			},

			// 部门信息管理折叠控制
			toggleDepartmentSection() {
				this.departmentExpanded = !this.departmentExpanded
				
				// 如果展开部门信息，确保数据已加载
				if (this.departmentExpanded && Object.keys(this.formData.departmentDetails).length === 0) {
					this.initDepartmentDetails()
				}
				
				uni.showToast({
					title: `部门信息: ${this.departmentExpanded ? '展开' : '折叠'}`,
					icon: 'none',
					duration: 1000
				})
			},
			
			// 初始化部门信息
			initDepartmentDetails() {
				// 如果没有部门信息，使用默认的部门信息
				if (Object.keys(this.formData.departmentDetails).length === 0) {
					this.formData.departmentDetails = {
						'策划部': {
							name: '策划部',
							shortName: '策划',
							color: '#FF6B6B',
							description: '协会的"大脑"',
							introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。',
							duties: [
								'活动方案设计与策划',
								'各部门协调与分工安排',
								'活动执行细节把控',
								'项目进度管理与风险控制'
							],
							requirements: [
								'思维缜密，逻辑清晰',
								'责任心强，执行力佳',
								'具备良好的沟通协调能力',
								'有创新思维和团队合作精神'
							]
						},
						'执行部': {
							name: '执行部',
							shortName: '执行',
							color: '#4ECDC4',
							description: '协会的"行动力"',
							introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。',
							duties: [
								'活动前期筹备与物资准备',
								'现场执行与协调管理',
								'主持与现场氛围营造',
								'突发情况应急处理'
							],
							requirements: [
								'责任心强，性格开朗',
								'具备良好的组织协调能力',
								'有较强的沟通交际能力',
								'能够承受一定的工作压力'
							]
						},
						'宣传部': {
							name: '宣传部',
							shortName: '宣传',
							color: '#45B7D1',
							description: '协会的"信息窗口"',
							introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能。',
							duties: [
								'新媒体内容创作与编辑',
								'视觉设计与图片处理',
								'摄影摄像与后期制作',
								'品牌形象设计与维护'
							],
							requirements: [
								'对新媒体运营充满热忱',
								'具备良好的文字表达能力',
								'有审美能力和创意思维',
								'熟悉设计软件或愿意学习'
							]
						}
					}
					
					// 为每个部门添加文本格式的字段
					for (const deptKey in this.formData.departmentDetails) {
						const dept = this.formData.departmentDetails[deptKey]
						dept.dutiesText = dept.duties ? dept.duties.join('\n') : ''
						dept.requirementsText = dept.requirements ? dept.requirements.join('\n') : ''
					}
				}
			},

			// 展开所有部门
			expandAllDepartments() {
				this.editingDepartments = []
				
				// 为每个部门添加编辑模式
				for (const deptKey in this.formData.departmentDetails) {
					this.editingDepartments.push(deptKey)
					
					// 确保部门数据存在
					if (!this.formData.departmentDetails[deptKey]) {
						this.formData.departmentDetails[deptKey] = {
							name: '',
							shortName: '',
							description: '',
							introduction: '',
							duties: [],
							requirements: [],
							color: '#007aff'
						}
					}
					
					// 转换数组为文本格式，方便编辑
					const dept = this.formData.departmentDetails[deptKey]
					if (dept.duties && Array.isArray(dept.duties)) {
						dept.dutiesText = dept.duties.join('\n')
					} else {
						dept.dutiesText = ''
					}
					if (dept.requirements && Array.isArray(dept.requirements)) {
						dept.requirementsText = dept.requirements.join('\n')
					} else {
						dept.requirementsText = ''
					}
				}
				
				uni.showToast({
					title: '所有部门已展开',
					icon: 'success',
					duration: 1500
				})
			},

			// 切换编辑模式
			toggleDepartmentEdit(deptKey) {
				const index = this.editingDepartments.indexOf(deptKey)
				
				if (index > -1) {
					// 如果部门已经在编辑中，则关闭编辑
					this.editingDepartments.splice(index, 1)
				} else {
					// 如果部门未在编辑中，则添加编辑
					this.editingDepartments.push(deptKey)
					
					// 确保部门数据存在
					if (!this.formData.departmentDetails[deptKey]) {
						this.formData.departmentDetails[deptKey] = {
							name: '',
							shortName: '',
							description: '',
							introduction: '',
							duties: [],
							requirements: [],
							color: '#007aff'
						}
					}
					// 转换数组为文本格式，方便编辑
					const dept = this.formData.departmentDetails[deptKey]
					
					if (dept.duties && Array.isArray(dept.duties)) {
						dept.dutiesText = dept.duties.join('\n')
					} else {
						dept.dutiesText = ''
					}
					if (dept.requirements && Array.isArray(dept.requirements)) {
						dept.requirementsText = dept.requirements.join('\n')
					} else {
						dept.requirementsText = ''
					}
				}
			},

			// 取消编辑
			cancelDepartmentEdit(deptKey) {
				// 从编辑数组中移除该部门
				const index = this.editingDepartments.indexOf(deptKey)
				if (index > -1) {
					this.editingDepartments.splice(index, 1)
				}
				// 恢复原始数据
				this.formData.departmentDetails[deptKey] = { ...this.formData.departmentDetails[deptKey] }
			},

			// 保存部门信息
			async saveDepartmentEdit(deptKey) {
				this.savingDepartment = deptKey
				try {
					const dept = this.formData.departmentDetails[deptKey]
					
					// 验证必填字段
					if (!dept.name || !dept.shortName || !dept.introduction) {
						throw new Error('部门名称、简称和介绍为必填项')
					}
					
					// 转换文本为数组格式
					const duties = dept.dutiesText ? dept.dutiesText.split('\n').filter(item => item.trim()) : []
					const requirements = dept.requirementsText ? dept.requirementsText.split('\n').filter(item => item.trim()) : []
					
					const configData = {
						departmentDetails: {
							[deptKey]: {
								name: dept.name,
								shortName: dept.shortName,
								description: dept.description || '',
								introduction: dept.introduction,
								duties: duties,
								requirements: requirements,
								color: dept.color || '#007aff'
							}
						}
					}

					// 保留现有的面试配置和其他字段
					const currentConfig = uni.getStorageSync('systemConfig') || {}
					if (currentConfig.interviewConfig) {
						configData.interviewConfig = currentConfig.interviewConfig
					}
					if (currentConfig.recruitmentTime) {
						configData.recruitmentTime = currentConfig.recruitmentTime
					}

					try {
						const result = await apiService.updateSystemConfig(configData)
						if (result.success) {
							uni.showToast({
								title: '部门信息已保存',
								icon: 'success'
							})
							
							// 更新本地存储
							try {
								uni.setStorageSync('systemConfig', configData)
								
								// 更新当前表单数据
								if (configData.departmentDetails && configData.departmentDetails[deptKey]) {
									this.formData.departmentDetails[deptKey] = {
										...this.formData.departmentDetails[deptKey],
										...configData.departmentDetails[deptKey]
									}
								}
								
								// 关闭编辑模式
								const index = this.editingDepartments.indexOf(deptKey)
								if (index > -1) {
									this.editingDepartments.splice(index, 1)
								}
							} catch (localError) {
								console.error('同步到本地存储失败:', localError)
							}
						} else {
							throw new Error(result.error)
						}
					} catch (apiError) {
						console.error('保存部门信息到云数据库失败:', apiError)
						
						// 保存到本地存储作为备用
						try {
							uni.setStorageSync('systemConfig', configData)
							
							// 更新当前表单数据
							if (configData.departmentDetails && configData.departmentDetails[deptKey]) {
								this.formData.departmentDetails[deptKey] = {
									...this.formData.departmentDetails[deptKey],
									...configData.departmentDetails[deptKey]
								}
							}
							
							// 关闭编辑模式
							const index = this.editingDepartments.indexOf(deptKey)
							if (index > -1) {
								this.editingDepartments.splice(index, 1)
							}
							
							uni.showToast({
								title: '部门信息已保存到本地（云数据库连接失败）',
								icon: 'success'
							})
						} catch (localError) {
							console.error('保存到本地存储也失败:', localError)
							uni.showToast({
								title: '保存失败，请检查网络连接',
								icon: 'none'
							})
						}
					}
				} catch (error) {
					console.error('保存部门信息失败:', error)
					uni.showToast({
						title: error.message || '保存部门信息失败',
						icon: 'none'
					})
				} finally {
					this.savingDepartment = null
				}
			},

			// 批量保存所有部门信息
			async saveAllDepartments() {
				this.savingAllDepartments = true
				try {
					const configData = {
						departmentDetails: {}
					}
					
					// 验证所有部门信息
					for (const deptKey in this.formData.departmentDetails) {
						const dept = this.formData.departmentDetails[deptKey]
						if (!dept.name || !dept.shortName || !dept.introduction) {
							throw new Error(`部门 ${dept.name || deptKey} 的必填信息不完整`)
						}
					}
					
					for (const deptKey in this.formData.departmentDetails) {
						const dept = this.formData.departmentDetails[deptKey]
						// 转换文本为数组格式
						const duties = dept.dutiesText ? dept.dutiesText.split('\n').filter(item => item.trim()) : []
						const requirements = dept.requirementsText ? dept.requirementsText.split('\n').filter(item => item.trim()) : []
						
						configData.departmentDetails[deptKey] = {
							name: dept.name,
							shortName: dept.shortName,
							description: dept.description || '',
							introduction: dept.introduction,
							duties: duties,
							requirements: requirements,
							color: dept.color || '#007aff'
						}
					}

					// 保留现有的面试配置和其他字段
					const currentConfig = uni.getStorageSync('systemConfig') || {}
					if (currentConfig.interviewConfig) {
						configData.interviewConfig = currentConfig.interviewConfig
					}
					if (currentConfig.recruitmentTime) {
						configData.recruitmentTime = currentConfig.recruitmentTime
					}

					try {
						const result = await apiService.updateSystemConfig(configData)
						if (result.success) {
							uni.showToast({
								title: '所有部门信息已保存',
								icon: 'success'
							})
							
							// 更新本地存储
							try {
								uni.setStorageSync('systemConfig', configData)
								
								// 更新当前表单数据
								this.formData.departmentDetails = configData.departmentDetails
								
								// 关闭所有编辑模式
								this.editingDepartments = []
							} catch (localError) {
								console.error('同步到本地存储失败:', localError)
							}
						} else {
							throw new Error(result.error)
						}
					} catch (apiError) {
						console.error('批量保存部门信息到云数据库失败:', apiError)
						
						// 保存到本地存储作为备用
						try {
							uni.setStorageSync('systemConfig', configData)
							
							// 更新当前表单数据
							this.formData.departmentDetails = configData.departmentDetails
							
							// 关闭所有编辑模式
							this.editingDepartments = []
							
							uni.showToast({
								title: '所有部门信息已保存到本地（云数据库连接失败）',
								icon: 'success'
							})
						} catch (localError) {
							console.error('保存到本地存储也失败:', localError)
							uni.showToast({
								title: '保存失败，请检查网络连接',
								icon: 'none'
							})
						}
					}
				} catch (error) {
					console.error('批量保存部门信息失败:', error)
					uni.showToast({
						title: error.message || '批量保存部门信息失败',
						icon: 'none'
					})
				} finally {
					this.savingAllDepartments = false
				}
			}
		}
	}
</script>

<style scoped>
	.container {
		padding: 20rpx;
		background-color: #f5f5f5;
		min-height: 100vh;
	}
	
	.page-header {
		text-align: center;
		margin-bottom: 40rpx;
	}
	
	.page-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
		margin-bottom: 10rpx;
	}
	
	.page-subtitle {
		font-size: 28rpx;
		color: #666;
	}
	
	.settings-form {
		margin-bottom: 40rpx;
	}
	
	.form-section {
		margin-bottom: 50rpx;
		padding: 30rpx;
		background-color: #fff;
		border-radius: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
	}
	
	.interview-section {
		margin-top: 30rpx;
	}

	.department-section {
		margin-top: 30rpx;
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		padding-bottom: 15rpx;
		border-bottom: 2rpx solid #f0f0f0;
		transition: all 0.3s ease;
	}
	
	.section-header:hover {
		background-color: rgba(0, 122, 255, 0.05);
		border-radius: 10rpx;
		padding: 10rpx 15rpx;
		margin: -10rpx -15rpx 5rpx -15rpx;
	}
	
	.section-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}
	
	.section-subtitle {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 25rpx;
		display: block;
		font-style: italic;
	}
	
	.collapse-icon {
		transition: transform 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background-color: rgba(0, 122, 255, 0.1);
	}
	
	.collapse-icon:hover {
		background-color: rgba(0, 122, 255, 0.2);
		transform: scale(1.1);
	}
	
	.collapse-arrow {
		font-size: 24rpx;
		color: #007aff;
		font-weight: bold;
		transition: transform 0.3s ease;
	}
	
	.collapse-icon.collapsed .collapse-arrow {
		transform: rotate(-90deg);
	}
	
	.section-content {
		overflow: hidden;
		transition: all 0.3s ease-out;
	}
	
	.section-content.collapsed {
		display: none;
	}
	
	.section-content:not(.collapsed) {
		display: block;
	}
	
	.form-group {
		margin-bottom: 20rpx;
	}
	
	.form-label {
		font-size: 28rpx;
		color: #333;
		margin-bottom: 12rpx;
		display: block;
		font-weight: 500;
	}
	
	.picker-input {
		background-color: #f8f9fa;
		border: 2rpx solid #e9ecef;
		border-radius: 10rpx;
		padding: 18rpx 20rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		min-height: 50rpx;
	}
	
	.picker-text {
		font-size: 28rpx;
		color: #333;
	}
	
	.picker-arrow {
		font-size: 24rpx;
		color: #999;
	}
	
	.status-section {
		margin-top: 30rpx;
		padding-top: 25rpx;
		border-top: 2rpx solid #f0f0f0;
	}
	
	.status-card {
		background-color: #f8f9fa;
		border-radius: 15rpx;
		padding: 25rpx;
		border: 1rpx solid #e9ecef;
	}
	
	.status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15rpx;
	}
	
	.status-item:last-child {
		margin-bottom: 0;
	}
	
	.status-label {
		font-size: 28rpx;
		color: #666;
	}
	
	.status-value {
		font-size: 28rpx;
		font-weight: bold;
	}
	
	.status-pending {
		color: #ffc107;
	}
	
	.status-active {
		color: #28a745;
	}
	
	.status-ended {
		color: #dc3545;
	}
	
	.action-buttons {
		display: flex;
		gap: 20rpx;
	}
	
	.btn-primary, .btn-secondary {
		flex: 1;
		height: 70rpx;
		border-radius: 10rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
	}
	
	.btn-primary {
		background-color: #007aff;
		color: #fff;
	}
	
	.btn-primary:disabled {
		background-color: #ccc;
	}
	
	.btn-secondary {
		background-color: #f8f9fa;
		color: #333;
		border: 2rpx solid #e9ecef;
	}
	
	.btn-text {
		font-size: 28rpx;
	}
	
	.interview-group {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 8rpx 25rpx rgba(102, 126, 234, 0.15);
		position: relative;
		overflow: hidden;
		transition: all 0.3s ease;
		transform: translateY(0);
	}
	
	.interview-group:hover {
		transform: translateY(-5rpx);
		box-shadow: 0 12rpx 35rpx rgba(102, 126, 234, 0.25);
	}
	
	/* 第二轮面试使用不同的颜色主题 */
	.interview-group:nth-child(2) {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		box-shadow: 0 8rpx 25rpx rgba(240, 147, 251, 0.15);
	}
	
	.interview-group:nth-child(2):hover {
		box-shadow: 0 12rpx 35rpx rgba(240, 147, 251, 0.25);
	}
	
	.interview-group::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
	}
	
	.interview-group:last-child {
		margin-bottom: 0;
	}
	
	.interview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		padding-bottom: 15rpx;
		border-bottom: 2rpx solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s ease;
	}
	
	.interview-header:hover {
		background-color: rgba(255, 255, 255, 0.1);
		border-radius: 10rpx;
		padding: 10rpx 15rpx;
		margin: -10rpx -15rpx 5rpx -15rpx;
	}
	
	.interview-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #fff;
		margin-bottom: 0;
		display: block;
		padding-bottom: 0;
		border-bottom: none;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}
	
	.interview-content {
		overflow: hidden;
		transition: all 0.3s ease-out;
		margin-top: 20rpx;
	}
	
	.interview-content.collapsed {
		display: none;
	}
	
	.interview-content:not(.collapsed) {
		display: block;
	}
	
	.interview-group .form-group {
		margin-bottom: 16rpx;
	}
	
	.interview-group .form-label {
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		margin-bottom: 8rpx;
		font-size: 26rpx;
	}
	
	.interview-group .picker-input {
		background-color: rgba(255, 255, 255, 0.95);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 12rpx;
		padding: 16rpx 20rpx;
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
		min-height: 48rpx;
	}
	
	.interview-group .picker-input:active {
		transform: scale(0.98);
		background-color: rgba(255, 255, 255, 1);
	}
	
	.interview-group .picker-text {
		color: #333;
		font-weight: 500;
	}
	
	.interview-group .picker-arrow {
		color: #667eea;
		font-weight: bold;
	}
	
	/* 第二轮面试的箭头颜色 */
	.interview-group:nth-child(2) .picker-arrow {
		color: #f093fb;
	}
	
	.input-field {
		background-color: rgba(255, 255, 255, 0.95);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		border-radius: 12rpx;
		padding: 18rpx 20rpx;
		font-size: 28rpx;
		color: #333;
		width: 100%;
		box-sizing: border-box;
		min-height: 52rpx;
		line-height: 1.5;
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
	}
	
	.input-field:focus {
		border-color: #fff;
		background-color: rgba(255, 255, 255, 1);
		box-shadow: 0 0 0 4rpx rgba(255, 255, 255, 0.2);
	}
	
	/* 面试地点输入框特殊样式 */
	.interview-location {
		width: 100%;
		min-width: 100%;
		min-height: 80rpx;
		height: 80rpx;
		resize: none;
		padding: 20rpx;
		line-height: 1.4;
		background-color: rgba(255, 255, 255, 0.98);
		border: 2rpx solid rgba(255, 255, 255, 0.4);
		border-radius: 12rpx;
		font-size: 28rpx;
		color: #333;
		box-sizing: border-box;
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
	}
	
	.interview-location:focus {
		border-color: #fff;
		background-color: rgba(255, 255, 255, 1);
		box-shadow: 0 0 0 4rpx rgba(255, 255, 255, 0.3);
	}
	
	.interview-actions {
		margin-top: 25rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 20rpx;
		border-top: 2rpx solid rgba(255, 255, 255, 0.2);
		gap: 20rpx;
	}
	
	.btn-small {
		height: 60rpx;
		font-size: 26rpx;
		padding: 0 25rpx;
		border-radius: 12rpx;
		flex: 1;
		min-width: 140rpx;
		font-weight: 600;
		transition: all 0.3s ease;
		position: relative;
		overflow: hidden;
	}
	
	.btn-small::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}
	
	.btn-small:active::before {
		left: 100%;
	}
	
	.interview-group .btn-secondary {
		background: rgba(255, 255, 255, 0.2);
		color: #fff;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		backdrop-filter: blur(10rpx);
	}
	
	.interview-group .btn-secondary:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.95);
	}
	
	.interview-group .btn-primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
	}
	
	/* 第二轮面试的保存按钮颜色 */
	.interview-group:nth-child(2) .btn-primary {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		box-shadow: 0 4rpx 15rpx rgba(240, 147, 251, 0.3);
	}
	
	.interview-group .btn-primary:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
	}
	
	/* 第二轮面试按钮的激活效果 */
	.interview-group:nth-child(2) .btn-primary:active {
		box-shadow: 0 2rpx 8rpx rgba(240, 147, 251, 0.4);
	}
	
	.interview-group .btn-primary:disabled {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.5);
		box-shadow: none;
	}
	
	.section-actions {
		display: flex;
		justify-content: space-between;
		margin-top: 30rpx;
		padding-top: 20rpx;
		border-top: 2rpx solid #f0f0f0;
	}
	
	.btn-section {
		flex: 1;
		margin: 0 10rpx;
		height: 60rpx;
		font-size: 26rpx;
	}
	
	.interview-group .collapse-icon {
		transition: transform 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40rpx;
		height: 40rpx;
		border-radius: 50%;
		background-color: rgba(255, 255, 255, 0.2);
	}
	
	.interview-group .collapse-icon:hover {
		background-color: rgba(255, 255, 255, 0.3);
		transform: scale(1.1);
	}
	
	.interview-group .collapse-arrow {
		font-size: 24rpx;
		color: #fff;
		font-weight: bold;
		transition: transform 0.3s ease;
	}
	
	.interview-group .collapse-icon.collapsed .collapse-arrow {
		transform: rotate(-90deg);
	}

	.department-list {
		margin-top: 24rpx;
	}

	.department-item {
		background-color: #f8f9fa;
		border-left: 8rpx solid;
		border-radius: 15rpx;
		padding: 40rpx;
		margin-bottom: 32rpx;
		box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.08);
		transition: all 0.3s ease;
	}

	.department-item:hover {
		transform: translateY(-5rpx);
		box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.12);
	}

	.department-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		cursor: pointer;
		padding-bottom: 20rpx;
		border-bottom: 2rpx solid #e9ecef;
		margin-bottom: 24rpx;
	}

	.department-header:hover {
		background-color: rgba(0, 122, 255, 0.05);
		border-radius: 10rpx;
		padding: 10rpx 15rpx;
		margin: -10rpx -15rpx 5rpx -15rpx;
	}

	.department-info {
		flex: 1;
		padding-right: 20rpx;
	}

	.department-name {
		font-size: 34rpx;
		font-weight: bold;
		color: #333;
		margin-bottom: 8rpx;
	}

	.department-short {
		font-size: 26rpx;
		color: #666;
		font-weight: 500;
	}

	.department-status {
		display: flex;
		align-items: center;
		gap: 12rpx;
	}

	.status-badge {
		font-size: 24rpx;
		font-weight: bold;
		padding: 10rpx 18rpx;
		border-radius: 20rpx;
		background-color: #e0e0e0;
		color: #333;
		transition: all 0.3s ease;
		min-width: 80rpx;
		text-align: center;
	}
	
	.status-badge.editing {
		background-color: #007aff;
		color: #fff;
		box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
	}

	.department-edit {
		overflow: hidden;
		transition: all 0.3s ease-out;
		margin-top: 28rpx;
		padding-top: 28rpx;
	}

	.department-edit.collapsed {
		display: none;
	}

	.department-edit:not(.collapsed) {
		display: block;
	}

	.edit-form .form-group {
		margin-bottom: 32rpx;
	}

	.edit-form .form-label {
		color: #333;
		font-weight: 500;
		margin-bottom: 12rpx;
		font-size: 28rpx;
	}

	.edit-form .input-field {
		background-color: #fff;
		border: 2rpx solid #e9ecef;
		border-radius: 12rpx;
		padding: 20rpx 24rpx;
		font-size: 30rpx;
		color: #333;
		width: 100%;
		box-sizing: border-box;
		min-height: 80rpx;
		line-height: 1.6;
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.edit-form .input-field:focus {
		border-color: #007aff;
		background-color: #f0f9eb;
		box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.2);
	}

	.edit-form .textarea-field {
		background-color: #fff;
		border: 2rpx solid #e9ecef;
		border-radius: 12rpx;
		padding: 20rpx 24rpx;
		font-size: 28rpx; /* 减小字体，确保更多内容可见 */
		color: #333;
		width: 100%;
		box-sizing: border-box;
		min-height: 200rpx; /* 大幅增加文本域高度，支持长文本 */
		line-height: 1.7; /* 增加行高，提高可读性 */
		backdrop-filter: blur(10rpx);
		transition: all 0.3s ease;
		resize: none; /* 禁用文本域的resize */
		word-wrap: break-word;
		overflow-wrap: break-word;
		white-space: pre-wrap; /* 保持换行和空格 */
		overflow-y: auto; /* 添加垂直滚动条 */
		word-break: break-all; /* 允许在任意字符间换行 */
	}
	
	/* 自定义滚动条样式 */
	.edit-form .textarea-field::-webkit-scrollbar {
		width: 8rpx;
	}
	
	.edit-form .textarea-field::-webkit-scrollbar-track {
		background: #f1f1f1;
		border-radius: 4rpx;
	}
	
	.edit-form .textarea-field::-webkit-scrollbar-thumb {
		background: #c1c1c1;
		border-radius: 4rpx;
	}
	
	.edit-form .textarea-field::-webkit-scrollbar-thumb:hover {
		background: #a8a8a8;
	}

	.edit-form .textarea-field:focus {
		border-color: #007aff;
		background-color: #f0f9eb;
		box-shadow: 0 0 0 4rpx rgba(0, 122, 255, 0.2);
	}
	
	/* 部门介绍字段特殊样式 */
	.edit-form .textarea-field.introduction-field {
		min-height: 300rpx; /* 进一步增加部门介绍字段高度，确保200+字完整显示 */
		height: auto; 
		font-size: 28rpx; /* 稍微减小字体，确保更多内容可见 */
		line-height: 1.8; /* 增加行高，提高可读性 */
		word-break: break-all; /* 允许在任意字符间换行 */
		white-space: pre-wrap; /* 保持换行和空格 */
		overflow-wrap: break-word; /* 长单词换行 */
	}
	
	/* 职责和要求字段样式 */
	.edit-form .textarea-field.duties-field,
	.edit-form .textarea-field.requirements-field {
		min-height: 180rpx; /* 增加职责和要求字段高度 */
		height: auto; 
		font-size: 28rpx; /* 保持字体一致 */
		line-height: 1.7; /* 保持行高一致 */
		word-break: break-all; /* 允许在任意字符间换行 */
		white-space: pre-wrap; /* 保持换行和空格 */
		overflow-wrap: break-word; /* 长单词换行 */
	}

	.edit-form .form-hint {
		font-size: 26rpx;
		color: #999;
		margin-top: 10rpx;
		font-style: italic;
		line-height: 1.4;
	}

	.department-actions {
		margin-top: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 24rpx;
		border-top: 2rpx solid #f0f0f0;
		gap: 20rpx;
	}

	.btn-batch {
		flex: 1;
		height: 70rpx;
		font-size: 28rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: #fff;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 4rpx 15rpx rgba(102, 126, 234, 0.3);
	}

	.btn-batch:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(102, 126, 234, 0.4);
	}

	.btn-batch:disabled {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.5);
		box-shadow: none;
	}
	
	.batch-actions {
		margin-top: 30rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 24rpx;
		border-top: 2rpx solid #f0f0f0;
		gap: 20rpx;
	}

	.batch-actions .btn-batch {
		flex: 1;
		height: 70rpx;
		font-size: 28rpx;
		border-radius: 12rpx;
		transition: all 0.3s ease;
	}

	.batch-actions .btn-secondary {
		background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
		color: #fff;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
		box-shadow: 0 4rpx 15rpx rgba(108, 117, 125, 0.3);
	}

	.batch-actions .btn-secondary:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(108, 117, 125, 0.4);
	}

	.batch-actions .btn-secondary:disabled {
		background: linear-gradient(135deg, #adb5bd 0%, #6c757d 100%);
		opacity: 0.6;
		cursor: not-allowed;
	}
</style>