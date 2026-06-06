const jwt = require('jsonwebtoken');
const path = require('path');

process.env.NODE_ENV = 'test';

const { pool, query } = require('../../backend/db/pgPool');
const { runMigrations } = require('../../backend/db/migrate');
const { seedDefaultData } = require('../../backend/db/seed');

const JWT_SECRET = process.env.JWT_SECRET || 'ricky_finance_jwt_secret_2024';

function generateTestToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

let adminToken, headToken, memberToken;
let testMemberId, testFamilyId;
let secondFamilyId, secondHeadId, secondMemberId;
let customTypeId;

async function clearAllTables() {
  await query('DELETE FROM records');
  await query('DELETE FROM users');
  await query('DELETE FROM asset_types');
  await query('DELETE FROM members');
  await query('DELETE FROM families');
}

async function seedTestDbData() {
  const testData = {};

  const familyResult = await query(
    "INSERT INTO families (family_name) VALUES ('测试家庭') RETURNING id"
  );
  const familyId = familyResult.rows[0].id;

  const headResult = await query(
    "INSERT INTO members (family_id, name, short_name, role) VALUES ($1, '测试户主', '测', 'head') RETURNING id",
    [familyId]
  );
  const headId = headResult.rows[0].id;

  const member1Result = await query(
    "INSERT INTO members (family_id, name, short_name, role) VALUES ($1, '测试成员1', '成1', 'member') RETURNING id",
    [familyId]
  );
  const member1Id = member1Result.rows[0].id;

  const member2Result = await query(
    "INSERT INTO members (family_id, name, short_name, role) VALUES ($1, '测试成员2', '成2', 'member') RETURNING id",
    [familyId]
  );
  const member2Id = member2Result.rows[0].id;

  await query('UPDATE families SET head_id = $1 WHERE id = $2', [headId, familyId]);

  testData.family1 = { id: familyId, headId, member1Id, member2Id };

  const family2Result = await query(
    "INSERT INTO families (family_name) VALUES ('测试家庭B') RETURNING id"
  );
  const family2Id = family2Result.rows[0].id;

  const head2Result = await query(
    "INSERT INTO members (family_id, name, short_name, role) VALUES ($1, '户主B', '主B', 'head') RETURNING id",
    [family2Id]
  );
  const head2Id = head2Result.rows[0].id;

  const member2_1Result = await query(
    "INSERT INTO members (family_id, name, short_name, role) VALUES ($1, '成员B1', 'B1', 'member') RETURNING id",
    [family2Id]
  );
  const member2_1Id = member2_1Result.rows[0].id;

  await query('UPDATE families SET head_id = $1 WHERE id = $2', [head2Id, family2Id]);

  secondFamilyId = family2Id;
  secondHeadId = head2Id;
  secondMemberId = member2_1Id;

  testData.family2 = { id: family2Id, headId: head2Id, memberId: member2_1Id };

  const assetTypes = [
    ['stock', '股票', '#f59e0b'],
    ['fund', '基金', '#3b82f6'],
    ['bond', '债券', '#10b981'],
    ['realestate', '房地产', '#ec4899'],
    ['cash', '现金', '#6366f1'],
    ['other', '其他', '#6b7280'],
  ];
  for (const [tv, dn, c] of assetTypes) {
    await query(
      'INSERT INTO asset_types (type_value, display_name, color, is_custom) VALUES ($1, $2, $3, 0)',
      [tv, dn, c]
    );
  }

  const customTypeResult = await query(
    "INSERT INTO asset_types (type_value, display_name, color, is_custom, family_id) VALUES ('crypto', '加密货币', '#8b5cf6', 1, $1) RETURNING id",
    [familyId]
  );
  customTypeId = customTypeResult.rows[0].id;

  await query(
    "INSERT INTO asset_types (type_value, display_name, color, is_custom, family_id) VALUES ('gold', '黄金', '#fbbf24', 1, $1)",
    [familyId]
  );

  const bcrypt = require('bcryptjs');
  const adminHash = bcrypt.hashSync('admin123', 10);
  const headHash = bcrypt.hashSync('head123', 10);
  const memberHash = bcrypt.hashSync('member123', 10);
  const head2Hash = bcrypt.hashSync('head2pwd', 10);

  await query(
    "INSERT INTO users (username, password, role, member_id) VALUES ('admin', $1, 'admin', NULL)",
    [adminHash]
  );
  await query(
    "INSERT INTO users (username, password, role, member_id) VALUES ('head', $1, 'head', $2)",
    [headHash, headId]
  );
  await query(
    "INSERT INTO users (username, password, role, member_id) VALUES ('member', $1, 'member', $2)",
    [memberHash, member1Id]
  );
  await query(
    "INSERT INTO users (username, password, role, member_id) VALUES ('head2', $1, 'head', $2)",
    [head2Hash, head2Id]
  );

  const records = [
    [headId, familyId, 'stock', '招商银行股票', 1250000, '2026-05-24', '客户追加投资', 'valid'],
    [headId, familyId, 'fund', '华夏成长基金', 890000, '2026-05-23', '', 'valid'],
    [member1Id, familyId, 'stock', '贵州茅台股票', 2300000, '2026-05-22', '', 'valid'],
    [member1Id, familyId, 'cash', '活期存款', 500000, '2026-05-21', '', 'valid'],
    [headId, familyId, 'fund', '易方达蓝筹基金', 850000, '2026-05-20', '定投计划执行', 'valid'],
    [member1Id, familyId, 'realestate', '房产投资', 5000000, '2026-05-19', '', 'valid'],
    [member1Id, familyId, 'bond', '国债', 300000, '2026-05-18', '', 'valid'],
    [headId, familyId, 'other', '收藏品', 150000, '2026-05-17', '', 'valid'],
    [member1Id, familyId, 'stock', '待审核股票', 50000, '2026-05-16', '等待户主审核', 'pending'],
    [headId, familyId, 'fund', '归档基金', 30000, '2026-05-15', '已归档', 'archived'],
    [member2Id, familyId, 'cash', '异常现金', 10000, '2026-05-14', '异常场景测试', 'pending'],
    [headId, familyId, 'stock', '招商银行', 1000000, '2026-01-15', '年初记录', 'valid'],
    [headId, familyId, 'stock', '招商银行', 1100000, '2026-03-20', '季度更新', 'valid'],
    [headId, familyId, 'stock', '招商银行', 1250000, '2026-05-24', '最新记录', 'valid'],
    [member1Id, familyId, 'fund', '华夏成长', 800000, '2026-01-10', '', 'valid'],
    [member1Id, familyId, 'fund', '华夏成长', 890000, '2026-05-23', '最新', 'valid'],
    [headId, familyId, 'cash', '定期存款', 2000000, '2026-04-01', '户主的定期', 'valid'],
    [member1Id, familyId, 'cash', '定期存款', 1500000, '2026-04-15', '成员的定期', 'valid'],
    [headId, familyId, 'cash', '极小值现金', 0.01, '2026-05-10', '最小货币单位测试', 'valid'],
    [member1Id, familyId, 'realestate', '极高价值房产', 999999999, '2026-05-09', '大数处理测试', 'valid'],
    [head2Id, family2Id, 'stock', '家庭B股票', 500000, '2026-05-20', '家庭B数据', 'valid'],
    [member2_1Id, family2Id, 'fund', '家庭B基金', 300000, '2026-05-19', '家庭B数据', 'valid'],
  ];

  for (const [mid, fid, type, name, value, date, note, status] of records) {
    await query(
      'INSERT INTO records (member_id, family_id, type, name, value, date, note, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [mid, fid, type, name, value, date, note, status]
    );
  }

  return testData;
}

