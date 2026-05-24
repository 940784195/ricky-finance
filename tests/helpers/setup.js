const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const DATA_DIR = path.join(__dirname, '..', '..', 'server', 'data');
const RECORDS_FILE = path.join(DATA_DIR, 'records.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const JWT_SECRET = 'ricky_finance_jwt_secret_2024';

const INITIAL_RECORDS = [
  { id: '1', customerId: '1', type: 'stock', name: '招商银行股票', value: 1250000, previousValue: 1080000, date: '2026-05-24', note: '客户追加投资，资产配置调整', status: 'valid', createdAt: '2026-05-24 14:32:00' },
  { id: '2', customerId: '2', type: 'fund', name: '华夏成长基金', value: 890000, previousValue: 820000, date: '2026-05-23', note: '', status: 'valid', createdAt: '2026-05-23 09:15:00' },
  { id: '3', customerId: '3', type: 'realestate', name: '北京市朝阳区房产', value: 5200000, previousValue: 5322000, date: '2026-05-22', note: '市场估值调整，待重新确认', status: 'pending', createdAt: '2026-05-22 16:45:00' },
  { id: '4', customerId: '4', type: 'bond', name: '国债2024', value: 980000, previousValue: 945000, date: '2026-05-21', note: '', status: 'valid', createdAt: '2026-05-21 11:20:00' },
  { id: '5', customerId: '5', type: 'cash', name: '活期存款', value: 500000, previousValue: 476000, date: '2026-05-20', note: '', status: 'valid', createdAt: '2026-05-20 10:00:00' },
  { id: '6', customerId: '1', type: 'fund', name: '易方达蓝筹基金', value: 850000, previousValue: 780000, date: '2026-05-19', note: '定投计划执行', status: 'valid', createdAt: '2026-05-19 15:30:00' },
  { id: '7', customerId: '2', type: 'stock', name: '贵州茅台股票', value: 2300000, previousValue: 2150000, date: '2026-05-18', note: '', status: 'valid', createdAt: '2026-05-18 14:00:00' },
  { id: '8', customerId: '3', type: 'cash', name: '定期存款', value: 1200000, previousValue: 1200000, date: '2026-05-17', note: '到期转存', status: 'valid', createdAt: '2026-05-17 11:00:00' }
];

const INITIAL_CUSTOMERS = [
  { id: 1, name: '张三', shortName: '张', code: 'C001' },
  { id: 2, name: '李四', shortName: '李', code: 'C002' },
  { id: 3, name: '王五', shortName: '王', code: 'C003' },
  { id: 4, name: '赵六', shortName: '赵', code: 'C004' },
  { id: 5, name: '孙七', shortName: '孙', code: 'C005' }
];

function generateTestToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

const adminToken = generateTestToken({ id: 1, username: 'admin', role: 'admin' });
const userToken = generateTestToken({ id: 2, username: 'user', role: 'user', customerId: 1 });

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function seedTestData() {
  ensureDataDir();
  fs.writeFileSync(RECORDS_FILE, JSON.stringify(INITIAL_RECORDS, null, 2));
  fs.writeFileSync(CUSTOMERS_FILE, JSON.stringify(INITIAL_CUSTOMERS, null, 2));
}

function cleanupTestData() {
  try {
    if (fs.existsSync(RECORDS_FILE)) fs.unlinkSync(RECORDS_FILE);
    if (fs.existsSync(CUSTOMERS_FILE)) fs.unlinkSync(CUSTOMERS_FILE);
  } catch (e) {
    // 忽略删除错误，其他测试可能正在访问文件
  }
}

module.exports = { seedTestData, cleanupTestData, INITIAL_RECORDS, INITIAL_CUSTOMERS, adminToken, userToken };
