<template>
	<view v-if="visible" class="modal-overlay" @click="$emit('close')">
		<view class="modal-content large-modal" @click.stop>
			<view class="modal-header">
				<text class="modal-title">历史通知</text>
				<text class="close-btn" @click="$emit('close')">×</text>
			</view>
			<view class="modal-body">
				<view v-if="history.length === 0" class="empty-state">
					<text class="empty-text">暂无历史通知</text>
				</view>
				<view v-else class="notification-list">
					<view v-for="notification in history" :key="notification._id" class="notification-item">
						<view class="notification-header">
							<text class="notification-title">{{ notification.title }}</text>
							<view class="notification-meta">
								<text class="notification-time">{{ formatTime(notification.createdAt) }}</text>
								<view class="notification-actions">
									<button class="btn-small btn-primary" @click="editNotification(notification)">编辑</button>
									<button class="btn-small btn-secondary" @click="deleteNotification(notification._id)">删除</button>
								</view>
							</view>
						</view>
						<view class="notification-content">{{ notification.content }}</view>
						<view class="notification-footer">
							<text class="notification-target">发送对象：{{ getTargetText(notification.type) }}</text>
							<text class="notification-status">状态：已发送</text>
						</view>
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="$emit('close')">关闭</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { formatTime, getTargetText } from '@/utils/admin-common.js'
	
	export default {
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			history: {
				type: Array,
				default: () => []
			}
		},
		methods: {
			editNotification(notification) {
				this.$emit('edit', notification)
			},
			
			deleteNotification(notificationId) {
				this.$emit('delete', notificationId)
			},
			
			formatTime,
			getTargetText
		}
	}
</script>

<style scoped>
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
		max-width: 600px;
		max-height: 80vh;
		overflow: hidden;
	}
	
	.large-modal {
		max-width: 700px;
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
	
	.modal-body {
		padding: 20px;
		max-height: 400px;
		overflow-y: auto;
	}
	
	.empty-state {
		text-align: center;
		padding: 40px 20px;
	}
	
	.empty-text {
		font-size: 16px;
		color: #999;
	}
	
	.notification-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	
	.notification-item {
		background: #f8f9fa;
		border-radius: 8px;
		padding: 16px;
		border: 1px solid #e9ecef;
	}
	
	.notification-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 12px;
	}
	
	.notification-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
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
		color: #666;
	}
	
	.notification-actions {
		display: flex;
		gap: 8px;
	}
	
	.btn-small {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		border: none;
		cursor: pointer;
	}
	
	.btn-primary {
		background: #007bff;
		color: white;
	}
	
	.btn-secondary {
		background: #6c757d;
		color: white;
	}
	
	.notification-content {
		font-size: 14px;
		color: #333;
		line-height: 1.6;
		margin-bottom: 12px;
		background: white;
		padding: 12px;
		border-radius: 6px;
	}
	
	.notification-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 12px;
		color: #666;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e9ecef;
	}
</style>