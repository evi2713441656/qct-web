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
							<picker class="filter-picker" :value="statusIndex" :range="statusOptions" @change="onStatusChange">
								<view class="picker-text">{{statusOptions[statusIndex]}}</view>
							</picker>
						</view>
						<view class="filter-item">
							<text class="filter-label">部门筛选</text>
							<picker class="filter-picker" :value="deptIndex" :range="deptOptions" @change="onDeptChange">
								<view class="picker-text">{{deptOptions[deptIndex]}}</view>
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
						<text class="stats-number">{{filteredApplications.length}}</text>
						<text class="stats-label">当前显示</text>
					</view>
					<view class="stats-item">
						<text class="stats-number">{{totalApplications}}</text>
						<text class="stats-label">总一面数</text>
					</view>
					<view class="stats-item">
						<text class="stats-number">{{pendingCount}}</text>
						<text class="stats-label">待审核</text>
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
							<view class="select-all" @click="toggleSelectAll">
								<text class="select-text">{{isAllSelected ? '取消全选' : '全选'}}</text>
							</view>
						</view>
					</view>
					
			<!-- 数据导出 -->
			<view class="quick-actions">
				<view class="action-group">
					<text class="action-group-title">数据导出</text>
					<view class="action-buttons">
						<button class="btn-secondary action-btn" @click="exportAllData">导出全部数据</button>
						<button class="btn-secondary action-btn" @click="showExportOptions">按条件导出</button>
					</view>
				</view>
				
				<!-- 通知管理 -->
				<view class="action-group">
					<text class="action-group-title">通知管理</text>
					<view class="action-buttons">
						<button class="btn-primary action-btn" @click="showSendNotification">发送通知</button>
						<button class="btn-secondary action-btn" @click="showNotificationHistory">查看历史通知</button>
					</view>
				</view>
				
				<!-- 批量操作 -->
				<view class="action-group" v-if="selectedApplications.length > 0">
					<text class="action-group-title">批量操作 ({{selectedApplications.length}}项)</text>
					<view class="action-buttons">
						<button class="btn-secondary action-btn" @click="batchPass">批量通过</button>
						<button class="btn-secondary action-btn" @click="batchReject">批量拒绝</button>
					</view>
				</view>
			</view>
		</view>
	</view>
	
	<!-- 报名列表 -->
	<view class="applications-section">
		<view v-if="filteredApplications.length === 0" class="empty-state">
			<view class="empty-logo">
				<image src="/static/logo.png" mode="aspectFit" class="logo-image"></image>
			</view>
			<view class="empty-content">
				<text class="empty-title">暂无一面数据</text>
			</view>
		</view>
		
		<view v-else class="applications-list">
			<view 
				class="application-card" 
				v-for="(app, index) in filteredApplications" 
				:key="app.id"
				:class="{selected: selectedApplications.includes(app.id)}"
				@click="toggleSelect(app.id)"
			>
				<view class="app-header">
					<view class="app-info">
						<text class="app-name">{{app.formData?.name || '未知姓名'}}</text>
						<text v-if="app.formData?.studentId" class="app-student-id">{{app.formData.studentId}}</text>
					</view>
					<view class="app-status">
						<!-- 状态标签在上面 -->
						<view class="status-badge" :class="getStatusClass(app.status, app)">
							{{getStatusText(app.status, app)}}
						</view>
						<!-- 签到序号显示在下面 -->
						<view v-if="app.firstInterview?.checkInNumber" class="checkin-number-badge">
							<text class="checkin-number-text">签到序号 #{{app.firstInterview.checkInNumber}}</text>
						</view>
					</view>
				</view>
				
				<view class="app-details">
					<view v-if="app.formData?.major" class="detail-row">
						<text class="detail-label">专业班级：</text>
						<text class="detail-value">{{app.formData.major}}</text>
					</view>
					<view v-if="app.formData?.phone" class="detail-row">
						<text class="detail-label">手机号码：</text>
						<text class="detail-value">{{app.formData.phone}}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">意向部门：</text>
						<text class="detail-value">{{app.departments || '未知部门'}}</text>
					</view>
					<!-- 一面通过显示 -->
					<view v-if="app.status === 'first_passed' || app.status === 'waiting_second' || app.status === 'department_selection' || app.status === 'accepted' || app.status === 'second_failed'" class="detail-row">
						<text class="detail-label">一面通过：</text>
						<text class="detail-value first-passed-dept">{{getFirstPassedDepartments(app)}}</text>
					</view>
					<!-- 二面通过显示 -->
					<view v-if="app.status === 'department_selection' || app.status === 'accepted'" class="detail-row">
						<text class="detail-label">二面通过：</text>
						<text class="detail-value second-passed-dept">{{getSecondPassedDepartments(app)}}</text>
					</view>
					<!-- 最终录取部门显示 -->
					<view v-if="app.status === 'accepted'" class="detail-row">
						<text class="detail-label">最终部门：</text>
						<text class="detail-value final-dept">{{getFinalDepartment(app)}}</text>
					</view>
					<view class="detail-row">
						<text class="detail-label">报名时间：</text>
						<text class="detail-value">{{app.applyTime || '未知时间'}}</text>
					</view>
				</view>
				
				<view class="app-actions">
					<button class="action-btn view-btn" @click.stop="viewDetail(app)">详情</button>
					<button v-if="app.status === 'waiting_first' && (!app.firstInterview || app.firstInterview.status !== 'completed')" class="action-btn interview-btn" @click.stop="markAsInterviewed(app)">已面试</button>
					<button v-if="app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed'" class="action-btn pass-btn" @click.stop="passApplication(app)">通过</button>
					<button v-if="app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed'" class="action-btn reject-btn" @click.stop="rejectApplication(app)">拒绝</button>
					<button v-if="app.status === 'first_failed' || app.status === 'first_passed' || app.status === 'first_reject' || app.status === 'waiting_second' || (app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed')" class="action-btn undo-btn" @click.stop="undoApplication(app)">撤销</button>
				</view>
			</view>
		</view>
	</view>
