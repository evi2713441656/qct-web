/**
 * 登录工具函数
 * 小程序端：微信登录（原逻辑保留）
 * 网页端（H5）：表单登录（学号 + 姓名），调用 Java 后端 auth/login
 */

import {
  WECHAT_CONFIG,
  WECHAT_CONSTANTS,
  WECHAT_API_CONFIG,
  CURRENT_CONFIG
} from '../config/wechat.js'

/**
 * 检查登录状态
 * @returns {Promise<boolean>}
 */
export const checkWechatLoginStatus = () => {
  // #ifdef H5
  return new Promise((resolve) => {
    const token = uni.getStorageSync('wechat_token')
    const userInfo = uni.getStorageSync('wechat_userInfo')
    const loginTime = uni.getStorageSync('login_time')

    if (token && userInfo && loginTime) {
      const now = Date.now()
      const loginAge = now - loginTime
      resolve(loginAge < WECHAT_CONFIG.userInfoCacheTime)
    } else {
      resolve(false)
    }
  })
  // #endif

  // #ifndef H5
  return new Promise((resolve) => {
    uni.checkSession({
      success: () => {
        const token = uni.getStorageSync('wechat_token')
        const userInfo = uni.getStorageSync('wechat_userInfo')
        const loginTime = uni.getStorageSync('login_time')

        if (token && userInfo && loginTime) {
          const now = Date.now()
          const loginAge = now - loginTime

          if (loginAge < WECHAT_CONFIG.userInfoCacheTime) {
            resolve(true)
          } else {
            console.log('登录已过期')
            resolve(false)
          }
        } else {
          resolve(false)
        }
      },
      fail: () => {
        console.log('session_key已失效')
        resolve(false)
      }
    })
  })
  // #endif
}

/**
 * 微信登录（小程序端，必须在用户点击事件中直接调用）
 * @returns {Promise<Object>}
 */
export const wechatLogin = () => {
  // #ifdef H5
  return wechatLoginSimple()
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    if (CURRENT_CONFIG.debug) {
      console.log('开始微信登录流程')
    }

    // 直接调用getUserProfile，必须在用户点击事件中直接调用
    uni.getUserProfile({
      desc: '用于完善用户资料',
      success: async (userRes) => {
        if (CURRENT_CONFIG.debug) {
          console.log('获取用户信息成功:', userRes)
        }

        try {
          const result = await handleWechatLogin(userRes.userInfo)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      fail: (err) => {
        console.error('获取用户信息失败:', err)
        reject({
          success: false,
          error: WECHAT_CONSTANTS.ERROR_CODES.PERMISSION_DENIED,
          message: WECHAT_CONSTANTS.ERROR_MESSAGES.PERMISSION_DENIED,
          details: err
        })
      }
    })
  })
  // #endif
}

/**
 * 简化登录（小程序端仅获取openid；网页端表单登录）
 * @returns {Promise<Object>}
 */
export const wechatLoginSimple = () => {
  // #ifdef H5
  return formLogin()
  // #endif

  // #ifndef H5
  return new Promise((resolve, reject) => {
    if (CURRENT_CONFIG.debug) {
      console.log('开始简化微信登录流程')
    }

    showLoading('登录中...')

    // 添加重试机制
    const attemptLogin = (retryCount = 0) => {
      uni.login({
        provider: 'weixin',
        timeout: WECHAT_CONFIG.loginTimeout,
        success: async (loginRes) => {
          if (CURRENT_CONFIG.debug) {
            console.log('微信登录成功:', loginRes)
          }

          try {
            // 调用后端接口获取openid
            const result = await callBackendLoginSimple(loginRes.code)

            // 检查云函数调用是否真正成功
            if (result.success && result.userInfo) {
              hideLoading()
              resolve(result)
            } else {
              // 云函数调用失败
              hideLoading()
              const errorMsg = result.error || result.message || '云函数调用失败'
              reject(new Error(errorMsg))
            }
          } catch (error) {
            hideLoading()

            // 如果是invalid code错误且未超过重试次数，则重试
            if (error.message && (error.message.includes('无效') || error.message.includes('过期')) && retryCount < 2) {
              console.log(`第${retryCount + 1}次重试登录...`)
              setTimeout(() => attemptLogin(retryCount + 1), 1000)
              return
            }

            reject(error)
          }
        },
        fail: (err) => {
          console.error('微信登录失败:', err)
          hideLoading()
          reject({
            success: false,
            error: WECHAT_CONSTANTS.ERROR_CODES.LOGIN_FAILED,
            message: WECHAT_CONSTANTS.ERROR_MESSAGES.LOGIN_FAILED,
            details: err
          })
        }
      })
    }

    attemptLogin()
  })
  // #endif
}

// #ifdef H5
/**
 * 网页版表单登录：输入学号和姓名，自动注册或登录
 * @returns {Promise<Object>}
 */
