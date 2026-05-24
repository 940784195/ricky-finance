const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ==================== 认证 API（无需鉴权） ====================
const authRoutes = require('./routes/auth');
const { authMiddleware, optionalAuth } = require('./middleware/auth');
app.use('/api/auth', authRoutes);

// ==================== 导出 / 导入 API ====================
const exportRoutes = require('./routes/export');
app.use('/api', authMiddleware, exportRoutes);

const DATA_DIR = path.join(__dirname, 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(RECORDS_FILE)) {
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(getInitialRecords(), null, 2));
  }
  if (!fs.existsSync(CUSTOMERS_FILE)) {
    fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(getInitialCustomers(), null, 2));
  }
}

function getInitialRecords() {
  return [
    { id: '1', customerId: '1', type: 'stock', name: '招商银行股票', value: 1250000, previousValue: 1080000, date: '2026-05-24', note: '客户追加投资，资产配置调整', status: 'valid', createdAt: '2026-05-24 14:32:00' },
    { id: '2', customerId: '2', type: 'fund', name: '华夏成长基金', value: 890000, previousValue: 820000, date: '2026-05-23', note: '', status: 'valid', createdAt: '2026-05-23 09:15:00' },
    { id: '3', customerId: '3', type: 'realestate', name: '北京市朝阳区房产', value: 5200000, previousValue: 5322000, date: '2026-05-22', note: '市场估值调整，待重新确认', status: 'pending', createdAt: '2026-05-22 16:45:00' },
    { id: '4', customerId: '4', type: 'bond', name: '国债2024', value: 980000, previousValue: 945000, date: '2026-05-21', note: '', status: 'valid', createdAt: '2026-05-21 11:20:00' },
    { id: '5', customerId: '5', type: 'cash', name: '活期存款', value: 500000, previousValue: 476000, date: '2026-05-20', note: '', status: 'valid', createdAt: '2026-05-20 10:00:00' },
    { id: '6', customerId: '1', type: 'fund', name: '易方达蓝筹基金', value: 850000, previousValue: 780000, date: '2026-05-19', note: '定投计划执行', status: 'valid', createdAt: '2026-05-19 15:30:00' },
    { id: '7', customerId: '2', type: 'stock', name: '贵州茅台股票', value: 2300000, previousValue: 2150000, date: '2026-05-18', note: '', status: 'valid', createdAt: '2026-05-18 14:00:00' },
    { id: '8', customerId: '3', type: 'cash', name: '定期存款', value: 1200000, previousValue: 1200000, date: '2026-05-17', note: '到期转存', status: 'valid', createdAt: '2026-05-17 11:00:00' }
  ];
}

function getInitialCustomers() {
  return [
    { id: 1, name: '张三', shortName: '张', code: 'C001' },
    { id: 2, name: '李四', shortName: '李', code: 'C002' },
    { id: 3, name: '王五', shortName: '王', code: 'C003' },
    { id: 4, name: '赵六', shortName: '赵', code: 'C004' },
    { id: 5, name: '孙七', shortName: '孙', code: 'C005' }
  ];
}

function readRecords() {
  return JSON.parse(fs.readFileSync(RECORDS_FILE, 'utf-8'));
}

function writeRecords(records) {
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2));
}

function readCustomers() {
  return JSON.parse(fs.readFileSync(CUSTOMERS_FILE, 'utf-8'));
}

function writeCustomers(customers) {
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(customers, null, 2));
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }
  next();
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ==================== 资产记录 API ====================

app.get('/api/records', authMiddleware, (req, res) => {
  const records = readRecords();
  const { customerId, type, status, startDate, endDate, keyword } = req.query;
  let filtered = [...records];

  if (req.user && req.user.role === 'user' && req.user.customerId) {
    filtered = filtered.filter(r => String(r.customerId) === String(req.user.customerId));
  }

  if (customerId) filtered = filtered.filter(r => r.customerId === customerId);
  if (type) filtered = filtered.filter(r => r.type === type);
  if (status) filtered = filtered.filter(r => r.status === status);
  if (startDate) filtered = filtered.filter(r => r.date >= startDate);
  if (endDate) filtered = filtered.filter(r => r.date <= endDate);
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(r => r.name.toLowerCase().includes(kw));
  }

  res.json({ success: true, data: filtered });
});

app.get('/api/records/:id', authMiddleware, (req, res) => {
  const records = readRecords();
  const record = records.find(r => r.id === req.params.id);
  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }
  res.json({ success: true, data: record });
});

app.post('/api/records', authMiddleware, (req, res) => {
  const { customerId, type, name, value, date, previousValue, note } = req.body;

  if (!customerId || !type || !name || value == null || !date) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }

  const newRecord = {
    id: generateId(),
    customerId: String(customerId),
    type,
    name,
    value: Number(value),
    date,
    previousValue: previousValue ? Number(previousValue) : null,
    note: note || '',
    status: 'valid',
    createdAt: new Date().toLocaleString('zh-CN')
  };

  const records = readRecords();
  records.unshift(newRecord);
  writeRecords(records);

  res.status(201).json({ success: true, data: newRecord });
});

