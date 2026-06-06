const express = require('express');
const { getDb } = require('../db/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取统计数据
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();

  let recordsWhere = '';
  let recordsParams = [];
  let membersWhere = '';
  let membersParams = [];
  let whereConnector = 'WHERE';

  if (req.user.role === 'admin') {
    whereConnector = 'WHERE';
  } else if (req.user.role === 'head') {
    recordsWhere = 'WHERE r.family_id = ?';
    recordsParams.push(req.user.familyId);
    membersWhere = 'WHERE family_id = ?';
    membersParams.push(req.user.familyId);
    whereConnector = 'AND';
  } else {
    recordsWhere = 'WHERE r.member_id = ?';
    recordsParams.push(req.user.memberId);
    membersWhere = 'WHERE id = ?';
    membersParams.push(req.user.memberId);
    whereConnector = 'AND';
  }

  // 资产相关统计 - 先按成员分组，再按资产名称去重，仅取每个名称的最新记录（按日期取最新）
  // 首先获取所有 valid 记录
  const allValidRecords = db.prepare(`
    SELECT r.id, r.name, r.value, r.type, r.status, r.created_at, r.date, r.member_id
    FROM records r
    ${recordsWhere}
    ${whereConnector} r.status = 'valid'
    ORDER BY r.member_id, r.name, r.date DESC, r.id DESC
  `).all(...recordsParams);

  // 在内存中按 (member_id, name) 去重，只保留最新记录
  const latestRecordMap = {};
  allValidRecords.forEach(r => {
    const key = `${r.member_id}_${r.name}`;
    if (!latestRecordMap[key]) {
      latestRecordMap[key] = r;
    }
  });
  const deduplicatedRecords = Object.values(latestRecordMap);

  const totalValue = deduplicatedRecords.reduce((sum, r) => sum + r.value, 0);
  const totalRecords = db.prepare(`
    SELECT COUNT(*) as total_records
    FROM records r
    ${recordsWhere}
  `).get(...recordsParams).total_records;

  // 成员统计
  const membersStats = db.prepare(`
    SELECT
      COUNT(*) as member_count,
      COUNT(DISTINCT CASE WHEN EXISTS (
        SELECT 1 FROM records r WHERE r.member_id = m.id AND r.status = 'valid'
      ) THEN m.id END) as active_members
    FROM members m
    ${membersWhere}
  `).get(...membersParams);

  // 本月新增记录
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  let monthlyWhere = 'WHERE r.date >= ?';
  let monthlyParams = [monthStart];

  if (req.user.role === 'admin') {
  } else if (req.user.role === 'head') {
    monthlyWhere += ' AND r.family_id = ?';
    monthlyParams.push(req.user.familyId);
  } else {
    monthlyWhere += ' AND r.member_id = ?';
    monthlyParams.push(req.user.memberId);
  }

  const monthlyStats = db.prepare(`
    SELECT COUNT(*) as monthly_new
    FROM records r
    ${monthlyWhere}
  `).get(...monthlyParams);

  // 待处理记录
  let pendingWhere = 'WHERE r.status = ?';
  let pendingParams = ['pending'];

  if (req.user.role === 'admin') {
  } else if (req.user.role === 'head') {
    pendingWhere += ' AND r.family_id = ?';
    pendingParams.push(req.user.familyId);
  } else {
    pendingWhere += ' AND r.member_id = ?';
    pendingParams.push(req.user.memberId);
  }

  const pendingStats = db.prepare(`
    SELECT COUNT(*) as pending_count
    FROM records r
    ${pendingWhere}
  `).get(...pendingParams);

  // 资产类型分布 - 先按 member+name 去重取最新记录（按日期），再按 type 汇总
  const typeMap = {}; // key: type, value: { names: Set, totalValue: 0 }
  deduplicatedRecords.forEach(r => {
    if (!typeMap[r.type]) {
      typeMap[r.type] = {
        type: r.type,
        names: new Set(),
        totalValue: 0
      };
    }
    typeMap[r.type].names.add(r.name);
    typeMap[r.type].totalValue += r.value;
  });

  // 获取资产类型显示名称
  const allTypes = db.prepare('SELECT type_value, display_name, color FROM asset_types').all();
  const typeInfo = {};
  allTypes.forEach(t => {
    typeInfo[t.type_value] = t;
  });

  // 构建 typeDistribution
  const typeDistribution = Object.values(typeMap).map(t => {
    const info = typeInfo[t.type] || { display_name: t.type, color: '#6b7280' };
    return {
      type: t.type,
      display_name: info.display_name,
      color: info.color,
      record_count: t.names.size,
      total_value: t.totalValue
    };
  }).sort((a, b) => b.total_value - a.total_value);

  res.json({
    success: true,
    data: {
      totalValue,
      totalRecords,
      memberCount: membersStats.member_count,
      activeMembers: membersStats.active_members,
      monthlyNew: monthlyStats.monthly_new,
      pendingCount: pendingStats.pending_count,
      typeDistribution
    }
  });
});

module.exports = router;
