const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取可用的资产类型
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  let types;

  if (req.user.role === 'admin') {
    types = db.prepare('SELECT * FROM asset_types ORDER BY id').all();
  } else {
    // 普通用户/户主 获取系统默认+家庭自定义类型
    types = db.prepare(`
      SELECT * FROM asset_types
      WHERE is_custom = 0 OR (is_custom = 1 AND family_id = ?)
      ORDER BY id
    `).all(req.user.familyId);
  }

  res.json({ success: true, data: types });
});

// 添加自定义资产类型（户主）
router.post('/', authMiddleware, requireRole('head'), (req, res) => {
  const { typeValue, displayName, color } = req.body;

  if (!typeValue || !displayName || !color) {
    return res.status(400).json({ success: false, message: '缺少必填项' });
  }

  const db = getDb();

  // 检查是否已存在
  const existing = db.prepare('SELECT * FROM asset_types WHERE type_value = ?').get(typeValue);
  if (existing) {
    return res.status(400).json({ success: false, message: '类型标识已存在' });
  }

  const result = db.prepare(`
    INSERT INTO asset_types (type_value, display_name, color, is_custom, family_id)
    VALUES (?, ?, ?, 1, ?)
  `).run(typeValue, displayName, color, req.user.familyId);

  const newType = db.prepare('SELECT * FROM asset_types WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: newType });
});

// 更新自定义资产类型（户主）
router.put('/:id', authMiddleware, requireRole('head'), (req, res) => {
  const db = getDb();
  const type = db.prepare('SELECT * FROM asset_types WHERE id = ?').get(req.params.id);

  if (!type) {
    return res.status(404).json({ success: false, message: '类型不存在' });
  }

  if (!type.is_custom || type.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权修改此类型' });
  }

  const { displayName, color } = req.body;
  db.prepare(`
    UPDATE asset_types
    SET display_name = COALESCE(?, display_name),
        color = COALESCE(?, color)
    WHERE id = ?
  `).run(displayName, color, req.params.id);

  const updatedType = db.prepare('SELECT * FROM asset_types WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updatedType });
});

// 删除自定义资产类型（户主）
router.delete('/:id', authMiddleware, requireRole('head'), (req, res) => {
  const db = getDb();
  const type = db.prepare('SELECT * FROM asset_types WHERE id = ?').get(req.params.id);

  if (!type) {
    return res.status(404).json({ success: false, message: '类型不存在' });
  }

  if (!type.is_custom || type.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权删除此类型' });
  }

  // 检查是否有记录使用此类型
  const usage = db.prepare('SELECT COUNT(*) as cnt FROM records WHERE type = ?').get(type.type_value);
  if (usage.cnt > 0) {
    return res.status(400).json({ success: false, message: '此类型正在使用中，无法删除' });
  }

  db.prepare('DELETE FROM asset_types WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '类型已删除' });
});

module.exports = router;
