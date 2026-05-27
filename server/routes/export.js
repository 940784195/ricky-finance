const express = require('express');
const router = express.Router();
const { getDb } = require('../db');

// ============ 导出 API ============

router.get('/export/csv', (req, res) => {
  const db = getDb();
  const { memberId, type, startDate, endDate } = req.query;

  let whereClauses = ['1=1'];
  let params = [];

  // 权限过滤
  if (req.user.role === 'head') {
    whereClauses.push('r.family_id = ?');
    params.push(req.user.familyId);
  } else if (req.user.role === 'member') {
    whereClauses.push('r.member_id = ?');
    params.push(req.user.memberId);
  }

  if (memberId) {
    whereClauses.push('r.member_id = ?');
    params.push(memberId);
  }
  if (type) {
    whereClauses.push('r.type = ?');
    params.push(type);
  }
  if (startDate) {
    whereClauses.push('r.date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push('r.date <= ?');
    params.push(endDate);
  }

  const sql = `
    SELECT r.*, m.name as member_name, at.display_name as type_display
    FROM records r
    JOIN members m ON r.member_id = m.id
    LEFT JOIN asset_types at ON r.type = at.type_value
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY r.date DESC
  `;

  const records = db.prepare(sql).all(...params);

  const headers = ['成员', '类型', '资产名称', '价值', '上期价值', '日期', '状态', '备注'];
  const lines = [headers.join(',')];

  records.forEach(r => {
    const line = [
      r.member_name,
      r.type_display,
      r.name,
      r.value,
      r.previous_value,
      r.date,
      r.status,
      (r.note || '').replace(/"/g, '""')
    ];
    lines.push(line.map(v => `"${v}"`).join(','));
  });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="资产记录导出.csv"');
  res.send('\uFEFF' + lines.join('\n')); // BOM for UTF-8
});

module.exports = router;
