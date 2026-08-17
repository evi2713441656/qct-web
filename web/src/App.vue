<script>
	import { wechatUtils } from './utils/utils.js'
	import { wechatLoginSimple, checkWechatLoginStatus } from './utils/wechat.js'
	
	export default {
		onLaunch: function() {
			// 青创通招新系统启动
			// 不自动检查登录状态，让用户主动登录
		},
		onShow: function() {
			// App Show
		},
		onHide: function() {
			// App Hide
		},
		methods: {
			// 移除自动登录逻辑，让用户主动登录
		}
	}
</script>

<style>
	/* 全局样式 */
	page {
		background-color: #f5f5f5;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
	}
	
	/* 通用按钮样式 */
	.btn-primary {
		background: linear-gradient(135deg, #4A90E2 0%, #357ABD 100%);
		color: white;
		border: none;
		border-radius: 8px;
		padding: 12px 24px;
		font-size: 16px;
		font-weight: 500;
		box-shadow: 0 2px 8px rgba(74, 144, 226, 0.3);
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-primary:active {
		transform: translateY(1px);
		box-shadow: 0 1px 4px rgba(74, 144, 226, 0.3);
	}
	
	.btn-secondary {
		background: #f8f9fa;
		color: #6c757d;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		padding: 12px 24px;
		font-size: 16px;
		font-weight: 500;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	/* 卡片样式 */
	.card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		margin: 10px;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
	}
	
	/* 输入框样式 */
	.input-field {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 12px 16px;
		font-size: 16px;
		margin-bottom: 16px;
		transition: border-color 0.3s ease;
	}
	
	.input-field:focus {
		border-color: #4A90E2;
		outline: none;
	}
	
	/* 标题样式 */
	.title {
		font-size: 24px;
		font-weight: 600;
		color: #2c3e50;
		margin-bottom: 16px;
	}
	
	.subtitle {
		font-size: 18px;
		font-weight: 500;
		color: #34495e;
		margin-bottom: 12px;
	}
	
	/* 状态标签 */
	.status-tag {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 500;
	}
	
	.status-pending {
		background: #fff3cd;
		color: #856404;
	}
	
	.status-passed {
		background: #d4edda;
		color: #155724;
	}
	
	.status-failed {
		background: #f8d7da;
		color: #721c24;
	}
</style>
