const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware } = require('../middleware/auth');
const { buildScopeFilter } = require('../middleware/permissions');

const router = express.Router();

router.get('/csv', authMiddleware, async (req, res) => {
  const { memberId, type, startDate, endDate } = req.query;
  const { clause: scopeClause, params, nextIndex } = buildScopeFilter(req.user, 'r');

  let whereClauses = ['1=1'];
  if (scopeClause) whereClauses.push(scopeClause);
  let paramIndex = nextIndex;

  if (memberId) {
    whereClauses.push(`r.member_id = $${paramIndex++}`);
    params.push(memberId);
  }
  if (type) {
    whereClauses.push(`r.type = $${paramIndex++}`);
    params.push(type);
  }
  if (startDate) {
    whereClauses.push(`r.date >= $${paramIndex++}`);
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push(`r.date <= $${paramIndex++}`);
    params.push(endDate);
  }

  const result = await query(
    `SELECT r.*, m.name as member_name
     FROM records r
     JOIN members m ON r.member_id = m.id
     WHERE ${whereClauses.join(' AND ')}
     ORDER BY r.date DESC, r.created_at DESC`,
    params
  );

  const rows = result.rows;
  const BOM = '\uFEFF';
  const headers = ['ID', '成员', '资产类型', '资产名称', '价值', '上期价值', '日期', '状态', '备注', '创建时间'];

  let csv = BOM + headers.join(',') + '\n';
  rows.forEach(r => {
    const line = [
      r.id,
      `"${(r.member_name || '').replace(/"/g, '""')}"`,
      r.type,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      r.value,
      r.previous_value || '',
      r.date,
      r.status,
      `"${(r.note || '').replace(/"/g, '""')}"`,
      r.created_at
    ];
    csv += line.join(',') + '\n';
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=asset_records_${new Date().toISOString().slice(0, 10)}.csv`);
  res.send(csv);
});

module.exports = router;
