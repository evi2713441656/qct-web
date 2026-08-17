# 青创通 · 网页版 (qct-web)

校内协会招新系统的网页版改造：uni-app 编译 H5 前端 + Spring Boot 后端。

## 结构

```
web/     uni-app 前端（编译 H5，桥接 uniCloud.callFunction -> HTTP）
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

环境变量（`application.yml` 均有默认值）：`MYSQL_HOST/MYSQL_PORT/MYSQL_DB/MYSQL_USER/MYSQL_PASSWORD/QCT_JWT_SECRET/QCT_TOKEN_EXPIRE_HOURS/...`。

### 前端

```
cd web && npm install
npm run build:h5     # 产物 dist/build/h5
npm run dev:h5       # 开发调试（vite 默认 5173）
```

后端地址通过环境变量 `VITE_API_BASE` 注入（默认 `http://localhost:8080`），可复制 `.env.example` 为 `.env` 修改。

## 部署

- 前端：推送到 `main` 后 GitHub Actions 自动构建并发布到 Pages（`web/dist/build/h5`）。
  在仓库 Settings → Actions → Variables 配置 `VITE_API_BASE` 指向你的后端地址（如 `https://api.example.com`）。
- 后端：需要一台有 MySQL 的环境，`mvn package` 后 `java -jar target/qct-server-*.jar` 运行；对外暴露 8080，并配置 CORS（`qct.cors-allowed-origin`）。

## 登录

- 学生端：网页版使用「学号 + 姓名」登录（不再依赖微信），首次登录自动注册。
- 管理端：必须先用默认或自建管理员账号登录。

## 安全注意

- 仓库已移除原微信小程序 `appSecret`、uniCloud `clientSecret` 等敏感配置，请勿重新提交。
- JWT 密钥默认固定，生产环境务必用 `QCT_JWT_SECRET` 覆盖。