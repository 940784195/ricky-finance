const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const result = await query(
    `SELECT m.id, m.name, m.short_name, m.role, m.created_at,
            f.id as family_id, f.family_name,
            (SELECT COUNT(*) FROM members mem WHERE mem.family_id = f.id) as member_count,
            (SELECT COUNT(*) FROM records r WHERE r.family_id = f.id) as record_count,
            (SELECT COALESCE(SUM(r2.value), 0)
             FROM records r2
             WHERE r2.family_id = f.id
               AND r2.status = 'valid'
               AND r2.id = (
                 SELECT r3.id FROM records r3
                 WHERE r3.member_id = r2.member_id AND r3.name = r2.name AND r3.status = 'valid'
                 ORDER BY r3.date DESC, r3.id DESC LIMIT 1
               )
            ) as total_value
     FROM members m
     JOIN families f ON m.family_id = f.id
     WHERE m.role = 'head'
     ORDER BY m.created_at DESC`
  );

  res.json({ success: true, data: result.rows });
});

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const memberResult = await query(
    `SELECT m.*, f.family_name
     FROM members m
     JOIN families f ON m.family_id = f.id
     WHERE m.id = $1 AND m.role = 'head'`,
    [req.params.id]
  );

  const customer = memberResult.rows[0];
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }

  const recordsResult = await query(
    `SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
     FROM records r
     JOIN members m ON r.member_id = m.id
     LEFT JOIN asset_types at ON r.type = at.type_value
     WHERE r.family_id = $1
     ORDER BY r.date DESC, r.created_at DESC`,
    [customer.family_id]
  );

  const statsResult = await query(
    `SELECT
      (SELECT COALESCE(SUM(r2.value), 0)
       FROM records r2
       WHERE r2.family_id = $1
         AND r2.status = 'valid'
         AND r2.id = (
           SELECT r3.id FROM records r3
           WHERE r3.member_id = r2.member_id AND r3.name = r2.name AND r3.status = 'valid'
           ORDER BY r3.date DESC, r3.id DESC LIMIT 1
         )
      ) as total_value,
      (SELECT COUNT(*) FROM records r WHERE r.family_id = $1) as record_count`,
    [customer.family_id]
  );

  res.json({
    success: true,
    data: {
      ...customer,
      totalValue: parseFloat(statsResult.rows[0].total_value) || 0,
      recordCount: parseInt(statsResult.rows[0].record_count) || 0,
      records: recordsResult.rows
    }
  });
});

router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, shortName, code } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: '客户名称不能为空' });
  }

  const client = await require('../db/pgPool').getClient();
  try {
    await client.query('BEGIN');

    const familyResult = await client.query(
      'INSERT INTO families (family_name) VALUES ($1) RETURNING id',
      [name]
    );
    const familyId = familyResult.rows[0].id;

    const memberResult = await client.query(
      `INSERT INTO members (family_id, name, short_name, role)
       VALUES ($1, $2, $3, 'head') RETURNING id`,
      [familyId, name, shortName || name.charAt(0)]
    );
    const headId = memberResult.rows[0].id;

    await client.query('UPDATE families SET head_id = $1 WHERE id = $2', [headId, familyId]);

    await client.query('COMMIT');

    const newCustomer = await query(
      `SELECT m.*, f.family_name, f.id as family_id
       FROM members m
       JOIN families f ON m.family_id = f.id
       WHERE m.id = $1`,
      [headId]
    );

    res.status(201).json({ success: true, data: newCustomer.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const memberResult = await query(
    'SELECT * FROM members WHERE id = $1 AND role = $2',
    [req.params.id, 'head']
  );

  const customer = memberResult.rows[0];
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }

  const { name, shortName } = req.body;

  if (name) {
    await query('UPDATE members SET name = $1 WHERE id = $2', [name, req.params.id]);
    await query('UPDATE families SET family_name = $1 WHERE head_id = $2', [name, req.params.id]);
  }
  if (shortName) {
    await query('UPDATE members SET short_name = $1 WHERE id = $2', [shortName, req.params.id]);
  }

  const updated = await query(
    `SELECT m.*, f.family_name, f.id as family_id
     FROM members m
     JOIN families f ON m.family_id = f.id
     WHERE m.id = $1`,
    [req.params.id]
  );

  res.json({ success: true, data: updated.rows[0] });
});

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const memberResult = await query(
    'SELECT * FROM members WHERE id = $1 AND role = $2',
    [req.params.id, 'head']
  );

  const customer = memberResult.rows[0];
  if (!customer) {
    return res.status(404).json({ success: false, message: '客户不存在' });
  }

  const client = await require('../db/pgPool').getClient();
  try {
    await client.query('BEGIN');

    await client.query('UPDATE users SET member_id = NULL WHERE member_id = $1', [req.params.id]);
    await client.query('DELETE FROM records WHERE family_id = $1', [customer.family_id]);
    await client.query('DELETE FROM asset_types WHERE family_id = $1', [customer.family_id]);
    await client.query('DELETE FROM members WHERE family_id = $1', [customer.family_id]);
    await client.query('DELETE FROM families WHERE id = $1', [customer.family_id]);

    await client.query('COMMIT');
    res.json({ success: true, message: '客户已删除' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = router;
