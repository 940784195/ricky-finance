require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { authMiddleware } = require('./middleware/auth');
const { runMigrations } = require('./db/migrate');
const { seedDefaultData } = require('./db/seed');
const { pool } = require('./db/pgPool');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/export', authMiddleware, require('./routes/export'));
app.use('/api/families', authMiddleware, require('./routes/families'));
app.use('/api/members', authMiddleware, require('./routes/members'));
app.use('/api/asset-types', authMiddleware, require('./routes/asset-types'));
app.use('/api/records', authMiddleware, require('./routes/records'));
app.use('/api/stats', authMiddleware, require('./routes/stats'));
app.use('/api/customers', authMiddleware, require('./routes/customers'));

async function start() {
  try {
    await runMigrations();
    await seedDefaultData();
    console.log('[Server] 数据库初始化完成');
  } catch (err) {
    console.error('[Server] 数据库初始化失败:', err.message);
    console.log('[Server] 将以无数据库模式启动（仅限测试）');
  }

  app.listen(PORT, () => {
    console.log(`[Server] 资产管家后端服务已启动: http://localhost:${PORT}`);
  });
}

start();

module.exports = app;
