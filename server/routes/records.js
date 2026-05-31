const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 获取资产记录列表
router.get('/', authMiddleware, (req, res) => {
  const db = getDb();
  const { memberId, type, status, startDate, endDate, keyword } = req.query;

  let whereClauses = ['1=1'];
  let params = [];

  // 权限过滤
  if (req.user.role === 'admin') {
    // 管理员查看所有记录
  } else if (req.user.role === 'head') {
    whereClauses.push('r.family_id = ?');
    params.push(req.user.familyId);
  } else {
    // 成员只查看自己的记录
    whereClauses.push('r.member_id = ?');
    params.push(req.user.memberId);
  }

  // 其他筛选条件
  if (memberId) {
    whereClauses.push('r.member_id = ?');
    params.push(memberId);
  }
  if (type) {
    whereClauses.push('r.type = ?');
    params.push(type);
  }
  if (status) {
    whereClauses.push('r.status = ?');
    params.push(status);
  }
  if (startDate) {
    whereClauses.push('r.date >= ?');
    params.push(startDate);
  }
  if (endDate) {
    whereClauses.push('r.date <= ?');
    params.push(endDate);
  }
  if (keyword) {
    whereClauses.push('(r.name LIKE ? OR m.name LIKE ?)');
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

  const records = db.prepare(sql).all(...params);
  res.json({ success: true, data: records });
});

// 获取单条记录详情
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const record = db.prepare(`
    SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
    FROM records r
    JOIN members m ON r.member_id = m.id
    LEFT JOIN asset_types at ON r.type = at.type_value
    WHERE r.id = ?
  `).get(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  // 权限检查
  if (req.user.role !== 'admin' && record.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权访问此记录' });
  }
  if (req.user.role === 'member' && record.member_id !== req.user.memberId) {
    return res.status(403).json({ success: false, message: '无权访问此记录' });
  }

  res.json({ success: true, data: record });
});

// 添加资产记录
router.post('/', authMiddleware, (req, res) => {
  const { type, name, value, date, previousValue, note, memberId } = req.body;

  // 权限检查
  let targetMemberId = memberId;
  if (req.user.role === 'member') {
    targetMemberId = req.user.memberId;
  }
  if (req.user.role === 'head' && !memberId) {
    targetMemberId = req.user.memberId;
  }
  if (req.user.role === 'head' && memberId) {
    // 验证成员是否属于本家庭
    const member = getDb().prepare('SELECT * FROM members WHERE id = ?').get(memberId);
    if (!member || member.family_id !== req.user.familyId) {
      return res.status(403).json({ success: false, message: '无权为该成员添加记录' });
    }
  }
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: '管理员不允许添加资产记录' });
  }

  if (!type || !name || !value || !date) {
    return res.status(400).json({ success: false, message: '缺少必填项' });
  }

  const db = getDb();
  // 确保 targetMemberId 是数字类型
  const numericMemberId = typeof targetMemberId === 'string' ? parseInt(targetMemberId, 10) : targetMemberId;
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(numericMemberId);
  if (!member) {
    return res.status(400).json({ success: false, message: '成员不存在' });
  }

  const result = db.prepare(`
    INSERT INTO records (member_id, family_id, type, name, value, previous_value, date, status, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'valid', ?)
  `).run(
    numericMemberId,
    member.family_id,
    type,
    name,
    Number(value),
    previousValue ? Number(previousValue) : null,
    date,
    note || ''
  );

  const newRecord = db.prepare(`
    SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
    FROM records r
    JOIN members m ON r.member_id = m.id
    LEFT JOIN asset_types at ON r.type = at.type_value
    WHERE r.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ success: true, data: newRecord });
});

// 更新资产记录
router.put('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  // 权限检查
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: '管理员不允许修改资产记录' });
  }
  if (req.user.role === 'member' && record.member_id !== req.user.memberId) {
    return res.status(403).json({ success: false, message: '无权修改此记录' });
  }
  if (req.user.role === 'head' && record.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权修改此记录' });
  }

  const { type, name, value, date, previousValue, status, note, previous_value } = req.body;
  const actualPreviousValue = previousValue !== undefined ? previousValue : previous_value;
  db.prepare(`
    UPDATE records
    SET type = COALESCE(?, type),
        name = COALESCE(?, name),
        value = CASE WHEN ? IS NOT NULL THEN ? ELSE value END,
        previous_value = CASE WHEN ? IS NOT NULL THEN ? ELSE previous_value END,
        date = COALESCE(?, date),
        status = COALESCE(?, status),
        note = CASE WHEN ? IS NOT NULL THEN ? ELSE note END
    WHERE id = ?
  `).run(type, name, value, value, actualPreviousValue, actualPreviousValue, date, status, note, note, req.params.id);

  const updatedRecord = db.prepare(`
    SELECT r.*, m.name as member_name, at.display_name as type_display, at.color as type_color
    FROM records r
    JOIN members m ON r.member_id = m.id
    LEFT JOIN asset_types at ON r.type = at.type_value
    WHERE r.id = ?
  `).get(req.params.id);

  res.json({ success: true, data: updatedRecord });
});

// 删除资产记录
router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDb();
  const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);

  if (!record) {
    return res.status(404).json({ success: false, message: '记录不存在' });
  }

  // 权限检查
  if (req.user.role === 'admin') {
    return res.status(403).json({ success: false, message: '管理员不允许删除资产记录' });
  }
  if (req.user.role === 'member' && record.member_id !== req.user.memberId) {
    return res.status(403).json({ success: false, message: '无权删除此记录' });
  }
  if (req.user.role === 'head' && record.family_id !== req.user.familyId) {
    return res.status(403).json({ success: false, message: '无权删除此记录' });
  }

  db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: '记录已删除' });
});

module.exports = router;
