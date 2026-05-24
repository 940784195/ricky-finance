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
    seedDefaultUsers();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      customer_id INTEGER,
      customer_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `);
}

function seedDefaultUsers() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (count.cnt === 0) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    const userHash = bcrypt.hashSync('user123', 10);

    const insert = db.prepare(
      'INSERT INTO users (username, password, role, customer_id, customer_name) VALUES (?, ?, ?, ?, ?)'
    );

    insert.run('admin', adminHash, 'admin', null, '系统管理员');
    insert.run('user', userHash, 'user', 1, '张三');

    console.log('[DB] 已创建默认用户: admin/admin123, user/user123');
  }
}

function findUserByUsername(username) {
  return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findUserById(id) {
  return getDb().prepare('SELECT id, username, role, customer_id, customer_name, created_at FROM users WHERE id = ?').get(id);
}

function createUser(username, password, role, customerId, customerName) {
  const hash = bcrypt.hashSync(password, 10);
  const result = getDb().prepare(
    'INSERT INTO users (username, password, role, customer_id, customer_name) VALUES (?, ?, ?, ?, ?)'
  ).run(username, hash, role || 'user', customerId || null, customerName || null);
  return result.lastInsertRowid;
}

function verifyPassword(inputPassword, storedHash) {
  return bcrypt.compareSync(inputPassword, storedHash);
}

module.exports = {
  getDb,
  findUserByUsername,
  findUserById,
  createUser,
  verifyPassword
};