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

  if (req.user.role === 'admin') {
    // 管理员查看所有
  } else if (req.user.role === 'head') {
    // 户主查看本家庭
    recordsWhere = 'WHERE r.family_id = ?';
    recordsParams.push(req.user.familyId);
    membersWhere = 'WHERE family_id = ?';
    membersParams.push(req.user.familyId);
  } else {
    // 成员只查看自己的
    recordsWhere = 'WHERE r.member_id = ?';
    recordsParams.push(req.user.memberId);
    membersWhere = 'WHERE id = ?';
    membersParams.push(req.user.memberId);
  }

  // 资产相关统计
  const recordsStats = db.prepare(`
    SELECT
      COUNT(*) as total_records,
      SUM(CASE WHEN r.status = 'valid' THEN r.value ELSE 0 END) as total_value,
      SUM(CASE WHEN r.status = 'valid' AND r.previous_value IS NOT NULL
               THEN r.value - r.previous_value ELSE 0 END) as total_change,
      AVG(CASE WHEN r.status = 'valid' AND r.previous_value IS NOT NULL
              THEN ((r.value - r.previous_value) / r.previous_value) * 100
              ELSE NULL END) as avg_rate
    FROM records r
    ${recordsWhere}
  `).get(...recordsParams);

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

  // 资产类型分布
  let typeWhere = '';
  let typeParams = [];
  if (req.user.role === 'admin') {
  } else if (req.user.role === 'head') {
    typeWhere = 'WHERE r.family_id = ?';
    typeParams.push(req.user.familyId);
  } else {
    typeWhere = 'WHERE r.member_id = ?';
    typeParams.push(req.user.memberId);
  }

  const typeDistribution = db.prepare(`
    SELECT 
      r.type,
      at.display_name,
      at.color,
      COUNT(*) as record_count,
      SUM(r.value) as total_value
    FROM records r
    LEFT JOIN asset_types at ON r.type = at.type_value
    ${typeWhere}
    GROUP BY r.type
    ORDER BY total_value DESC
  `).all(...typeParams);

  res.json({
    success: true,
    data: {
      totalValue: recordsStats.total_value || 0,
      totalChange: recordsStats.total_change || 0,
      totalRate: recordsStats.avg_rate ? Number(recordsStats.avg_rate.toFixed(1)) : 0,
      totalRecords: recordsStats.total_records,
      memberCount: membersStats.member_count,
      activeMembers: membersStats.active_members,
      monthlyNew: monthlyStats.monthly_new,
      pendingCount: pendingStats.pending_count,
      typeDistribution
    }
  });
});

module.exports = router;
