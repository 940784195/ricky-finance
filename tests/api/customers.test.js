const request = require('supertest');
const app = require('../../server/index');
const { seedTestData, cleanupTestData, adminToken, userToken, headToken, testMemberId, testFamilyId } = require('../helpers/setup');
const { getDb, setActiveDb } = require('../../server/db');

const TEST_DB_NAME = 'test';
setActiveDb(TEST_DB_NAME);

beforeEach(() => {
  seedTestData();
});

afterEach(() => {
  cleanupTestData();
});

function authRequest(req, token = adminToken) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Customers API', () => {
  describe('GET /api/customers', () => {
    it('should return all customers for admin', async () => {
      const res = await authRequest(request(app).get('/api/customers'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should include memberCount, recordCount and totalValue for each customer', async () => {
      const res = await authRequest(request(app).get('/api/customers'));
      expect(res.status).toBe(200);
      
      const customer = res.body.data[0];
      expect(customer.memberCount).toBeDefined();
      expect(typeof customer.memberCount).toBe('number');
      expect(customer.recordCount).toBeDefined();
      expect(typeof customer.recordCount).toBe('number');
      expect(customer.totalValue).toBeDefined();
      expect(typeof customer.totalValue).toBe('number');
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer with stats using dynamic ID', async () => {
      const res = await authRequest(request(app).get(`/api/customers/${testMemberId}`));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('测试户主');
      expect(res.body.data.totalValue).toBeGreaterThan(0);
      expect(res.body.data.recordCount).toBeGreaterThan(0);
      expect(res.body.data.records.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authRequest(request(app).get('/api/customers/99999'));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('客户不存在');
    });

    it('should return 404 for non-head member', async () => {
      // 测试成员（非户主）不应被视为客户
      const res = await authRequest(request(app).get('/api/customers/2'));
      expect(res.status).toBe(404);
    });

    it('should include records array with member_name', async () => {
      const res = await authRequest(request(app).get(`/api/customers/${testMemberId}`));
      expect(res.status).toBe(200);
      
      const records = res.body.data.records;
      expect(Array.isArray(records)).toBe(true);
      
      if (records.length > 0) {
        expect(records[0].member_name).toBeDefined();
        expect(records[0].type).toBeDefined();
        expect(records[0].value).toBeDefined();
      }
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer with full data', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: '新客户张三',
        shortName: '张',
        code: 'C099'
      }));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('新客户张三');
      expect(res.body.data.shortName).toBe('张');
    });

    it('should auto-generate shortName if not provided', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: '自动生成客户'
      }));
      expect(res.status).toBe(201);
      expect(res.body.data.shortName).toBe('自');
    });

    it('should return 400 when name is missing', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({}));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('客户名称不能为空');
    });

    it('should return 400 when name is empty string', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: ''
      }));
      expect(res.status).toBe(400);
    });

    it('should create associated family and member records', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: '关联测试客户'
      }));
      expect(res.status).toBe(201);
      
      const db = getDb(TEST_DB_NAME);
      const customerId = res.body.data.id;
      
      // 验证成员记录
      const member = db.prepare('SELECT * FROM members WHERE id = ?').get(customerId);
      expect(member).not.toBeUndefined();
      expect(member.role).toBe('head');
      
      // 验证家庭记录
      const family = db.prepare('SELECT * FROM families WHERE head_id = ?').get(customerId);
      expect(family).not.toBeUndefined();
      expect(family.family_name).toBe('关联测试客户');
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update an existing customer using dynamic ID', async () => {
      const res = await authRequest(request(app).put(`/api/customers/${testMemberId}`).send({
        name: '测试户主已修改',
        shortName: '改'
      }));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('测试户主已修改');
      expect(res.body.data.shortName).toBe('改');
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authRequest(request(app).put('/api/customers/99999').send({ name: 'test' }));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-head member', async () => {
      const res = await authRequest(request(app).put('/api/customers/2').send({ name: 'test' }));
      expect(res.status).toBe(404);
    });

    it('should update name only when shortName is not provided', async () => {
      // 先创建一个新客户，避免状态污染
      const createRes = await authRequest(request(app).post('/api/customers').send({
        name: '部分更新测试客户',
        shortName: '原'
      }));
      const newCustomerId = createRes.body.data.id;
      
      // 只更新名称
      const updateRes = await authRequest(request(app).put(`/api/customers/${newCustomerId}`).send({
        name: '仅改名称'
      }));
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('仅改名称');
      expect(updateRes.body.data.shortName).toBe('原'); // 保持不变
    });

    it('should update shortName only when name is not provided', async () => {
      // 先创建一个新客户，避免状态污染
      const createRes = await authRequest(request(app).post('/api/customers').send({
        name: '部分更新测试客户2',
        shortName: '原'
      }));
      const newCustomerId = createRes.body.data.id;
      
      // 只更新简称
      const updateRes = await authRequest(request(app).put(`/api/customers/${newCustomerId}`).send({
        shortName: '新简称'
      }));
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.shortName).toBe('新简称');
      expect(updateRes.body.data.name).toBe('部分更新测试客户2'); // 保持不变
    });

    it('should update family_name when customer name is updated', async () => {
      await authRequest(request(app).put(`/api/customers/${testMemberId}`).send({
        name: '家庭名称测试'
      }));
      
      const db = getDb(TEST_DB_NAME);
      const family = db.prepare('SELECT * FROM families WHERE head_id = ?').get(testMemberId);
      expect(family.family_name).toBe('家庭名称测试');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer and related records using dynamic ID', async () => {
      const res = await authRequest(request(app).delete(`/api/customers/${testMemberId}`));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('客户已删除');
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authRequest(request(app).delete('/api/customers/99999'));
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 for non-head member', async () => {
      const res = await authRequest(request(app).delete('/api/customers/2'));
      expect(res.status).toBe(404);
    });

    it('should cascade delete all related records', async () => {
      // 先创建一个新客户
      const createRes = await authRequest(request(app).post('/api/customers').send({
        name: '删除测试客户'
      }));
      const newCustomerId = createRes.body.data.id;
      const familyId = createRes.body.data.family_id;
      
      // 添加一些记录
      const db = getDb(TEST_DB_NAME);
      db.prepare(`
        INSERT INTO records (member_id, family_id, type, name, value, date, note, status)
        VALUES (?, ?, 'stock', '测试股票', 100000, '2026-05-20', '', 'valid')
      `).run(newCustomerId, familyId);
      
      // 删除客户
      const deleteRes = await authRequest(request(app).delete(`/api/customers/${newCustomerId}`));
      expect(deleteRes.status).toBe(200);
      
      // 验证级联删除
      const remainingRecords = db.prepare('SELECT * FROM records WHERE family_id = ?').all(familyId);
      expect(remainingRecords.length).toBe(0);
      
      const remainingMembers = db.prepare('SELECT * FROM members WHERE family_id = ?').all(familyId);
      expect(remainingMembers.length).toBe(0);
      
      const remainingFamily = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
      expect(remainingFamily).toBeUndefined();
    });
  });

  // 破坏性测试放在最后
  describe('Edge Cases', () => {
    it('should return empty array when no customers exist', async () => {
      const db = getDb(TEST_DB_NAME);
      // 先关闭外键约束，按正确顺序清理，再开启
      db.prepare('PRAGMA foreign_keys = OFF').run();
      db.prepare('DELETE FROM records').run();
      db.prepare('DELETE FROM users WHERE role != ?').run('admin');
      db.prepare('DELETE FROM members').run();
      db.prepare('DELETE FROM families').run();
      db.prepare('PRAGMA foreign_keys = ON').run();
      
      const res = await authRequest(request(app).get('/api/customers'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });
});