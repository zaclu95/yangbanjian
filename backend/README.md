# 样板间网站后端

Node.js + Express，提供地图点位与精选样板间数据 API，以及运营管理后台。

## 功能

- **公开 API**
  - `GET /api/customer-points`：地图上的客户案例点位（前端地图用）
  - `GET /api/showrooms`：精选样板间文案与四宫格卡片（可后续接入前端）

- **运营管理页**（免登录）
  - 访问：`http://localhost:3001/admin`
  - 可直接编辑：地图点位（城市、经纬度、行业、客户、主题）、精选样板间首屏大卡片、四宫格卡片

- **开发时同源访问**
  - 根路径 `http://localhost:3001/` 会提供前端静态页（上一级目录的 `index.html` 与 `assets/`）
  - 前端会从同源请求 `/api/customer-points`，无需跨域

## 安装与运行

```bash
cd backend
npm install
npm start
```

- 首页：http://localhost:3001/
- 管理后台：http://localhost:3001/admin

## 环境变量（可选）

- `PORT`：端口，默认 3001

## 数据文件

- `data/customerPoints.json`：地图点位数组
- `data/showrooms.json`：精选样板间（featured 大卡片 + cards 四宫格）

修改后保存即生效，无需重启。
