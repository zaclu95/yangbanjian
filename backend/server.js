const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json());

function readJson(name) {
  const p = path.join(DATA_DIR, name + '.json');
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

function writeJson(name, data) {
  const p = path.join(DATA_DIR, name + '.json');
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

// 从 cities.json 加载全国城市经纬度及省份，构建查找表；失败时使用内置兜底
let CITY_COORDS = {};
let CITY_PROVINCE = {};
function loadCityCoords() {
  const raw = readJson('cities');
  if (raw && Array.isArray(raw)) {
    CITY_COORDS = {};
    CITY_PROVINCE = {};
    raw.forEach(function (row) {
      const name = row && row.name ? String(row.name).trim() : '';
      if (!name) return;
      const lng = Number(row.lng);
      const lat = Number(row.lat);
      const province = row.province ? String(row.province).trim() : '';
      if (isNaN(lng) || isNaN(lat)) return;
      const coords = [lng, lat];
      CITY_COORDS[name] = coords;
      CITY_PROVINCE[name] = province;
      if (name.indexOf('市') === -1 && name.indexOf('省') === -1) CITY_COORDS[name + '市'] = coords;
      if (province) CITY_PROVINCE[name + '市'] = province;
    });
    return;
  }
  const fallback = {
    '北京': [116.4074, 39.9042], '北京市': [116.4074, 39.9042],
    '上海': [121.4737, 31.2304], '上海市': [121.4737, 31.2304],
    '广州': [113.2644, 23.1291], '深圳': [114.0579, 22.5431], '杭州': [120.1551, 30.2741],
    '成都': [104.0665, 30.5723], '武汉': [114.3055, 30.5931], '苏州': [120.5954, 31.2989],
    '南京': [118.7969, 32.0603], '西安': [108.9398, 34.3416], '重庆': [106.5516, 29.5630],
    '天津': [117.2010, 39.0842], '拉萨': [91.1145, 29.6544]
  };
  CITY_COORDS = fallback;
}
loadCityCoords();

function resolveValueByCity(item) {
  const city = item && item.city ? String(item.city).trim() : '';
  if (!city) return;
  const coords = CITY_COORDS[city] || CITY_COORDS[city.replace(/[省市]$/, '')] || CITY_COORDS[city + '市'];
  if (coords && Array.isArray(coords) && coords.length >= 2) {
    item.value = [Number(coords[0]), Number(coords[1])];
    const prov = CITY_PROVINCE[city] || CITY_PROVINCE[city.replace(/[省市]$/, '')] || CITY_PROVINCE[city + '市'];
    if (prov) item.province = prov;
  }
}

// 读取 customerPoints 并按 city 自动修正 value，写回文件（直接改 JSON 后刷新页面也会生效）
function readCustomerPoints() {
  const data = readJson('customerPoints');
  if (data == null || !Array.isArray(data)) return null;
  data.forEach(resolveValueByCity);
  writeJson('customerPoints', data);
  return data;
}

// ---------- 公开 API：前端拉取数据 ----------

app.get('/api/customer-points', (req, res) => {
  const data = readCustomerPoints();
  if (data == null) return res.status(500).json({ error: '数据文件不存在' });
  res.json(data);
});

app.get('/api/showrooms', (req, res) => {
  const data = readJson('showrooms');
  if (data == null) return res.status(500).json({ error: '数据文件不存在' });
  res.json(data);
});

// ---------- 管理 API：编辑案例（免登录） ----------

app.get('/api/admin/customer-points', (req, res) => {
  const data = readCustomerPoints();
  if (data == null) return res.status(500).json({ error: '数据文件不存在' });
  res.json(data);
});

app.put('/api/admin/customer-points', (req, res) => {
  const body = req.body;
  if (!Array.isArray(body)) return res.status(400).json({ error: '需要数组' });
  body.forEach(function (item) {
    resolveValueByCity(item);
  });
  writeJson('customerPoints', body);
  res.json(body);
});

app.get('/api/admin/showrooms', (req, res) => {
  const data = readJson('showrooms');
  if (data == null) return res.status(500).json({ error: '数据文件不存在' });
  res.json(data);
});

app.put('/api/admin/showrooms', (req, res) => {
  const body = req.body;
  if (body == null || typeof body !== 'object') return res.status(400).json({ error: '需要对象' });
  writeJson('showrooms', body);
  res.json(body);
});

// ---------- 运营管理页（静态 HTML） ----------

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ---------- 前端静态资源（开发时同源访问 API） ----------

const FRONTEND_ROOT = path.join(__dirname, '..');
app.use(express.static(FRONTEND_ROOT, { index: false }));
app.get('/', (req, res) => {
  res.sendFile(path.join(FRONTEND_ROOT, 'index.html'));
});

app.listen(PORT, () => {
  console.log('后端运行在 http://localhost:' + PORT);
  console.log('首页 http://localhost:' + PORT + '/');
  console.log('运营管理页 http://localhost:' + PORT + '/admin');
});
