const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// 首先设置环境变量，确保后续加载的模块使用测试数据库
process.env.NODE_ENV = 'test';

// 现在再加载 db 模块
const { getDb, closeAllDbs, setActiveDb, getDbPath } = require('../../server/db');

const JWT_SECRET = 'ricky_finance_jwt_secret_2024';

function generateTestToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

let adminToken, headToken, memberToken;
let testMemberId, testFamilyId;
let secondFamilyId, secondHeadId, secondMemberId;
let customTypeId;
const TEST_DB_NAME = 'test';

// 初始化测试数据库
function initTestDb() {
  // 设置活动数据库为测试数据库
  setActiveDb(TEST_DB_NAME);

  // 关闭所有现有连接
  closeAllDbs();

  // 删除旧的测试数据库文件
  const testDbPath = getDbPath(TEST_DB_NAME);
  const testDbDir = path.dirname(testDbPath);

  // 确保目录存在
  if (!fs.existsSync(testDbDir)) {
    fs.mkdirSync(testDbDir, { recursive: true });
  }

  // 删除旧的测试数据库
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (err) {
      console.log('[Test Setup] 测试数据库文件正在被使用，跳过删除');
    }
  }

  // 连接到测试数据库（会自动创建新的空数据库）
  const db = getDb(TEST_DB_NAME);

  // 初始化测试数据
  seedTestDbData(db);

  return db;
}

