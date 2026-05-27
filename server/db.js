const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'users.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
    seedDefaultData();
  }
  return db;
}

function initTables() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      member_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 家庭表
  db.exec(`
    CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_name TEXT NOT NULL,
      head_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (head_id) REFERENCES members(id)
    )
  `);

  // 家庭成员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      family_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      short_name TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);

  // 资产类型表
  db.exec(`
    CREATE TABLE IF NOT EXISTS asset_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type_value TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      color TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      family_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);

  // 资产记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      member_id INTEGER NOT NULL,
      family_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      previous_value REAL,
      date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'valid',
      note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (member_id) REFERENCES members(id),
      FOREIGN KEY (family_id) REFERENCES families(id)
    )
  `);
}

function seedDefaultData() {
  // 检查是否需要初始化数据
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (userCount.cnt > 0) return;

  console.log('[DB] 正在初始化默认数据...');

  // 1. 创建默认家庭
  const insertFamily = db.prepare('INSERT INTO families (family_name) VALUES (?)');
  const familyResult = insertFamily.run('张家');
  const familyId = familyResult.lastInsertRowid;

  // 2. 创建默认成员
  const insertMember = db.prepare('INSERT INTO members (family_id, name, short_name, role) VALUES (?, ?, ?, ?)');
  const headResult = insertMember.run(familyId, '张三', '张', 'head');
  const headId = headResult.lastInsertRowid;
  insertMember.run(familyId, '李四', '李', 'member');
  insertMember.run(familyId, '王五', '王', 'member');

  // 3. 更新家庭户主
  db.prepare('UPDATE families SET head_id = ? WHERE id = ?').run(headId, familyId);

  // 4. 创建默认资产类型
  const insertAssetType = db.prepare(
    'INSERT INTO asset_types (type_value, display_name, color, is_custom) VALUES (?, ?, ?, 0)'
  );
  insertAssetType.run('stock', '股票', '#f59e0b');
  insertAssetType.run('fund', '基金', '#3b82f6');
  insertAssetType.run('bond', '债券', '#10b981');
  insertAssetType.run('realestate', '房地产', '#ec4899');
  insertAssetType.run('cash', '现金', '#6366f1');
  insertAssetType.run('other', '其他', '#6b7280');

  // 5. 创建默认用户
  const adminHash = bcrypt.hashSync('admin123', 10);
  const headHash = bcrypt.hashSync('head123', 10);
  const memberHash = bcrypt.hashSync('member123', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, role, member_id) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('admin', adminHash, 'admin', null);
  insertUser.run('head', headHash, 'head', headId);
  insertUser.run('member', memberHash, 'member', 2);

  // 6. 创建默认资产记录
  const insertRecord = db.prepare(
    'INSERT INTO records (member_id, family_id, type, name, value, previous_value, date, status, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  insertRecord.run(headId, familyId, 'stock', '招商银行股票', 1250000, 1080000, '2026-05-27', 'valid', '客户追加投资');
  insertRecord.run(2, familyId, 'fund', '华夏成长基金', 890000, 820000, '2026-05-27', 'valid', '');
  insertRecord.run(headId, familyId, 'fund', '易方达蓝筹基金', 850000, 780000, '2026-05-19', 'valid', '定投计划执行');
  insertRecord.run(2, familyId, 'stock', '贵州茅台股票', 2300000, 2150000, '2026-05-18', 'valid', '');
  insertRecord.run(3, familyId, 'cash', '定期存款', 1200000, 1200000, '2026-05-17', 'valid', '到期转存');

  console.log('[DB] 默认数据初始化完成！');
  console.log('  - 系统管理员: admin / admin123');
  console.log('  - 户主: head / head123');
  console.log('  - 家庭成员: member / member123');
}

// 用户相关操作
function findUserByUsername(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findUserById(id) {
  return getDb().prepare('SELECT id, username, role, member_id, created_at FROM users WHERE id = ?').get(id);
}

function findUserWithMember(userId) {
  const sql = `
    SELECT u.*, m.name, m.family_id, m.short_name, m.role as member_role
    FROM users u
    LEFT JOIN members m ON u.member_id = m.id
    WHERE u.id = ?
  `;
  return getDb().prepare(sql).get(userId);
}

function createUser(username, password, role, memberId) {
  const hash = bcrypt.hashSync(password, 10);
  const result = getDb().prepare(
    'INSERT INTO users (username, password, role, member_id) VALUES (?, ?, ?, ?)'
  ).run(username, hash, role, memberId || null);
  return result.lastInsertRowid;
}

function verifyPassword(inputPassword, storedHash) {
  return bcrypt.compareSync(inputPassword, storedHash);
}

module.exports = {
  getDb,
  findUserByUsername,
  findUserById,
  findUserWithMember,
  createUser,
  verifyPassword
};