</scroll-view>
	
	<!-- 详情弹窗 -->
	<view v-if="showDetail && selectedApp" class="detail-modal" @click="closeDetail">
		<view class="detail-content" @click.stop>
			<view class="detail-header">
				<text class="detail-title">一面详情</text>
				<text class="close-btn" @click="closeDetail">×</text>
			</view>
			
			<scroll-view class="detail-body" scroll-y>
				<!-- 基本信息 -->
				<view class="section">
					<text class="section-title">基本信息</text>
					<view class="info-row">
						<text class="label">姓名：</text>
						<text class="value">{{selectedApp.formData?.name || '未知姓名'}}</text>
					</view>
					<view v-if="selectedApp.formData?.studentId" class="info-row">
						<text class="label">学号：</text>
						<text class="value">{{selectedApp.formData.studentId}}</text>
					</view>
					<view v-if="selectedApp.formData?.gender" class="info-row">
						<text class="label">性别：</text>
						<text class="value">{{selectedApp.formData.gender}}</text>
					</view>
					<view v-if="selectedApp.formData?.major" class="info-row">
						<text class="label">专业班级：</text>
						<text class="value">{{selectedApp.formData.major}}</text>
					</view>
					<view v-if="selectedApp.formData?.dormitory" class="info-row">
						<text class="label">宿舍号：</text>
						<text class="value">{{selectedApp.formData.dormitory}}</text>
					</view>
					<view v-if="selectedApp.formData?.phone" class="info-row">
						<text class="label">手机号码：</text>
						<text class="value">{{selectedApp.formData.phone}}</text>
					</view>
				</view>
				
				<!-- 申请信息 -->
				<view class="section">
					<text class="section-title">申请信息</text>
					<view class="info-row">
						<text class="label">申请部门：</text>
						<text class="value">{{selectedApp.departments || '未知部门'}}</text>
					</view>
					<view class="info-row">
						<text class="label">当前状态：</text>
						<text class="value status-new" :class="getNewStatusClass(selectedApp.status)">{{getStatusText(selectedApp.status, selectedApp)}}</text>
					</view>
				</view>
				
				<!-- 一面信息 -->
				<view class="section">
					<text class="section-title">一面信息</text>
					<view class="info-row">
						<text class="label">申请时间：</text>
						<text class="value">{{selectedApp.applyTime || '未知时间'}}</text>
					</view>
					<view v-if="getFirstPassedDepartments(selectedApp)" class="info-row">
						<text class="label">一面通过：</text>
						<text class="value first-passed-dept">{{getFirstPassedDepartments(selectedApp)}}</text>
					</view>
					<view v-if="selectedApp.firstInterview && selectedApp.firstInterview.feedback" class="info-row">
						<text class="label">一面反馈：</text>
						<text class="value">{{selectedApp.firstInterview.feedback}}</text>
					</view>
					<!-- 一面通过等待用户选择提示 -->
					<view v-if="selectedApp.status === 'first_passed'" class="info-row">
						<text class="label">用户选择：</text>
						<text class="value waiting-choice">等待用户选择是否继续二面</text>
					</view>
				</view>
				
				<!-- 自我介绍 -->
				<view v-if="selectedApp.formData?.introduction" class="section">
					<text class="section-title">自我介绍</text>
					<view class="intro-box">
						<text class="intro-text">{{selectedApp.formData.introduction}}</text>
					</view>
				</view>
			</scroll-view>
			
			<view class="detail-footer">
				<!-- 主要操作按钮行 -->
				<view class="action-row primary-actions">
					<button v-if="selectedApp.status === 'waiting_first' && (!selectedApp.firstInterview || selectedApp.firstInterview.status !== 'completed')" class="btn-info" @click="markAsInterviewed(selectedApp)">已面试</button>
					<button v-if="selectedApp.status === 'waiting_first' && selectedApp.firstInterview && selectedApp.firstInterview.status === 'completed'" class="btn-primary" @click="passApplication(selectedApp)">通过</button>
					<button v-if="selectedApp.status === 'waiting_first' && selectedApp.firstInterview && selectedApp.firstInterview.status === 'completed'" class="btn-danger" @click="rejectApplication(selectedApp)">拒绝</button>
					<button v-if="selectedApp.status === 'first_passed'" class="btn-primary" @click="helpContinueSecond(selectedApp)">继续二面</button>
					<button v-if="selectedApp.status === 'first_passed'" class="btn-danger" @click="helpRejectSecond(selectedApp)">拒绝二面</button>
					<button v-if="selectedApp.status === 'first_failed' || selectedApp.status === 'first_passed' || selectedApp.status === 'first_reject' || selectedApp.status === 'waiting_second' || (selectedApp.status === 'waiting_first' && selectedApp.firstInterview && selectedApp.firstInterview.status === 'completed')" class="btn-warning" @click="undoApplication(selectedApp)">撤销</button>
				</view>
				
				<!-- 修改报名信息按钮 - 独立一行，所有状态都显示 -->
				<view class="action-row edit-action">
					<button class="btn-edit" @click="showEditApplication">
						<text class="btn-icon">✏️</text>
						<text class="btn-text">修改报名信息</text>
					</button>
				</view>
			</view>
		</view>
	</view>
	
	<!-- 导出选项弹窗 -->
	<view v-if="showExportModal" class="modal-overlay" @click="closeExportModal">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">导出数据选项</text>
				<text class="close-btn" @click="closeExportModal">×</text>
			</view>
			<view class="modal-body">
				<view class="export-options">
					
					<view class="option-group">
						<text class="option-title">按状态筛选</text>
						<view class="status-filter-container">
							<view class="all-status-section">
								<label class="checkbox-item all-status-item" @click="toggleAllExportStatus">
									<checkbox class="checkbox-input" :checked="isAllExportStatusSelected" />
									<text class="all-status-label">所有状态</text>
								</label>
							</view>
							<view class="status-grid">
								<label class="status-item">
									<checkbox value="waiting_first" :checked="exportOptions.status.includes('waiting_first')" />
									<text>等待一面</text>
								</label>
								<label class="status-item">
									<checkbox value="interviewed" :checked="exportOptions.status.includes('interviewed')" />
									<text>已面试</text>
								</label>
								<label class="status-item">
									<checkbox value="first_passed" :checked="exportOptions.status.includes('first_passed')" />
									<text>一面通过</text>
								</label>
								<label class="status-item">
									<checkbox value="first_failed" :checked="exportOptions.status.includes('first_failed')" />
									<text>一面不通过</text>
								</label>
								<label class="status-item">
									<checkbox value="first_reject" :checked="exportOptions.status.includes('first_reject')" />
									<text>一面拒绝</text>
								</label>
								<label class="status-item">
									<checkbox value="waiting_second" :checked="exportOptions.status.includes('waiting_second')" />
									<text>等待二面</text>
								</label>
								<label class="status-item">
									<checkbox value="second_failed" :checked="exportOptions.status.includes('second_failed')" />
									<text>二面不通过</text>
								</label>
								<label class="status-item">
									<checkbox value="department_selection" :checked="exportOptions.status.includes('department_selection')" />
									<text>选择部门</text>
								</label>
								<label class="status-item">
									<checkbox value="accepted" :checked="exportOptions.status.includes('accepted')" />
									<text>已录取</text>
								</label>
							</view>
						</view>
					</view>
					
					<view class="option-group">
						<text class="option-title">按部门筛选</text>
						<checkbox-group @change="onExportDeptChange">
							<label class="checkbox-item">
								<checkbox value="宣传部" :checked="exportOptions.departments.includes('宣传部')" />
								<text>宣传部</text>
							</label>
							<label class="checkbox-item">
								<checkbox value="执行部" :checked="exportOptions.departments.includes('执行部')" />
								<text>执行部</text>
							</label>
							<label class="checkbox-item">
								<checkbox value="策划部" :checked="exportOptions.departments.includes('策划部')" />
								<text>策划部</text>
							</label>
						</checkbox-group>
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="closeExportModal">取消</button>
				<button class="btn-primary" @click="executeExport">确认导出</button>
			</view>
		</view>
	</view>
	
	<!-- 发送通知弹窗 -->
	<view v-if="showNotificationModal" class="modal-overlay" @click="closeNotificationModal">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">发送通知</text>
				<text class="close-btn" @click="closeNotificationModal">×</text>
			</view>
			<view class="modal-body">
				<view class="form-group">
					<text class="form-label">通知标题</text>
					<input class="form-input" v-model="notificationForm.title" placeholder="请输入通知标题" />
				</view>
				<view class="form-group">
					<text class="form-label">通知内容</text>
					<textarea class="form-textarea" v-model="notificationForm.content" placeholder="请输入通知内容" />
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
				<button class="btn-primary" @click="sendNotification" :disabled="!notificationForm.title || !notificationForm.content">发送通知</button>
			</view>
		</view>
	</view>
	
	<!-- 历史通知弹窗 -->
	<view v-if="showHistoryModal" class="modal-overlay" @click="closeHistoryModal">
		<view class="modal-content large-modal" @click.stop>
			<view class="modal-header">
				<text class="modal-title">历史通知管理</text>
				<text class="close-btn" @click="closeHistoryModal">×</text>
			</view>
			<view class="modal-body">
				<view v-if="notificationHistory.length === 0" class="empty-state">
					<text class="empty-text">暂无历史通知</text>
				</view>
				<view v-else class="notification-list">
					<view 
						class="notification-item" 
						v-for="(notification, index) in notificationHistory" 
						:key="notification._id"
					>
						<view class="notification-header">
							<text class="notification-title">{{notification.title}}</text>
							<view class="notification-meta">
								<text class="notification-time">{{formatTime(notification.createdAt)}}</text>
								<view class="notification-actions">
									<button class="btn-small btn-primary" @click="editNotification(notification)">编辑</button>
									<button class="btn-small btn-secondary" @click="deleteNotification(notification._id)">删除</button>
								</view>
							</view>
						</view>
						<view class="notification-content">
							<text>{{notification.content}}</text>
						</view>
						<view class="notification-footer">
							<text class="notification-target">发送对象: {{getTargetText(notification.type)}}</text>
							<text class="notification-status">状态: {{notification.status === 'sent' ? '已发送' : '待发送'}}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="closeHistoryModal">关闭</button>
				<button class="btn-primary" @click="showSendNotification">发送新通知</button>
			</view>
		</view>
	</view>
	
	<!-- 编辑通知弹窗 -->
	<view v-if="showEditNotificationModal" class="modal-overlay" @click="closeEditNotificationModal">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">编辑通知</text>
				<text class="close-btn" @click="closeEditNotificationModal">×</text>
			</view>
			<view class="modal-body">
				<view class="form-group">
					<text class="form-label">通知标题</text>
					<input class="form-input" v-model="editingNotification.title" placeholder="请输入通知标题" />
				</view>
				<view class="form-group">
					<text class="form-label">通知内容</text>
					<textarea class="form-textarea" v-model="editingNotification.content" placeholder="请输入通知内容" />
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="closeEditNotificationModal">取消</button>
				<button class="btn-primary" @click="updateNotification" :disabled="!editingNotification.title || !editingNotification.content">保存修改</button>
			</view>
		</view>
	</view>
	
	<!-- 修改报名信息弹窗 -->
	<view v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
		<view class="modal-content large-modal" @click.stop>
			<view class="modal-header">
				<text class="modal-title">修改报名信息</text>
				<text class="close-btn" @click="closeEditModal">×</text>
			</view>
			<view class="modal-body">
				<view class="form-group">
					<text class="form-label">昵称 *</text>
					<input class="form-input" v-model="editForm.name" placeholder="请输入昵称" />
				</view>
				
				<view class="form-group">
					<text class="form-label">学号</text>
					<input class="form-input" v-model="editForm.studentId" placeholder="请输入学号" />
				</view>
				
				<view class="form-group">
					<text class="form-label">性别</text>
					<view class="gender-options">
						<view 
							class="gender-option" 
							v-for="(gender, index) in genderOptions" 
							:key="index"
							:class="{selected: editForm.gender === gender}"
							@click="selectEditGender(gender)"
						>
							<text class="gender-option-text">{{gender}}</text>
						</view>
					</view>
				</view>
				
				<view class="form-group">
					<text class="form-label">专业班级</text>
					<input class="form-input" v-model="editForm.major" placeholder="例如：计算机科学与技术2025级1班" />
				</view>
				
				<view class="form-group">
					<text class="form-label">宿舍号</text>
					<input class="form-input" v-model="editForm.dormitory" placeholder="例如：西四315" />
				</view>
				
				<view class="form-group">
					<text class="form-label">联系方式</text>
					<input class="form-input" v-model="editForm.phone" placeholder="请输入联系方式" type="number" />
				</view>
				
				<view class="form-group">
					<text class="form-label">意向部门（最多选择2个）</text>
					<view class="department-options">
						<view 
							class="dept-option" 
							v-for="(dept, index) in departments" 
							:key="index"
							:class="{selected: editForm.departments.includes(dept.name)}"
							@click="toggleEditDepartment(dept.name)"
						>
							<view class="dept-option-icon" :style="{backgroundColor: dept.color}">
								<text class="dept-option-text">{{dept.shortName}}</text>
							</view>
							<text class="dept-option-name">{{dept.name}}</text>
						</view>
					</view>
						<view v-if="editForm.departments.length > 0" class="selected-departments-info">
							<text class="selected-info-text">已选择：{{editForm.departments.join('、')}}</text>
						</view>
				</view>
				
				<view class="form-group">
					<text class="form-label">自我介绍 *</text>
					<textarea 
						class="form-textarea" 
						v-model="editForm.introduction" 
						placeholder="请简单介绍一下自己，包括个人特长、兴趣爱好、为什么想加入我们等（200-500字）"
						maxlength="500"
					></textarea>
					<text class="char-count">{{editForm.introduction.length}}/500</text>
				</view>
			</view>
			<view class="modal-footer edit-modal-footer">
				<button class="btn-secondary btn-small" @click="closeEditModal">取消</button>
				<button class="btn-primary btn-small" @click="saveEditApplication" :disabled="savingEdit">保存修改</button>
			</view>
		</view>
	</view>
	
	<!-- 部门选择弹窗 -->
	<view v-if="showDepartmentModal" class="modal-overlay" @click="closeDepartmentModal">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">{{isBatchOperation ? '批量通过 - 选择部门' : '选择通过部门'}}</text>
				<text class="close-btn" @click="closeDepartmentModal">×</text>
			</view>
			<view class="modal-body">
				<view class="form-group">
					<text class="form-label" v-if="!isBatchOperation">请选择该学生通过的部门（可多选）：</text>
					<text class="form-label" v-else>请选择要通过的部门（可多选，选中的学生将通过到所有选中部门）：</text>
					
					<!-- 统一使用多选模式 -->
					<checkbox-group @change="onDepartmentsChange">
						<label class="checkbox-item">
							<checkbox value="策划部" :checked="selectedDepartments.includes('策划部')" />
							<text>策划部</text>
						</label>
						<label class="checkbox-item">
							<checkbox value="执行部" :checked="selectedDepartments.includes('执行部')" />
							<text>执行部</text>
						</label>
						<label class="checkbox-item">
							<checkbox value="宣传部" :checked="selectedDepartments.includes('宣传部')" />
							<text>宣传部</text>
						</label>
					</checkbox-group>
					
					<view v-if="isBatchOperation" class="batch-info">
						<text class="info-text">将通过 {{selectedApplications.length}} 个申请</text>
						<text class="info-text" v-if="selectedDepartments.length > 0">
							所有申请将同时通过到：{{selectedDepartments.join('、')}}
						</text>
					</view>
					<view v-else-if="selectedDepartments.length > 0" class="batch-info">
						<text class="info-text">该申请将通过到：{{selectedDepartments.join('、')}}</text>
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="closeDepartmentModal">取消</button>
				<button class="btn-primary" @click="confirmPassApplication" 
					:disabled="selectedDepartments.length === 0">
					确认通过
				</button>
			</view>
		</view>
	</view>
