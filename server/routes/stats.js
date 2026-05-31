const express = require('express');
const { getDb } = require('../db');
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

  // 资产相关统计 - 按资产名称去重，仅取每个名称的最新记录
  const deduplicatedRecords = db.prepare(`
    SELECT r.id, r.name, r.value, r.type, r.status, r.created_at, r.date
    FROM records r
    ${recordsWhere}
    ${whereConnector} r.status = 'valid'
    AND r.id IN (
      SELECT MAX(r2.id)
      FROM records r2
      ${recordsWhere}
      ${whereConnector} r2.status = 'valid'
      GROUP BY r2.name
    )
  `).all(...recordsParams, ...recordsParams);

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

  // 资产类型分布 - 先按 type+name 去重取最新记录，再按 type 汇总
  const typeDistribution = db.prepare(`
    SELECT 
      latest.type,
      at.display_name,
      at.color,
      COUNT(DISTINCT latest.name) as record_count,
      SUM(latest.value) as total_value
    FROM (
      SELECT r.type, r.name, r.value
      FROM records r
      ${recordsWhere}
      ${whereConnector} r.status = 'valid'
      AND r.id IN (
        SELECT MAX(r2.id)
        FROM records r2
        ${recordsWhere}
        ${whereConnector} r2.status = 'valid'
        GROUP BY r2.type, r2.name
      )
    ) latest
    LEFT JOIN asset_types at ON latest.type = at.type_value
    GROUP BY latest.type
    ORDER BY total_value DESC
  `).all(...recordsParams, ...recordsParams);

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
