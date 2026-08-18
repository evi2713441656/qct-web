import { callCloudOrThrow } from './http.js'

function saveSession(data) {
  localStorage.setItem('userToken', data.token)
  localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
  return data
}

/** 普通用户登录：手机号 + 密码。 */
export async function login(phone, password) {
  const result = await callCloudOrThrow('auth', { type: 'login', phone, password })
  return saveSession(result.data)
}

/** 获取注册图块滑动验证挑战。 */
export function getSliderChallenge() {
  return callCloudOrThrow('auth', { type: 'slider_challenge' })
}

/** 普通用户注册：姓名 + 手机号 + 密码 + 图块滑动验证。 */
export async function register(name, phone, password, captcha) {
  const result = await callCloudOrThrow('auth', {
    type: 'register', name, phone, password, ...captcha
  })
  return saveSession(result.data)
}

export function getUserInfo() {
  try {
    return JSON.parse(localStorage.getItem('userInfo') || 'null')
  } catch {
    return null
  }
}

export function isLoggedIn() {
  return !!localStorage.getItem('userToken')
}

export function logout() {
  localStorage.removeItem('userToken')
  localStorage.removeItem('userInfo')
}

export async function getSystemConfig() {
  return callCloudOrThrow('admin', { type: 'getSystemConfig' })
}
