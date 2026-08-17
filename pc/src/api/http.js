import axios from 'axios'

const apiBase = import.meta.env.VITE_API_BASE || ''
const http = axios.create({
  baseURL: apiBase,
  timeout: 15000
})

http.interceptors.request.use((config) => {
  const userToken = localStorage.getItem('userToken')
  if (userToken) config.headers.Authorization = 'Bearer ' + userToken
  const adminToken = localStorage.getItem('adminToken')
  if (adminToken) config.headers['X-Admin-Token'] = adminToken
  return config
})

http.interceptors.response.use(
  (res) => {
    if (res.status === 401) {
      localStorage.removeItem('userToken')
      localStorage.removeItem('adminToken')
    }
    return res
  },
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('userToken')
      localStorage.removeItem('adminToken')
      if (!location.hash.includes('/admin/login')) {
        location.hash = '#/'
      }
      return Promise.reject(new Error('登录已失效，请重新登录'))
    }
    return Promise.reject(new Error('网络连接失败，请检查网络设置'))
  }
)

/** 调用云函数风格接口：POST {apiBase}/api/cloud/{name}，返回 { success, data, error } */
export async function callCloud(name, data = {}) {
  const res = await http.post('/api/cloud/' + name, data)
  return res.data
}

export async function callCloudOrThrow(name, data = {}) {
  const result = await callCloud(name, data)
  if (result && result.success) return result
  throw new Error((result && (result.error || result.message)) || '请求失败')
}

export default http