const formLogin = () => {
  return new Promise((resolve, reject) => {
    uni.showModal({
      title: '登录',
      content: '请输入您的学号',
      editable: true,
      placeholderText: '请输入学号',
      success: (res1) => {
        if (!res1.confirm) {
          resolve({ success: false, message: '用户取消登录' })
          return
        }
        const studentId = (res1.content || '').trim()
        if (!studentId) {
          uni.showToast({ title: '学号不能为空', icon: 'none' })
          resolve({ success: false, message: '学号不能为空' })
          return
        }

        uni.showModal({
          title: '登录',
          content: '请输入您的姓名',
          editable: true,
          placeholderText: '请输入姓名',
          success: (res2) => {
            if (!res2.confirm) {
              resolve({ success: false, message: '用户取消登录' })
              return
            }
            const name = (res2.content || '').trim()
            if (!name) {
              uni.showToast({ title: '姓名不能为空', icon: 'none' })
              resolve({ success: false, message: '姓名不能为空' })
              return
            }

            doFormLogin(studentId, name).then(resolve).catch(reject)
          }
        })
      }
    })
  })
}

/**
 * 调用后端表单登录接口
 * @param {string} studentId 学号
 * @param {string} name 姓名
 * @returns {Promise<Object>}
 */
const doFormLogin = async (studentId, name) => {
  showLoading('登录中...')
  try {
    const res = await uniCloud.callFunction({
      name: 'auth',
      data: {
        type: 'login',
        studentId: studentId,
        name: name
      }
    })

    const result = res.result || {}
    if (result.success && result.data) {
      const { token, userInfo } = result.data

      // 保存登录信息
      uni.setStorageSync('wechat_token', token)
      uni.setStorageSync('wechat_userInfo', userInfo)
      uni.setStorageSync('userToken', token)
      uni.setStorageSync('userInfo', userInfo)
      uni.setStorageSync('login_time', Date.now())

      hideLoading()
      return {
        success: true,
        token: token,
        userInfo: userInfo
      }
    }

    hideLoading()
    const errorMsg = result.error || result.message || '登录失败'
    uni.showToast({ title: errorMsg, icon: 'none', duration: 3000 })
    return { success: false, message: errorMsg }
  } catch (error) {
    hideLoading()
    console.error('表单登录失败:', error)
    uni.showToast({ title: error.message || '登录失败', icon: 'none', duration: 3000 })
    throw error
  }
}
// #endif

/**
 * 处理微信登录逻辑（小程序端）
 * @param {Object} userInfo 用户信息
 * @returns {Promise<Object>}
 */
const handleWechatLogin = async (userInfo) => {
  showLoading('登录中...')

  try {
    // 1. 获取微信登录凭证
    const loginRes = await new Promise((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        timeout: WECHAT_CONFIG.loginTimeout,
        success: resolve,
        fail: reject
      })
    })

    if (CURRENT_CONFIG.debug) {
      console.log('微信登录成功:', loginRes)
    }

    // 2. 调用后端接口，用code换取openid和session_key
    const result = await callBackendLogin(loginRes.code, userInfo)
    hideLoading()
    return result
  } catch (error) {
    hideLoading()
    throw error
  }
}

/**
 * 调用后端登录接口
 * @param {string} code 微信登录凭证
 * @param {Object} userInfo 用户信息
 * @returns {Promise<Object>}
 */