// 初始化测试数据库的基础数据
function seedTestDbData(db) {
  // 检查是否已经有数据
  const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (userCount.cnt > 0) {
    console.log('[Test Setup] 测试数据库已有数据，跳过初始化');
    return;
  }

  console.log('[Test Setup] 正在初始化测试数据库数据...');

  // ========== 家庭1：主测试家庭 ==========
  const insertFamily = db.prepare('INSERT INTO families (family_name) VALUES (?)');
  const familyResult = insertFamily.run('测试家庭');
  const familyId = familyResult.lastInsertRowid;

  // 插入成员（家庭1）
  const insertMember = db.prepare('INSERT INTO members (family_id, name, short_name, role) VALUES (?, ?, ?, ?)');
  const headResult = insertMember.run(familyId, '测试户主', '测', 'head');
  const headId = headResult.lastInsertRowid;
  const member1Result = insertMember.run(familyId, '测试成员1', '成1', 'member');
  const member1Id = member1Result.lastInsertRowid;
  const member2Result = insertMember.run(familyId, '测试成员2', '成2', 'member');
  const member2Id = member2Result.lastInsertRowid;

  db.prepare('UPDATE families SET head_id = ? WHERE id = ?').run(headId, familyId);

  // ========== 家庭2：多家庭隔离测试 ==========
  const family2Result = insertFamily.run('测试家庭B');
  const family2Id = family2Result.lastInsertRowid;

  const head2Result = insertMember.run(family2Id, '户主B', '主B', 'head');
  const head2Id = head2Result.lastInsertRowid;
  const member2_1Result = insertMember.run(family2Id, '成员B1', 'B1', 'member');
  const member2_1Id = member2_1Result.lastInsertRowid;

  db.prepare('UPDATE families SET head_id = ? WHERE id = ?').run(head2Id, family2Id);

  // 保存全局变量
  secondFamilyId = family2Id;
  secondHeadId = head2Id;
  secondMemberId = member2_1Id;

  // ========== 资产类型 ==========
  const insertAssetType = db.prepare(
    'INSERT INTO asset_types (type_value, display_name, color, is_custom) VALUES (?, ?, ?, 0)'
  );
  insertAssetType.run('stock', '股票', '#f59e0b');
  insertAssetType.run('fund', '基金', '#3b82f6');
  insertAssetType.run('bond', '债券', '#10b981');
  insertAssetType.run('realestate', '房地产', '#ec4899');
  insertAssetType.run('cash', '现金', '#6366f1');
  insertAssetType.run('other', '其他', '#6b7280');

  // 自定义资产类型（用于 TD-TYPE-01~06）
  const insertCustomType = db.prepare(
    'INSERT INTO asset_types (type_value, display_name, color, is_custom, family_id) VALUES (?, ?, ?, 1, ?)'
  );
  const customTypeResult = insertCustomType.run('crypto', '加密货币', '#8b5cf6', familyId);
  customTypeId = customTypeResult.lastInsertRowid;

  // 另一个自定义类型（未使用，用于删除测试）
  const unusedTypeResult = insertCustomType.run('gold', '黄金', '#fbbf24', familyId);

  // ========== 测试用户 ==========
  const bcrypt = require('bcryptjs');
  const adminHash = bcrypt.hashSync('admin123', 10);
  const headHash = bcrypt.hashSync('head123', 10);
  const memberHash = bcrypt.hashSync('member123', 10);
  const head2Hash = bcrypt.hashSync('head2pwd', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, role, member_id) VALUES (?, ?, ?, ?)'
  );
  insertUser.run('admin', adminHash, 'admin', null);
  insertUser.run('head', headHash, 'head', headId);
  insertUser.run('member', memberHash, 'member', member1Id);
  insertUser.run('head2', head2Hash, 'head', head2Id);

  // ========== 资产记录（覆盖 TD-REC-01~31） ==========
  const insertRecord = db.prepare(
    'INSERT INTO records (member_id, family_id, type, name, value, date, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  // 正常场景记录（TD-REC-01）
  insertRecord.run(headId, familyId, 'stock', '招商银行股票', 1250000, '2026-05-24', '客户追加投资', 'valid');
  insertRecord.run(headId, familyId, 'fund', '华夏成长基金', 890000, '2026-05-23', '', 'valid');
  insertRecord.run(member1Id, familyId, 'stock', '贵州茅台股票', 2300000, '2026-05-22', '', 'valid');
  insertRecord.run(member1Id, familyId, 'cash', '活期存款', 500000, '2026-05-21', '', 'valid');
  insertRecord.run(headId, familyId, 'fund', '易方达蓝筹基金', 850000, '2026-05-20', '定投计划执行', 'valid');
  insertRecord.run(member1Id, familyId, 'realestate', '房产投资', 5000000, '2026-05-19', '', 'valid');
  insertRecord.run(member1Id, familyId, 'bond', '国债', 300000, '2026-05-18', '', 'valid');
  insertRecord.run(headId, familyId, 'other', '收藏品', 150000, '2026-05-17', '', 'valid');

  // 多状态记录（TD-REC-29~31）
  insertRecord.run(member1Id, familyId, 'stock', '待审核股票', 50000, '2026-05-16', '等待户主审核', 'pending');
  insertRecord.run(headId, familyId, 'fund', '归档基金', 30000, '2026-05-15', '已归档', 'archived');
  insertRecord.run(member2Id, familyId, 'cash', '异常现金', 10000, '2026-05-14', '异常场景测试', 'pending');

  // 同一资产多次记录（TD-REC-26~28：测试更新规则）
  insertRecord.run(headId, familyId, 'stock', '招商银行', 1000000, '2026-01-15', '年初记录', 'valid');
  insertRecord.run(headId, familyId, 'stock', '招商银行', 1100000, '2026-03-20', '季度更新', 'valid');
  insertRecord.run(headId, familyId, 'stock', '招商银行', 1250000, '2026-05-24', '最新记录', 'valid');

  // 不同资产分别记录
  insertRecord.run(member1Id, familyId, 'fund', '华夏成长', 800000, '2026-01-10', '', 'valid');
  insertRecord.run(member1Id, familyId, 'fund', '华夏成长', 890000, '2026-05-23', '最新', 'valid');

  // 同一资产不同成员（TD-REC-28）
  insertRecord.run(headId, familyId, 'cash', '定期存款', 2000000, '2026-04-01', '户主的定期', 'valid');
  insertRecord.run(member1Id, familyId, 'cash', '定期存款', 1500000, '2026-04-15', '成员的定期', 'valid');

  // 边界条件记录（TD-REC-07~08）
  insertRecord.run(headId, familyId, 'cash', '极小值现金', 0.01, '2026-05-10', '最小货币单位测试', 'valid');
  insertRecord.run(member1Id, familyId, 'realestate', '极高价值房产', 999999999, '2026-05-09', '大数处理测试', 'valid');

  // 家庭2的记录（多家庭隔离测试 TD-SEC-05~06）
  insertRecord.run(head2Id, family2Id, 'stock', '家庭B股票', 500000, '2026-05-20', '家庭B数据', 'valid');
  insertRecord.run(member2_1Id, family2Id, 'fund', '家庭B基金', 300000, '2026-05-19', '家庭B数据', 'valid');

  console.log('[Test Setup] 测试数据库初始化完成');
}

