const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// 获取当前家庭的所有成员（户主）
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  let members;

  if (req.user.role === 'admin') {
    // 管理员查看所有成员
    members = db.prepare(`
      SELECT m.*, f.family_name
      FROM members m
      JOIN families f ON m.family_id = f.id
    `).all();
  } else if (req.user.role === 'head') {
    // 户主查看自己家庭的成员
    members = db.prepare(`
      SELECT m.*
      FROM members m
      WHERE m.family_id = ?
    `).all(req.user.familyId);
  } else {
    // 成员只查看自己
    members = db.prepare(`
      SELECT m.*
      FROM members m
      WHERE m.id = ?
    `).all(req.user.memberId);
  }

  // 补充成员资产统计
  for (let member of members) {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as record_count,
        SUM(CASE WHEN status = 'valid' THEN value ELSE 0 END) as total_value
      FROM records
      WHERE member_id = ?
    `).get(member.id);
    member.record_count = stats.record_count;
    member.total_value = stats.total_value || 0;
  }

  res.json({ success: true, data: members });
});

// 获取成员详情（含资产记录）
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);

  if (!member) {
    return res.status(404).json({ success: false, message: '成员不存在' });
  }

  // 权限检查
  if (req.user.role !== 'admin' && member.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权访问' });
  }

  // 获取成员资产记录
  const records = db.prepare(`
    SELECT r.*, at.display_name as type_display
    FROM records r
    LEFT JOIN asset_types at ON r.type = at.type_value
    WHERE r.member_id = ?
    ORDER BY r.date DESC
  `).all(req.params.id);

  res.json({ success: true, data: { ...member, records } });
});

// 添加新成员（户主）
router.post('/', authMiddleware, requireRole('head'), (req, res) => {
  const { name, shortName } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: '成员姓名为必填项' });
  }

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO members (family_id, name, short_name, role)
    VALUES (?, ?, ?, 'member')
  `).run(req.user.familyId, name, shortName || name.charAt(0));

  const newMember = db.prepare('SELECT * FROM members WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: newMember });
});

// 更新成员信息（户主）
router.put('/:id', authMiddleware, requireRole('head'), (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);

  if (!member) {
    return res.status(404).json({ success: false, message: '成员不存在' });
  }

  if (member.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权修改' });
  }

  const { name, shortName } = req.body;
  db.prepare(`
    UPDATE members
    SET name = COALESCE(?, name),
        short_name = COALESCE(?, short_name)
    WHERE id = ?
  `).run(name, shortName, req.params.id);

  const updatedMember = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updatedMember });
});

// 删除成员（户主）
router.delete('/:id', authMiddleware, requireRole('head'), (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);

  if (!member) {
    return res.status(404).json({ success: false, message: '成员不存在' });
  }

  if (member.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权删除' });
  }

  // 删除成员资产记录
  db.prepare('DELETE FROM records WHERE member_id = ?').run(req.params.id);
  // 删除成员用户账号
  db.prepare('UPDATE users SET member_id = NULL WHERE member_id = ?').run(req.params.id);
  // 删除成员
  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id);

  res.json({ success: true, message: '成员已删除' });
});

module.exports = router;
