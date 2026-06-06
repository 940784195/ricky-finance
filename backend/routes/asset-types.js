const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

const DEFAULT_TYPES = [
  { type_value: 'stock', display_name: '股票', color: '#f59e0b' },
  { type_value: 'fund', display_name: '基金', color: '#3b82f6' },
  { type_value: 'bond', display_name: '债券', color: '#10b981' },
  { type_value: 'realestate', display_name: '房地产', color: '#ec4899' },
  { type_value: 'cash', display_name: '现金', color: '#6366f1' },
  { type_value: 'other', display_name: '其他', color: '#6b7280' },
];

router.get('/', authMiddleware, async (req, res) => {
  let whereClause = '';
  let params = [];
  let paramIndex = 1;

  if (req.user.role === 'admin') {
    whereClause = '';
  } else if (req.user.role === 'head') {
    whereClause = `WHERE (at.family_id IS NULL OR at.family_id = $${paramIndex++})`;
    params.push(req.user.familyId);
  } else {
    whereClause = `WHERE (at.family_id IS NULL OR at.family_id = $${paramIndex++})`;
    params.push(req.user.familyId);
  }

  const typesResult = await query(
    `SELECT at.*,
      (SELECT COUNT(*) FROM records r WHERE r.type = at.type_value) as usage_count
     FROM asset_types at
     ${whereClause}
     ORDER BY at.is_custom ASC, at.id ASC`,
    params
  );

  res.json({ success: true, data: typesResult.rows });
});

router.post('/', authMiddleware, requireRole('head'), async (req, res) => {
  const { typeValue, displayName, color } = req.body;

  if (!typeValue || !displayName || !color) {
    return res.status(400).json({ success: false, message: '缺少必填项' });
  }

  const existingResult = await query(
    'SELECT * FROM asset_types WHERE type_value = $1 AND (family_id IS NULL OR family_id = $2)',
    [typeValue, req.user.familyId]
  );
  if (existingResult.rows.length > 0) {
    return res.status(400).json({ success: false, message: '该资产类型已存在' });
  }

  const insertResult = await query(
    `INSERT INTO asset_types (type_value, display_name, color, is_custom, family_id)
     VALUES ($1, $2, $3, 1, $4) RETURNING id`,
    [typeValue, displayName, color, req.user.familyId]
  );

  const newType = await query('SELECT * FROM asset_types WHERE id = $1', [insertResult.rows[0].id]);
  res.status(201).json({ success: true, data: newType.rows[0] });
});

router.post('/restore-default', authMiddleware, requireRole('head'), async (req, res) => {
  const client = await require('../db/pgPool').getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'DELETE FROM asset_types WHERE is_custom = 1 AND family_id = $1',
      [req.user.familyId]
    );

    for (const type of DEFAULT_TYPES) {
      const existingResult = await client.query(
        'SELECT id FROM asset_types WHERE type_value = $1 AND family_id IS NULL',
        [type.type_value]
      );
      if (existingResult.rows.length === 0) {
        await client.query(
          'INSERT INTO asset_types (type_value, display_name, color, is_custom) VALUES ($1, $2, $3, 0)',
          [type.type_value, type.display_name, type.color]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, message: '已恢复默认资产类型' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

router.put('/:id', authMiddleware, requireRole('head'), async (req, res) => {
  const typeResult = await query('SELECT * FROM asset_types WHERE id = $1', [req.params.id]);
  const assetType = typeResult.rows[0];

  if (!assetType) {
    return res.status(404).json({ success: false, message: '资产类型不存在' });
  }
  if (!assetType.is_custom) {
    return res.status(403).json({ success: false, message: '不能修改系统默认类型' });
  }
  if (assetType.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权修改此类型' });
  }

  const { displayName, color } = req.body;

  await query(
    `UPDATE asset_types
     SET display_name = COALESCE($1, display_name),
         color = COALESCE($2, color)
     WHERE id = $3`,
    [displayName, color, req.params.id]
  );

  const updated = await query('SELECT * FROM asset_types WHERE id = $1', [req.params.id]);
  res.json({ success: true, data: updated.rows[0] });
});

router.delete('/:id', authMiddleware, requireRole('head'), async (req, res) => {
  const typeResult = await query('SELECT * FROM asset_types WHERE id = $1', [req.params.id]);
  const assetType = typeResult.rows[0];

  if (!assetType) {
    return res.status(404).json({ success: false, message: '资产类型不存在' });
  }
  if (!assetType.is_custom) {
    return res.status(403).json({ success: false, message: '不能删除系统默认类型' });
  }
  if (assetType.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权删除此类型' });
  }

  const client = await require('../db/pgPool').getClient();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE records SET type = $1 WHERE type = $2',
      ['other', assetType.type_value]
    );

    await client.query('DELETE FROM asset_types WHERE id = $1', [req.params.id]);

    await client.query('COMMIT');
    res.json({ success: true, message: '资产类型已删除，关联记录已转为"其他"类型' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
});

module.exports = router;