const callBackendLogin = async (code, userInfo) => {
  try {
    console.log('调用云函数登录API:', { code, userInfo })

    const result = await uniCloud.callFunction({
      name: 'wechat-login',
      data: {
        type: 'login',
        code: code,
        userInfo: userInfo
      }
    })

    console.log('云函数登录响应:', result)

    if (result.result && result.result.success) {
      const { token, userInfo: userData } = result.result.data

      // 保存登录信息
      uni.setStorageSync('wechat_token', token)
      uni.setStorageSync('wechat_userInfo', userData)
      uni.setStorageSync('login_time', Date.now())

      return {
        success: true,
        token: token,
        userInfo: userData
      }
    } else {
      // 处理特定的错误类型
      const errorMsg = result.result?.error || '登录失败'
      if (errorMsg.includes('invalid code')) {
        throw new Error('微信登录凭证已过期，请重新登录')
      } else if (errorMsg.includes('微信API错误')) {
        throw new Error('微信服务暂时不可用，请稍后重试')
      } else {
        throw new Error(errorMsg)
      }
    }
  } catch (error) {
    console.error('云函数登录失败:', error)

    // 根据错误类型返回不同的错误信息
    let errorMessage = '登录失败'
    if (error.message.includes('invalid code')) {
      errorMessage = '微信登录凭证已过期，请重新登录'
    } else if (error.message.includes('微信API错误')) {
      errorMessage = '微信服务暂时不可用，请稍后重试'
    } else if (error.message.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else {
      errorMessage = error.message || '登录失败，请重试'
    }

    throw {
      success: false,
      error: WECHAT_CONSTANTS.ERROR_CODES.LOGIN_FAILED,
      message: errorMessage
    }
  }
}

/**
 * 调用后端简化登录接口
 * @param {string} code 微信登录凭证
 * @returns {Promise<Object>}
 */
const callBackendLoginSimple = async (code) => {
  try {
    console.log('调用云函数简化登录API:', { code })

    const result = await uniCloud.callFunction({
      name: 'wechat-login',
      data: {
        type: 'login',
        code: code
      }
    })

    console.log('云函数简化登录响应:', result)

    // 检查云函数调用是否成功
    if (result.result && result.result.success) {
      const { token, userInfo: userData } = result.result.data

      // 保存登录信息
      uni.setStorageSync('wechat_token', token)
      uni.setStorageSync('wechat_userInfo', userData)
      uni.setStorageSync('login_time', Date.now())

      return {
        success: true,
        token: token,
        userInfo: userData
      }
    } else {
      // 处理云函数返回的错误
      const errorMsg = result.result?.error || result.result?.message || '登录失败'
      console.error('云函数简化登录返回错误:', errorMsg)

      // 根据错误类型返回具体的错误信息
      if (errorMsg.includes('无效') || errorMsg.includes('过期')) {
        throw new Error('微信登录凭证已过期，请重新登录')
      } else if (errorMsg.includes('微信API错误')) {
        throw new Error('微信服务暂时不可用，请稍后重试')
      } else if (errorMsg.includes('网络')) {
        throw new Error('网络连接失败，请检查网络设置')
      } else {
        throw new Error(errorMsg)
      }
    }
  } catch (error) {
    console.error('云函数简化登录失败:', error)

    // 根据错误类型返回不同的错误信息
    let errorMessage = '登录失败'
    if (error.message && error.message.includes('无效')) {
      errorMessage = '微信登录凭证已过期，请重新登录'
    } else if (error.message && error.message.includes('过期')) {
      errorMessage = '微信登录凭证已过期，请重新登录'
    } else if (error.message && error.message.includes('微信API错误')) {
      errorMessage = '微信服务暂时不可用，请稍后重试'
    } else if (error.message && error.message.includes('网络')) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else {
      errorMessage = error.message || '登录失败，请重试'
    }

    throw new Error(errorMessage)
  }
}

/**
 * 登出
 */
export const wechatLogout = () => {
  try {
    // 清除本地存储的登录信息
    uni.removeStorageSync('wechat_token')
    uni.removeStorageSync('wechat_userInfo')
    uni.removeStorageSync('login_time')
    uni.removeStorageSync('userToken')
    uni.removeStorageSync('userInfo')
    uni.removeStorageSync('adminToken')
    uni.removeStorageSync('adminInfo')

    // 清除其他相关数据
    uni.removeStorageSync('user_application')

    // 调用后端登出接口（如果配置了）
    if (!CURRENT_CONFIG.useMockData) {
      callBackendLogout()
    }

    return {
      success: true,
      message: '登出成功'
    }
  } catch (error) {
    console.error('登出失败:', error)
    return {
      success: false,
      message: '登出失败',
      error: error
    }
  }
}

/**
 * 调用后端登出接口
 */
const callBackendLogout = () => {
  const token = uni.getStorageSync('wechat_token')
  if (token) {
    uni.request({
      url: WECHAT_API_CONFIG.baseUrl + WECHAT_API_CONFIG.endpoints.logout,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      },
      timeout: WECHAT_API_CONFIG.timeout,
      success: (res) => {
        if (CURRENT_CONFIG.debug) {
          console.log('后端登出成功:', res)
        }
      },
      fail: (err) => {
        console.error('后端登出失败:', err)
      }
    })
  }
}

/**
 * 获取用户信息
 * @returns {Object|null}
 */
export const getWechatUserInfo = () => {
  return uni.getStorageSync('wechat_userInfo') || null
}

/**
 * 获取登录token
 * @returns {string|null}
 */
export const getWechatToken = () => {
  return uni.getStorageSync('wechat_token') || null
}

/**
 * 检查是否需要重新登录
 * @returns {boolean}
 */
export const needReLogin = () => {
  const loginTime = uni.getStorageSync('login_time')
  const token = uni.getStorageSync('wechat_token')

  if (!loginTime || !token) {
    return true
  }

  // 检查登录是否超过配置的时间
  const now = Date.now()
  return (now - loginTime) > WECHAT_CONFIG.userInfoCacheTime
}

/**
 * 刷新登录状态
 * @returns {Promise<Object>}
 */
export const refreshLogin = () => {
  return new Promise((resolve, reject) => {
    if (needReLogin()) {
      wechatLoginSimple()
        .then(resolve)
        .catch(reject)
    } else {
      resolve({
        success: true,
        message: '登录状态有效'
      })
    }
  })
}

/**
 * 获取微信分享参数
 * @returns {Object}
 */
export const getWechatShareParams = () => {
  return {
    title: '青创通招新系统',
    desc: '青年创新创业协会招新报名',
    path: '/pages/index/index',
    imageUrl: '/static/share-image.png'
  }
}

// 辅助函数
const showLoading = (title = '加载中...') => {
  uni.showLoading({
    title,
    mask: true
  })
}

const hideLoading = () => {
  uni.hideLoading()
}

export default {
  checkWechatLoginStatus,
  wechatLogin,
  wechatLoginSimple,
  wechatLogout,
  getWechatUserInfo,
  getWechatToken,
  needReLogin,
  refreshLogin,
  getWechatShareParams
}
