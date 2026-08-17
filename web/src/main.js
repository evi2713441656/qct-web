import App from './App'

// 显式引用微信相关文件，确保被打包
import './config/wechat.js'
import './utils/wechat.js'

// H5 环境安装云函数 HTTP 桥接（替代 uniCloud）
import { installCloudBridge } from './utils/cloud-bridge.js'
installCloudBridge()

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'

const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'

export function createApp() {
  const app = createSSRApp(App)
  
  return {
    app
  }
}
// #endif
