<template>
	<view v-if="visible" class="modal-overlay" @click="$emit('close')">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">导出选项</text>
				<text class="close-btn" @click="$emit('close')">×</text>
			</view>
			<view class="modal-body">
				<view class="export-options">
					
					<!-- 状态筛选 -->
					<view class="option-group">
						<text class="option-title">状态筛选</text>
						<view class="status-filter-container">
							<view class="all-status-section">
								<label class="checkbox-item all-status-item" @click="toggleAllStatus">
									<checkbox class="checkbox-input" :checked="isAllStatusSelected" />
									<text class="all-status-label">所有状态</text>
								</label>
							</view>
							<view class="status-grid">
								<label class="status-item">
									<checkbox class="checkbox-input" value="waiting_first" :checked="exportOptions.status.includes('waiting_first')" />
									<text>等待一面</text>
								</label>
								<label class="status-item">
									<checkbox class="checkbox-input" value="first_passed" :checked="exportOptions.status.includes('first_passed')" />
									<text>一面通过</text>
								</label>
								<label class="status-item">
									<checkbox class="checkbox-input" value="first_failed" :checked="exportOptions.status.includes('first_failed')" />
									<text>一面未通过</text>
								</label>
								<label class="status-item">
									<checkbox class="checkbox-input" value="waiting_second" :checked="exportOptions.status.includes('waiting_second')" />
									<text>等待二面</text>
								</label>
								<label class="status-item">
									<checkbox class="checkbox-input" value="second_failed" :checked="exportOptions.status.includes('second_failed')" />
									<text>二面未通过</text>
								</label>
								<label class="status-item">
									<checkbox class="checkbox-input" value="department_selection" :checked="exportOptions.status.includes('department_selection')" />
									<text>选择部门</text>
								</label>
								<label class="status-item">
									<checkbox class="checkbox-input" value="accepted" :checked="exportOptions.status.includes('accepted')" />
									<text>已录取</text>
								</label>
							</view>
						</view>
					</view>
					
					<!-- 部门筛选 -->
					<view class="option-group">
						<text class="option-title">部门筛选</text>
						<checkbox-group @change="onExportDeptChange">
							<label class="checkbox-item" v-for="dept in deptOptions" :key="dept">
								<checkbox class="checkbox-input" :value="dept" :checked="exportOptions.departments.includes(dept)" />
								<text>{{ dept }}</text>
							</label>
						</checkbox-group>
					</view>
				</view>
			</view>
			<view class="modal-footer">
				<button class="btn-secondary" @click="$emit('close')">取消</button>
				<button class="btn-primary" @click="executeExport">导出</button>
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
			},
			applications: {
				type: Array,
				default: () => []
			},
			selectedApplications: {
				type: Array,
				default: () => []
			}
		},
		data() {
			return {
				exportOptions: {
					status: ['waiting_first', 'first_passed', 'first_failed', 'waiting_second', 'second_failed', 'department_selection', 'accepted'],
					departments: ['宣传部', '执行部', '策划部', '技术部', '外联部']
				},
				deptOptions: ['宣传部', '执行部', '策划部', '技术部', '外联部']
			}
		},
		computed: {
			isAllStatusSelected() {
				const allStatuses = ['waiting_first', 'first_passed', 'first_failed', 'waiting_second', 'second_failed', 'department_selection', 'accepted']
				return allStatuses.every(status => this.exportOptions.status.includes(status))
			}
		},
		methods: {
			
			onExportStatusChange(e) {
				this.exportOptions.status = e.detail.value
			},
			
			onExportDeptChange(e) {
				this.exportOptions.departments = e.detail.value
			},
			
			toggleAllStatus() {
				if (this.isAllStatusSelected) {
					// 如果全部选中，则取消所有选择
					this.exportOptions.status = []
				} else {
					// 如果未全部选中，则选择所有状态
					this.exportOptions.status = ['waiting_first', 'first_passed', 'first_failed', 'waiting_second', 'second_failed', 'department_selection', 'accepted']
				}
			},
			
			executeExport() {
				let dataToExport = []
				
				// 默认导出全部数据
				dataToExport = this.applications
				
				if (this.exportOptions.status.length > 0) {
					dataToExport = dataToExport.filter(app => this.exportOptions.status.includes(app.status))
				}
				
				if (this.exportOptions.departments.length > 0) {
					dataToExport = dataToExport.filter(app => {
						return this.exportOptions.departments.some(dept => (app.departments || '').includes(dept))
					})
				}
				
				if (dataToExport.length === 0) {
					uni.showToast({ title: '没有符合条件的数据', icon: 'none' })
					return
				}
				
				this.$emit('export', this.exportOptions)
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
	
	.option-group {
		margin-bottom: 20px;
	}
	
	.option-title {
		font-size: 16px;
		font-weight: 600;
		color: #333;
		margin-bottom: 12px;
		display: block;
	}
	
	.radio-item, .checkbox-item {
		display: flex;
		align-items: center;
		padding: 8px 0;
		border-bottom: 1px solid #f0f0f0;
	}
	
	.radio-item:last-child, .checkbox-item:last-child {
		border-bottom: none;
	}
	
	.radio-item .radio-input, .checkbox-item .checkbox-input {
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
</style>