/**
 * 微信登录配置文件
 */

// 微信小程序配置
export const WECHAT_CONFIG = {
  // 小程序AppID
  appId: 'wxd13da1925d336c26',
  
  // 授权作用域
  scope: 'snsapi_userinfo',
  
  // 登录超时时间（毫秒）
  loginTimeout: 10000,
  
  // 自动登录重试次数
  autoLoginRetryCount: 3,
  
  // 登录状态检查间隔（毫秒）
  loginCheckInterval: 300000, // 5分钟
  
  // 用户信息缓存时间（毫秒）
  userInfoCacheTime: 7 * 24 * 60 * 60 * 1000, // 7天
}

// 微信登录相关常量
export const WECHAT_CONSTANTS = {
  // 登录状态
  LOGIN_STATUS: {
    SUCCESS: 'success',
    FAILED: 'failed',
    PENDING: 'pending',
    EXPIRED: 'expired'
  },
  
  // 错误码
  ERROR_CODES: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    LOGIN_FAILED: 'LOGIN_FAILED',
    USER_CANCEL: 'USER_CANCEL',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    SESSION_EXPIRED: 'SESSION_EXPIRED'
  },
  
  // 错误信息
  ERROR_MESSAGES: {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    LOGIN_FAILED: '登录失败，请重试',
    USER_CANCEL: '用户取消登录',
    PERMISSION_DENIED: '权限被拒绝，请在设置中开启相关权限',
    SESSION_EXPIRED: '登录已过期，请重新登录',
    UNKNOWN_ERROR: '未知错误，请重试'
  }
}

// 微信登录API配置
export const WECHAT_API_CONFIG = {
  // 使用uniCloud云函数，不需要外部API地址
  baseUrl: '',
  
  // 云函数名称配置
  cloudFunctions: {
    // 微信登录云函数
    login: '/api/wechat/login',
    
    // 获取用户信息接口
    userInfo: '/api/wechat/userinfo',
    
    // 刷新登录状态接口
    refresh: '/api/wechat/refresh',
    
    // 登出接口
    logout: '/api/wechat/logout'
  },
  
  // 请求超时时间（毫秒）
  timeout: 10000,
  
  // 请求重试次数
  retryCount: 3,
  
  // 请求重试间隔（毫秒）
  retryInterval: 1000
}

// 微信分享配置
export const WECHAT_SHARE_CONFIG = {
  // 默认分享标题
  defaultTitle: '青创通招新系统',
  
  // 默认分享描述
  defaultDesc: '青年创新创业协会招新报名',
  
  // 默认分享图片
  defaultImageUrl: '/static/share-image.png',
  
  // 默认分享路径
  defaultPath: '/pages/index/index',
  
  // 分享配置
  shareOptions: {
    // 是否显示分享菜单
    showShareMenu: true,
    
    // 分享到朋友圈
    shareToTimeline: true,
    
    // 分享给朋友
    shareToFriend: true
  }
}

// 微信支付配置（如果需要）
export const WECHAT_PAY_CONFIG = {
  // 支付相关配置
  enabled: false, // 是否启用支付功能
  
  // 支付回调地址
  notifyUrl: 'https://your-backend-api.com/api/pay/notify',
  
  // 支付超时时间（毫秒）
  timeout: 30000
}

// 开发环境配置
export const DEV_CONFIG = {
  // 是否启用调试模式
  debug: true,
  
  // 是否使用模拟数据
  useMockData: false,
  
  // 模拟登录延迟（毫秒）
  mockLoginDelay: 1000,
  
  // 模拟网络延迟（毫秒）
  mockNetworkDelay: 500
}

// 生产环境配置
export const PROD_CONFIG = {
  // 是否启用调试模式
  debug: false,
  
  // 是否使用模拟数据
  useMockData: false,
  
  // 是否启用错误上报
  enableErrorReport: true,
  
  // 是否启用性能监控
  enablePerformanceMonitor: true
}

// 根据环境导出配置
const isDev = process.env.NODE_ENV === 'development'

export const CURRENT_CONFIG = isDev ? DEV_CONFIG : PROD_CONFIG

export default {
  WECHAT_CONFIG,
  WECHAT_CONSTANTS,
  WECHAT_API_CONFIG,
  WECHAT_SHARE_CONFIG,
  WECHAT_PAY_CONFIG,
  CURRENT_CONFIG
}