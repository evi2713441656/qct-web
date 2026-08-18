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

/** 普通用户注册：姓名 + 手机号 + 密码。注册成功后自动登录。 */
export async function register(name, phone, password) {
  const result = await callCloudOrThrow('auth', { type: 'register', name, phone, password })
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
