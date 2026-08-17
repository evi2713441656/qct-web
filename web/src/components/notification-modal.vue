<template>
	<view v-if="visible" class="modal-overlay" @click="$emit('close')">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">发送通知</text>
				<text class="close-btn" @click="$emit('close')">×</text>
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
				<button class="btn-secondary" @click="$emit('close')">取消</button>
				<button class="btn-primary" @click="sendNotification">发送</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		props: {
			visible: {
				type: Boolean,
				default: false
			}
		},
		data() {
			return {
				notificationForm: {
					title: '',
					content: '',
					target: 'all'
				},
				notificationTargetIndex: 0,
				notificationTargetOptions: ['全体用户', '等待一面', '一面通过', '等待二面', '一面未通过', '部门选择', '二面未通过', '已录取']
			}
		},
		methods: {
			onNotificationTargetChange(e) {
				this.notificationTargetIndex = e.detail.value
				const targets = ['all', 'waiting_first', 'first_passed', 'waiting_second', 'first_failed', 'department_selection', 'second_failed', 'accepted']
				this.notificationForm.target = targets[e.detail.value]
			},
			
			sendNotification() {
				if (!this.notificationForm.title || !this.notificationForm.content) {
					uni.showToast({ title: '请填写完整信息', icon: 'none' })
					return
				}
				
				this.$emit('send', this.notificationForm)
				this.resetForm()
			},
			
			resetForm() {
				this.notificationForm = {
					title: '',
					content: '',
					target: 'all'
				}
				this.notificationTargetIndex = 0
			}
		},
		watch: {
			visible(newVal) {
				if (newVal) {
					this.resetForm()
				}
			}
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
		max-width: 500px;
		max-height: 80vh;
		overflow: hidden;
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
	
	.form-group {
		margin-bottom: 20px;
	}
	
	.form-label {
		font-size: 14px;
		font-weight: 600;
		color: #333;
		margin-bottom: 8px;
		display: block;
	}
	
	.form-input {
		width: 100%;
		padding: 12px;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		font-size: 14px;
		background: #f8f9fa;
		min-height: 44px;
		box-sizing: border-box;
	}
	
	.form-textarea {
		width: 100%;
		min-height: 100px;
		padding: 12px;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		font-size: 14px;
		background: #f8f9fa;
		resize: vertical;
	}
	
	.radio-item {
		display: flex;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.radio-item:last-child {
		border-bottom: none;
	}
	
	.radio-item .radio-input {
		margin-right: 8px;
	}
	
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		padding: 20px;
		border-top: 1px solid #e9ecef;
	}
	
	.btn-primary {
		background: #007bff;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
	}
	
	.btn-secondary {
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 14px;
		cursor: pointer;
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
</style>