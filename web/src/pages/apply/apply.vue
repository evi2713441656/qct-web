<template>
	<view class="container">
		<!-- 加载状态 -->
		<view v-if="loading" class="loading-container">
			<uni-load-more status="loading" :content-text="{
				contentdown: '加载中...',
				contentrefresh: '加载中...',
				contentnomore: '加载中...'
			}"></uni-load-more>
		</view>
		
		<!-- 未登录状态 -->
		<view v-else-if="!isLoggedIn" class="login-section">
			<view class="login-card">
				<image src="/static/logo.png" class="login-logo" mode="aspectFit"></image>
				<text class="login-title">请先登录微信</text>
				<text class="login-desc">登录后才能进行报名申请</text>
				<button class="btn-primary login-btn" @click="wxLogin">微信登录</button>
			</view>
		</view>
		
		<!-- 已登录状态 -->
		<view v-else class="apply-section">
			<!-- 修改报名信息表单 - 显示在报名状态卡片上方 -->
			<view v-if="isEditing && isApplicationOpen" class="form-section">
				<view class="form-card">
					<text class="form-title">修改报名信息</text>
					
					<!-- 基本信息 -->
					<view class="form-group">
						<text class="group-title">基本信息</text>
						
						<view class="input-group">
							<text class="input-label">昵称 *</text>
							<input class="input-field" v-model="formData.name" placeholder="请输入您的昵称" />
						</view>
						
						<view class="input-group">
							<text class="input-label">学号</text>
							<input class="input-field" v-model="formData.studentId" placeholder="请输入学号" />
						</view>
						
						<view class="input-group">
							<text class="input-label">性别</text>
							<view class="gender-options">
								<view 
									class="gender-option" 
									v-for="(gender, index) in genderOptions" 
									:key="index"
									:class="{selected: formData.gender === gender}"
									@click="selectGender(gender)"
								>
									<text class="gender-option-text">{{gender}}</text>
								</view>
							</view>
						</view>
						
						<view class="input-group">
							<text class="input-label">专业班级</text>
							<input class="input-field" v-model="formData.major" placeholder="例如：计算机科学与技术2025级1班" />
						</view>
						
						<view class="input-group">
							<text class="input-label">宿舍号</text>
							<input class="input-field" v-model="formData.dormitory" placeholder="例如：西四315" />
						</view>
						
						<view class="input-group">
							<text class="input-label">联系方式</text>
							<input class="input-field" v-model="formData.phone" placeholder="请输入您的联系方式" type="number" />
						</view>
					</view>
					
					<!-- 意向部门 -->
					<view class="form-group">
						<text class="group-title">意向部门（最多选择2个）</text>
						<view class="department-options">
							<view 
								class="dept-option" 
								v-for="(dept, index) in departments" 
								:key="index"
								:class="{selected: selectedDepartments.includes(dept.name)}"
								@click="toggleDepartment(dept.name)"
							>
								<view class="dept-option-icon" :style="{backgroundColor: dept.color}">
									<text class="dept-option-text">{{dept.shortName}}</text>
								</view>
								<text class="dept-option-name">{{dept.name}}</text>
							</view>
						</view>
						<view v-if="selectedDepartments.length > 0" class="selected-departments-info">
							<text class="selected-info-text">已选择：{{selectedDepartments.join('、')}}</text>
						</view>
					</view>
					
					<!-- 自我介绍 -->
					<view class="form-group">
						<text class="group-title">自我介绍 *</text>
						<textarea 
							class="textarea-field" 
							v-model="formData.introduction" 
							placeholder="请简单介绍一下自己，包括个人特长、兴趣爱好、为什么想加入我们等（200-500字）"
							maxlength="500"
						></textarea>
						<text class="char-count">{{formData.introduction.length}}/500</text>
					</view>
					
					<!-- 隐私保护声明 -->
					<view class="privacy-section">
						<view class="privacy-notice">
							<text class="privacy-title">🔒 隐私保护声明</text>
							<text class="privacy-content">
								我们承诺保护您的个人信息安全。您提供的信息仅用于：
								• 协会招新活动组织和管理
								• 面试安排和结果通知
								• 内部成员信息管理
								我们不会将您的信息用于其他商业用途或向第三方泄露。
							</text>
						</view>
						
						<view class="consent-section">
							<view class="consent-checkbox" @click="toggleConsent">
								<view class="checkbox" :class="{checked: hasConsented}">
									<text class="checkbox-icon">{{hasConsented ? '✓' : ''}}</text>
								</view>
								<text class="consent-text">我已阅读并同意《用户协议》和《隐私政策》</text>
							</view>
						</view>
					</view>
					
					<!-- 提交按钮 -->
					<view class="submit-section">
						<button class="btn-secondary cancel-btn" @click="cancelEdit" :disabled="submitting">取消</button>
						<button class="btn-primary submit-btn" @click="submitApplication" :disabled="submitting || !hasConsented">
							{{submitting ? '保存中...' : '保存修改'}}
						</button>
					</view>
				</view>
			</view>
			

			
			<!-- 报名表单 -->
			<view v-if="(isEditing && isApplicationOpen) || (applicationStatus && applicationStatus.status === 'first_passed')" class="card-spacing"></view>
			
			<!-- 报名状态 -->
			<view v-if="applicationStatus && applicationStatus.status && !isEditing" class="status-card">
				<view class="status-header">
					<text class="status-title">报名状态</text>
					<view class="status-badge" :class="getStatusClass(applicationStatus.status)">
						{{getStatusText(applicationStatus.status)}}
					</view>
				</view>
				<view class="status-info">
					<view class="info-row">
						<text class="info-label">姓名：</text>
						<text class="info-value">{{applicationStatus.name}}</text>
					</view>
					<view class="info-row">
						<text class="info-label">学号：</text>
						<text class="info-value">{{applicationStatus.student_id || applicationStatus.studentId}}</text>
					</view>
					<view class="info-row">
						<text class="info-label">手机：</text>
						<text class="info-value">{{applicationStatus.phone}}</text>
					</view>
					<view class="info-row">
						<text class="info-label">专业：</text>
						<text class="info-value">{{applicationStatus.major}}</text>
					</view>
					<view class="info-row">
						<text class="info-label">宿舍：</text>
						<text class="info-value">{{applicationStatus.dormitory}}</text>
					</view>
					<view class="info-row">
						<text class="info-label">报名时间：</text>
						<text class="info-value">{{formatDate(applicationStatus.createdAt || applicationStatus.applyTime)}}</text>
					</view>
					<view class="info-row">
						<text class="info-label">意向部门：</text>
						<text class="info-value">{{formatDepartments(applicationStatus)}}</text>
					</view>
					<!-- 一面通过部门 - 显示逻辑：有数据且状态是一面通过及之后 -->
					<view v-if="getFirstPassedDepartments(applicationStatus) && ['first_passed', 'waiting_second', 'second_failed', 'department_selection', 'accepted', 'rejected'].includes(applicationStatus.status)" class="info-row">
						<text class="info-label">一面通过部门：</text>
						<text class="info-value passed-departments">{{formatPassedDepartments(getFirstPassedDepartments(applicationStatus))}}</text>
					</view>
					<!-- 二面通过部门 - 显示逻辑：有数据且状态是部门选择、已录取或已拒绝 -->
					<view v-if="getSecondPassedDepartments(applicationStatus) && ['department_selection', 'accepted', 'rejected'].includes(applicationStatus.status)" class="info-row">
						<text class="info-label">二面通过部门：</text>
						<text class="info-value passed-departments">{{formatPassedDepartments(getSecondPassedDepartments(applicationStatus))}}</text>
					</view>
					<!-- 最终录取部门 -->
					<view v-if="getFinalDepartment(applicationStatus)" class="info-row">
						<text class="info-label">录取部门：</text>
						<text class="info-value final-department">{{getFinalDepartment(applicationStatus)}}</text>
					</view>
					
					<!-- 部门选择界面 - 整合到状态卡片中 -->
					<view v-if="applicationStatus.status === 'department_selection'" class="department-selection-section">
						<view class="selection-header">
							<text class="selection-title">🎉 恭喜您通过面试！</text>
							<text v-if="getAvailableDepartments().length > 1" class="selection-subtitle">请选择您希望加入的部门</text>
							<text v-else class="selection-subtitle">请确认是否接受以下部门的录取</text>
						</view>
						
						<!-- 多个部门时显示选择列表 -->
						<view v-if="getAvailableDepartments().length > 1" class="department-list">
							<view v-for="dept in getAvailableDepartments()" :key="dept" 
								  class="department-option" 
								  :class="{ 'selected': selectedDepartment === dept }"
								  @click="selectDepartment(dept)">
								<view class="dept-name">{{dept}}</view>
								<view class="dept-check">{{selectedDepartment === dept ? '✓' : ''}}</view>
							</view>
						</view>
						
						<!-- 单个部门时显示确认信息 -->
						<view v-else class="single-department-info">
							<view class="dept-card">
								<view class="dept-icon">🏢</view>
								<view class="dept-details">
									<text class="dept-name-large">{{getAvailableDepartments()[0]}}</text>
									<text class="dept-desc">您已通过该部门的面试，是否确认加入？</text>
								</view>
							</view>
						</view>
						
						<!-- 操作按钮 -->
						<view class="action-buttons">
							<view v-if="getAvailableDepartments().length > 1" class="multi-dept-buttons">
								<button class="btn-secondary reject-btn" 
										@click="rejectDepartment"
										:disabled="submittingSelection">
									{{submittingSelection ? '处理中...' : '拒绝录取'}}
								</button>
								<button class="btn-primary confirm-btn" 
										:class="{ 'disabled': !selectedDepartment }"
										@click="confirmDepartmentSelection"
										:disabled="submittingSelection || !selectedDepartment">
									{{submittingSelection ? '处理中...' : '确认选择'}}
								</button>
							</view>
							<view v-else class="single-dept-buttons">
								<button class="btn-secondary reject-btn" 
										@click="rejectDepartment"
										:disabled="submittingSelection">
									{{submittingSelection ? '处理中...' : '拒绝录取'}}
								</button>
								<button class="btn-primary confirm-btn" 
										@click="acceptSingleDepartment"
										:disabled="submittingSelection">
									{{submittingSelection ? '处理中...' : '确认加入'}}
								</button>
							</view>
						</view>
					</view>
					
					<!-- 一面通过选择界面 - 整合到状态卡片中 -->
					<view v-if="applicationStatus.status === 'first_passed'" class="first-passed-section">
						<view class="first-passed-header">
							<text class="first-passed-title">🎉 恭喜您通过第一轮面试！</text>
							<text class="first-passed-subtitle">请选择是否继续参加第二轮面试</text>
						</view>
						
						<view class="first-passed-options">
							<view class="option-card continue-option" @click="selectContinueSecond">
								<view class="option-icon">🚀</view>
								<view class="option-content">
									<text class="option-title">继续参加二面</text>
									<text class="option-desc">争取最终录取机会</text>
								</view>
								<view class="option-arrow">→</view>
							</view>
							
							<view class="option-card reject-option" @click="selectRejectSecond">
								<view class="option-icon">💔</view>
								<view class="option-content">
									<text class="option-title">狠心拒绝</text>
									<text class="option-desc">结束申请流程</text>
								</view>
								<view class="option-arrow">→</view>
							</view>
						</view>
						
					</view>
					
					<!-- 面试信息 -->
					<view v-if="interviewInfo" class="interview-info-section">
						<text class="interview-info-title">📅 面试安排</text>
						<view v-if="interviewInfo.firstInterview" class="interview-info-item">
							<text class="interview-info-label">第一轮面试：</text>
							<view class="interview-info-content">
								<text class="interview-info-time">{{interviewInfo.firstInterview.time}}</text>
								<text class="interview-info-location">{{interviewInfo.firstInterview.location}}</text>
							</view>
						</view>
						<view v-if="interviewInfo.secondInterview" class="interview-info-item">
							<text class="interview-info-label">第二轮面试：</text>
							<view class="interview-info-content">
								<text class="interview-info-time">{{interviewInfo.secondInterview.time}}</text>
								<text class="interview-info-location">{{interviewInfo.secondInterview.location}}</text>
							</view>
						</view>
						
						<!-- 签到状态提示 -->
						<view v-if="interviewInfo.firstInterview && !interviewInfo.firstInterview.checkInEnabled" class="checkin-status-hint">
							<text class="hint-text">📝 第一轮面试签到功能暂未开启</text>
						</view>
						
						<view v-if="interviewInfo.secondInterview && !interviewInfo.secondInterview.checkInEnabled" class="checkin-status-hint">
							<text class="hint-text">📝 第二轮面试签到功能暂未开启</text>
						</view>
						
						<!-- 签到卡片 - 只有当签到功能开启时才显示 -->
						<view v-if="interviewInfo.firstInterview && interviewInfo.firstInterview.checkInEnabled" class="checkin-section">
							<view class="checkin-header">
								<text class="checkin-title">📝 第一轮面试签到</text>
							</view>
							<view v-if="applicationStatus.firstInterview && applicationStatus.firstInterview.checkInNumber" class="checkin-status">
								<text class="checkin-success">✅ 已签到</text>
								<text class="checkin-number">签到序号：{{applicationStatus.firstInterview.checkInNumber}}</text>
								<text class="checkin-time">签到时间：{{formatDate(applicationStatus.firstInterview.checkInTime)}}</text>
							</view>
							<view v-else class="checkin-action">
								<button class="btn-primary checkin-btn" @click="handleCheckIn('first')" :disabled="checkingIn">
									{{checkingIn ? '签到中...' : '立即签到'}}
								</button>
								<text class="checkin-tip">请提前到达面试地点进行签到</text>
							</view>
						</view>
						
						<view v-if="interviewInfo.secondInterview && interviewInfo.secondInterview.checkInEnabled" class="checkin-section">
							<view class="checkin-header">
								<text class="checkin-title">📝 第二轮面试签到</text>
							</view>
							<view v-if="applicationStatus.secondInterview && applicationStatus.secondInterview.checkInNumber" class="checkin-status">
								<text class="checkin-success">✅ 已签到</text>
								<text class="checkin-number">签到序号：{{applicationStatus.secondInterview.checkInNumber}}</text>
								<text class="checkin-time">签到时间：{{formatDate(applicationStatus.secondInterview.checkInTime)}}</text>
							</view>
							<view v-else class="checkin-action">
								<button class="btn-primary checkin-btn" @click="handleCheckIn('second')" :disabled="checkingIn">
									{{checkingIn ? '签到中...' : '立即签到'}}
								</button>
								<text class="checkin-tip">请提前到达面试地点进行签到</text>
							</view>
						</view>
					</view>
					
					<!-- 操作按钮 -->
					<view v-if="applicationStatus && applicationStatus.status === 'waiting_first'" class="action-buttons">
						<button class="edit-btn" @click="startEdit" v-if="canEdit">修改申请</button>
						<button class="cancel-btn" @click="deleteApplication" v-if="canEdit">删除申请</button>
					</view>
				</view>
			</view>
			
			<!-- 报名时间状态提示 -->
			<view v-if="!applicationStatus && !isApplicationOpen" class="time-status-section">
				<view class="time-status-card">
					<!-- Logo区域 -->
					<view class="time-status-logo">
						<image src="/static/logo.png" mode="aspectFit" class="logo-image"></image>
					</view>
					
					<view v-if="!hasApplicationStarted" class="time-status-content not-started">
						<view class="time-status-icon">⏰</view>
						<text class="time-status-title">报名未开始</text>
						<text class="time-status-desc">招新报名还未开始，请耐心等待</text>
						<view v-if="startDate" class="time-status-time">
							开始时间：{{ formatChineseDateOnly(startDate) }} {{ formatChineseTimeOnly(startDate) }}
						</view>
					</view>
					<view v-else class="time-status-content ended">
						<view class="time-status-icon">❌</view>
						<text class="time-status-title">报名已截止</text>
						<text class="time-status-desc">很抱歉，招新报名已经截止</text>
						<view v-if="deadlineDate" class="time-status-time">
							截止时间：{{ formatChineseDateOnly(deadlineDate) }} {{ formatChineseTimeOnly(deadlineDate) }}
						</view>
					</view>
				</view>
			</view>
			
			<!-- 报名表单 - 仅用于新报名 -->
			<view v-if="!applicationStatus && isApplicationOpen" class="form-section">
				<view class="form-card">
					<text class="form-title">报名申请</text>
					
					<!-- 基本信息 -->
					<view class="form-group">
						<text class="group-title">基本信息</text>
						
						<view class="input-group">
							<text class="input-label">昵称 *</text>
							<input class="input-field" v-model="formData.name" placeholder="请输入您的昵称" />
						</view>
						
						<view class="input-group">
							<text class="input-label">性别</text>
							<view class="gender-options">
								<view 
									class="gender-option" 
									v-for="(gender, index) in genderOptions" 
									:key="index"
									:class="{selected: formData.gender === gender}"
									@click="selectGender(gender)"
								>
									<text class="gender-option-text">{{gender}}</text>
								</view>
							</view>
						</view>
					</view>
					
					<!-- 意向部门 -->
					<view class="form-group">
						<text class="group-title">意向部门（最多选择2个）</text>
						<view class="department-options">
							<view 
								class="dept-option" 
								v-for="(dept, index) in departments" 
								:key="index"
								:class="{selected: selectedDepartments.includes(dept.name)}"
								@click="toggleDepartment(dept.name)"
							>
								<view class="dept-option-icon" :style="{backgroundColor: dept.color}">
									<text class="dept-option-text">{{dept.shortName}}</text>
								</view>
								<text class="dept-option-name">{{dept.name}}</text>
							</view>
						</view>
						<view v-if="selectedDepartments.length > 0" class="selected-departments-info">
							<text class="selected-info-text">已选择：{{selectedDepartments.join('、')}}</text>
						</view>
					</view>
					
					<!-- 自我介绍 -->
					<view class="form-group">
						<text class="group-title">自我介绍 *</text>
						<textarea 
							class="textarea-field" 
							v-model="formData.introduction" 
							placeholder="请简单介绍一下自己，包括个人特长、兴趣爱好、为什么想加入我们等（200-500字）"
							maxlength="500"
						></textarea>
						<text class="char-count">{{formData.introduction.length}}/500</text>
					</view>
					
					<!-- 隐私保护声明 -->
					<view class="privacy-section">
						<view class="privacy-notice">
							<text class="privacy-title">🔒 隐私保护声明</text>
							<text class="privacy-content">
								我们承诺保护您的个人信息安全。您提供的信息仅用于：
								• 协会招新活动组织和管理
								• 面试安排和结果通知
								• 内部成员信息管理
								我们不会将您的信息用于其他商业用途或向第三方泄露。
							</text>
						</view>
						
						<view class="consent-section">
							<view class="consent-checkbox" @click="toggleConsent">
								<view class="checkbox" :class="{checked: hasConsented}">
									<text class="checkbox-icon">{{hasConsented ? '✓' : ''}}</text>
								</view>
								<text class="consent-text">我已阅读并同意《用户协议》和《隐私政策》</text>
							</view>
						</view>
					</view>
					
					<!-- 提交按钮 -->
					<view class="submit-section">
						<button class="btn-primary submit-btn" @click="submitApplication" :disabled="submitting || !hasConsented">
							{{submitting ? '提交中...' : '提交报名'}}
						</button>
					</view>
				</view>
			</view>
			

		</view>
	</view>
