/**
 * H5 云函数桥接层
 *
 * 小程序版通过 uniCloud.callFunction 调用云端函数。
 * 网页版（H5）没有 uniCloud 环境，这里把 uniCloud.callFunction
 * 桥接为 HTTP POST {apiBase}/api/cloud/{functionName}，
 * 请求体与云函数 event 一致，返回体与云函数 result 一致，
 * 因此业务页面代码无需任何改动。
 */

import config from '../config/config.js'

const getApiBase = () => {
  if (typeof config.apiBase === 'string' && config.apiBase) {
    return config.apiBase
  }
  return 'http://localhost:8080'
}

const getTokens = () => {
  const headers = {}
  try {
    const userToken = uni.getStorageSync('userToken') || uni.getStorageSync('wechat_token')
    if (userToken) {
      headers.Authorization = 'Bearer ' + userToken
    }
    const adminToken = uni.getStorageSync('adminToken')
    if (adminToken) {
      headers['X-Admin-Token'] = adminToken
    }
  } catch (e) {
    console.error('读取登录凭证失败:', e)
  }
  return headers
}

const callCloudFunction = (opts) => {
  const name = opts && opts.name
  const data = (opts && opts.data) || {}

  if (!name) {
    return Promise.reject(new Error('缺少云函数名称'))
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: getApiBase() + '/api/cloud/' + name,
      method: 'POST',
      data: data,
      header: {
        'Content-Type': 'application/json',
        ...getTokens()
      },
      timeout: 15000,
      success: (res) => {
        // 兼容后端返回 {code:401} 的登录失效场景
        if (res.statusCode === 401) {
          reject(new Error('登录已失效，请重新登录'))
          return
        }
        if (res.statusCode !== 200) {
          reject(new Error('请求失败，状态码: ' + res.statusCode))
          return
        }
        // 保持与云函数一致的返回结构 { result: {...} }
        resolve({ result: res.data })
      },
      fail: (err) => {
        console.error(`云函数 ${name} 请求失败:`, err)
        reject(new Error('网络连接失败，请检查网络设置'))
      }
    })
  })
}

export const installCloudBridge = () => {
  // 仅在 H5 环境安装
  // #ifdef H5
  if (typeof globalThis.uniCloud === 'undefined') {
    globalThis.uniCloud = {}
  }
  globalThis.uniCloud.callFunction = callCloudFunction
  // #endif
}

export default {
  callCloudFunction,
  installCloudBridge
}
