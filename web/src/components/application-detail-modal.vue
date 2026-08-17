<template>
	<view v-if="visible" class="detail-modal" @click="$emit('close')">
		<view class="detail-content" @click.stop>
			<view class="detail-header">
				<text class="detail-title">申请详情</text>
				<text class="close-btn" @click="$emit('close')">×</text>
			</view>
			
			<scroll-view class="detail-body" scroll-y>
				<!-- 基本信息 -->
				<view class="section">
					<text class="section-title">基本信息</text>
					<view class="info-row">
						<text class="label">姓名：</text>
						<text class="value">{{ application.name }}</text>
					</view>
					<view v-if="getStudentId(application)" class="info-row">
						<text class="label">学号：</text>
						<text class="value">{{ getStudentId(application) }}</text>
					</view>
					<view v-if="getGender(application)" class="info-row">
						<text class="label">性别：</text>
						<text class="value">{{ getGender(application) }}</text>
					</view>
					<view v-if="getMajor(application)" class="info-row">
						<text class="label">专业班级：</text>
						<text class="value">{{ getMajor(application) }}</text>
					</view>
					<view v-if="getDormitory(application)" class="info-row">
						<text class="label">宿舍号：</text>
						<text class="value">{{ getDormitory(application) }}</text>
					</view>
					<view v-if="getPhone(application)" class="info-row">
						<text class="label">手机号码：</text>
						<text class="value">{{ getPhone(application) }}</text>
					</view>
				</view>

				<!-- 申请信息 -->
				<view class="section">
					<text class="section-title">申请信息</text>
					<view class="info-row">
						<text class="label">申请部门：</text>
						<text class="value">{{ getDepartmentsText(application.departments) }}</text>
					</view>
					<view class="info-row">
						<text class="label">当前状态：</text>
						<text class="value status-new" :class="getNewStatusClass(application.status)">{{ getStatusText(application.status) }}</text>
					</view>
				</view>

				<!-- 一面信息 -->
				<view v-if="application.firstInterview" class="section">
					<text class="section-title">一面信息</text>
					<view v-if="getApplicationTime(application)" class="info-row">
						<text class="label">申请时间：</text>
						<text class="value">{{ getApplicationTime(application) }}</text>
					</view>
					<view v-if="getFirstPassedDepartments(application)" class="info-row">
						<text class="label">一面通过：</text>
						<text class="value first-passed-dept">{{ getFirstPassedDepartments(application) }}</text>
					</view>
					<view v-if="application.firstInterview.feedback" class="info-row">
						<text class="label">一面反馈：</text>
						<text class="value">{{ application.firstInterview.feedback }}</text>
					</view>
				</view>

				<!-- 二面信息 -->
				<view v-if="application.secondInterview" class="section">
					<text class="section-title">二面信息</text>
					<view class="info-row">
						<text class="label">二面状态：</text>
						<text class="value status-new" :class="getNewStatusClass(application.secondInterview.status, 'interview')">{{ getStatusText(application.secondInterview.status, 'interview') }}</text>
					</view>
					<view v-if="getSecondInterviewDepartments(application)" class="info-row">
						<text class="label">二面部门：</text>
						<text class="value">{{ getSecondInterviewDepartments(application) }}</text>
					</view>
					<view v-if="getSecondPassedDepartments(application)" class="info-row">
						<text class="label">二面通过：</text>
						<text class="value second-passed-dept">{{ getSecondPassedDepartments(application) }}</text>
					</view>
					<view v-if="getSecondInterviewTime(application)" class="info-row">
						<text class="label">二面时间：</text>
						<text class="value">{{ getSecondInterviewTime(application) }}</text>
					</view>
					<view v-if="getSecondInterviewFeedback(application)" class="info-row">
						<text class="label">二面反馈：</text>
						<text class="value">{{ getSecondInterviewFeedback(application) }}</text>
					</view>
				</view>

				<!-- 最终录取信息 -->
				<view v-if="application.status === 'accepted' || application.status === 'department_selection'" class="section">
					<text class="section-title">录取信息</text>
					<view class="info-row">
						<text class="label">录取状态：</text>
						<text class="value status-new" :class="getNewStatusClass(application.status)">
							{{ application.status === 'accepted' ? '已确认录取' : '待确认录取' }}
						</text>
					</view>
					<view v-if="getFinalDepartment(application)" class="info-row">
						<text class="label">最终部门：</text>
						<text class="value final-department">{{ getFinalDepartment(application) }}</text>
					</view>
					<view v-else-if="application.status === 'department_selection'" class="info-row">
						<text class="label">最终部门：</text>
						<text class="value pending-selection">待用户确认</text>
					</view>
				</view>

				<!-- 自我介绍 -->
				<view v-if="getIntroduction(application)" class="section">
					<text class="section-title">自我介绍</text>
					<view class="intro-box">
						<text class="intro-text">{{ getIntroduction(application) }}</text>
					</view>
				</view>
			</scroll-view>
			
			<view class="detail-footer">
				<button class="btn-secondary" @click="$emit('close')">关闭</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { formatTime } from '@/utils/admin-common.js'
	import { getStatusText, getStatusClass } from '@/utils/utils.js'
	
	export default {
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			application: {
				type: Object,
				default: null
			}
		},
		computed: {
		},
		methods: {
			formatTime,
			getStatusText,
			getStatusClass,
			getNewStatusClass(status, type = 'application') {
				// 新的状态样式类，不带背景色
				const classMap = {
					application: {
						waiting_first: 'status-new-pending',
						first_failed: 'status-new-failed',
						waiting_second: 'status-new-interview',
						second_failed: 'status-new-failed',
						department_selection: 'status-new-selection',
						accepted: 'status-new-passed'
					},
					interview: {
						pending: 'status-new-pending',
						completed: 'status-new-completed'
					}
				}
				
				return classMap[type]?.[status] || 'status-new-pending'
			},
			getDepartmentsText(departments) {
				if (!departments) return '未填写'
				if (Array.isArray(departments)) {
					return departments.join('、')
				}
				if (typeof departments === 'string') {
					return departments
				}
				return '未填写'
			},
			
			// 获取学号，如果为空或无效则返回null
			getStudentId(application) {
				const studentId = application.studentId || application.student_id
				if (!studentId || studentId === '未知学号' || studentId.trim() === '') {
					return null
				}
				return studentId
			},
			
			// 获取申请时间，如果为空或无效则返回null
			getApplicationTime(application) {
				const time = application.createTime || application.applyTime
				if (!time || time === '未知时间' || time.trim() === '') {
					return null
				}
				return time
			},
			getIntroduction(application) {
				// 按优先级获取自我介绍
				return application.formData?.introduction || 
					   application.self_introduction || 
					   application.introduction || 
					   ''
			},
			getFirstPassedDepartments(application) {
				// 统一使用firstInterview.passedDepartments
				if (application.firstInterview && application.firstInterview.passedDepartments) {
					if (Array.isArray(application.firstInterview.passedDepartments) && application.firstInterview.passedDepartments.length > 0) {
						return application.firstInterview.passedDepartments.join('、')
					}
					if (typeof application.firstInterview.passedDepartments === 'string' && application.firstInterview.passedDepartments.trim()) {
						return application.firstInterview.passedDepartments
					}
				}
				
				// 如果状态表明已通过一面，但没有具体部门信息
				if (application.status === 'waiting_second' || 
					application.status === 'department_selection' || 
					application.status === 'accepted' || 
					application.status === 'second_failed') {
					return '已通过（部门信息缺失）'
				}
				
				return ''
			},
			getSecondPassedDepartments(application) {
				// 只有二面通过的状态才显示
				if (application.status !== 'department_selection' && 
					application.status !== 'accepted') {
					return ''
				}
				
				// 统一使用secondInterview.passedDepartments
				if (application.secondInterview && application.secondInterview.passedDepartments) {
					if (Array.isArray(application.secondInterview.passedDepartments) && application.secondInterview.passedDepartments.length > 0) {
						return application.secondInterview.passedDepartments.join('、')
					}
					if (typeof application.secondInterview.passedDepartments === 'string' && application.secondInterview.passedDepartments.trim()) {
						return application.secondInterview.passedDepartments
					}
				}
				
				// 如果状态表明已通过二面，但没有具体部门信息
				return '已通过（部门信息缺失）'
			},
			
			// 获取最终录取部门
			getFinalDepartment(application) {
				if (application.status === 'accepted' && application.finalDepartment) {
					return application.finalDepartment
				}
				return ''
			},
			
			// 获取性别，如果为空或无效则返回null
			getGender(application) {
				const gender = application.gender
				if (!gender || gender === '未知性别' || gender.trim() === '') {
					return null
				}
				return gender
			},
			
			// 获取专业班级，如果为空或无效则返回null
			getMajor(application) {
				const major = application.major
				if (!major || major === '未知专业' || major.trim() === '') {
					return null
				}
				return major
			},
			
			// 获取宿舍号，如果为空或无效则返回null
			getDormitory(application) {
				const dormitory = application.dormitory
				if (!dormitory || dormitory === '未知宿舍' || dormitory.trim() === '') {
					return null
				}
				return dormitory
			},
			
			// 获取手机号码，如果为空或无效则返回null
			getPhone(application) {
				const phone = application.phone
				if (!phone || phone === '未知号码' || phone.trim() === '') {
					return null
				}
				return phone
			},
			
			// 获取二面部门，如果为空或无效则返回null
			getSecondInterviewDepartments(application) {
				if (application.secondInterview && application.secondInterview.departments) {
					if (Array.isArray(application.secondInterview.departments) && application.secondInterview.departments.length > 0) {
						return application.secondInterview.departments.join('、')
					}
					if (typeof application.secondInterview.departments === 'string' && application.secondInterview.departments.trim()) {
						return application.secondInterview.departments
					}
				}
				return null
			},
			
			// 获取二面时间，如果为空或无效则返回null
			getSecondInterviewTime(application) {
				if (application.secondInterview && application.secondInterview.time) {
					return formatTime(application.secondInterview.time)
				}
				return null
			},
			
			// 获取二面反馈，如果为空或无效则返回null
			getSecondInterviewFeedback(application) {
				const feedback = application.secondInterview?.feedback
				if (!feedback || feedback.trim() === '') {
					return null
				}
				return feedback
			},
		}
	}