function initTokens() {
  const db = getDb(TEST_DB_NAME);
  const members = db.prepare('SELECT * FROM members').all();

  // 获取主测试家庭（第一个创建的家庭，family_name = '测试家庭'）
  const families = db.prepare('SELECT * FROM families ORDER BY id ASC').all();
  const primaryFamily = families.find(f => f.family_name === '测试家庭') || families[0];
  const primaryFamilyId = primaryFamily?.id;

  const headMember = members.find(m => m.role === 'head' && m.family_id === primaryFamilyId);
  const memberMember = members.find(m => m.role === 'member' && m.family_id === primaryFamilyId);

  const headId = headMember?.id || 1;
  const headFamilyId = headMember?.family_id || 1;
  const memberId = memberMember?.id || headId;
  const memberFamilyId = memberMember?.family_id || headFamilyId;

  testMemberId = headId;
  testFamilyId = headFamilyId;

  adminToken = generateTestToken({ id: 1, username: 'admin', role: 'admin' });
  headToken = generateTestToken({ id: 2, username: 'head', role: 'head', memberId: headId, familyId: headFamilyId });
  memberToken = generateTestToken({ id: 3, username: 'member', role: 'member', memberId: memberId, familyId: memberFamilyId });

  return { headId, headFamilyId, memberId, memberFamilyId };
}

function seedTestData() {
  const db = getDb(TEST_DB_NAME);

  // 安全清理：先关闭外键约束，按依赖顺序清理，再开启
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM records').run();
  // 保留基础数据（members, families, users, asset_types），只清理records
  db.prepare('PRAGMA foreign_keys = ON').run();

  const { headId, headFamilyId, memberId } = initTokens();

  const initialRecords = [
    { member_id: headId, family_id: headFamilyId, type: 'stock', name: '招商银行股票', value: 1250000, date: '2026-05-24', note: '客户追加投资', status: 'valid' },
    { member_id: headId, family_id: headFamilyId, type: 'fund', name: '华夏成长基金', value: 890000, date: '2026-05-23', note: '', status: 'valid' },
    { member_id: memberId, family_id: headFamilyId, type: 'stock', name: '贵州茅台股票', value: 2300000, date: '2026-05-22', note: '', status: 'valid' },
    { member_id: memberId, family_id: headFamilyId, type: 'cash', name: '活期存款', value: 500000, date: '2026-05-21', note: '', status: 'valid' },
    { member_id: headId, family_id: headFamilyId, type: 'fund', name: '易方达蓝筹基金', value: 850000, date: '2026-05-20', note: '定投计划执行', status: 'valid' },
    { member_id: memberId, family_id: headFamilyId, type: 'realestate', name: '房产投资', value: 5000000, date: '2026-05-19', note: '', status: 'valid' },
    { member_id: memberId, family_id: headFamilyId, type: 'bond', name: '国债', value: 300000, date: '2026-05-18', note: '', status: 'valid' },
    { member_id: headId, family_id: headFamilyId, type: 'other', name: '收藏品', value: 150000, date: '2026-05-17', note: '', status: 'valid' },
    // 多状态记录
    { member_id: memberId, family_id: headFamilyId, type: 'stock', name: '待审核股票', value: 50000, date: '2026-05-16', note: '等待户主审核', status: 'pending' },
    { member_id: headId, family_id: headFamilyId, type: 'fund', name: '归档基金', value: 30000, date: '2026-05-15', note: '已归档', status: 'archived' },
  ];

  const insertStmt = db.prepare(
    'INSERT INTO records (member_id, family_id, type, name, value, date, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  let insertedCount = 0;
  initialRecords.forEach(record => {
    try {
      insertStmt.run(
        record.member_id,
        record.family_id,
        record.type,
        record.name,
        record.value,
        record.date,
        record.note,
        record.status
      );
      insertedCount++;
    } catch (err) {
      console.log('[Test Setup] 插入记录失败:', record.name, err.message);
    }
  });
  console.log(`[Test Setup] seedTestData 插入了 ${insertedCount} 条记录`);
}

function cleanupTestData() {
  const db = getDb(TEST_DB_NAME);
  db.prepare('PRAGMA foreign_keys = OFF').run();
  db.prepare('DELETE FROM records').run();
  db.prepare('PRAGMA foreign_keys = ON').run();
}

function cleanupTestDb() {
  closeAllDbs();
  const testDbPath = getDbPath(TEST_DB_NAME);
  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (err) {
      console.log('[Test Setup] 无法删除测试数据库文件，可能正在被使用');
    }
  }
}

// 获取测试辅助数据
function getTestData() {
  return {
    secondFamilyId,
    secondHeadId,
    secondMemberId,
    customTypeId,
    testMemberId,
    testFamilyId
  };
}

// 在模块加载时初始化测试数据库
initTestDb();
initTokens();

module.exports = {
  seedTestData,
  cleanupTestData,
  cleanupTestDb,
  getTestData,
  adminToken,
  headToken,
  memberToken,
  testMemberId,
  testFamilyId
};
