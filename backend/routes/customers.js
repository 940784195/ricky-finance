const express = require('express');
const router = express.Router();
const { getDb } = require('../db/db');

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const customers = db.prepare(`
      SELECT m.id, m.name, m.short_name as shortName, 
             f.family_name, f.id as family_id,
             m.created_at,
             (SELECT COUNT(*) FROM members WHERE family_id = f.id) as memberCount,
             (SELECT COUNT(*) FROM records WHERE family_id = f.id AND status = 'valid') as recordCount
      FROM members m
      LEFT JOIN families f ON m.id = f.head_id
      WHERE m.role = 'head'
    `).all();

    for (const customer of customers) {
      const validRecords = db.prepare(`
        SELECT id, name, value, date
        FROM records
        WHERE family_id = ? AND status = 'valid'
        ORDER BY name, date DESC, id DESC
      `).all(customer.family_id);

      const latestMap = {};
      validRecords.forEach(r => {
        if (!latestMap[r.name]) {
          latestMap[r.name] = r;
        }
      });
      const dedupedRecords = Object.values(latestMap);
      customer.totalValue = dedupedRecords.reduce((sum, r) => sum + r.value, 0);
    }

    res.json({ success: true, data: customers });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ success: false, message: '获取客户列表失败' });
  }
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const customerId = parseInt(req.params.id);
  
  try {
    const customer = db.prepare(`
      SELECT m.id, m.name, m.short_name as shortName, 
             f.family_name, f.id as family_id,
             m.created_at,
             (SELECT COUNT(*) FROM records WHERE family_id = f.id AND status = 'valid') as recordCount
      FROM members m
      LEFT JOIN families f ON m.id = f.head_id
      WHERE m.id = ? AND m.role = 'head'
    `).get(customerId);
    
    if (!customer) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }

    const validRecords = db.prepare(`
      SELECT id, name, value, date
      FROM records
      WHERE family_id = ? AND status = 'valid'
      ORDER BY name, date DESC, id DESC
    `).all(customer.family_id);

    const latestMap = {};
    validRecords.forEach(r => {
      if (!latestMap[r.name]) {
        latestMap[r.name] = r;
      }
    });
    const dedupedRecords = Object.values(latestMap);
    customer.totalValue = dedupedRecords.reduce((sum, r) => sum + r.value, 0);
    
    const recordsSql = `
      SELECT r.*, mem.name as member_name
      FROM records r
      LEFT JOIN members mem ON r.member_id = mem.id
      WHERE r.family_id = ? AND r.status = 'valid'
      ORDER BY r.date DESC
    `;
    
    const records = db.prepare(recordsSql).all(customer.family_id);
    
    customer.records = records;
    
    res.json({ success: true, data: customer });
  } catch (err) {
    console.error('Error fetching customer:', err);
    res.status(500).json({ success: false, message: '获取客户信息失败' });
  }
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, shortName, code } = req.body;
  
  if (!name) {
    return res.status(400).json({ success: false, message: '客户名称不能为空' });
  }
  
  try {
    const insertFamily = db.prepare(
      'INSERT INTO families (family_name) VALUES (?)'
    );
    const familyResult = insertFamily.run(name);
    const familyId = familyResult.lastInsertRowid;
    
    const insertMember = db.prepare(
      'INSERT INTO members (family_id, name, short_name, role) VALUES (?, ?, ?, ?)'
    );
    const memberResult = insertMember.run(familyId, name, shortName || name.charAt(0), 'head');
    const memberId = memberResult.lastInsertRowid;
    
    db.prepare('UPDATE families SET head_id = ? WHERE id = ?').run(memberId, familyId);
    
    const customerSql = `
      SELECT m.id, m.name, m.short_name as shortName, 
             f.family_name, f.id as family_id, m.created_at
      FROM members m
      LEFT JOIN families f ON m.id = f.head_id
      WHERE m.id = ?
    `;
    
    const customer = db.prepare(customerSql).get(memberId);
    
    res.status(201).json({ success: true, data: customer });
  } catch (err) {
    console.error('Error creating customer:', err);
    res.status(500).json({ success: false, message: '创建客户失败' });
  }
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const customerId = parseInt(req.params.id);
  const { name, shortName } = req.body;
  
  try {
    const member = db.prepare("SELECT * FROM members WHERE id = ? AND role = 'head'").get(customerId);
    
    if (!member) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    
    if (name) {
      db.prepare('UPDATE members SET name = ? WHERE id = ?').run(name, customerId);
      db.prepare('UPDATE families SET family_name = ? WHERE head_id = ?').run(name, customerId);
    }
    
    if (shortName) {
      db.prepare('UPDATE members SET short_name = ? WHERE id = ?').run(shortName, customerId);
    }
    
    const customerSql = `
      SELECT m.id, m.name, m.short_name as shortName, 
             f.family_name, f.id as family_id, m.created_at
      FROM members m
      LEFT JOIN families f ON m.id = f.head_id
      WHERE m.id = ?
    `;
    
    const customer = db.prepare(customerSql).get(customerId);
    
    res.json({ success: true, data: customer });
  } catch (err) {
    console.error('Error updating customer:', err);
    res.status(500).json({ success: false, message: '更新客户失败' });
  }
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const customerId = parseInt(req.params.id);
  
  try {
    const member = db.prepare("SELECT * FROM members WHERE id = ? AND role = 'head'").get(customerId);
    
    if (!member) {
      return res.status(404).json({ success: false, message: '客户不存在' });
    }
    
    const familyId = member.family_id;
    
    db.prepare('DELETE FROM records WHERE family_id = ?').run(familyId);
    db.prepare('DELETE FROM asset_types WHERE family_id = ?').run(familyId);
    db.prepare('UPDATE families SET head_id = NULL WHERE id = ?').run(familyId);
    db.prepare('UPDATE users SET member_id = NULL WHERE member_id IN (SELECT id FROM members WHERE family_id = ?)').run(familyId);
    db.prepare('DELETE FROM members WHERE family_id = ?').run(familyId);
    db.prepare('DELETE FROM families WHERE id = ?').run(familyId);
    
    res.json({ success: true, message: '客户已删除' });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ success: false, message: '删除客户失败' });
  }
});

module.exports = router;