</script>

<style scoped>
	.detail-modal {
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
	
	.detail-content {
		background: white;
		border-radius: 12px;
		width: 90%;
		max-width: 500px;
		max-height: 85vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		margin: 0 auto;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		position: relative;
		box-sizing: border-box;
	}
	
	.detail-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20px;
		border-bottom: 1px solid #e9ecef;
		flex-shrink: 0;
	}
	
	.detail-title {
		font-size: 18px;
		font-weight: 600;
		color: #333;
	}
	
	.close-btn {
		font-size: 24px;
		color: #999;
		cursor: pointer;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.detail-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		box-sizing: border-box;
		width: 100%;
	}
	
	.section {
		margin-bottom: 24px;
		width: 100%;
		box-sizing: border-box;
	}
	
	.section:last-child {
		margin-bottom: 0;
	}
	
	.section-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
		margin-bottom: 12px;
		display: block;
		padding-bottom: 8px;
		border-bottom: 2px solid #007bff;
		width: 100%;
		box-sizing: border-box;
	}
	
	.info-row {
		display: flex;
		margin-bottom: 8px;
		align-items: flex-start;
		width: 100%;
		box-sizing: border-box;
	}
	
	.label {
		font-weight: 500;
		color: #666;
		min-width: 80px;
		flex-shrink: 0;
		margin-right: 8px;
	}
	
	.value {
		color: #333;
		flex: 1;
		word-break: break-all;
		word-wrap: break-word;
		overflow-wrap: break-word;
		max-width: calc(100% - 88px);
	}
	
	/* 新的状态样式 - 不带背景色和边框 */
	.status-new {
		font-weight: 600;
		font-size: 14px;
		padding: 2px 4px;
	}
	
	.status-new-pending {
		color: #f39c12;
	}
	
	.status-new-interview {
		color: #3498db;
	}
	
	.status-new-passed {
		color: #27ae60;
	}
	
	.status-new-failed {
		color: #e74c3c;
	}
	
	.status-new-selection {
		color: #9b59b6;
	}
	
	.status-new-completed {
		color: #2c3e50;
	}
	
	.intro-box {
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 10px;
		background: #f8f9fa;
		height: 150px;
		overflow-y: auto;
		box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
		width: 100%;
		box-sizing: border-box;
		margin: 0;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}
	
	.intro-text {
		line-height: 1.6;
		color: #333;
		white-space: pre-wrap;
		word-wrap: break-word;
		word-break: break-word;
		overflow-wrap: break-word;
		font-size: 14px;
		display: block;
		margin: 0;
	}
	
	.detail-footer {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e9ecef;
		flex-shrink: 0;
		flex-wrap: wrap;
	}
	
	.detail-footer button {
		height: 40px;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
		min-width: 80px;
		white-space: nowrap;
	}
	
	.btn-primary {
		background: #007bff;
		color: white;
	}
	
	.btn-secondary {
		background: #6c757d;
		color: white;
	}
	
	/* 最终录取部门样式 */
	.final-department {
		color: #dc3545 !important;
		font-weight: 600;
		background: #fff5f5;
		padding: 3px 8px;
		border-radius: 4px;
		border: 1px solid #fecaca;
	}
	
	.pending-selection {
		color: #f39c12 !important;
		font-weight: 500;
		font-style: italic;
	}
	
	.first-passed-dept {
		color: #28a745 !important;
		font-weight: 500;
	}
	
	.second-passed-dept {
		color: #28a745 !important;
		font-weight: 500;
	}
	
</style>