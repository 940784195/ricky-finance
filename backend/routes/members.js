const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { buildScopeFilter, canAccess, requireOwnership } = require('../middleware/permissions');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const { clause: scopeClause, params, nextIndex } = buildScopeFilter(req.user, 'm', 1, 'id');

  const whereClause = scopeClause ? `WHERE ${scopeClause}` : '';

  const membersResult = await query(
    `SELECT m.*,
      (SELECT COUNT(*) FROM records r WHERE r.member_id = m.id) as record_count,
      (SELECT COALESCE(SUM(r2.value), 0)
       FROM records r2
       WHERE r2.member_id = m.id
         AND r2.status = 'valid'
         AND r2.id = (
           SELECT r3.id FROM records r3
           WHERE r3.member_id = r2.member_id AND r3.name = r2.name AND r3.status = 'valid'
           ORDER BY r3.date DESC, r3.id DESC LIMIT 1
         )
      ) as total_assets
     FROM members m
     ${whereClause}
     ORDER BY m.role DESC, m.id ASC`,
    params
  );

  res.json({ success: true, data: membersResult.rows });
});

const loadMember = (req) =>
  query(
    `SELECT m.*,
      (SELECT COUNT(*) FROM records r WHERE r.member_id = m.id) as record_count
     FROM members m WHERE m.id = $1`,
    [req.params.id]
  ).then(result => result.rows[0]);

router.get('/:id', authMiddleware, requireOwnership('成员', loadMember, 'id'), async (req, res) => {
  const member = req.resource;

  const recordsResult = await query(
    `SELECT r.*, at.display_name as type_display, at.color as type_color
     FROM records r
     LEFT JOIN asset_types at ON r.type = at.type_value
     WHERE r.member_id = $1
     ORDER BY r.date DESC, r.created_at DESC`,
    [req.params.id]
  );

  res.json({
    success: true,
    data: { ...member, records: recordsResult.rows }
  });
});

router.post('/', authMiddleware, requireRole('head'), async (req, res) => {
  const { name, shortName, role } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: '成员姓名不能为空' });
  }

  const insertResult = await query(
    `INSERT INTO members (family_id, name, short_name, role)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [req.user.familyId, name, shortName || name.charAt(0), role || 'member']
  );

  const newMember = await query('SELECT * FROM members WHERE id = $1', [insertResult.rows[0].id]);
  res.status(201).json({ success: true, data: newMember.rows[0] });
});

router.put('/:id', authMiddleware, requireRole('head'), requireOwnership('成员', loadMember, 'id'), async (req, res) => {
  const { name, shortName, role } = req.body;

  await query(
    `UPDATE members
     SET name = COALESCE($1, name),
         short_name = COALESCE($2, short_name),
         role = COALESCE($3, role)
     WHERE id = $4`,
    [name, shortName, role, req.params.id]
  );

  const updated = await query('SELECT * FROM members WHERE id = $1', [req.params.id]);
  res.json({ success: true, data: updated.rows[0] });
});

router.delete('/:id', authMiddleware, requireRole('head'), requireOwnership('成员', loadMember, 'id'), async (req, res) => {
  await query('UPDATE users SET member_id = NULL WHERE member_id = $1', [req.params.id]);
  await query('DELETE FROM records WHERE member_id = $1', [req.params.id]);
  await query('DELETE FROM members WHERE id = $1', [req.params.id]);

  res.json({ success: true, message: '成员已删除' });
});

module.exports = router;
