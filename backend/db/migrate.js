const fs = require('fs');
const path = require('path');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', '..', envFile) });

const { pool } = require('./pgPool');

async function runMigrations() {
  const sqlPath = path.join(__dirname, 'migrate.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('[Migration] 正在执行数据库迁移...');
  try {
    await pool.query(sql);
    console.log('[Migration] 迁移完成！');
  } catch (err) {
    console.error('[Migration] 迁移失败:', err.message);
    throw err;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