async function initTokens() {
  const usersResult = await query('SELECT * FROM users');
  const users = usersResult.rows;
  const adminUser = users.find(u => u.username === 'admin');
  const headUser = users.find(u => u.username === 'head');
  const memberUser = users.find(u => u.username === 'member');

  const membersResult = await query('SELECT * FROM members');
  const members = membersResult.rows;
  const headMember = members.find(m => m.id === headUser?.member_id);
  const memberMember = members.find(m => m.id === memberUser?.member_id);

  const headId = headMember?.id || 1;
  const headFamilyId = headMember?.family_id || 1;
  const memberId = memberMember?.id || headId;
  const memberFamilyId = memberMember?.family_id || headFamilyId;

  testMemberId = headId;
  testFamilyId = headFamilyId;

  adminToken = generateTestToken({ id: adminUser?.id || 1, username: 'admin', role: 'admin' });
  headToken = generateTestToken({ id: headUser?.id || 2, username: 'head', role: 'head', memberId: headId, familyId: headFamilyId });
  memberToken = generateTestToken({ id: memberUser?.id || 3, username: 'member', role: 'member', memberId: memberId, familyId: memberFamilyId });

  return { headId, headFamilyId, memberId, memberFamilyId };
}

async function initTestDb() {
  await runMigrations();
  await clearAllTables();
  const testData = await seedTestDbData();
  await initTokens();
  return testData;
}

async function resetToSeedData() {
  await clearAllTables();
  const testData = await seedTestDbData();
  await initTokens();
  return testData;
}

function seedTestData() {
  return resetToSeedData();
}

function cleanupTestData() {
}

async function cleanupTestDb() {
  try {
    await pool.end();
  } catch (err) {
  }
}

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

module.exports = {
  resetToSeedData,
  initTestDb,
  seedTestData,
  cleanupTestData,
  cleanupTestDb,
  getTestData,

  getAdminToken: () => adminToken,
  getHeadToken: () => headToken,
  getMemberToken: () => memberToken,
  getTestMemberId: () => testMemberId,
  getTestFamilyId: () => testFamilyId,

  adminToken,
  headToken,
  memberToken,
  testMemberId,
  testFamilyId
};