</view>
</template>

<script>
	export default {
		data() {
			return {
				applications: [],
				filteredApplications: [],
				selectedApplications: [],
				isAllSelected: false,
				statusIndex: 0,
				deptIndex: 0,
				searchKeyword: '',
				statusOptions: ['全部', '待一面', '已面试', '一面通过', '待二面', '选部门', '已录取', '一面不通过', '二面不通过', '一面拒绝'],
				deptOptions: ['全部', '策划部', '执行部', '宣传部'],
				showDetail: false,
				selectedApp: null,
				
				// 下拉刷新状态
				isRefreshing: false,
				
				// 自动刷新相关
				autoRefreshTimer: null,
				lastRefreshTime: 0,
				refreshInterval: 3 * 60 * 1000, // 3分钟
				
				// 搜索防抖相关
				searchTimer: null,
				
				// 导出相关
				showExportModal: false,
				exportOptions: {
					status: ['waiting_first', 'interviewed', 'first_passed', 'first_failed', 'first_reject', 'waiting_second', 'second_failed', 'department_selection', 'accepted'],
					departments: ['宣传部', '执行部', '策划部']
				},
				
				// 通知相关
				showNotificationModal: false,
				notificationForm: {
					title: '',
					content: '',
					target: 'all'
				},
				notificationTargetIndex: 0,
				notificationTargetOptions: ['全体用户', '等待一面', '已面试', '一面通过', '等待二面', '一面不通过', '一面拒绝', '部门选择', '二面不通过', '已录取'],
				
				// 历史通知相关
				showHistoryModal: false,
				notificationHistory: [],
				
				// 编辑通知相关
				showEditNotificationModal: false,
				editingNotification: {
					_id: '',
					title: '',
					content: ''
				},
				
				// 部门选择相关
				showDepartmentModal: false,
				selectedDepartments: [], // 多选部门
				pendingApplication: null,
				isBatchOperation: false, // 是否为批量操作
				
				// 修改报名信息相关
				showEditModal: false,
				editForm: {
					name: '',
					studentId: '',
					gender: '',
					major: '',
					dormitory: '',
					phone: '',
					departments: [],
					introduction: ''
				},
				genderOptions: ['男', '女'],
				departments: [
					{ name: '策划部', shortName: '策划', color: '#FF6B6B' },
					{ name: '执行部', shortName: '执行', color: '#4ECDC4' },
					{ name: '宣传部', shortName: '宣传', color: '#45B7D1' }
				],
				savingEdit: false
			}
		},
		computed: {
			totalApplications() {
				return this.applications.length
			},
			pendingCount() {
				return this.applications.filter(app => app.status === 'waiting_first').length
			},
			isAllExportStatusSelected() {
				const allStatuses = ['waiting_first', 'interviewed', 'first_passed', 'first_failed', 'first_reject', 'waiting_second', 'second_failed', 'department_selection', 'accepted']
				return allStatuses.every(status => this.exportOptions.status.includes(status))
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
			// 加载报名数据
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

					this.applications = this.validateApplicationData(all)
					this.filterApplications()
					
					// 更新最后刷新时间
					this.lastRefreshTime = Date.now()
					
					// 如果是自动刷新，显示提示
					if (isAutoRefresh) {
						uni.showToast({ title: '数据已更新', icon: 'success' })
					}
				} catch (err) {
					this.applications = []
					if (!this.isRefreshing && !isAutoRefresh) {
						uni.showToast({ title: '加载数据失败', icon: 'none' })
					}
				} finally {
					if (!this.isRefreshing) {
						uni.hideLoading()
					}
				}
			},
			
			// 验证和清理申请数据
			validateApplicationData(data) {
				return data.map(app => {
					// 创建标准化的数据结构
					const formData = {
						name: app.name || app.formData?.name || '',
						studentId: app.student_id || app.formData?.studentId || app.formData?.student_id || '',
						major: app.major || app.formData?.major || '',
						phone: app.phone || app.formData?.phone || '',
						gender: app.gender || app.formData?.gender || '',
						dormitory: app.dormitory || app.formData?.dormitory || '',
						introduction: app.self_introduction || app.formData?.introduction || app.introduction || ''
					}
					
					// 格式化申请时间
					let applyTime = '未知时间'
					const timeField = app.createdAt || app.applyTime
					if (timeField) {
						try {
							const date = new Date(timeField)
							const year = date.getFullYear()
							const month = String(date.getMonth() + 1).padStart(2, '0')
							const day = String(date.getDate()).padStart(2, '0')
							const hours = String(date.getHours()).padStart(2, '0')
							const minutes = String(date.getMinutes()).padStart(2, '0')
							applyTime = `${year}年${month}月${day}日 ${hours}:${minutes}`
						} catch (e) {
							applyTime = '未知时间'
						}
					}
					
					// 处理部门信息 - 优化显示格式
					let departments = '未知部门'
					const firstChoice = app.first_choice || app.departments
					const secondChoice = app.second_choice
					
					if (firstChoice && secondChoice && firstChoice !== secondChoice) {
						departments = `第一志愿：${firstChoice}，第二志愿：${secondChoice}`
					} else if (firstChoice) {
						departments = `${firstChoice}`
					} else if (app.departments) {
						if (Array.isArray(app.departments)) {
							departments = app.departments.join('，')
						} else {
							departments = app.departments.toString()
						}
					}
					
					return {
						id: app._id || app.id || Math.random().toString(36).substr(2, 9),
						formData: formData,
						departments: departments,
						applyTime: applyTime,
						status: app.status || 'waiting_first',
						userId: app.user_id,
						createdAt: app.createdAt,
						updatedAt: app.updatedAt,
						// 保留面试相关数据
						firstInterview: app.firstInterview || null,
						secondInterview: app.secondInterview || null,
						passedDepartments: app.passedDepartments || null,
						finalDepartment: app.finalDepartment || null
					}
				})
			},
			
			// 筛选报名数据
			filterApplications() {
				let filtered = [...this.applications]
				
				// 状态筛选
				if (this.statusIndex > 0) {
					const statusMap = ['', 'waiting_first', 'interviewed', 'first_passed', 'waiting_second', 'department_selection', 'accepted', 'first_failed', 'second_failed', 'first_reject']
					const targetStatus = statusMap[this.statusIndex]
					
					if (targetStatus === 'interviewed') {
						// 特殊处理：筛选已面试状态（waiting_first + firstInterview.status === 'completed'）
						filtered = filtered.filter(app => 
							app.status === 'waiting_first' && 
							app.firstInterview && 
							app.firstInterview.status === 'completed'
						)
					} else {
						filtered = filtered.filter(app => app.status === targetStatus)
					}
				}
				
				// 部门筛选
				if (this.deptIndex > 0) {
					const deptName = this.deptOptions[this.deptIndex]
					filtered = filtered.filter(app => (app.departments || '').includes(deptName))
				}
				
				// 关键词搜索
				if (this.searchKeyword.trim()) {
					const keyword = this.searchKeyword.toLowerCase()
					filtered = filtered.filter(app => 
						(app.formData?.name || '').toLowerCase().includes(keyword) ||
						(app.formData?.studentId || '').toLowerCase().includes(keyword)
					)
				}
				
				// 按签到序号排序：有签到的按序号从小到大排序，没有签到的保持默认顺序
				filtered.sort((a, b) => {
					const aHasCheckIn = a.firstInterview?.checkInNumber
					const bHasCheckIn = b.firstInterview?.checkInNumber
					
					// 如果都有签到，按序号排序
					if (aHasCheckIn && bHasCheckIn) {
						return a.firstInterview.checkInNumber - b.firstInterview.checkInNumber
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
			
			// 状态筛选变化
			onStatusChange(e) {
				this.statusIndex = e.detail.value
				this.filterApplications()
			},
			
			// 部门筛选变化
			onDeptChange(e) {
				this.deptIndex = e.detail.value
				this.filterApplications()
			},
			
			// 处理搜索输入（自动搜索，带防抖）
			handleSearch() {
				// 清除之前的定时器
				if (this.searchTimer) {
					clearTimeout(this.searchTimer)
				}
				
				// 设置新的定时器，300ms后执行搜索
				this.searchTimer = setTimeout(() => {
					this.filterApplications()
				}, 300)
			},
			
			// 切换选择
			toggleSelect(appId) {
				const index = this.selectedApplications.indexOf(appId)
				if (index > -1) {
					this.selectedApplications.splice(index, 1)
				} else {
					this.selectedApplications.push(appId)
				}
				this.updateSelectAllStatus()
			},
			
			// 全选/取消全选
			toggleSelectAll() {
				if (this.isAllSelected) {
					this.selectedApplications = []
				} else {
					this.selectedApplications = this.filteredApplications.map(app => app.id)
				}
				this.updateSelectAllStatus()
			},
			
			// 更新全选状态
			updateSelectAllStatus() {
				this.isAllSelected = this.selectedApplications.length === this.filteredApplications.length && this.filteredApplications.length > 0
			},
			
			// 批量通过
			batchPass() {
				if (this.selectedApplications.length === 0) {
					uni.showToast({
						title: '请选择要操作的申请',
						icon: 'none'
					})
					return
				}
				
				// 设置为批量操作模式并显示部门选择弹窗
				this.isBatchOperation = true
				this.selectedDepartments = []
				this.showDepartmentModal = true
			},
			
			// 批量拒绝
			async batchReject() {
				if (this.selectedApplications.length === 0) {
					uni.showToast({
						title: '请选择要操作的申请',
						icon: 'none'
					})
					return
				}
				
				uni.showModal({
					title: '确认操作',
					content: `确定要拒绝选中的 ${this.selectedApplications.length} 个申请吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								const promises = this.selectedApplications.map(appId =>
									uniCloud.callFunction({
										name: 'application',
										data: { 
											type: 'update_status',
											applicationId: appId, 
											status: 'first_failed' 
										}
									})
								)
								await Promise.all(promises)
								await this.refreshAfterOperation()
								this.selectedApplications = []
								this.isAllSelected = false
								uni.showToast({ title: '操作成功', icon: 'success' })
							} catch (err) {
								// 批量拒绝失败
								uni.showToast({ title: '操作失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			

			
			// 查看详情
			viewDetail(app) {
				// 确保数据完整性
				if (!app.formData) {
					app.formData = {}
				}
				this.selectedApp = app
				this.showDetail = true
			},
			
			// 关闭详情
			closeDetail() {
				this.showDetail = false
				this.selectedApp = null
			},
			
			// 标记为已面试
			async markAsInterviewed(app) {
				uni.showModal({
					title: '确认操作',
					content: `确定要将 ${app.formData?.name || '该用户'} 标记为已面试吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								await uniCloud.callFunction({
									name: 'application',
									data: { 
										type: 'update_interview_status',
										applicationId: app.id, 
										interviewType: 'first',
										status: 'completed' 
									}
								})
								
								// 更新当前选中的申请对象，确保弹窗中的按钮状态正确
								if (this.selectedApp && this.selectedApp.id === app.id) {
									// 更新selectedApp的firstInterview状态
									if (!this.selectedApp.firstInterview) {
										this.selectedApp.firstInterview = {}
									}
									this.selectedApp.firstInterview.status = 'completed'
								}
								
								await this.refreshAfterOperation()
								uni.showToast({ title: '已标记为面试', icon: 'success' })
							} catch (err) {
								uni.showToast({ title: '操作失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			
			// 通过申请
			passApplication(app) {
				this.pendingApplication = app
				this.selectedDepartments = []
				this.isBatchOperation = false
				this.showDepartmentModal = true
			},
			
			// 拒绝申请
			async rejectApplication(app) {
				uni.showModal({
					title: '确认操作',
					content: `确定要拒绝 ${app.formData?.name || '该用户'} 的申请吗？`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								await uniCloud.callFunction({
									name: 'application',
									data: { 
										type: 'update_status',
										applicationId: app.id, 
										status: 'first_failed' 
									}
								})
								await this.refreshAfterOperation()
								this.closeDetail()
								uni.showToast({ title: '操作成功', icon: 'success' })
							} catch (err) {
								// 拒绝申请失败
								uni.showToast({ title: '操作失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			
			// 安排面试
			scheduleInterview(app) {
				uni.showToast({
					title: '功能开发中',
					icon: 'none'
				})
			},
			
			// 多选部门变化
			onDepartmentsChange(e) {
				this.selectedDepartments = e.detail.value
			},
			
			// 关闭部门选择弹窗
			closeDepartmentModal() {
				this.showDepartmentModal = false
				this.selectedDepartments = []
				this.pendingApplication = null
				this.isBatchOperation = false
			},
			
			// 确认通过申请
			async confirmPassApplication() {
				if (this.isBatchOperation) {
					// 批量操作
					if (this.selectedDepartments.length === 0) {
						uni.showToast({ title: '请选择至少一个部门', icon: 'none' })
						return
					}
					
					uni.showLoading({ title: '批量处理中...' })
					try {
						// 每个申请通过到所有选中的部门
						const promises = this.selectedApplications.map(appId => {
							return uniCloud.callFunction({
								name: 'application',
								data: { 
									type: 'update_status',
									applicationId: appId, 
									status: 'first_passed',
									departments: this.selectedDepartments // 传递所有选中的部门
								}
							})
						})
						
						await Promise.all(promises)
						await this.refreshAfterOperation()
						this.selectedApplications = []
						this.isAllSelected = false
						this.closeDepartmentModal()
						
						const deptText = this.selectedDepartments.join('、')
						uni.showToast({ 
							title: `已批量通过到：${deptText}`, 
							icon: 'success',
							duration: 3000
						})
					} catch (err) {
						// 批量通过失败
						uni.showToast({ title: '批量操作失败', icon: 'none' })
					} finally {
						uni.hideLoading()
					}
				} else {
					// 单个操作 - 现在也支持多部门选择
					if (this.selectedDepartments.length === 0) {
						uni.showToast({ title: '请选择至少一个部门', icon: 'none' })
						return
					}
					
					if (!this.pendingApplication) {
						uni.showToast({ title: '未找到申请信息', icon: 'none' })
						return
					}
					
					uni.showLoading({ title: '处理中...' })
					try {
						await uniCloud.callFunction({
							name: 'application',
							data: { 
								type: 'update_status',
								applicationId: this.pendingApplication.id, 
								status: 'first_passed',
								departments: this.selectedDepartments // 传递所有选中的部门
							}
						})
						await this.refreshAfterOperation()
						this.closeDepartmentModal()
						this.closeDetail()
						
						const deptText = this.selectedDepartments.join('、')
						uni.showToast({ title: `已通过一面`, icon: 'success' })
					} catch (err) {
						// 通过申请失败
						uni.showToast({ title: '操作失败', icon: 'none' })
					} finally {
						uni.hideLoading()
					}
				}
			},
			
			// 撤销申请状态
			async undoApplication(app) {
				let statusText = '操作'
				let isInterviewed = false
				
				if (app.status === 'first_passed') {
					statusText = '一面通过'
				} else if (app.status === 'waiting_second') {
					statusText = '等待二面'
				} else if (app.status === 'first_failed') {
					statusText = '一面不通过'
				} else if (app.status === 'first_reject') {
					statusText = '用户拒绝二面'
				} else if (app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed') {
					statusText = '已面试'
					isInterviewed = true
				}
				
				// 根据状态确定撤销后的目标状态
				let targetStatus = 'waiting_first'
				let targetStatusText = '等待一面状态'
				
				// 对于一面相关状态，撤销后应该回到已面试状态
				if (['first_passed', 'first_failed', 'first_reject', 'waiting_second'].includes(app.status)) {
					targetStatus = 'waiting_first'
					targetStatusText = '已面试状态'
					// 只有从已面试状态撤销才需要特殊处理
					if (app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed') {
						isInterviewed = true
					}
				}
				
				uni.showModal({
					title: '确认撤销',
					content: `确定要撤销 ${app.formData?.name || '该用户'} 的${statusText}状态吗？撤销后将重新回到${targetStatusText}。`,
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								if (isInterviewed) {
									// 撤销已面试状态，将状态改回pending
									await uniCloud.callFunction({
										name: 'application',
										data: { 
											type: 'update_interview_status',
											applicationId: app.id, 
											interviewType: 'first',
											status: 'pending'
										}
									})
								} else {
									// 撤销其他状态
									await uniCloud.callFunction({
										name: 'application',
										data: { 
											type: 'update_status',
											applicationId: app.id, 
											status: targetStatus
										}
									})
								}
								await this.refreshAfterOperation()
								this.closeDetail()
								uni.showToast({ title: '已撤销操作', icon: 'success' })
							} catch (err) {
								// 撤销操作失败
								uni.showToast({ title: '撤销失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			
			// 管理员帮用户选择继续二面
			async helpContinueSecond(app) {
				uni.showModal({
					title: '确认操作',
					content: `确定要帮 ${app.formData?.name || '该用户'} 选择继续参加二面吗？\n\n此操作将直接将该申请状态更新为"等待二面"。`,
					confirmText: '确定继续',
					cancelText: '取消',
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								await uniCloud.callFunction({
									name: 'application',
									data: { 
										type: 'update_status',
										applicationId: app.id, 
										status: 'waiting_second'
									}
								})
								await this.refreshAfterOperation()
								this.closeDetail()
								uni.showToast({ 
									title: '已帮用户选择继续二面', 
									icon: 'success',
									duration: 2000
								})
							} catch (err) {
								console.error('帮用户选择继续二面失败:', err)
								uni.showToast({ 
									title: err.message || '操作失败', 
									icon: 'none' 
								})
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			
			// 管理员帮用户选择拒绝二面
			async helpRejectSecond(app) {
				uni.showModal({
					title: '确认操作',
					content: `确定要帮 ${app.formData?.name || '该用户'} 选择拒绝参加二面吗？\n\n此操作将直接将该申请状态更新为"一面未通过"。`,
					confirmText: '确定拒绝',
					cancelText: '取消',
					success: async (res) => {
						if (res.confirm) {
							uni.showLoading({ title: '处理中...' })
							try {
								await uniCloud.callFunction({
									name: 'application',
									data: { 
										type: 'update_status',
										applicationId: app.id, 
										status: 'first_failed'
									}
								})
								await this.refreshAfterOperation()
								this.closeDetail()
								uni.showToast({ 
									title: '已帮用户选择拒绝二面', 
									icon: 'success',
									duration: 2000
								})
							} catch (err) {
								console.error('帮用户选择拒绝二面失败:', err)
								uni.showToast({ 
									title: err.message || '操作失败', 
									icon: 'none' 
								})
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			
			// 获取状态样式
			getStatusClass(status, app = null) {
				// 特殊处理：如果用户是等待一面且firstInterview.status为completed，显示为已面试样式
				if (status === 'waiting_first' && app && app.firstInterview && app.firstInterview.status === 'completed') {
					return 'status-interviewed'
				}
				
				const classMap = {
					waiting_first: 'status-pending',
					interviewed: 'status-interviewed',
					first_passed: 'status-passed',
					first_failed: 'status-failed',
					first_reject: 'status-failed',
					waiting_second: 'status-interview',
					second_failed: 'status-failed',
					department_selection: 'status-selection',
					accepted: 'status-passed'
				}
				return classMap[status] || 'status-pending'
			},
			
			// 获取状态文本
			getStatusText(status, app = null) {
				// 特殊处理：如果用户是等待一面且firstInterview.status为completed，显示为已面试
				if (status === 'waiting_first' && app && app.firstInterview && app.firstInterview.status === 'completed') {
					return '已面试'
				}
				
				const textMap = {
					waiting_first: '等待一面',
					interviewed: '已面试',
					first_passed: '一面通过',
					first_failed: '一面不通过',
					first_reject: '一面拒绝',
					waiting_second: '等待二面',
					second_failed: '二面不通过',
					department_selection: '选择部门',
					accepted: '已录取'
				}
				return textMap[status] || '等待一面'
			},
			
			// 获取一面通过的部门信息
			getFirstPassedDepartments(app) {
				// 统一使用applications集合中的firstInterview.passedDepartments
				if (app.firstInterview && app.firstInterview.passedDepartments) {
					if (Array.isArray(app.firstInterview.passedDepartments) && app.firstInterview.passedDepartments.length > 0) {
						return app.firstInterview.passedDepartments.join('、')
					}
					if (typeof app.firstInterview.passedDepartments === 'string' && app.firstInterview.passedDepartments.trim()) {
						return app.firstInterview.passedDepartments
					}
				}
				
				// 如果状态表明已通过一面，但没有具体部门信息
				if (app.status === 'first_passed' || 
					app.status === 'waiting_second' || 
					app.status === 'department_selection' || 
					app.status === 'accepted' || 
					app.status === 'second_failed' ||
					app.status === 'first_reject' ||
					app.status === 'rejected') {
					return '已通过（部门信息缺失）'
				}
				
				return ''
			},
			
			// 获取二面通过的部门信息
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
				return '待用户确认'
			},
			
			// 获取新的状态样式类
			getNewStatusClass(status, type = 'application') {
				if (type === 'interview') {
					// 面试状态的样式
					const classMap = {
						pending: 'status-new-pending',
						completed: 'status-new-passed',
						pass: 'status-new-passed',
						fail: 'status-new-failed'
					}
					return classMap[status] || 'status-new-pending'
				} else {
					// 申请状态的样式
					const classMap = {
						waiting_first: 'status-new-pending',
						first_failed: 'status-new-failed',
						waiting_second: 'status-new-interview',
						second_failed: 'status-new-failed',
						department_selection: 'status-new-selection',
						accepted: 'status-new-completed'
					}
					return classMap[status] || 'status-new-pending'
				}
			},
			
			// ========== 导出功能 ==========
			// 导出全部数据
			async exportAllData() {
				try {
					const csvData = this.generateCSV(this.applications)
					await this.downloadCSV(csvData, '全部报名数据.csv')
				} catch (err) {
					console.error('导出失败:', err)
					uni.showToast({ title: '导出失败', icon: 'none' })
				}
			},
			
			// 显示导出选项
			showExportOptions() {
				this.showExportModal = true
			},
			
			// 关闭导出弹窗
			closeExportModal() {
				this.showExportModal = false
			},
			
			
			// 导出状态变化
			onExportStatusChange(e) {
				this.exportOptions.status = e.detail.value
			},
			
			// 导出部门变化
			onExportDeptChange(e) {
				this.exportOptions.departments = e.detail.value
			},
			
			// 切换所有导出状态
			toggleAllExportStatus() {
				if (this.isAllExportStatusSelected) {
					// 如果全部选中，则取消所有选择
					this.exportOptions.status = []
				} else {
					// 如果未全部选中，则选择所有状态
					this.exportOptions.status = ['waiting_first', 'interviewed', 'first_passed', 'first_failed', 'first_reject', 'waiting_second', 'second_failed', 'department_selection', 'accepted']
				}
			},
			
			// 执行导出
			async executeExport() {
				try {
					let dataToExport = []
					
					// 默认导出全部数据
					dataToExport = this.applications
					
					// 按状态筛选
					if (this.exportOptions.status.length > 0) {
						dataToExport = dataToExport.filter(app => {
							// 特殊处理：已面试状态
							if (this.exportOptions.status.includes('interviewed')) {
								if (app.status === 'waiting_first' && app.firstInterview && app.firstInterview.status === 'completed') {
									return true
								}
							}
							return this.exportOptions.status.includes(app.status)
						})
					}
					
					// 按部门筛选
					if (this.exportOptions.departments.length > 0) {
						dataToExport = dataToExport.filter(app => {
							return this.exportOptions.departments.some(dept => (app.departments || '').includes(dept))
						})
					}
					
					if (dataToExport.length === 0) {
						uni.showToast({ title: '没有符合条件的数据', icon: 'none' })
						return
					}
					
					const csvData = this.generateCSV(dataToExport)
					const now = new Date()
			const year = now.getFullYear()
			const month = String(now.getMonth() + 1).padStart(2, '0')
			const day = String(now.getDate()).padStart(2, '0')
			await this.downloadCSV(csvData, `报名数据_${year}年${month}月${day}日.csv`)
					this.closeExportModal()
				} catch (err) {
					// 导出失败
					uni.showToast({ title: '导出失败', icon: 'none' })
				}
			},
			
			// 生成CSV数据
			generateCSV(data) {
				const headers = ['姓名', '学号', '性别', '专业班级', '宿舍号', '手机号码', '意向部门', '报名时间', '状态', '自我介绍']
				const csvContent = [headers.join(',')]
				
				data.forEach(app => {
					const row = [
						app.formData?.name || '',
						app.formData?.studentId || '',
						app.formData?.gender || '',
						app.formData?.major || '',
						app.formData?.dormitory || '',
						app.formData?.phone || '',
						app.departments || '',
						app.applyTime || '',
						this.getStatusText(app.status),
						(app.formData?.introduction || '').replace(/,/g, '，').replace(/\n/g, ' ')
					]
					csvContent.push(row.map(field => `"${field}"`).join(','))
				})
				
				return csvContent.join('\n')
			},
			
			// 下载CSV文件
			async downloadCSV(csvData, filename) {
				try {
					// 在微信小程序中，保存到用户可访问的位置
					// #ifdef MP-WEIXIN
					// 直接保存文件，不需要特殊权限
					this.saveFileToAlbum(csvData, filename)
					// #endif
					
					// 在其他平台中，显示数据内容供复制
					// #ifndef MP-WEIXIN
					uni.showModal({
						title: '导出成功',
						content: `文件已生成：${filename}\n\n请点击确定复制数据内容`,
						success: (res) => {
							if (res.confirm) {
								uni.setClipboardData({
									data: '\uFEFF' + csvData,
									success: () => {
										uni.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
									},
									fail: () => {
										uni.showToast({ title: '复制失败，请重试', icon: 'none' })
									}
								})
							}
						}
					})
					// #endif
				} catch (err) {
					console.error('下载CSV失败:', err)
					uni.showToast({ title: '下载失败', icon: 'none' })
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
										uni.showToast({ title: '文件保存成功', icon: 'success' })
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
													uni.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
												},
												fail: () => {
													uni.showToast({ title: '复制失败', icon: 'none' })
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
											uni.showToast({ title: '数据已复制到剪贴板', icon: 'success' })
										},
										fail: () => {
											uni.showToast({ title: '复制失败', icon: 'none' })
										}
									})
								}
							}
						})
					}
				})
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
				this.closeHistoryModal()
			},
			
			// 关闭通知弹窗
			closeNotificationModal() {
				this.showNotificationModal = false
			},
			
			// 通知目标变化
			onNotificationTargetChange(e) {
				this.notificationTargetIndex = e.detail.value
				const targets = ['all', 'waiting_first', 'interviewed', 'first_passed', 'waiting_second', 'first_failed', 'first_reject', 'department_selection', 'second_failed', 'accepted']
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
						// 刷新历史通知
						if (this.showHistoryModal) {
							this.loadNotificationHistory()
						}
					} else {
						uni.showToast({ title: result.result?.error || '发送失败', icon: 'none' })
					}
				} catch (error) {
					uni.hideLoading()
					console.error('发送通知失败:', error)
					uni.showToast({ title: '发送失败，请重试', icon: 'none' })
				}
			},
			
			// ========== 历史通知功能 ==========
			// 显示历史通知
			async showNotificationHistory() {
				this.showHistoryModal = true
				await this.loadNotificationHistory()
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
						this.notificationHistory = result.result.data || []
					} else {
						this.notificationHistory = []
					}
				} catch (err) {
					console.error('加载历史通知失败:', err)
					this.notificationHistory = []
				}
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
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}
				
				uni.showLoading({ title: '保存中...' })
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
					
					if (result.result && result.result.success) {
						uni.showToast({ title: '保存成功', icon: 'success' })
						this.closeEditNotificationModal()
						await this.loadNotificationHistory()
					} else {
						throw new Error(result.result?.error || '保存失败')
					}
				} catch (err) {
					console.error('更新通知失败:', err)
					uni.showToast({ title: '保存失败', icon: 'none' })
				} finally {
					uni.hideLoading()
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
										notificationId: notificationId
									}
								})
								
								if (result.result && result.result.success) {
									uni.showToast({ title: '删除成功', icon: 'success' })
									await this.loadNotificationHistory()
								} else {
									throw new Error(result.result?.error || '删除失败')
								}
							} catch (err) {
								console.error('删除通知失败:', err)
								uni.showToast({ title: '删除失败', icon: 'none' })
							} finally {
								uni.hideLoading()
							}
						}
					}
				})
			},
			
			// ========== 工具方法 ==========
			// 格式化时间 - 使用中国人习惯的格式
			formatTime(time) {
				if (!time) return '未知时间'
				try {
					const date = new Date(time)
					const now = new Date()
					const diffMs = now.getTime() - date.getTime()
					const diffMinutes = Math.floor(diffMs / (1000 * 60))
					const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
					const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
					
					// 智能时间显示 - 通知场景适合相对时间
					if (diffMinutes < 1) {
						return '刚刚'
					} else if (diffMinutes < 60) {
						return `${diffMinutes}分钟前`
					} else if (diffHours < 24) {
						return `${diffHours}小时前`
					} else if (diffDays < 7) {
						const hours = String(date.getHours()).padStart(2, '0')
						const minutes = String(date.getMinutes()).padStart(2, '0')
						if (diffDays === 1) {
							return `昨天 ${hours}:${minutes}`
						} else if (diffDays === 2) {
							return `前天 ${hours}:${minutes}`
						} else {
							return `${diffDays}天前`
						}
					} else {
						// 超过7天显示完整日期时间
						const year = date.getFullYear()
						const month = String(date.getMonth() + 1).padStart(2, '0')
						const day = String(date.getDate()).padStart(2, '0')
						const hours = String(date.getHours()).padStart(2, '0')
						const minutes = String(date.getMinutes()).padStart(2, '0')
						return `${year}年${month}月${day}日 ${hours}:${minutes}`
					}
				} catch (e) {
					return '未知时间'
				}
			},
			
			// 获取目标文本
			getTargetText(target) {
				const typeMap = {
					all: '全体用户',
					waiting_first: '等待一面',
					interviewed: '已面试',
					first_passed: '一面通过',
					waiting_second: '等待二面',
					first_failed: '一面不通过',
					first_reject: '一面拒绝',
					department_selection: '部门选择',
					second_failed: '二面不通过',
					accepted: '已录取',
					selected: '选择用户'
				}
				return typeMap[target] || '未知'
			},
			
			// ========== 下拉刷新功能 ==========
			// 下拉刷新处理
			async onRefresh() {
				this.isRefreshing = true
				try {
					await this.loadApplications()
					// 重置定时器
					this.startAutoRefresh()
				} catch (err) {
					// 静默处理错误，不显示弹窗
					console.error('下拉刷新失败:', err)
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
			
			// ========== 自动刷新功能 ==========
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
				
				// 清理搜索定时器
				if (this.searchTimer) {
					clearTimeout(this.searchTimer)
					this.searchTimer = null
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
			
			// 手动刷新数据
			async handleManualRefresh() {
				try {
					await this.loadApplications()
					// 手动刷新不重新启动自动刷新定时器
					uni.showToast({ title: '刷新成功', icon: 'success' })
				} catch (err) {
					console.error('手动刷新失败:', err)
					uni.showToast({ title: '刷新失败', icon: 'none' })
				}
			},
			
			// ========== 修改报名信息功能 ==========
			// 显示修改报名信息弹窗
			showEditApplication() {
				if (!this.selectedApp) return
				
				// 调试信息
				console.log('原始部门数据:', this.selectedApp.departments)
				console.log('原始申请数据:', this.selectedApp)
				
				// 填充表单数据，空值字段置空
				this.editForm = {
					name: this.selectedApp.formData?.name || '',
					studentId: this.selectedApp.formData?.studentId || '',
					gender: this.selectedApp.formData?.gender || '',
					major: this.selectedApp.formData?.major || '',
					dormitory: this.selectedApp.formData?.dormitory || '',
					phone: this.selectedApp.formData?.phone || '',
					departments: this.parseDepartments(this.selectedApp.departments),
					introduction: this.selectedApp.formData?.introduction || ''
				}
				
				// 调试信息
				console.log('解析后的部门数据:', this.editForm.departments)
				
				this.showEditModal = true
			},
			
			// 关闭修改弹窗
			closeEditModal() {
				this.showEditModal = false
				this.editForm = {
					name: '',
					studentId: '',
					gender: '',
					major: '',
					dormitory: '',
					phone: '',
					departments: [],
					introduction: ''
				}
			},
			
			
			// 解析部门信息
			parseDepartments(departmentsStr) {
				console.log('开始解析部门数据:', departmentsStr, '类型:', typeof departmentsStr)
				
				if (!departmentsStr || departmentsStr === '未知部门') {
					console.log('部门数据为空或未知部门')
					return []
				}
				
				let result = []
				
				// 如果已经是数组，直接返回
				if (Array.isArray(departmentsStr)) {
					result = departmentsStr.filter(dept => dept && dept.trim())
				} else {
					// 处理字符串格式
					const str = departmentsStr.toString()
					
					// 处理不同的部门格式
					if (str.includes('第一志愿：') && str.includes('第二志愿：')) {
						// 第一志愿、第二志愿格式
						const parts = str.split('，')
						parts.forEach(part => {
							if (part.includes('第一志愿：')) {
								result.push(part.replace('第一志愿：', '').trim())
							} else if (part.includes('第二志愿：')) {
								result.push(part.replace('第二志愿：', '').trim())
							}
						})
					} else if (str.includes('、')) {
						// 顿号分隔格式
						result = str.split('、').map(dept => dept.trim()).filter(dept => dept)
					} else if (str.includes('，')) {
						// 逗号分隔格式
						result = str.split('，').map(dept => dept.trim()).filter(dept => dept)
					} else if (str.includes(',')) {
						// 英文逗号分隔格式
						result = str.split(',').map(dept => dept.trim()).filter(dept => dept)
					} else {
						// 单个部门
						const trimmed = str.trim()
						result = trimmed ? [trimmed] : []
					}
				}
				
				// 过滤掉无效的部门名称
				const validDepartments = ['策划部', '执行部', '宣传部']
				result = result.filter(dept => validDepartments.includes(dept))
				
				console.log('解析结果:', result)
				return result
			},
			
			// 选择性别
			selectEditGender(gender) {
				this.editForm.gender = gender
			},
			
			// 切换部门选择
			toggleEditDepartment(deptName) {
				const index = this.editForm.departments.indexOf(deptName)
				if (index > -1) {
					// 如果已选择，则取消选择
					this.editForm.departments.splice(index, 1)
				} else {
					// 如果未选择，检查是否已达到最大选择数量
					if (this.editForm.departments.length >= 2) {
						uni.showToast({
							title: '最多只能选择2个部门',
							icon: 'none'
						})
						return
					}
					// 检查是否已经选择了相同的部门（防止重复）
					if (!this.editForm.departments.includes(deptName)) {
						this.editForm.departments.push(deptName)
					}
				}
			},
			
			// 保存修改
			async saveEditApplication() {
				// 表单验证
				if (!this.editForm.name.trim()) {
					uni.showToast({ title: '请输入昵称', icon: 'none' })
					return
				}
				if (this.editForm.departments.length === 0) {
					uni.showToast({ title: '请至少选择一个部门', icon: 'none' })
					return
				}
				if (!this.editForm.introduction.trim()) {
					uni.showToast({ title: '请填写自我介绍', icon: 'none' })
					return
				}
				if (this.editForm.introduction.trim().length < 50) {
					uni.showToast({ title: '自我介绍至少50字', icon: 'none' })
					return
				}
				
				this.savingEdit = true
				uni.showLoading({ title: '保存中...' })
				
				try {
					// 构建更新数据
					const updateData = {
						name: this.editForm.name,
						studentId: this.editForm.studentId,
						gender: this.editForm.gender,
						major: this.editForm.major,
						dormitory: this.editForm.dormitory,
						phone: this.editForm.phone,
						introduction: this.editForm.introduction,
						departments: this.editForm.departments
					}
					
					// 调用云函数更新申请信息
					const result = await uniCloud.callFunction({
						name: 'application',
						data: {
							type: 'update_application_info',
							applicationId: this.selectedApp.id,
							updateData: updateData
						}
					})
					
					if (result.result && result.result.success) {
						uni.showToast({ title: '修改成功', icon: 'success' })
						this.closeEditModal()
						this.closeDetail()
						await this.refreshAfterOperation()
					} else {
						throw new Error(result.result?.error || '修改失败')
					}
				} catch (err) {
					console.error('修改报名信息失败:', err)
					uni.showToast({ title: err.message || '修改失败', icon: 'none' })
				} finally {
					this.savingEdit = false
					uni.hideLoading()
				}
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
		display: block;
		margin-bottom: 6px;
		font-weight: 500;
	}
	
	.filter-picker {
		width: 100%;
		height: 36px;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		display: flex;
		align-items: center;
		padding: 0 10px;
		box-sizing: border-box;
	}
	
	.picker-text {
		font-size: 13px;
		color: #2c3e50;
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
		height: 36px;
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 0 10px;
		font-size: 13px;
		box-sizing: border-box;
	}
	
	.search-btn {
		width: 70px;
		height: 36px;
		background: #4A90E2;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 13px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		cursor: pointer;
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
		justify-content: space-between;
	}
	
	.stats-item {
		text-align: center;
		flex: 1;
	}
	
	.stats-number {
		font-size: 20px;
		font-weight: 600;
		color: #4A90E2;
		display: block;
		margin-bottom: 4px;
	}
	
	.stats-label {
		font-size: 12px;
		color: #7f8c8d;
	}
	
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
		color: #2c3e50;
	}
	
	.select-all {
		padding: 8px 16px;
		background: #f8f9fa;
		border-radius: 6px;
		cursor: pointer;
	}
	
	.select-text {
		font-size: 14px;
		color: #4A90E2;
	}
	
	/* 快捷操作样式 */
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
		color: #2c3e50;
		margin-bottom: 12px;
		display: block;
	}
	
	.action-buttons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	
	.action-btn {
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 14px;
		border: none;
		cursor: pointer;
		min-width: 80px;
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
		max-height: 85vh;
		overflow: hidden;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		display: flex;
		flex-direction: column;
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
	
	/* 导出选项样式 */
	.export-options {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	
	.option-group {
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 16px;
	}
	
	.option-title {
		font-size: 14px;
		font-weight: 600;
		color: #2c3e50;
		margin-bottom: 12px;
		display: block;
	}
	
	.radio-item, .checkbox-item {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
		cursor: pointer;
	}
	
	.radio-item:last-child, .checkbox-item:last-child {
		margin-bottom: 0;
	}
	
	/* 表单样式 */
	.form-group {
		margin-bottom: 16px;
	}
	
	.form-label {
		font-size: 14px;
		color: #2c3e50;
		margin-bottom: 8px;
		display: block;
	}
	
	.form-input {
		width: 100%;
		height: 44px;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 0 12px;
		font-size: 14px;
		box-sizing: border-box;
	}
	
	.form-textarea {
		width: 100%;
		min-height: 80px;
		border: 1px solid #e9ecef;
		border-radius: 6px;
		padding: 12px;
		font-size: 14px;
		resize: vertical;
		box-sizing: border-box;
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
	}
	
	.notification-meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
	}
	
	.notification-time {
		font-size: 12px;
		color: #7f8c8d;
	}
	
	.notification-actions {
		display: flex;
		gap: 8px;
	}
	
	.notification-content {
		margin-bottom: 12px;
		line-height: 1.5;
		color: #2c3e50;
	}
	
	.notification-footer {
		display: flex;
		justify-content: space-between;
		font-size: 12px;
		color: #7f8c8d;
	}
	
	.notification-target, .notification-status {
		font-size: 12px;
		color: #7f8c8d;
	}
	
	/* 按钮样式 */
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
	
	.btn-small {
		padding: 4px 8px;
		font-size: 12px;
		border-radius: 4px;
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	
	.btn-primary:disabled, .btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.select-all {
		padding: 8px 16px;
		background: #f8f9fa;
		border-radius: 8px;
	}
	
	.select-text {
		font-size: 14px;
		color: #4A90E2;
	}
	
	.batch-actions {
		display: flex;
		gap: 12px;
	}
	
	.batch-btn {
		flex: 1;
		height: 36px;
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}
	
	.applications-section {
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
	
	.applications-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
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
		background: #cce5ff;
		color: #004085;
	}
	
	.status-selection {
		background: #e2e3e5;
		color: #383d41;
	}
	
	.status-passed {
		background: #d4edda;
		color: #155724;
	}
	
	.status-failed {
		background: #f8d7da;
		color: #721c24;
	}
	
	.status-interviewed {
		background: #d1ecf1;
		color: #0c5460;
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
	
	/* 一面通过部门绿色字体样式 */
	.first-passed-dept {
		color: #28a745 !important;
		font-weight: 600;
	}
	
	.app-actions {
		display: flex;
		gap: 6px;
		width: 100%;
		box-sizing: border-box;
	}
	
	.action-btn {
		flex: 1;
		height: 36px;
		border-radius: 8px;
		font-size: 13px;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		cursor: pointer;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
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
	
	.interview-btn {
		background: #cce5ff;
		color: #004085;
	}
	
	.undo-btn {
		background: #fff3cd;
		color: #856404;
	}
	
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
		flex-direction: column;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e9ecef;
		flex-shrink: 0;
		background: #f8f9fa;
	}
	
	.action-row {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	
	.edit-action {
		justify-content: center;
		padding-top: 8px;
		border-top: 1px solid #e9ecef;
	}
	
	.detail-footer button {
		height: 40px;
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
		min-width: 80px;
		white-space: nowrap;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		transition: all 0.3s ease;
		font-weight: 500;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}
	
	.detail-footer button:active {
		transform: translateY(1px);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
	
	.btn-primary {
		background: linear-gradient(135deg, #007bff, #0056b3);
		color: white;
	}
	
	.btn-primary:hover {
		background: linear-gradient(135deg, #0056b3, #004085);
	}
	
	.btn-secondary {
		background: linear-gradient(135deg, #6c757d, #5a6268);
		color: white;
	}
	
	.btn-secondary:hover {
		background: linear-gradient(135deg, #5a6268, #495057);
	}
	
	.btn-danger {
		background: linear-gradient(135deg, #dc3545, #c82333);
		color: white;
	}
	
	.btn-danger:hover {
		background: linear-gradient(135deg, #c82333, #bd2130);
	}
	
	.btn-warning {
		background: linear-gradient(135deg, #ffc107, #e0a800);
		color: #212529;
	}
	
	.btn-warning:hover {
		background: linear-gradient(135deg, #e0a800, #d39e00);
	}
	
	.btn-info {
		background: linear-gradient(135deg, #17a2b8, #138496);
		color: white;
	}
	
	.btn-info:hover {
		background: linear-gradient(135deg, #138496, #117a8b);
	}
	
	/* 批量操作相关样式 */
	.batch-info {
		margin-top: 16px;
		padding: 12px;
		background: #f8f9fa;
		border-radius: 8px;
		border-left: 4px solid #007bff;
	}
	
	.info-text {
		display: block;
		font-size: 14px;
		color: #495057;
		margin-bottom: 4px;
	}
	
	.info-text:last-child {
		margin-bottom: 0;
	}
	
	/* 复选框样式 */
	.checkbox-item {
		display: flex;
		align-items: center;
		margin-bottom: 12px;
		padding: 8px;
		border-radius: 6px;
		transition: background-color 0.2s;
	}
	
	.checkbox-item:hover {
		background: #f8f9fa;
	}
	
	.checkbox-item text {
		margin-left: 8px;
		font-size: 14px;
		color: #2c3e50;
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
	
	.status-item:hover {
		background: #f8f9fa;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.status-item text {
		font-size: 13px;
		color: #2c3e50;
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
	
	/* 面试结果样式 */
	.first-passed-dept {
		color: #28a745;
		font-weight: 500;
	}
	
	.second-passed-dept {
		color: #007bff;
		font-weight: 500;
	}
	
	.final-dept {
		color: #dc3545;
		font-weight: 600;
		background: #fff5f5;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #fecaca;
	}
	
	/* 等待用户选择样式 */
	.waiting-choice {
		color: #f39c12;
		font-weight: 500;
		font-style: italic;
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
	
	/* 修改报名信息按钮样式 */
	.btn-edit {
		background: linear-gradient(135deg, #17a2b8, #138496);
		color: white;
		height: 44px;
		border: none;
		border-radius: 12px;
		padding: 12px 24px;
		font-size: 15px;
		cursor: pointer;
		min-width: 160px;
		white-space: nowrap;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: all 0.3s ease;
		font-weight: 600;
		box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
		position: relative;
		overflow: hidden;
	}
	
	.btn-edit::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}
	
	.btn-edit:hover::before {
		left: 100%;
	}
	
	.btn-edit:hover {
		background: linear-gradient(135deg, #138496, #117a8b);
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(23, 162, 184, 0.4);
	}
	
	.btn-edit:active {
		transform: translateY(0);
		box-shadow: 0 2px 8px rgba(23, 162, 184, 0.3);
	}
	
	.btn-icon {
		font-size: 16px;
		display: inline-block;
	}
	
	.btn-text {
		font-size: 15px;
		font-weight: 600;
		letter-spacing: 0.5px;
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
	
	/* 部门选择样式 */
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
		cursor: pointer;
	}
	
	.dept-option.selected {
		border-color: #4A90E2;
		background: #f0f8ff;
		box-shadow: 0 2px 8px rgba(74, 144, 226, 0.2);
		transform: translateY(-1px);
	}
	
	.dept-option.selected .dept-option-icon {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
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
	
	/* 字符计数样式 */
	.char-count {
		font-size: 12px;
		color: #7f8c8d;
		text-align: right;
		margin-top: 4px;
	}
	
	/* 修改报名信息弹窗底部按钮样式 */
	.edit-modal-footer {
		padding: 16px 20px;
		background: #f8f9fa;
		border-top: 1px solid #e9ecef;
	}
	
	.edit-modal-footer .btn-small {
		height: 36px;
		padding: 8px 20px;
		font-size: 14px;
		min-width: 80px;
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