/**
 * 全局登录状态管理工具
 */

import { wechatLoginSimple } from './wechat.js'
import apiService from './api.js'

class AuthManager {
	constructor() {
		this.isLoggedIn = false
		this.userInfo = null
		this.listeners = []
		this.init()
	}

	// 初始化
	init() {
		this.checkLoginStatus()
	}

	// 检查登录状态
	checkLoginStatus() {
		const userInfo = uni.getStorageSync('userInfo')
		const wechatUserInfo = uni.getStorageSync('wechat_userInfo')
		const wechatToken = uni.getStorageSync('wechat_token')
		
		if (userInfo && userInfo._id) {
			this.isLoggedIn = true
			this.userInfo = userInfo
		} else if (wechatUserInfo && wechatToken) {
			// 如果有微信登录信息但没有用户信息，尝试同步
			this.isLoggedIn = true
			this.userInfo = {
				_id: wechatUserInfo.openid,
				openid: wechatUserInfo.openid,
				nickname: wechatUserInfo.nickname,
				avatar: wechatUserInfo.avatar,
				...wechatUserInfo
			}
			// 保存到userInfo存储
			uni.setStorageSync('userInfo', this.userInfo)
		} else {
			this.isLoggedIn = false
			this.userInfo = null
		}
		
		this.notifyListeners()
		return this.isLoggedIn
	}

	// 登录
	async login() {
		let loadingShown = false
		try {
			uni.showLoading({ title: '登录中...' })
			loadingShown = true
			
			const result = await wechatLoginSimple()
			
			// 检查微信登录是否真正成功
			if (result.success && result.userInfo) {
				const userInfo = result.userInfo
				
				// 直接使用微信登录返回的用户信息，不再调用后端API
				// 因为wechatLoginSimple已经成功获取了用户信息和token
				this.userInfo = {
					_id: userInfo._id || userInfo.openid,
					openid: userInfo.openid,
					nickname: userInfo.nickname,
					avatar: userInfo.avatar,
					gender: userInfo.gender,
					...userInfo
				}
				
				// 保存用户信息到本地存储
				uni.setStorageSync('userInfo', this.userInfo)
				uni.setStorageSync('userToken', result.token)
				
				this.isLoggedIn = true
				this.notifyListeners()
				
				uni.showToast({
					title: '登录成功',
					icon: 'success'
				})
				
				return {
					success: true,
					userInfo: this.userInfo
				}
			} else {
				// 微信登录失败
				throw new Error(result.message || result.error || '微信登录失败')
			}
		} catch (error) {
			console.error('登录失败:', error)
			
			// 显示具体的错误信息
			let errorMessage = '登录失败'
			if (error.message && error.message.includes('无效')) {
				errorMessage = '微信登录凭证已过期，请重新登录'
			} else if (error.message && error.message.includes('微信API错误')) {
				errorMessage = '微信服务暂时不可用，请稍后重试'
			} else if (error.message && error.message.includes('网络')) {
				errorMessage = '网络连接失败，请检查网络设置'
			} else if (error.message && error.message.includes('过期')) {
				errorMessage = '微信登录凭证已过期，请重新登录'
			} else {
				errorMessage = error.message || '登录失败，请重试'
			}
			
			uni.showToast({
				title: errorMessage,
				icon: 'none',
				duration: 3000
			})
			
			return {
				success: false,
				error: errorMessage
			}
		} finally {
			if (loadingShown) {
				uni.hideLoading()
			}
		}
	}

	// 登出
	async logout() {
		let loadingShown = false
		try {
			uni.showLoading({ title: '退出中...' })
			loadingShown = true
			
			// 调用后端登出接口
			try {
				await apiService.logout()
			} catch (error) {
				console.warn('后端登出失败:', error)
			}
			
			// 清除本地存储
			uni.removeStorageSync('userInfo')
			uni.removeStorageSync('wechat_userInfo')
			uni.removeStorageSync('wechat_token')
			uni.removeStorageSync('login_time')
			
			this.isLoggedIn = false
			this.userInfo = null
			this.notifyListeners()
			
			uni.showToast({
				title: '已退出登录',
				icon: 'success'
			})
			
			return { success: true }
		} catch (error) {
			console.error('登出失败:', error)
			uni.showToast({
				title: '退出失败',
				icon: 'none'
			})
			return { success: false, error: error.message }
		} finally {
			if (loadingShown) {
				uni.hideLoading()
			}
		}
	}

	// 获取登录状态
	getLoginStatus() {
		return {
			isLoggedIn: this.isLoggedIn,
			userInfo: this.userInfo
		}
	}

	// 获取用户信息
	getUserInfo() {
		return this.userInfo
	}

	// 添加状态变化监听器
	addListener(callback) {
		this.listeners.push(callback)
	}

	// 移除状态变化监听器
	removeListener(callback) {
		const index = this.listeners.indexOf(callback)
		if (index > -1) {
			this.listeners.splice(index, 1)
		}
	}

	// 通知所有监听器
	notifyListeners() {
		this.listeners.forEach(callback => {
			try {
				callback({
					isLoggedIn: this.isLoggedIn,
					userInfo: this.userInfo
				})
			} catch (error) {
				console.error('监听器执行失败:', error)
			}
		})
	}

	// 刷新登录状态
	refreshLoginStatus() {
		this.checkLoginStatus()
	}
}

// 创建全局单例
const authManager = new AuthManager()

export default authManager 