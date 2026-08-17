// 系统配置文件
export default {
  // 后端 API 地址（网页版使用 Java 后端）
  // 可通过环境变量 VITE_API_BASE 覆盖，如构建时：VITE_API_BASE=https://api.example.com pnpm build:h5
  apiBase: import.meta.env?.VITE_API_BASE || 'http://localhost:8080',

  // 应用信息
  appInfo: {
    name: '青创通招新系统',
    version: '2.3.0',
    description: '青年创新创业协会招新管理系统'
  },
  
  // 招新时间配置
  recruitmentTime: {
    startDate: '2025-08-01',
    endDate: '2025-10-15 23:59:59'
  },
  
  // 编辑截止时间
  editDeadline: '2025-10-15 23:59:59',
  
  // 部门配置
  departments: [
    {
      id: 1,
      name: '策划部',
      shortName: '策划',
      color: '#FF6B6B',
      description: '协会的"大脑"',
      duties: [
        '活动方案设计与策划',
        '各部门协调与分工安排',
        '活动执行细节把控',
        '项目进度管理与风险控制'
      ]
    },
    {
      id: 2,
      name: '执行部',
      shortName: '执行',
      color: '#4ECDC4',
      description: '协会的"行动力"',
      duties: [
        '活动前期筹备与物资准备',
        '现场执行与协调管理',
        '主持与现场氛围营造',
        '突发情况应急处理'
      ]
    },
    {
      id: 3,
      name: '宣传部',
      shortName: '宣传',
      color: '#45B7D1',
      description: '协会的"信息窗口"',
      duties: [
        '新媒体内容创作与编辑',
        '视觉设计与图片处理',
        '摄影摄像与后期制作',
        '品牌形象设计与维护'
      ]
    }
  ],
  
  // 状态配置
  status: {
    application: {
      pending: 'pending',
      passed: 'passed',
      failed: 'failed'
    },
    interview: {
      pending: 'pending',
      scheduled: 'scheduled',
      completed: 'completed'
    }
  },
  
  // 管理员配置
  admin: {
    defaultUsername: 'admin',
    defaultPassword: '123456',
    roles: {
      super: '超级管理员',
      admin: '管理员',
      operator: '操作员'
    }
  },
  
  // 联系信息
  contact: {
    email: 'ymxc152@qq.com'
  },
  
  // 系统设置
  settings: {
    maxDepartments: 2, // 最多可选择部门数量
    minIntroductionLength: 50, // 自我介绍最少字数
    maxIntroductionLength: 500, // 自我介绍最多字数
    enableEdit: true, // 是否允许编辑
    enableNotification: true // 是否启用通知
  }
} 