import { callCloudOrThrow } from './http.js'

/** 学号 + 姓名登录（首次自动注册） */
export async function login(studentId, name) {
  const result = await callCloudOrThrow('auth', { type: 'login', studentId, name })
  const { token, userInfo } = result.data
  localStorage.setItem('userToken', token)
  localStorage.setItem('userInfo', JSON.stringify(userInfo))
  return result.data
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
