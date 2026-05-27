const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取所有家庭（管理员）
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDb();
  const families = db.prepare(`
    SELECT f.*, m.name as head_name
    FROM families f
    LEFT JOIN members m ON f.head_id = m.id
  `).all();

  res.json({ success: true, data: families });
});

// 获取家庭详情（管理员）
router.get('/:id', authMiddleware, requireRole('admin'), (req, res) => {
  const db = getDb();
  const family = db.prepare(`
    SELECT f.*, m.name as head_name
    FROM families f
    LEFT JOIN members m ON f.head_id = m.id
    WHERE f.id = ?
  `).get(req.params.id);

  if (!family) {
    return res.status(404).json({ success: false, message: '家庭不存在' });
  }

  res.json({ success: true, data: family });
});

module.exports = router;
