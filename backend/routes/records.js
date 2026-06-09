const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/asset-names', authMiddleware, async (req, res) => {
  const { keyword } = req.query;

  let whereClauses = [];
  let params = [];
  let paramIndex = 1;

  if (req.user.role === 'head') {
    whereClauses.push(`r.family_id = $${paramIndex++}`);
    params.push(req.user.familyId);
  } else if (req.user.role === 'member') {
    whereClauses.push(`r.member_id = $${paramIndex++}`);
    params.push(req.user.memberId);
  }

  if (keyword) {
    whereClauses.push(`r.name LIKE $${paramIndex++}`);
    params.push(`%${keyword}%`);
  }

  const sql = `
    SELECT r.name
    FROM records r
    ${whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''}
    GROUP BY r.name
    ORDER BY MAX(r.date) DESC
    LIMIT 20
  `;

  const result = await query(sql, params);
  const names = result.rows.map(row => row.name);
  res.json({ success: true, data: names });
});

router.get('/', authMiddleware, async (req, res) => {
  const { memberId, type, status, startDate, endDate, keyword } = req.query;

  let whereClauses = ['1=1'];
  let params = [];
  let paramIndex = 1;

  if (req.user.role === 'head') {
    whereClauses.push(`r.family_id = $${paramIndex++}`);
    params.push(req.user.familyId);
  } else if (req.user.role === 'member') {
    whereClauses.push(`r.member_id = $${paramIndex++}`);
    params.push(req.user.memberId);
  }

  if (memberId) {
    whereClauses.push(`r.member_id = $${paramIndex++}`);
    params.push(memberId);
  }
  if (type) {
    whereClauses.push(`r.type = $${paramIndex++}`);
    params.push(type);
  }
  if (status) {
    whereClauses.push(`r.status = $${paramIndex++}`);
    params.push(status);
  }
  if (startDate) {
    whereClauses.push(`r.date >= $${paramIndex++}`);
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push(`r.date <= $${paramIndex++}`);
    params.push(endDate);
  }
  if (keyword) {
    whereClauses.push(`(r.name LIKE $${paramIndex++} OR m.name LIKE $${paramIndex++})`);
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  const sql = `
    SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
    FROM records r
    JOIN members m ON r.member_id = m.id
    LEFT JOIN asset_types at ON r.type = at.type_value
    WHERE ${whereClauses.join(' AND ')}
    ORDER BY r.date DESC, r.created_at DESC
  `;

  const result = await query(sql, params);
  res.json({ success: true, data: result.rows });
});

router.get('/:id', authMiddleware, async (req, res) => {
  const result = await query(
    `SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
     FROM records r
     JOIN members m ON r.member_id = m.id
     LEFT JOIN asset_types at ON r.type = at.type_value
     WHERE r.id = $1`,
    [req.params.id]
  );

  const record = result.rows[0];
  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  if (req.user.role !== 'admin' && record.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权访问此记录' });
  }
  if (req.user.role === 'member' && record.member_id !== req.user.memberId) {
    return res.status(403).json({ success: false, message: '无权访问此记录' });
  }

  res.json({ success: true, data: record });
});

router.post('/', authMiddleware, async (req, res) => {
  const { type, name, value, date, note, memberId } = req.body;

  let targetMemberId = memberId;
  if (req.user.role === 'member') {
    targetMemberId = req.user.memberId;
  }
  if (req.user.role === 'head' && !memberId) {
    targetMemberId = req.user.memberId;
  }
  if (req.user.role === 'head' && memberId) {
    const memberResult = await query('SELECT * FROM members WHERE id = $1', [memberId]);
    const member = memberResult.rows[0];
    if (!member || member.family_id !== req.user.familyId) {
      return res.status(403).json({ success: false, message: '无权为该成员添加记录' });
    }
  }

  if (req.user.role === 'admin' && !memberId) {
    return res.status(400).json({ success: false, message: '管理员添加记录必须指定 memberId' });
  }

  if (!type || !name || !value || !date) {
    return res.status(400).json({ success: false, message: '缺少必填项' });
  }

  const numericMemberId = typeof targetMemberId === 'string' ? parseInt(targetMemberId, 10) : targetMemberId;
  const memberResult = await query('SELECT * FROM members WHERE id = $1', [numericMemberId]);
  const member = memberResult.rows[0];
  if (!member) {
    return res.status(400).json({ success: false, message: '成员不存在' });
  }

  const insertResult = await query(
    `INSERT INTO records (member_id, family_id, type, name, value, date, status, note)
     VALUES ($1, $2, $3, $4, $5, $6, 'valid', $7) RETURNING id`,
    [numericMemberId, member.family_id, type, name, Number(value), date, note || '']
  );

  const newResult = await query(
    `SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
     FROM records r
     JOIN members m ON r.member_id = m.id
     LEFT JOIN asset_types at ON r.type = at.type_value
     WHERE r.id = $1`,
    [insertResult.rows[0].id]
  );

  res.status(201).json({ success: true, data: newResult.rows[0] });
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
  const recordResult = await query('SELECT * FROM records WHERE id = $1', [req.params.id]);
  const record = recordResult.rows[0];

  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  if (req.user.role === 'member' && record.member_id !== req.user.memberId) {
    return res.status(403).json({ success: false, message: '无权修改此记录' });
  }
  if (req.user.role === 'head' && record.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权修改此记录' });
  }

  const { type, name, value, date, previousValue, status, note, previous_value } = req.body;
  const actualPreviousValue = previousValue !== undefined ? previousValue : previous_value;

  await query(
    `UPDATE records
     SET type = COALESCE($1::TEXT, type),
         name = COALESCE($2::TEXT, name),
         value = CASE WHEN $3::REAL IS NOT NULL THEN $4::REAL ELSE value END,
         previous_value = CASE WHEN $5::REAL IS NOT NULL THEN $6::REAL ELSE previous_value END,
         date = COALESCE($7::TEXT, date),
         status = COALESCE($8::TEXT, status),
         note = CASE WHEN $9::TEXT IS NOT NULL THEN $10::TEXT ELSE note END
     WHERE id = $11`,
    [type, name, value, value, actualPreviousValue, actualPreviousValue, date, status, note, note, req.params.id]
  );

  const updatedResult = await query(
    `SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
     FROM records r
     JOIN members m ON r.member_id = m.id
     LEFT JOIN asset_types at ON r.type = at.type_value
     WHERE r.id = $1`,
    [req.params.id]
  );

  res.json({ success: true, data: updatedResult.rows[0] });
  } catch (err) {
    console.error('[PUT /records/:id] Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const recordResult = await query('SELECT * FROM records WHERE id = $1', [req.params.id]);
  const record = recordResult.rows[0];

  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  if (req.user.role === 'member' && record.member_id !== req.user.memberId) {
    return res.status(403).json({ success: false, message: '无权删除此记录' });
  }
  if (req.user.role === 'head' && record.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权删除此记录' });
  }

  await query('DELETE FROM records WHERE id = $1', [req.params.id]);
  res.json({ success: true, message: '记录已删除' });
});

module.exports = router;
