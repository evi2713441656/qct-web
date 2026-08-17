# 青创通 · 网页版 (qct-web)

校内协会招新系统的网页版：**PC 网页前端**（Vue3 + Element Plus，学生端响应式可用手机）+ Spring Boot 后端。

## 结构

```
pc/      PC 网页前端（Vue3 + Vite + Element Plus + vue-router，学生端 + 管理后台）
web/     原 uni-app 小程序源码（保留参考，不再构建部署）
server/  Spring Boot 后端（替代 uniCloud 云函数，接口/返回结构与云函数一致）
```

## 本地运行

### 后端

1. MySQL 8 建库与用户：
   ```sql
   CREATE DATABASE qct CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'qct'@'localhost' IDENTIFIED BY 'qct123456';
   GRANT ALL PRIVILEGES ON qct.* TO 'qct'@'localhost';
   ```
2. 启动（首次启动自动执行 `server/src/main/resources/db/schema.sql` 与 `data.sql` 初始化）：
   ```
   cd server && mvn spring-boot:run
   ```
3. 默认管理员：`admin / admin123`（登录后请立即修改）。

环境变量（`application.yml` 均有默认值）：`MYSQL_HOST/MYSQL_PORT/MYSQL_DB/MYSQL_USER/MYSQL_PASSWORD/QCT_JWT_SECRET/QCT_TOKEN_EXPIRE_HOURS/CORS...`。

### 前端（pc/）

```
cd pc && npm install
npm run dev      # 开发调试（vite 5174，代理 /api -> localhost:8080）
npm run build    # 生产构建，产物 dist/
```

后端地址通过环境变量 `VITE_API_BASE` 注入（默认空 = 同域 `/api` 或本机 8080），可复制 `.env.example` 为 `.env` 修改。

## 部署

- 前端：推送到 `main` 后 GitHub Actions 自动构建发布到 Pages（`pc/dist`，见 `.github/workflows/pages.yml`）。
  在仓库 Settings → Actions → Variables 配置 `VITE_API_BASE` 指向你的后端地址（如 `https://api.example.com`）。
- 后端：需要一台有 MySQL 的环境，`mvn package` 后 `java -jar target/qct-server-*.jar` 运行；对外暴露 8080，并配置 CORS（`qct.cors-allowed-origin`）。

## 功能

- 学生端（`pc/` 首页/报名/个人中心，可手机访问）：
  - 学号 + 姓名登录（首次自动注册）
  - 报名表单（姓名/学号/性别/专业班级/宿舍/手机号/意向部门 1-2 个/自我介绍）
  - 进度跟踪、一面/二面签到、一面通过后确认二面、二面通过后选择部门
  - 通知消息（我的通知）
- 管理后台（`pc/`，桌面浏览器设计）：
  - 数据总览（报名数/今日/一面对/二面/录取 + 状态与部门分布）
  - 报名管理（筛选/搜索/一面通过/不通过/撤销/编辑/批量/导出 CSV/详情）
  - 二面管理（标记面试/签到号/通过/不通过/批量）
  - 录取名单（待确认/已录取/部门筛选/提醒确认）
  - 通知管理（发送：全部/按状态/指定用户；历史编辑/删除）
  - 系统设置（报名时间、一面二面时间地点与签到开关、部门详情）

## 状态流转

```
报名提交 → waiting_first(等待一面)
  ├─ 一面通过(+部门) → first_passed
  │    ├─ 用户确认 → waiting_second(等待二面)
  │    │    ├─ 二面通过(+部门) → department_selection(选择部门)
  │    │    │    ├─ 用户选部门 → accepted(已录取)
  │    │    │    └─ 用户拒绝 → rejected
  │    │    └─ 二面不通过 → second_failed
  │    └─ 用户拒绝 → first_reject
  └─ 一面不通过 → first_failed
```

## 安全注意

- 仓库已移除原微信小程序 `appSecret`、uniCloud `clientSecret` 等敏感配置，请勿重新提交。
- JWT 密钥默认固定，生产环境务必用 `QCT_JWT_SECRET` 覆盖。