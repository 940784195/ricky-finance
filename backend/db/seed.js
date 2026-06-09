const path = require('path');
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', '..', envFile) });

const bcrypt = require('bcryptjs');
const { pool } = require('./pgPool');

async function seedDefaultData() {
  const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM users');
  if (parseInt(rows[0].cnt) > 0) {
    console.log('[Seed] 数据库已有数据，跳过种子初始化');
    return;
  }

  console.log('[Seed] 正在初始化默认数据...');

  const familyResult = await pool.query(
    'INSERT INTO families (family_name) VALUES ($1) RETURNING id',
    ['张家']
  );
  const familyId = familyResult.rows[0].id;

  const headResult = await pool.query(
    'INSERT INTO members (family_id, name, short_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [familyId, '张三', '张', 'head']
  );
  const headId = headResult.rows[0].id;

  const member2Result = await pool.query(
    'INSERT INTO members (family_id, name, short_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [familyId, '李四', '李', 'member']
  );
  const member2Id = member2Result.rows[0].id;

  const member3Result = await pool.query(
    'INSERT INTO members (family_id, name, short_name, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [familyId, '王五', '王', 'member']
  );
  const member3Id = member3Result.rows[0].id;

  await pool.query('UPDATE families SET head_id = $1 WHERE id = $2', [headId, familyId]);

  const assetTypes = [
    ['stock', '股票', '#f59e0b'],
    ['fund', '基金', '#3b82f6'],
    ['bond', '债券', '#10b981'],
    ['realestate', '房地产', '#ec4899'],
    ['cash', '现金', '#6366f1'],
    ['other', '其他', '#6b7280'],
  ];
  for (const [typeValue, displayName, color] of assetTypes) {
    await pool.query(
      'INSERT INTO asset_types (type_value, display_name, color, is_custom) VALUES ($1, $2, $3, 0)',
      [typeValue, displayName, color]
    );
  }

  const adminHash = bcrypt.hashSync('admin123', 10);
  const headHash = bcrypt.hashSync('head123', 10);
  const memberHash = bcrypt.hashSync('member123', 10);

  await pool.query(
    'INSERT INTO users (username, password, role, member_id) VALUES ($1, $2, $3, $4)',
    ['admin', adminHash, 'admin', null]
  );
  await pool.query(
    'INSERT INTO users (username, password, role, member_id) VALUES ($1, $2, $3, $4)',
    ['head', headHash, 'head', headId]
  );
  await pool.query(
    'INSERT INTO users (username, password, role, member_id) VALUES ($1, $2, $3, $4)',
    ['member', memberHash, 'member', member2Id]
  );

  const records = [
    [headId, familyId, 'stock', '招商银行股票', 1250000, 1080000, '2026-05-27', 'valid', '客户追加投资'],
    [member2Id, familyId, 'fund', '华夏成长基金', 890000, 820000, '2026-05-27', 'valid', ''],
    [headId, familyId, 'fund', '易方达蓝筹基金', 850000, 780000, '2026-05-19', 'valid', '定投计划执行'],
    [member2Id, familyId, 'stock', '贵州茅台股票', 2300000, 2150000, '2026-05-18', 'valid', ''],
    [member3Id, familyId, 'cash', '定期存款', 1200000, 1200000, '2026-05-17', 'valid', '到期转存'],
  ];
  for (const [memberId, fid, type, name, value, prevValue, date, status, note] of records) {
    await pool.query(
      'INSERT INTO records (member_id, family_id, type, name, value, previous_value, date, status, note) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [memberId, fid, type, name, value, prevValue, date, status, note]
    );
  }

  console.log('[Seed] 默认数据初始化完成！');
  console.log('  - 系统管理员: admin / admin123');
  console.log('  - 户主: head / head123');
  console.log('  - 家庭成员: member / member123');
}

if (require.main === module) {
  seedDefaultData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] 失败:', err.message);
      process.exit(1);
    });
}

module.exports = { seedDefaultData };
