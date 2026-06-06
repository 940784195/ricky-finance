const express = require('express');
const { query } = require('../db/pgDb');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  const result = await query(
    `SELECT f.*, m.name as head_name
     FROM families f
     LEFT JOIN members m ON f.head_id = m.id
     ORDER BY f.created_at DESC`
  );

  res.json({ success: true, data: result.rows });
});

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  const result = await query(
    `SELECT f.*, m.name as head_name
     FROM families f
     LEFT JOIN members m ON f.head_id = m.id
     WHERE f.id = $1`,
    [req.params.id]
  );

  const family = result.rows[0];
  if (!family) {
    return res.status(404).json({ success: false, message: '家庭不存在' });
  }

  const membersResult = await query(
    'SELECT * FROM members WHERE family_id = $1 ORDER BY role DESC, id ASC',
    [req.params.id]
  );

  res.json({
    success: true,
    data: { ...family, members: membersResult.rows }
  });
});

module.exports = router;
