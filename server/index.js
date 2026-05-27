const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const { authMiddleware } = require('./middleware/auth');

app.use('/api/auth', authRoutes);

const exportRoutes = require('./routes/export');
app.use('/api/export', authMiddleware, exportRoutes);

const familiesRoutes = require('./routes/families');
app.use('/api/families', authMiddleware, familiesRoutes);

const membersRoutes = require('./routes/members');
app.use('/api/members', authMiddleware, membersRoutes);

const assetTypesRoutes = require('./routes/asset-types');
app.use('/api/asset-types', authMiddleware, assetTypesRoutes);

const recordsRoutes = require('./routes/records');
app.use('/api/records', authMiddleware, recordsRoutes);

const statsRoutes = require('./routes/stats');
app.use('/api/stats', authMiddleware, statsRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

const { getDb } = require('./db');

if (require.main === module) {
  // 初始化数据库
  getDb();
  app.listen(PORT, () => {
    console.log(`资产管家后端服务已启动: http://localhost:${PORT}`);
  });
}

module.exports = app;
