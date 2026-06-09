const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  let recordsWhere = '';
  let recordsParams = [];
  let membersWhere = '';
  let membersParams = [];
  let whereConnector = 'WHERE';

  if (req.user.role === 'admin') {
    whereConnector = 'WHERE';
  } else if (req.user.role === 'head') {
    recordsWhere = 'WHERE r.family_id = $1';
    recordsParams.push(req.user.familyId);
    membersWhere = 'WHERE family_id = $1';
    membersParams.push(req.user.familyId);
    whereConnector = 'AND';
  } else {
    recordsWhere = 'WHERE r.member_id = $1';
    recordsParams.push(req.user.memberId);
    membersWhere = 'WHERE id = $1';
    membersParams.push(req.user.memberId);
    whereConnector = 'AND';
  }

  const allValidResult = await query(
    `SELECT r.id, r.name, r.value, r.type, r.status, r.created_at, r.date, r.member_id
     FROM records r
     ${recordsWhere}
     ${whereConnector} r.status = 'valid'
     ORDER BY r.member_id, r.name, r.date DESC, r.id DESC`,
    recordsParams
  );

  const latestRecordMap = {};
  allValidResult.rows.forEach(r => {
    const key = `${r.member_id}_${r.name}`;
    if (!latestRecordMap[key]) {
      latestRecordMap[key] = r;
    }
  });
  const deduplicatedRecords = Object.values(latestRecordMap);

  const totalValue = deduplicatedRecords.reduce((sum, r) => sum + r.value, 0);

  const totalResult = await query(
    `SELECT COUNT(*) as total_records
     FROM records r
     ${recordsWhere}`,
    recordsParams
  );
  const totalRecords = parseInt(totalResult.rows[0].total_records);

  const membersStatsResult = await query(
    `SELECT
      COUNT(*) as member_count,
      COUNT(DISTINCT CASE WHEN EXISTS (
        SELECT 1 FROM records r WHERE r.member_id = m.id AND r.status = 'valid'
      ) THEN m.id END) as active_members
     FROM members m
     ${membersWhere}`,
    membersParams
  );
  const membersStats = membersStatsResult.rows[0];

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  let monthlyParamIndex = 1;
  let monthlyWhere = `WHERE r.date >= $${monthlyParamIndex++}`;
  let monthlyParams = [monthStart];

  if (req.user.role === 'head') {
    monthlyWhere += ` AND r.family_id = $${monthlyParamIndex++}`;
    monthlyParams.push(req.user.familyId);
  } else if (req.user.role === 'member') {
    monthlyWhere += ` AND r.member_id = $${monthlyParamIndex++}`;
    monthlyParams.push(req.user.memberId);
  }

  const monthlyResult = await query(
    `SELECT COUNT(*) as monthly_new
     FROM records r
     ${monthlyWhere}`,
    monthlyParams
  );

  let pendingParamIndex = 1;
  let pendingWhere = `WHERE r.status = $${pendingParamIndex++}`;
  let pendingParams = ['pending'];

  if (req.user.role === 'head') {
    pendingWhere += ` AND r.family_id = $${pendingParamIndex++}`;
    pendingParams.push(req.user.familyId);
  } else if (req.user.role === 'member') {
    pendingWhere += ` AND r.member_id = $${pendingParamIndex++}`;
    pendingParams.push(req.user.memberId);
  }

  const pendingResult = await query(
    `SELECT COUNT(*) as pending_count
     FROM records r
     ${pendingWhere}`,
    pendingParams
  );

  const typeMap = {};
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

  const allTypesResult = await query('SELECT type_value, display_name, color FROM asset_types');
  const typeInfo = {};
  allTypesResult.rows.forEach(t => {
    typeInfo[t.type_value] = t;
  });

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
      memberCount: parseInt(membersStats.member_count),
      activeMembers: parseInt(membersStats.active_members),
      monthlyNew: parseInt(monthlyResult.rows[0].monthly_new),
      pendingCount: parseInt(pendingResult.rows[0].pending_count),
      typeDistribution
    }
  });
});

module.exports = router;