app.put('/api/records/:id', authMiddleware, (req, res) => {
  const records = readRecords();
  const index = records.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  const { customerId, type, name, value, date, previousValue, note } = req.body;
  records[index] = {
    ...records[index],
    customerId: customerId !== undefined ? String(customerId) : records[index].customerId,
    type: type !== undefined ? type : records[index].type,
    name: name !== undefined ? name : records[index].name,
    value: value !== undefined ? Number(value) : records[index].value,
    date: date !== undefined ? date : records[index].date,
    previousValue: previousValue !== undefined ? (previousValue ? Number(previousValue) : null) : records[index].previousValue,
    note: note !== undefined ? note : records[index].note
  };

  writeRecords(records);
  res.json({ success: true, data: records[index] });
});

app.delete('/api/records/:id', authMiddleware, (req, res) => {
  const records = readRecords();
  const index = records.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  records.splice(index, 1);
  writeRecords(records);
  res.json({ success: true, message: '记录已删除' });
});

// ==================== 客户 API ====================

app.get('/api/customers', authMiddleware, (req, res) => {
  const customers = readCustomers();

  if (req.user && req.user.role === 'user' && req.user.customerId) {
    const filtered = customers.filter(c => String(c.id) === String(req.user.customerId));
    return res.json({ success: true, data: filtered });
  }

  res.json({ success: true, data: customers });
});

app.get('/api/customers/:id', authMiddleware, (req, res) => {
  const customers = readCustomers();
  const customer = customers.find(c => String(c.id) === String(req.params.id));
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }

  const records = readRecords();
  const customerRecords = records.filter(r => String(r.customerId) === String(req.params.id));
  const totalValue = customerRecords
    .filter(r => r.status === 'valid')
    .reduce((sum, r) => sum + (r.value || 0), 0);
  const recordCount = customerRecords.length;

  res.json({
    success: true,
    data: {
      ...customer,
      totalValue,
      recordCount,
      records: customerRecords
    }
  });
});

app.post('/api/customers', authMiddleware, requireAdmin, (req, res) => {
  const { name, shortName, code } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: '缺少客户名称' });
  }

  const customers = readCustomers();
  const newId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;

  const newCustomer = {
    id: newId,
    name,
    shortName: shortName || name.charAt(0),
    code: code || `C${String(newId).padStart(3, '0')}`
  };

  customers.push(newCustomer);
  writeCustomers(customers);

  res.status(201).json({ success: true, data: newCustomer });
});

app.put('/api/customers/:id', authMiddleware, requireAdmin, (req, res) => {
  const customers = readCustomers();
  const index = customers.findIndex(c => String(c.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }

  const { name, shortName, code } = req.body;
  if (name !== undefined) customers[index].name = name;
  if (shortName !== undefined) customers[index].shortName = shortName;
  if (code !== undefined) customers[index].code = code;

  writeCustomers(customers);
  res.json({ success: true, data: customers[index] });
});

app.delete('/api/customers/:id', authMiddleware, requireAdmin, (req, res) => {
  const customers = readCustomers();
  const index = customers.findIndex(c => String(c.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }

  const customerId = customers[index].id;
  customers.splice(index, 1);
  writeCustomers(customers);

  let records = readRecords();
  records = records.filter(r => String(r.customerId) !== String(customerId));
  writeRecords(records);

  res.json({ success: true, message: '客户及相关记录已删除' });
});

// ==================== 统计 API ====================

app.get('/api/stats', authMiddleware, (req, res) => {
  let records = readRecords();

  if (req.user && req.user.role === 'user' && req.user.customerId) {
    records = records.filter(r => String(r.customerId) === String(req.user.customerId));
  }

  const validRecords = records.filter(r => r.status === 'valid');

  const totalValue = validRecords.reduce((sum, r) => sum + (r.value || 0), 0);
  const totalChange = validRecords.filter(r => r.previousValue).reduce((sum, r) => sum + (r.value - r.previousValue), 0);
  const totalPreviousValue = validRecords.filter(r => r.previousValue).reduce((sum, r) => sum + r.previousValue, 0);
  const totalRate = totalPreviousValue > 0 ? ((totalChange / totalPreviousValue) * 100).toFixed(1) : '0';

  const uniqueCustomers = [...new Set(validRecords.map(r => r.customerId))].length;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyNew = records.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  res.json({
    success: true,
    data: {
      totalValue,
      totalChange,
      totalRate: Number(totalRate),
      totalRecords: records.length,
      activeCustomers: uniqueCustomers,
      monthlyNew
    }
  });
});

// ==================== 静态资源（必须在所有 API 之后） ====================
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==================== 启动服务器 ====================

ensureDataDir();

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`资产管家后端服务已启动: http://localhost:${PORT}`);
    console.log(`资产记录页面: http://localhost:${PORT}/asset-records.html`);
  });
}

module.exports = app;