</template>

<script>
	import apiService from '../../utils/api.js'
	import { formatDateTime } from '../../utils/utils.js'
	import authManager from '../../utils/auth.js'
	import cloudApiService from '../../utils/cloud-api.js'

	
	export default {
		data() {
					return {
			isLoggedIn: false,
			userInfo: null,
			isEditing: false,
			applicationStatus: null,
			canEdit: true,
			loading: true,
			submitting: false,

			genderIndex: 0,
			genderOptions: ['男', '女'],
			selectedDepartments: [],
			departments: [],
			formData: {
				name: '',
				studentId: '',
				gender: '',
				major: '',
				dormitory: '',
				phone: '',
				introduction: ''
			},
			// 隐私同意状态
			hasConsented: false,
			// 部门选择相关
			selectedDepartment: '',
			submittingSelection: false,
			// 报名时间相关
			isApplicationOpen: false,
			hasApplicationStarted: false,
			startDate: null,
			deadlineDate: null,
			// 签到相关
			checkingIn: false,
			// 一面通过选择相关
			submittingFirstPassedChoice: false,
			// 系统配置 - 用于响应式更新
			systemConfig: null
		}
		},
		
		computed: {
			// 计算面试信息
			interviewInfo() {
				if (!this.applicationStatus) {
					console.log('interviewInfo: applicationStatus 为空')
					return null
				}
				
				const status = this.applicationStatus.status
				console.log('interviewInfo: 当前状态:', status)
				
				// 使用响应式的 systemConfig，如果没有则从 localStorage 获取
				const systemConfig = this.systemConfig || uni.getStorageSync('systemConfig')
				console.log('interviewInfo: systemConfig:', systemConfig)
				
				const interviewConfig = systemConfig?.interviewConfig
				console.log('interviewInfo: interviewConfig:', interviewConfig)
				
				if (!interviewConfig) {
					console.log('interviewInfo: interviewConfig 为空')
					return null
				}
				
				const info = {}
				
				// 如果状态是等待一面，显示一面信息（只要管理员设置了面试信息就显示，不管是否开启签到）
				if (status === 'waiting_first') {
					console.log('interviewInfo: 状态为等待一面，检查一面配置')
					const first = interviewConfig.firstInterview
					console.log('interviewInfo: 一面配置:', first)
					
					// 检查是否设置了完整的面试信息
					if (first && first.isSet && first.date && first.time && first.location) {
						console.log('interviewInfo: 一面信息完整，添加到显示列表')
						info.firstInterview = {
							time: `${first.date} ${first.time}`,
							location: first.location,
							checkInEnabled: first.checkInEnabled || false
						}
					} else {
						console.log('interviewInfo: 一面信息不完整:', {
							isSet: first?.isSet,
							date: first?.date,
							time: first?.time,
							location: first?.location
						})
					}
				}
				
				// 如果状态是一面通过，显示二面信息（让用户了解二面安排）
				if (status === 'first_passed') {
					console.log('interviewInfo: 状态为一面通过，检查二面配置')
					const second = interviewConfig.secondInterview
					console.log('interviewInfo: 二面配置:', second)
					
					// 检查是否设置了完整的面试信息
					if (second && second.isSet && second.date && second.time && second.location) {
						console.log('interviewInfo: 二面信息完整，添加到显示列表')
						info.secondInterview = {
							time: `${second.date} ${second.time}`,
							location: second.location,
							checkInEnabled: false // 一面通过状态下不开启签到
						}
					} else {
						console.log('interviewInfo: 二面信息不完整:', {
							isSet: second?.isSet,
							date: second?.date,
							time: second?.time,
							location: second?.location
						})
					}
				}
				
				// 如果状态是等待二面，显示二面信息（只要管理员设置了面试信息就显示，不管是否开启签到）
				if (status === 'waiting_second') {
					console.log('interviewInfo: 状态为等待二面，检查二面配置')
					const second = interviewConfig.secondInterview
					console.log('interviewInfo: 二面配置:', second)
					
					// 检查是否设置了完整的面试信息
					if (second && second.isSet && second.date && second.time && second.location) {
						console.log('interviewInfo: 二面信息完整，添加到显示列表')
						info.secondInterview = {
							time: `${second.date} ${second.time}`,
							location: second.location,
							checkInEnabled: second.checkInEnabled || false
						}
					} else {
						console.log('interviewInfo: 二面信息不完整:', {
							isSet: second?.isSet,
							date: second?.date,
							time: second?.time,
							location: second?.location
						})
					}
				}
				
				console.log('interviewInfo: 最终返回的信息:', info)
				return Object.keys(info).length > 0 ? info : null
			}
		},
		
		async onLoad() {
			// 添加登录状态监听器
			authManager.addListener(this.onAuthStateChanged)
			await this.initPage()
		},
		
		onShow() {
			// 页面显示时自动刷新所有数据
			this.autoRefresh()
		},
		
		onUnload() {
			// 移除登录状态监听器
			authManager.removeListener(this.onAuthStateChanged)
		},
		
		// 下拉刷新
		async onPullDownRefresh() {
			try {
				// 执行自动刷新
				await this.autoRefresh()
				
				// 强制重新计算时间状态
				this.recalculateTimeStatus()
			} catch (error) {
				// 刷新失败提示
				uni.showToast({
					title: '刷新失败',
					icon: 'none',
					duration: 1500
				})
			} finally {
				// 停止下拉刷新动画
				uni.stopPullDownRefresh()
			}
		},
		
		methods: {
			
			// 判断字段是否为空或未知
			isFieldEmpty(value) {
				if (!value) return true
				if (typeof value === 'string') {
					const trimmed = value.trim()
					// 检查是否为未知、空字符串或占位符
					return trimmed === '' || 
						   trimmed === '未知' || 
						   trimmed === '未填写' || 
						   trimmed === '未填' ||
						   trimmed === '无' ||
						   trimmed === '暂无' ||
						   trimmed === '待填写' ||
						   trimmed === '待填'
				}
				return false
			},
			
			// 切换隐私同意状态
			toggleConsent() {
				this.hasConsented = !this.hasConsented
			},
			
			// 自动刷新所有数据
			async autoRefresh() {
				try {
					// 刷新系统配置（包括报名时间状态）
					await this.loadSystemConfig()
					
					// 强制重新计算时间状态
					this.recalculateTimeStatus()
					
					// 刷新部门数据
					await this.loadDepartments()
					
					// 如果已登录，刷新申请状态
					if (this.isLoggedIn) {
						await this.checkApplicationStatus()
					}
					
					// 刷新编辑权限
					await this.checkEditPermission()
					
				} catch (error) {
					// 自动刷新失败，不影响用户体验
					console.error('自动刷新失败:', error)
				}
			},
			
			// 强制重新计算时间状态
			recalculateTimeStatus() {
				if (this.startDate && this.deadlineDate) {
					const now = new Date()
					
					// 重新判断报名状态
					this.hasApplicationStarted = now.getTime() >= this.startDate.getTime()
					this.isApplicationOpen = now.getTime() >= this.startDate.getTime() && now.getTime() < this.deadlineDate.getTime()
					
					console.log('重新计算时间状态:', {
						startDate: this.startDate.toISOString(),
						deadlineDate: this.deadlineDate.toISOString(),
						now: now.toISOString(),
						hasApplicationStarted: this.hasApplicationStarted,
						isApplicationOpen: this.isApplicationOpen
					})
				}
			},
			
			// 强制刷新配置
			async forceRefreshConfig() {
				try {
					console.log('开始强制刷新配置...')
					
					// 清除所有相关缓存
					uni.removeStorageSync('systemConfig')
					console.log('已清除本地缓存')
					
					// 强制重新加载系统配置
					console.log('开始加载系统配置...')
					await this.loadSystemConfig()
					
					// 强制重新计算时间状态
					console.log('开始重新计算时间状态...')
					this.recalculateTimeStatus()
					

					
					console.log('强制刷新配置完成')
					
				} catch (error) {
					console.error('强制刷新配置失败:', error)
					uni.showToast({
						title: '配置刷新失败',
						icon: 'none',
						duration: 2000
					})
				}
			},
			
			async initPage() {
				try {
					this.loading = true
					
					// 先从本地存储加载系统配置（如果有的话）
					const localConfig = uni.getStorageSync('systemConfig')
					if (localConfig) {
						this.systemConfig = localConfig
					}
					
					// 加载部门数据和系统配置
					await Promise.all([
						this.loadDepartments(),
						this.loadSystemConfig()
					])
					
					// 检查用户是否已经登录（静默检查，不自动登录）
					this.checkLoginStatus()
					
					// 如果已经登录，检查申请状态
					if (this.isLoggedIn) {
						await this.checkApplicationStatus()
					} else {
						// 即使未登录，也检查编辑权限（用于显示按钮）
						await this.checkEditPermission()
					}
				} catch (error) {
					// 初始化页面失败
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					})
				} finally {
					this.loading = false
				}
			},
			
			async loadSystemConfig() {
				try {
					console.log('loadSystemConfig: 开始加载系统配置...')
					
					// 清除本地缓存，强制获取最新配置
					uni.removeStorageSync('systemConfig')
					
					// 使用cloudApiService直接获取最新配置，绕过缓存
					const systemConfig = await cloudApiService.getSystemConfig()
					console.log('loadSystemConfig: 从云函数获取的配置:', systemConfig)
					
					// 保存到本地存储
					uni.setStorageSync('systemConfig', systemConfig)
					
					// 更新响应式数据，确保计算属性能够实时响应
					this.systemConfig = systemConfig
					
					// 设置报名时间状态
					this.setApplicationTime(systemConfig)
					
					console.log('loadSystemConfig: 成功加载最新系统配置:', systemConfig)
					console.log('loadSystemConfig: interviewConfig:', systemConfig.interviewConfig)
					
					// 系统配置加载成功
				} catch (error) {
					console.error('loadSystemConfig: 加载系统配置失败:', error)
					
					// 如果加载失败，尝试从本地存储获取
					const localConfig = uni.getStorageSync('systemConfig')
					if (localConfig) {
						console.log('loadSystemConfig: 使用本地存储的配置:', localConfig)
						console.log('loadSystemConfig: 本地配置中的interviewConfig:', localConfig.interviewConfig)
						this.systemConfig = localConfig
						this.setApplicationTime(localConfig)
					} else {
						console.log('loadSystemConfig: 使用默认配置')
						// 本地也没有系统配置，使用默认配置
						this.systemConfig = null
						this.setDefaultApplicationTime()
					}
				}
			},
			
			async loadDepartments() {
				try {
					const departments = await apiService.getDepartmentDetails()
					if (departments && typeof departments === 'object') {
						this.departments = Object.keys(departments).map(key => ({
							name: key,
							shortName: key.charAt(0),
							color: this.getDepartmentColor(key),
							...departments[key]
						}))
					} else {
						// 如果获取失败，使用默认部门数据（只包含introduction）
						this.departments = [
							{
								name: '策划部',
								shortName: '策划',
								color: '#FF6B6B',
								description: '协会的"大脑"',
								introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！'
							},
							{
								name: '执行部',
								shortName: '执行',
								color: '#4ECDC4',
								description: '协会的"行动力"',
								introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！'
							},
							{
								name: '宣传部',
								shortName: '宣传',
								color: '#45B7D1',
								description: '协会的"信息窗口"',
								introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！'
							}
						]
					}
				} catch (error) {
					// 加载部门数据失败
					// 使用默认部门数据（只包含introduction）
					this.departments = [
						{
							name: '策划部',
							shortName: '策划',
							color: '#FF6B6B',
							description: '协会的"大脑"',
							introduction: '作为协会的核心部门，策划部肩负着活动从构思到落地的全流程工作。在这里，你将主导活动方案设计，协调各部门分工，把控每个执行细节，用专业与创意打造精彩活动。加入策划组，你不仅能系统学习活动策划、应急处理等实用技能，更能收获将创意变为现实的成就感。我们寻找思维缜密、责任心强的小伙伴，也欢迎零基础但充满热情的你！别担心经验不足，我们将提供专业培训，只要你态度认真，这里就是展现才华的完美舞台。期待与你一起，用智慧点燃每一个创新火花！'
						},
						{
							name: '执行部',
							shortName: '执行',
							color: '#4ECDC4',
							description: '协会的"行动力"',
							introduction: '在这里，我们执行部诚挚邀请每一位怀揣热情的小伙伴加入！不论你是责任心强、性格开朗，还是渴望挑战自我、突破舒适区，执行部都将成为你成长的舞台。通过参与活动的全流程实践，从前期筹备到现场执行，你将全面提升组织协调与沟通交际能力。更棒的是，我们还为想要锻炼主持才能的同学提供展示机会！在这里，你将收获的不仅是能力的提升，更有真挚的伙伴情谊。勇敢迈出第一步，让执行部见证你的蜕变与成长！我们期待与你一起，在实干中收获精彩！'
						},
						{
							name: '宣传部',
							shortName: '宣传',
							color: '#45B7D1',
							description: '协会的"信息窗口"',
							introduction: '在这里，我们玩转文字与视觉的艺术，用推文排版构筑信息之美，以影像设计传递创新能量。作为协会的创意窗口，你将系统掌握新媒体运营全技能：从文案创作到视觉排版，从摄影技巧到图片处理，全方位提升数字媒体素养。我们寻找对新媒体充满热忱的探索者，无论你是初窥门径还是小有所成，这里都有属于你的创作舞台。加入我们，让每一份创意都被看见，每一次成长都被记录！用年轻的声音，讲述属于青创的精彩故事！'
						}
					]
				}
			},
			
			getDepartmentColor(deptName) {
				const colors = {
					'宣传部': '#45B7D1',
					'执行部': '#4ECDC4', 
					'策划部': '#FF6B6B'
				}
				return colors[deptName] || '#999'
			},
			
			// 设置报名时间状态
			setApplicationTime(systemConfig) {
				try {
					// 获取报名开始和结束时间
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
					
					// 判断是否已经开始报名（使用毫秒时间戳比较，避免精度问题）
					if (startTime) {
						this.hasApplicationStarted = now.getTime() >= startTime.getTime()
					} else {
						this.hasApplicationStarted = true
					}
					
					// 判断是否在报名时间内
					if (startTime) {
						this.isApplicationOpen = now.getTime() >= startTime.getTime() && now.getTime() < this.deadlineDate.getTime()
					} else {
						// 如果没有开始时间，只判断结束时间
						this.isApplicationOpen = now.getTime() < this.deadlineDate.getTime()
					}
					
					// 添加调试日志
					console.log('时间状态判断:', {
						startTime: startTime ? startTime.toISOString() : 'null',
						endTime: endTime ? endTime.toISOString() : 'null',
						now: now.toISOString(),
						hasApplicationStarted: this.hasApplicationStarted,
						isApplicationOpen: this.isApplicationOpen
					})
					
				} catch (error) {
					// 设置报名时间失败
					console.error('设置报名时间失败:', error)
					this.setDefaultApplicationTime()
				}
			},
			
			// 设置默认报名时间
			setDefaultApplicationTime() {
				this.startDate = new Date('2025-09-01T00:00:00') // 默认开始时间
				this.deadlineDate = new Date('2025-10-15T23:59:59')
				const now = new Date()
				
				// 判断报名状态（使用毫秒时间戳比较）
				this.hasApplicationStarted = now.getTime() >= this.startDate.getTime()
				this.isApplicationOpen = now.getTime() >= this.startDate.getTime() && now.getTime() < this.deadlineDate.getTime()
				
				// 添加调试日志
				console.log('默认时间状态判断:', {
					startDate: this.startDate.toISOString(),
					deadlineDate: this.deadlineDate.toISOString(),
					now: now.toISOString(),
					hasApplicationStarted: this.hasApplicationStarted,
					isApplicationOpen: this.isApplicationOpen
				})
			},
			
			// 登录状态变化回调
			onAuthStateChanged(authState) {
				console.log('登录状态变化:', authState)
				this.isLoggedIn = authState.isLoggedIn
				this.userInfo = authState.userInfo
				
				if (this.isLoggedIn && this.userInfo) {
					console.log('用户已登录，检查申请状态')
					this.checkApplicationStatus()
				} else {
					console.log('用户未登录，清空申请状态')
					this.applicationStatus = null
					this.isEditing = false
					this.canEdit = false
				}
			},
			
			checkLoginStatus() {
				// 使用全局登录状态管理
				const authState = authManager.getLoginStatus()
				this.isLoggedIn = authState.isLoggedIn
				this.userInfo = authState.userInfo
				
				// 如果未登录，确保清空相关状态
				if (!this.isLoggedIn || !this.userInfo) {
					this.applicationStatus = null
					this.isEditing = false
					this.canEdit = false
				}
			},
			
			async checkEditPermission() {
				try {
					// 首先检查申请状态，只有在等待一面状态时才允许编辑
					if (!this.applicationStatus || this.applicationStatus.status !== 'waiting_first') {
						this.canEdit = false
						return
					}
					
					// 如果状态是等待一面，再检查其他编辑条件
					this.canEdit = await apiService.canEditApplication()
				} catch (error) {
					// 检查编辑权限失败
					this.canEdit = false
				}
			},
			
			async wxLogin() {
				try {
					console.log('开始微信登录...')
					const result = await authManager.login()
					
					if (result.success) {
						console.log('微信登录成功:', result)
						// 登录成功，状态会自动更新
						uni.showToast({
							title: '登录成功',
							icon: 'success'
						})
					} else {
						console.log('微信登录失败:', result)
						// 登录失败
						uni.showToast({
							title: result.error || '登录失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('微信登录异常:', error)
					// 登录失败
					uni.showToast({
						title: error.message || '登录失败',
						icon: 'none'
					})
				}
			},
			

			
			clearLoginState() {
				// 使用全局登录状态管理
				authManager.logout()
				this.applicationStatus = null
				this.isEditing = false
			},
			
			async checkApplicationStatus() {
				if (!this.userInfo || !this.userInfo._id) {
					this.applicationStatus = null
					return
				}
				
				try {
					const result = await apiService.getApplication(this.userInfo._id)
					if (result.success && result.data) {
						this.applicationStatus = result.data
						this.loadFormData(this.applicationStatus)
						// 申请状态
						
						// 检查编辑权限
						await this.checkEditPermission()
					} else {
						this.applicationStatus = null
						// 检查编辑权限
						await this.checkEditPermission()
					}
				} catch (error) {
					console.error('检查申请状态失败:', error)
					// 检查申请状态失败
					this.applicationStatus = null
					// 检查编辑权限
					await this.checkEditPermission()
				}
			},
			
			// 加载表单数据
			loadFormData(application) {
				console.log('加载表单数据:', application)
				
				this.formData = {
					name: application.name || '',
					studentId: this.isFieldEmpty(application.student_id || application.studentId) ? '' : (application.student_id || application.studentId || ''),
					gender: this.isFieldEmpty(application.gender) ? '' : (application.gender || ''),
					major: this.isFieldEmpty(application.major) ? '' : (application.major || ''),
					dormitory: this.isFieldEmpty(application.dormitory) ? '' : (application.dormitory || ''),
					phone: application.phone || '',
					introduction: application.self_introduction || application.introduction || ''
				}
				
				// 设置性别索引和性别值
				if (this.formData.gender) {
					const genderIndex = this.genderOptions.indexOf(this.formData.gender)
					this.genderIndex = genderIndex >= 0 ? genderIndex : 0
				} else {
					this.genderIndex = 0
				}
				
				// 设置选择的部门 - 使用统一的解析函数
				this.selectedDepartments = this.parseDepartments(application)
				console.log('解析后的部门数据:', this.selectedDepartments)
			},
			
			// 解析部门信息
			parseDepartments(application) {
				console.log('开始解析部门数据:', application)
				
				let departments = []
				
				// 如果已经有 departments 字段且是数组
				if (application.departments && Array.isArray(application.departments)) {
					departments = application.departments.filter(dept => dept && dept.trim())
				}
				// 如果 departments 是字符串
				else if (application.departments && typeof application.departments === 'string') {
					const str = application.departments
					if (str.includes('、')) {
						departments = str.split('、').map(dept => dept.trim()).filter(dept => dept)
					} else if (str.includes('，')) {
						departments = str.split('，').map(dept => dept.trim()).filter(dept => dept)
					} else if (str.includes(',')) {
						departments = str.split(',').map(dept => dept.trim()).filter(dept => dept)
					} else {
						departments = [str.trim()].filter(dept => dept)
					}
				}
				// 从数据库字段构建部门数组
				else {
					if (application.first_choice) {
						departments.push(application.first_choice)
					}
					if (application.second_choice) {
						departments.push(application.second_choice)
					}
				}
				
				// 过滤掉无效的部门名称
				const validDepartments = ['策划部', '执行部', '宣传部']
				departments = departments.filter(dept => validDepartments.includes(dept))
				
				console.log('解析结果:', departments)
				return departments
			},
			
			// 性别选择
			selectGender(gender) {
				this.formData.gender = gender
				// 更新性别索引
				this.genderIndex = this.genderOptions.indexOf(gender)
			},
			
			// 切换部门选择
			toggleDepartment(deptName) {
				const index = this.selectedDepartments.indexOf(deptName)
				if (index > -1) {
					// 如果已选择，则取消选择
					this.selectedDepartments.splice(index, 1)
				} else {
					// 如果未选择，检查是否已达到最大选择数量
					if (this.selectedDepartments.length >= 2) {
						uni.showToast({
							title: '最多只能选择2个部门',
							icon: 'none'
						})
						return
					}
					// 检查是否已经选择了相同的部门（防止重复）
					if (!this.selectedDepartments.includes(deptName)) {
						this.selectedDepartments.push(deptName)
					}
				}
			},
			
			// 开始编辑
			startEdit() {
				// 检查报名时间状态
				if (!this.isApplicationOpen) {
					if (!this.hasApplicationStarted) {
						const startStr = this.startDate ? 
							this.formatChineseDateTime(this.startDate) : '2025年09月01日 00:00'
						uni.showModal({
							title: '报名未开始',
							content: `招新报名还未开始！\n\n开始时间：${startStr}\n\n请耐心等待，我们会在报名开始时通知大家。`,
							showCancel: false,
							confirmText: '我知道了',
							confirmColor: '#667eea'
						})
					} else {
						const deadlineStr = this.deadlineDate ? 
							this.formatChineseDateTime(this.deadlineDate) : '2025年09月14日 23:59'
						uni.showModal({
							title: '报名已截止',
							content: `很抱歉，招新报名已经截止了！\n\n截止时间：${deadlineStr}\n\n如果您对青创感兴趣，欢迎关注我们后续的活动信息。`,
							showCancel: false,
							confirmText: '我知道了',
							confirmColor: '#667eea'
						})
					}
					return
				}
				
				// 确认是否要修改信息
				uni.showModal({
					title: '修改报名信息',
					content: '确定要修改报名信息吗？修改后需要重新提交审核。',
					success: (res) => {
						if (res.confirm) {
							this.isEditing = true
							// 加载当前申请数据到表单
							this.loadFormData(this.applicationStatus)
						}
					}
				})
			},
			
			// 取消编辑
			cancelEdit() {
				// 确认是否要取消编辑
				uni.showModal({
					title: '取消编辑',
					content: '确定要取消编辑吗？未保存的修改将丢失。',
					success: (res) => {
						if (res.confirm) {
							this.isEditing = false
							this.loadFormData(this.applicationStatus)
						}
					}
				})
			},
			
			// 撤销报名
			async cancelApplication() {
				try {
					const result = await new Promise((resolve) => {
						uni.showModal({
							title: '确认撤销',
							content: '确定要撤销报名申请吗？撤销后将无法恢复。',
							confirmText: '确定撤销',
							cancelText: '取消',
							success: (res) => {
								resolve(res.confirm)
							}
						})
					})
					
					if (result) {
						uni.showLoading({ title: '撤销中...' })
						
						try {
							const deleteResult = await apiService.deleteApplication(this.applicationStatus._id)
							if (deleteResult.success) {
								uni.showToast({
									title: '撤销成功',
									icon: 'success'
								})
								this.applicationStatus = null
								this.isEditing = false
								// 清空表单数据
								this.formData = {
									name: '',
									studentId: '',
									gender: '',
									major: '',
									dormitory: '',
									phone: '',
									introduction: ''
								}
								this.selectedDepartments = []
								this.genderIndex = 0
								
								// 延迟显示提示信息
								setTimeout(() => {
									uni.showModal({
										title: '撤销成功',
										content: '您的报名申请已成功撤销。如需重新报名，请重新填写申请信息。',
										showCancel: false,
										confirmText: '知道了'
									})
								}, 500)
							} else {
								uni.showToast({
									title: deleteResult.message || '撤销失败',
									icon: 'none'
								})
							}
						} catch (error) {
							// 撤销报名失败
							uni.showToast({
								title: '撤销失败，请重试',
								icon: 'none'
							})
						} finally {
							uni.hideLoading()
						}
					}
				} catch (error) {
					// 撤销报名失败
					uni.showToast({
						title: '撤销失败',
						icon: 'none'
					})
				}
			},
			
			// 获取可选择的部门列表
			getAvailableDepartments() {
				if (!this.applicationStatus) return []
				
				// 在部门选择状态下，应该使用二面通过的部门
				if (this.applicationStatus.status === 'department_selection') {
					const passedDepts = this.getSecondPassedDepartments(this.applicationStatus)
					return passedDepts || []
				}
				
				// 其他状态使用一面通过的部门
				const passedDepts = this.getFirstPassedDepartments(this.applicationStatus)
				return passedDepts || []
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
							applicationId: this.applicationStatus._id,
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
						await this.checkApplicationStatus()
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
							applicationId: this.applicationStatus._id,
							department: availableDepts[0],
							userId: this.userInfo._id
						}
					})
					
					if (result.result.success) {
						uni.showToast({
							title: '确认成功！',
							icon: 'success'
						})
						
						// 刷新申请数据
						await this.checkApplicationStatus()
					} else {
						uni.showToast({
							title: result.result.error || '确认失败',
							icon: 'none'
						})
					}
				} catch (error) {
					// 确认加入部门失败
					uni.showToast({
						title: '确认失败，请重试',
						icon: 'none'
					})
				} finally {
					this.submittingSelection = false
				}
			},
			
			// 拒绝录取
			async rejectDepartment() {
				try {
					const result = await new Promise((resolve) => {
						uni.showModal({
							title: '确认拒绝',
							content: '确定要拒绝录取吗？拒绝后将无法恢复。',
							confirmText: '确定拒绝',
							cancelText: '取消',
							success: (res) => {
								resolve(res.confirm)
							}
						})
					})
					
					if (result) {
						this.submittingSelection = true
						
						try {
							const rejectResult = await uniCloud.callFunction({
								name: 'application',
								data: {
									type: 'reject_department',
									applicationId: this.applicationStatus._id,
									userId: this.userInfo._id
								}
							})
							
							if (rejectResult.result.success) {
								uni.showToast({
									title: '已拒绝录取',
									icon: 'success'
								})
								
								// 刷新申请数据
								await this.checkApplicationStatus()
							} else {
								uni.showToast({
									title: rejectResult.result.error || '操作失败',
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
					}
				} catch (error) {
					// 拒绝录取失败
					uni.showToast({
						title: '操作失败',
						icon: 'none'
					})
				}
			},
			
			async submitApplication() {
				// 防止重复提交
				if (this.submitting) {
					return
				}
				
				// 检查用户登录状态
				if (!this.userInfo || !this.userInfo._id) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				// 检查报名时间状态
				if (!this.isApplicationOpen) {
					if (!this.hasApplicationStarted) {
						const startStr = this.startDate ? 
							this.formatChineseDateTime(this.startDate) : '2025年09月01日 00:00'
						uni.showModal({
							title: '报名未开始',
							content: `招新报名还未开始！\n\n开始时间：${startStr}\n\n请耐心等待，我们会在报名开始时通知大家。`,
							showCancel: false,
							confirmText: '我知道了',
							confirmColor: '#667eea'
						})
					} else {
						const deadlineStr = this.deadlineDate ? 
							this.formatChineseDateTime(this.deadlineDate) : '2025年09月14日 23:59'
						uni.showModal({
							title: '报名已截止',
							content: `很抱歉，招新报名已经截止了！\n\n截止时间：${deadlineStr}\n\n如果您对青创感兴趣，欢迎关注我们后续的活动信息。`,
							showCancel: false,
							confirmText: '我知道了',
							confirmColor: '#667eea'
						})
					}
					return
				}
				
				// 表单验证
				if (!this.validateForm()) {
					return
				}
				
				this.submitting = true
				let loadingShown = false
				
				try {
					uni.showLoading({ 
						title: this.isEditing ? '更新中...' : '提交中...' 
					})
					loadingShown = true
					
					// 构建申请数据，确保字段名正确
					const applicationData = {
						name: this.formData.name,
						studentId: this.formData.studentId,
						phone: this.formData.phone,
						major: this.formData.major,
						gender: this.formData.gender,
						dormitory: this.formData.dormitory,
						introduction: this.formData.introduction,
						departments: this.selectedDepartments,
						userId: this.userInfo._id
					}
					
					// 如果是编辑模式且有申请ID，则添加申请ID
					if (this.isEditing && this.applicationStatus && this.applicationStatus._id) {
						applicationData._id = this.applicationStatus._id
					}
					
					let result
					if (this.isEditing) {
						result = await apiService.updateApplication(applicationData)
					} else {
						result = await apiService.submitApplication(applicationData)
					}
					
					if (result.success) {
						const wasEditing = this.isEditing
						uni.showToast({
							title: wasEditing ? '更新成功' : '提交成功',
							icon: 'success'
						})
						this.applicationStatus = result.data
						this.isEditing = false
						
						// 更新用户信息中的hasApplied字段
						const updatedUserInfo = {
							...this.userInfo,
							hasApplied: true
						}
						this.userInfo = updatedUserInfo
						uni.setStorageSync('userInfo', updatedUserInfo)
						
						// 刷新申请状态
						await this.checkApplicationStatus()
						
						// 延迟刷新页面，确保用户看到成功提示
						setTimeout(() => {
							// 重新加载页面数据
							this.autoRefresh()
						}, 1000)
					} else {
						uni.showToast({
							title: result.message || (this.isEditing ? '更新失败' : '提交失败'),
							icon: 'none'
						})
					}
				} catch (error) {
					// 提交申请失败
					uni.showToast({
						title: this.isEditing ? '更新失败，请重试' : '提交失败，请重试',
						icon: 'none'
					})
				} finally {
					if (loadingShown) {
						uni.hideLoading()
					}
					this.submitting = false
				}
			},
			
			validateForm() {
				// 验证必填字段：昵称
				if (!this.formData.name.trim()) {
					uni.showToast({ title: '请输入昵称', icon: 'none' })
					return false
				}
				
				// 验证必填字段：部门选择
				if (this.selectedDepartments.length === 0) {
					uni.showToast({ title: '请至少选择一个部门', icon: 'none' })
					return false
				}
				
				// 验证必填字段：自我介绍
				if (!this.formData.introduction.trim()) {
					uni.showToast({ title: '请填写自我介绍', icon: 'none' })
					return false
				}
				
				// 验证隐私同意
				if (!this.hasConsented) {
					uni.showToast({ title: '请先同意用户协议和隐私政策', icon: 'none' })
					return false
				}
				
				// 验证选填字段：只有填写了联系方式才验证格式，没有填写则跳过
				if (this.formData.phone.trim() && !/^1[3-9]\d{9}$/.test(this.formData.phone)) {
					uni.showToast({ title: '请输入正确的联系方式', icon: 'none' })
					return false
				}
				
				return true
			},
			

			
			toggleDepartment(deptName) {
				const index = this.selectedDepartments.indexOf(deptName)
				if (index > -1) {
					this.selectedDepartments.splice(index, 1)
				} else {
					if (this.selectedDepartments.length < 2) {
						this.selectedDepartments.push(deptName)
					} else {
						uni.showToast({
							title: '最多只能选择2个部门',
							icon: 'none'
						})
					}
				}
			},
			
			startEdit() {
				this.isEditing = true
			},
			
			cancelEdit() {
				this.isEditing = false
			},
			
			getStatusText(status) {
				const statusMap = {
					waiting_first: '等待一面',
					first_passed: '一面通过',
					first_failed: '一面未通过',
					first_reject: '一面拒绝',
					waiting_second: '等待二面',
					second_failed: '二面未通过',
					department_selection: '选择部门',
					accepted: '已录取',
					rejected: '已拒绝'
				}
				return statusMap[status] || '未知状态'
			},
			
			// 获取状态样式类
			getStatusClass(status) {
				const classMap = {
					waiting_first: 'status-waiting',
					first_passed: 'status-passed',
					first_failed: 'status-failed',
					first_reject: 'status-rejected',
					waiting_second: 'status-passed',
					second_failed: 'status-failed',
					department_selection: 'status-selection',
					accepted: 'status-accepted',
					rejected: 'status-rejected'
				}
				return classMap[status] || 'status-waiting'
			},
			
			// 格式化日期 - 使用统一的格式化函数
			formatDate(dateString) {
				if (!dateString) return '未填写'
				return formatDateTime(dateString) || '未填写'
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
			
			// 格式化中文日期（仅日期）
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
			
			// 格式化中文时间（仅时间）
			formatChineseTimeOnly(date) {
				if (!date) return '未知时间'
				try {
					const d = new Date(date)
					const hours = String(d.getHours()).padStart(2, '0')
					const minutes = String(d.getMinutes()).padStart(2, '0')
					return `${hours}:${minutes}`
				} catch (e) {
					return '未知时间'
				}
			},
			
			// 格式化部门显示
			formatDepartments(applicationData) {
				if (!applicationData) return '未选择'
				
				// 如果传入的是数组（旧格式）
				if (Array.isArray(applicationData)) {
					return applicationData.join('、')
				}
				
				// 如果传入的是字符串（旧格式）
				if (typeof applicationData === 'string') {
					return applicationData
				}
				
				// 处理新的数据库格式（first_choice, second_choice）
				const departments = []
				if (applicationData.first_choice) {
					departments.push(applicationData.first_choice)
				}
				if (applicationData.second_choice) {
					departments.push(applicationData.second_choice)
				}
				
				// 如果没有新格式字段，尝试旧格式
				if (departments.length === 0 && applicationData.departments) {
					if (Array.isArray(applicationData.departments)) {
						return applicationData.departments.join('、')
					}
					return applicationData.departments
				}
				
				return departments.length > 0 ? departments.join('、') : '未选择'
			},
			
			// 获取一面通过的部门
			getFirstPassedDepartments(application) {
				if (!application) return null
				
				// 优先从一面面试结果获取
				if (application.firstInterview && application.firstInterview.passedDepartments) {
					return application.firstInterview.passedDepartments
				}
				
				// 如果没有一面结果，尝试从二面结果获取（二面通过意味着一面也通过了）
				if (application.secondInterview && application.secondInterview.passedDepartments) {
					return application.secondInterview.passedDepartments
				}
				
				return null
			},
			
			// 获取二面通过的部门
			getSecondPassedDepartments(application) {
				if (!application) return null
				
				if (application.secondInterview && application.secondInterview.passedDepartments) {
					return application.secondInterview.passedDepartments
				}
				
				return null
			},
			
			// 获取最终录取部门
			getFinalDepartment(application) {
				if (!application) return null
				
				return application.finalDepartment || null
			},
			
			// 格式化通过的部门显示
			formatPassedDepartments(departments) {
				if (!departments) return '无'
				
				// 如果是数组，用顿号连接
				if (Array.isArray(departments)) {
					return departments.length > 0 ? departments.join('、') : '无'
				}
				
				// 如果是字符串，直接返回
				if (typeof departments === 'string') {
					return departments
				}
				
				return '无'
			},
			
			// 选择继续参加二面
			async selectContinueSecond() {
				try {
					this.submittingFirstPassedChoice = true
					
					const result = await uniCloud.callFunction({
						name: 'application',
						data: {
							type: 'update_status',
							applicationId: this.applicationStatus._id,
							status: 'waiting_second'
						}
					})
					
					if (result.result.success) {
						uni.showToast({
							title: '已选择继续参加二面！',
							icon: 'success'
						})
						
						// 刷新申请状态
						await this.checkApplicationStatus()
					} else {
						uni.showToast({
							title: result.result.error || '操作失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('选择继续二面失败:', error)
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					})
				} finally {
					this.submittingFirstPassedChoice = false
				}
			},
			
			// 选择拒绝继续面试
			async selectRejectSecond() {
				try {
					const result = await new Promise((resolve) => {
						uni.showModal({
							title: '确认拒绝',
							content: '确定要拒绝继续参加二面吗？\n',
							confirmText: '确定拒绝',
							cancelText: '再想想',
							success: (res) => {
								resolve(res.confirm)
							}
						})
					})
					
					if (result) {
						this.submittingFirstPassedChoice = true
						
						const rejectResult = await uniCloud.callFunction({
							name: 'application',
							data: {
								type: 'update_status',
								applicationId: this.applicationStatus._id,
								status: 'first_reject'
							}
						})
						
						if (rejectResult.result.success) {
							uni.showToast({
								title: '已拒绝继续面试',
								icon: 'success'
							})
							
							// 刷新申请状态
							await this.checkApplicationStatus()
						} else {
							uni.showToast({
								title: rejectResult.result.error || '操作失败',
								icon: 'none'
							})
						}
					}
				} catch (error) {
					console.error('拒绝继续面试失败:', error)
					uni.showToast({
						title: '操作失败，请重试',
						icon: 'none'
					})
				} finally {
					this.submittingFirstPassedChoice = false
				}
			},
			
			// 处理签到
			async handleCheckIn(interviewType) {
				if (!this.userInfo || !this.userInfo._id) {
					uni.showToast({
						title: '请先登录',
						icon: 'none'
					})
					return
				}
				
				try {
					this.checkingIn = true
					
					const result = await uniCloud.callFunction({
						name: 'application',
						data: {
							type: 'check_in',
							interviewType: interviewType,
							userId: this.userInfo._id
						}
					})
					
					if (result.result.success) {
						uni.showToast({
							title: result.result.message || '签到成功！',
							icon: 'success'
						})
						
						// 刷新申请状态以显示最新的签到信息
						await this.checkApplicationStatus()
					} else {
						uni.showToast({
							title: result.result.error || '签到失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('签到失败:', error)
					uni.showToast({
						title: '签到失败，请重试',
						icon: 'none'
					})
				} finally {
					this.checkingIn = false
				}
			},
			
			// 删除申请
			async deleteApplication() {
				if (!this.applicationStatus || !this.applicationStatus._id) {
					uni.showToast({
						title: '申请信息不存在',
						icon: 'none'
					})
					return
				}
				
				// 显示确认弹窗
				const result = await uni.showModal({
					title: '确认删除',
					content: '删除申请后将不会保留任何信息，再次报名需要重新填写资料。确定要删除吗？',
					confirmText: '确定删除',
					cancelText: '取消',
					confirmColor: '#ff4757'
				})
				
				if (!result.confirm) {
					return
				}
				
				try {
					const deleteResult = await apiService.deleteApplication(this.applicationStatus._id)
					if (deleteResult.success) {
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						})
						this.applicationStatus = null
						this.isEditing = false
					} else {
						uni.showToast({
							title: deleteResult.result.error || '删除失败',
							icon: 'none'
						})
					}
				} catch (error) {
					console.error('删除申请失败:', error)
					uni.showToast({
						title: '删除失败',
						icon: 'none'
					})
				}
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
	
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 60vh;
	}
	
	.login-section {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
	}
	
	.login-card {
		background: white;
		border-radius: 16px;
		padding: 40px 30px;
		text-align: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 300px;
	}
	
	.login-logo {
		width: 80px;
		height: 80px;
		margin-bottom: 20px;
	}
	
	.login-title {
		font-size: 20px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 8px;
	}
	
	.login-desc {
		font-size: 14px;
		color: #7f8c8d;
		margin-bottom: 30px;
	}
	
	.login-btn {
		width: 200px;
		height: 45px;
		border-radius: 22px;
		background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
		color: white;
		border: none;
		font-size: 16px;
		font-weight: 500;
		box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	
	.login-btn:active {
		transform: translateY(1px);
		box-shadow: 0 1px 4px rgba(74, 144, 226, 0.3);
	}
	
	.status-card {
		background: white;
		border-radius: 16px;
		padding: 24px;
		margin-bottom: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
		border: 1px solid #f0f0f0;
	}
	
	.status-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 16px;
		border-bottom: 2px solid #f8f9fa;
	}
	
	.status-title {
		font-size: 20px;
		font-weight: 700;
		color: #2c3e50;
	}
	
	.status-badge {
		padding: 6px 16px;
		border-radius: 20px;
		font-size: 13px;
		font-weight: 600;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}
	
	.status-info {
		margin-bottom: 16px;
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
	

	

	
	.info-row {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		padding: 8px 0;
		border-bottom: 1px solid #f8f9fa;
	}
	
	.info-row:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}
	
	.info-label {
		font-size: 14px;
		color: #6c757d;
		font-weight: 500;
		min-width: 70px;
		margin-right: 12px;
	}
	
	.info-value {
		font-size: 14px;
		color: #2c3e50;
		flex: 1;
		word-break: break-all;
	}
	
	.status-item {
		font-size: 14px;
		color: #7f8c8d;
		display: block;
		margin-bottom: 4px;
	}
	
	.edit-tip {
		border-top: 1px solid #ecf0f1;
		padding-top: 16px;
		text-align: center;
	}
	
	.edit-text {
		font-size: 14px;
		color: #7f8c8d;
		display: block;
		margin-bottom: 12px;
	}
	
	.edit-btn {
		width: 120px;
		height: 36px;
		font-size: 14px;
	}
	
	.form-section {
		margin-top: 20px;
	}
	
	.form-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	.form-title {
		font-size: 20px;
		font-weight: 600;
		color: #2c3e50;
		text-align: center;
		margin-bottom: 24px;
	}
	
	.form-group {
		margin-bottom: 24px;
	}
	
	.group-title {
		font-size: 16px;
		font-weight: 500;
		color: #34495e;
		display: block;
		margin-bottom: 16px;
		padding-bottom: 8px;
		border-bottom: 1px solid #ecf0f1;
	}
	
	.input-group {
		margin-bottom: 16px;
	}
	
	.input-label {
		font-size: 14px;
		color: #2c3e50;
		display: block;
		margin-bottom: 8px;
	}
	
	.input-field {
		width: 100%;
		height: 40px;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 0 12px;
		font-size: 14px;
		box-sizing: border-box;
	}
	
	.picker-field {
		width: 100%;
		height: 40px;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		display: flex;
		align-items: center;
		padding: 0 12px;
		box-sizing: border-box;
	}
	
	.picker-text {
		font-size: 14px;
		color: #2c3e50;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: 100%;
	}
	
	.department-options {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	
	.dept-option {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		background: white;
		transition: all 0.3s ease;
	}
	
	.dept-option.selected {
		border-color: #4A90E2;
		background: #f0f8ff;
	}
	
	.dept-option-icon {
		width: 40px;
		height: 40px;
		border-radius: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12px;
	}
	
	.dept-option-text {
		color: white;
		font-size: 12px;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 36px;
		text-align: center;
	}
	
	.dept-option-name {
		font-size: 14px;
		color: #2c3e50;
		font-weight: 500;
	}
	
	/* 性别选择样式 */
	.gender-options {
		display: flex;
		gap: 12px;
	}
	
	.gender-option {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 12px 16px;
		border: 2px solid #e9ecef;
		border-radius: 8px;
		background: white;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.gender-option.selected {
		border-color: #4A90E2;
		background: #f0f8ff;
	}
	
	.gender-option:active {
		transform: scale(0.98);
	}
	
	.gender-option-text {
		font-size: 14px;
		color: #2c3e50;
		font-weight: 500;
	}
	
	.textarea-field {
		width: 100%;
		height: 120px;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 12px 16px;
		font-size: 16px;
		box-sizing: border-box;
		resize: none;
	}
	
	.char-count {
		font-size: 12px;
		color: #7f8c8d;
		text-align: right;
		margin-top: 4px;
	}
	
	.submit-section {
		display: flex;
		gap: 16px;
		margin-top: 32px;
	}
	
	.cancel-btn {
		flex: 1;
		height: 45px;
	}
	
	.submit-btn {
		flex: 2;
		height: 45px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 15px;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.submit-btn:active {
		transform: translateY(1px);
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
	}
	
	.submit-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
	
	/* 操作按钮样式 */
	.action-buttons {
		display: flex;
		gap: 16px;
		margin-top: 20px;
		padding-top: 20px;
		border-top: 2px solid #f8f9fa;
	}
	

	

	
	.edit-btn {
		flex: 1;
		height: 44px;
		background: linear-gradient(135deg, #6c757d, #5a6268);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.edit-btn:active {
		transform: translateY(1px);
		box-shadow: 0 2px 8px rgba(108, 117, 125, 0.4);
	}
	
	.cancel-btn {
		flex: 1;
		height: 44px;
		background: linear-gradient(135deg, #dc3545, #c82333);
		color: white;
		border: none;
		border-radius: 12px;
		font-size: 15px;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.cancel-btn:active {
		transform: translateY(1px);
		box-shadow: 0 2px 8px rgba(220, 53, 69, 0.4);
	}
	
	/* 状态徽章样式 */
	.status-waiting {
		background: linear-gradient(135deg, #fff3cd, #ffeaa7);
		color: #856404;
		border: 1px solid #ffeaa7;
	}
	
	.status-passed {
		background: linear-gradient(135deg, #d4edda, #c3e6cb);
		color: #155724;
		border: 1px solid #c3e6cb;
	}
	
	.status-failed {
		background: linear-gradient(135deg, #f8d7da, #f5c6cb);
		color: #721c24;
		border: 1px solid #f5c6cb;
	}
	
	.status-selection {
		background: linear-gradient(135deg, #cce5ff, #b3d9ff);
		color: #004085;
		border: 1px solid #b3d9ff;
	}
	
	.status-accepted {
		background: linear-gradient(135deg, #d1ecf1, #bee5eb);
		color: #0c5460;
		border: 1px solid #bee5eb;
	}
	
	.status-rejected {
		background: linear-gradient(135deg, #f8d7da, #f5c6cb);
		color: #721c24;
		border: 1px solid #f5c6cb;
	}
	
	/* 面试信息样式 */
	.interview-info-section {
		margin-top: 20px;
		padding: 16px;
		background: linear-gradient(135deg, #e3f2fd, #bbdefb);
		border-radius: 12px;
		border: 1px solid #90caf9;
	}
	
	.interview-info-title {
		font-size: 16px;
		font-weight: 600;
		color: #1976d2;
		margin-bottom: 12px;
		display: block;
	}
	
	.interview-info-item {
		display: flex;
		align-items: flex-start;
		margin-bottom: 12px;
	}
	
	.interview-info-item:last-child {
		margin-bottom: 0;
	}
	
	.interview-info-label {
		font-size: 14px;
		color: #424242;
		font-weight: 500;
		min-width: 80px;
		margin-right: 8px;
	}
	
	.interview-info-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	
	.interview-info-time {
		font-size: 14px;
		color: #1976d2;
		font-weight: 600;
	}
	
	.interview-info-location {
		font-size: 14px;
		color: #666;
		font-weight: 500;
	}
	
	/* 签到卡片样式 */
	.checkin-section {
		margin-top: 16px;
		padding: 16px;
		background: linear-gradient(135deg, #f0f8ff, #e6f3ff);
		border-radius: 10px;
		border: 1px solid #b3d9ff;
	}
	
	.checkin-header {
		margin-bottom: 12px;
	}
	
	.checkin-title {
		font-size: 15px;
		font-weight: 600;
		color: #0066cc;
		display: block;
	}
	
	.checkin-status {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: center;
		text-align: center;
	}
	
	.checkin-success {
		font-size: 16px;
		font-weight: 600;
		color: #28a745;
	}
	
	.checkin-number {
		font-size: 14px;
		color: #0066cc;
		font-weight: 500;
	}
	
	.checkin-time {
		font-size: 13px;
		color: #666;
	}
	
	.checkin-action {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	
	.checkin-btn {
		width: 120px;
		height: 40px;
		font-size: 14px;
		font-weight: 600;
		border-radius: 20px;
		background: linear-gradient(135deg, #28a745, #20c997);
		border: none;
		color: white;
		box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
		transition: all 0.3s ease;
	}
	
	.checkin-btn:active {
		transform: translateY(1px);
		box-shadow: 0 2px 8px rgba(40, 167, 69, 0.4);
	}
	
	.checkin-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
		transform: none;
		box-shadow: none;
	}
	
	.checkin-tip {
		font-size: 12px;
		color: #666;
		text-align: center;
		line-height: 1.4;
	}
	
	/* 签到状态提示样式 */
	.checkin-status-hint {
		margin-top: 12px;
		padding: 8px 12px;
		background: linear-gradient(135deg, #fff3cd, #ffeaa7);
		border-radius: 8px;
		border: 1px solid #ffeaa7;
		text-align: center;
	}
	
	.hint-text {
		font-size: 13px;
		color: #856404;
		font-weight: 500;
	}
	
	/* 部门选择样式 - 整合到状态卡片中 */
	.department-selection-section {
		margin-top: 20px;
		padding: 16px;
		background: linear-gradient(135deg, #e8f5e8, #d4edda);
		border-radius: 10px;
		border: 1px solid #c3e6cb;
	}
	
	.selection-header {
		text-align: center;
		margin-bottom: 16px;
	}
	
	.selection-title {
		font-size: 16px;
		font-weight: 600;
		color: #155724;
		display: block;
		margin-bottom: 4px;
	}
	
	.selection-subtitle {
		font-size: 13px;
		color: #666;
		display: block;
	}
	
	.department-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 16px;
	}
	
	.department-option {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px;
		background: white;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.department-option.selected {
		border-color: #28a745;
		background: #f8fff9;
	}
	
	.dept-name {
		font-size: 15px;
		font-weight: 500;
		color: #2c3e50;
	}
	
	.dept-check {
		font-size: 16px;
		color: #28a745;
		font-weight: bold;
	}
	
	.single-department-info {
		margin-bottom: 16px;
	}
	
	.dept-card {
		display: flex;
		align-items: center;
		padding: 16px;
		background: white;
		border-radius: 6px;
		border: 1px solid #e9ecef;
	}
	
	.dept-icon {
		font-size: 20px;
		margin-right: 12px;
	}
	
	.dept-details {
		flex: 1;
	}
	
	.dept-name-large {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 3px;
	}
	
	.dept-desc {
		font-size: 13px;
		color: #666;
	}
	
	.multi-dept-buttons, .single-dept-buttons {
		display: flex;
		gap: 12px;
		width: 100%;
		justify-content: center;
	}
	
	.reject-btn {
		flex: 1;
		height: 40px;
		background: linear-gradient(135deg, #dc3545, #c82333);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		transition: all 0.3s ease;
	}
	
	.confirm-btn {
		flex: 1;
		height: 40px;
		background: linear-gradient(135deg, #28a745, #20c997);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 13px;
		font-weight: 600;
		transition: all 0.3s ease;
	}
	
	.confirm-btn.disabled {
		background: #6c757d;
		cursor: not-allowed;
	}
	
	/* 一面通过选择界面样式 - 整合到状态卡片中 */
	.first-passed-section {
		margin-top: 20px;
		padding: 20px;
		background: linear-gradient(135deg, #e8f5e8, #d4edda);
		border-radius: 12px;
		border: 1px solid #c3e6cb;
	}
	
	.first-passed-header {
		text-align: center;
		margin-bottom: 20px;
	}
	
	.first-passed-title {
		font-size: 18px;
		font-weight: 600;
		color: #155724;
		display: block;
		margin-bottom: 6px;
	}
	
	.first-passed-subtitle {
		font-size: 14px;
		color: #666;
		display: block;
		line-height: 1.4;
	}
	
	.first-passed-options {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 16px;
	}
	
	.option-card {
		display: flex;
		align-items: center;
		padding: 16px;
		border-radius: 8px;
		border: 1px solid #e9ecef;
		background: white;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	
	.option-card:active {
		transform: scale(0.98);
	}
	
	.continue-option {
		border-color: #28a745;
		background: #f8fff9;
	}
	
	.reject-option {
		border-color: #dc3545;
		background: #fff5f5;
	}
	
	.option-icon {
		font-size: 20px;
		margin-right: 12px;
		width: 32px;
		text-align: center;
	}
	
	.option-content {
		flex: 1;
	}
	
	.option-title {
		font-size: 16px;
		font-weight: 600;
		color: #2c3e50;
		display: block;
		margin-bottom: 3px;
	}
	
	.option-desc {
		font-size: 13px;
		color: #666;
		line-height: 1.3;
	}
	
	.option-arrow {
		font-size: 18px;
		color: #999;
		font-weight: bold;
		margin-left: 10px;
	}
	
	.first-passed-tip {
		margin-top: 16px;
		padding: 12px;
		background: #e3f2fd;
		border-radius: 8px;
		border: 1px solid #90caf9;
		text-align: center;
	}
	
	.tip-text {
		font-size: 13px;
		color: #1976d2;
		line-height: 1.4;
		font-weight: 500;
	}
	
	/* 二面信息预览样式 */
	.second-interview-preview {
		margin-top: 16px;
		padding: 12px;
		background: #fff3cd;
		border-radius: 8px;
		border: 1px solid #ffeaa7;
	}
	
	.preview-header {
		margin-bottom: 10px;
		text-align: center;
	}
	
	.preview-title {
		font-size: 14px;
		font-weight: 600;
		color: #856404;
		display: block;
	}
	
	.preview-content {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	
	.preview-item {
		display: flex;
		align-items: center;
	}
	
	.preview-label {
		font-size: 13px;
		color: #856404;
		font-weight: 500;
		min-width: 45px;
		margin-right: 8px;
	}
	
	.preview-value {
		font-size: 13px;
		color: #856404;
		font-weight: 600;
		flex: 1;
	}
	
	/* 时间状态提示样式 */
	.time-status-section {
		margin-top: 20px;
	}
	
	.time-status-card {
		background: white;
		border-radius: 20px;
		padding: 40px 30px;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		border: 1px solid #f0f0f0;
		position: relative;
		overflow: hidden;
	}
	
	/* Logo样式 */
	.time-status-logo {
		margin-bottom: 24px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	
	.logo-image {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
		border: 3px solid #f8f9fa;
	}
	
	.time-status-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
	}
	
	.time-status-icon {
		font-size: 56px;
		margin-bottom: 8px;
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
	
	.time-status-title {
		font-size: 26px;
		font-weight: 700;
		color: #2c3e50;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	}
	
	.time-status-desc {
		font-size: 16px;
		color: #7f8c8d;
		line-height: 1.6;
		max-width: 280px;
		text-align: center;
	}
	
	.time-status-time {
		font-size: 16px;
		font-weight: 600;
		padding: 12px 20px;
		border-radius: 20px;
		background: linear-gradient(135deg, #f8fafc, #e2e8f0);
		border: 2px solid #cbd5e1;
		color: #495057;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
		text-align: center;
		min-width: 200px;
		white-space: nowrap;
		line-height: 1.2;
	}
	
	/* 增强的时间状态样式 */
	.time-status-content.not-started {
		background: linear-gradient(135deg, #fff7ed, #fed7aa);
		border-radius: 16px;
		padding: 24px;
		margin: 16px 0;
		border: 2px solid #fdba74;
	}
	
	.time-status-content.ended {
		background: linear-gradient(135deg, #fef2f2, #fecaca);
		border-radius: 16px;
		padding: 24px;
		margin: 16px 0;
		border: 2px solid #fca5a5;
	}
	
	.time-status-content.not-started .time-status-icon {
		color: #f59e0b;
		font-size: 56px;
		text-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
	}
	
	.time-status-content.not-started .time-status-title {
		color: #d97706;
		font-size: 26px;
		text-shadow: 0 1px 4px rgba(217, 119, 6, 0.2);
	}
	
	.time-status-content.ended .time-status-icon {
		color: #dc3545;
		font-size: 56px;
		text-shadow: 0 2px 8px rgba(220, 53, 69, 0.3);
	}
	
	.time-status-content.ended .time-status-title {
		color: #c82333;
		font-size: 26px;
		text-shadow: 0 1px 4px rgba(200, 35, 51, 0.2);
	}
	
	.time-status-time {
		background: linear-gradient(135deg, #f8fafc, #e2e8f0);
		border: 2px solid #cbd5e1;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: all 0.3s ease;
	}
	
	.time-status-time:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}
	
	/* 装饰性元素 */
	.time-status-card::before {
		content: '';
		position: absolute;
		top: -50px;
		right: -50px;
		width: 100px;
		height: 100px;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
		border-radius: 50%;
		z-index: 0;
	}
	
	.time-status-card::after {
		content: '';
		position: absolute;
		bottom: -30px;
		left: -30px;
		width: 60px;
		height: 60px;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08));
		border-radius: 50%;
		z-index: 0;
	}
	
	/* 确保内容在装饰元素之上 */
	.time-status-logo,
	.time-status-content {
		position: relative;
		z-index: 1;
	}
	
	/* 卡片间距样式 */
	.card-spacing {
		height: 24px;
		background: transparent;
	}
	
	/* 响应式设计 */
	@media (max-width: 480px) {
		.time-status-card {
			padding: 30px 20px;
			margin: 0 10px;
		}
		
		.logo-image {
			width: 80px;
			height: 80px;
		}
		
		.time-status-title {
			font-size: 22px;
		}
		
		.time-status-desc {
			font-size: 14px;
			max-width: 240px;
		}
		
		.time-status-time {
			font-size: 14px;
			padding: 10px 18px;
			min-width: 180px;
		}
		
		.card-spacing {
			height: 20px;
		}
		
		/* 一面通过选择界面响应式样式 */
		.first-passed-section {
			padding: 16px;
			margin: 0 10px;
		}
		
		.first-passed-title {
			font-size: 16px;
		}
		
		.first-passed-subtitle {
			font-size: 13px;
		}
		
		.option-card {
			padding: 14px;
		}
		
		.option-title {
			font-size: 15px;
		}
		
		.option-desc {
			font-size: 12px;
		}
		
		.option-icon {
			font-size: 18px;
			margin-right: 10px;
			width: 28px;
		}
		
		.second-interview-preview {
			padding: 10px;
		}
		
		.preview-title {
			font-size: 13px;
		}
		
		.preview-label, .preview-value {
			font-size: 12px;
		}
	}
	
	/* 隐私保护声明样式 */
	.privacy-section {
		margin-top: 24px;
		padding: 16px;
		background: linear-gradient(135deg, #f8f9fa, #e9ecef);
		border-radius: 12px;
		border: 1px solid #dee2e6;
	}
	
	.privacy-notice {
		margin-bottom: 16px;
	}
	
	.privacy-title {
		font-size: 16px;
		font-weight: 600;
		color: #495057;
		display: block;
		margin-bottom: 12px;
	}
	
	.privacy-content {
		font-size: 13px;
		color: #6c757d;
		line-height: 1.6;
		display: block;
	}
	
	.consent-section {
		border-top: 1px solid #dee2e6;
		padding-top: 16px;
	}
	
	.consent-checkbox {
		display: flex;
		align-items: flex-start;
		cursor: pointer;
	}
	
	.checkbox {
		width: 20px;
		height: 20px;
		border: 2px solid #6c757d;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 12px;
		margin-top: 2px;
		transition: all 0.3s ease;
		flex-shrink: 0;
	}
	
	.checkbox.checked {
		background: #28a745;
		border-color: #28a745;
	}
	
	.checkbox-icon {
		color: white;
		font-size: 12px;
		font-weight: bold;
	}
	
	.consent-text {
		font-size: 13px;
		color: #495057;
		line-height: 1.5;
		flex: 1;
	}
	
	/* 已选择部门信息样式 */
	.selected-departments-info {
		margin-top: 12px;
		padding: 8px 12px;
		background: #e8f5e8;
		border-radius: 6px;
		border-left: 3px solid #28a745;
	}
	
	.selected-info-text {
		font-size: 13px;
		color: #28a745;
		font-weight: 500;
	}
</style>