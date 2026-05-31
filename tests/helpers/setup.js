const jwt = require('jsonwebtoken');
const { getDb } = require('../../server/db');

const JWT_SECRET = 'ricky_finance_jwt_secret_2024';

function generateTestToken(user) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
}

let adminToken, headToken, memberToken;
let testMemberId, testFamilyId;

function initTokens() {
  const db = getDb();
  const members = db.prepare('SELECT * FROM members').all();
  const headMember = members.find(m => m.role === 'head');
  const memberMember = members.find(m => m.role === 'member') || headMember;
  
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
  const db = getDb();
  
  db.prepare(`DELETE FROM records`).run();
  
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
  ];

  const insertStmt = db.prepare(`
    INSERT INTO records (member_id, family_id, type, name, value, date, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  initialRecords.forEach(record => {
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
  });
}

function cleanupTestData() {
  const db = getDb();
  db.prepare(`DELETE FROM records`).run();
}

initTokens();

module.exports = { 
  seedTestData, 
  cleanupTestData, 
  adminToken, 
  headToken, 
  memberToken,
  testMemberId,
  testFamilyId
};
