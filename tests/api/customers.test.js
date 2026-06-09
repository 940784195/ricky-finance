const request = require('supertest');
const app = require('../../backend/index');
const { initTestDb, seedTestData, cleanupTestData, getAdminToken, getHeadToken, getMemberToken, getTestMemberId, getTestFamilyId, getTestData } = require('../helpers/setup');
const { query } = require('../../backend/db/pgDb');

beforeAll(async () => {
  await initTestDb();
});

beforeEach(async () => {
  await seedTestData();
});

afterEach(() => {
  cleanupTestData();
});

function authRequest(req, token = getAdminToken()) {
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
      expect(customer.member_count).toBeDefined();
      expect(typeof parseInt(customer.member_count)).toBe('number');
      expect(customer.record_count).toBeDefined();
      expect(typeof parseInt(customer.record_count)).toBe('number');
      expect(customer.total_value).toBeDefined();
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer with stats using dynamic ID', async () => {
      const res = await authRequest(request(app).get(`/api/customers/${getTestMemberId()}`));
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
      const res = await authRequest(request(app).get('/api/customers/2'));
      expect(res.status).toBe(404);
    });

    it('should include records array with member_name', async () => {
      const res = await authRequest(request(app).get(`/api/customers/${getTestMemberId()}`));
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
      expect(res.body.data.short_name).toBe('张');
    });

    it('should auto-generate shortName if not provided', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: '自动生成客户'
      }));
      expect(res.status).toBe(201);
      expect(res.body.data.short_name).toBe('自');
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

      const customerId = res.body.data.id;

      const memberResult = await query('SELECT * FROM members WHERE id = $1', [customerId]);
      expect(memberResult.rows[0]).not.toBeUndefined();
      expect(memberResult.rows[0].role).toBe('head');

      const familyResult = await query('SELECT * FROM families WHERE head_id = $1', [customerId]);
      expect(familyResult.rows[0]).not.toBeUndefined();
      expect(familyResult.rows[0].family_name).toBe('关联测试客户');
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update an existing customer using dynamic ID', async () => {
      const res = await authRequest(request(app).put(`/api/customers/${getTestMemberId()}`).send({
        name: '测试户主已修改',
        shortName: '测'
      }));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('测试户主已修改');
      expect(res.body.data.short_name).toBe('测');
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
      const createRes = await authRequest(request(app).post('/api/customers').send({
        name: '部分更新测试客户',
        shortName: '部'
      }));
      const newCustomerId = createRes.body.data.id;

      const updateRes = await authRequest(request(app).put(`/api/customers/${newCustomerId}`).send({
        name: '仅改名称'
      }));
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('仅改名称');
      expect(updateRes.body.data.short_name).toBe('部');
    });

    it('should update shortName only when name is not provided', async () => {
      const createRes = await authRequest(request(app).post('/api/customers').send({
        name: '部分更新测试客户2',
        shortName: '部'
      }));
      const newCustomerId = createRes.body.data.id;

      const updateRes = await authRequest(request(app).put(`/api/customers/${newCustomerId}`).send({
        shortName: '新简'
      }));
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.short_name).toBe('新简');
      expect(updateRes.body.data.name).toBe('部分更新测试客户2');
    });

    it('should update family_name when customer name is updated', async () => {
      await authRequest(request(app).put(`/api/customers/${getTestMemberId()}`).send({
        name: '家庭名称测试'
      }));

      const familyResult = await query('SELECT * FROM families WHERE head_id = $1', [getTestMemberId()]);
      expect(familyResult.rows[0].family_name).toBe('家庭名称测试');
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer and related records using dynamic ID', async () => {
      const res = await authRequest(request(app).delete(`/api/customers/${getTestMemberId()}`));
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
      const createRes = await authRequest(request(app).post('/api/customers').send({
        name: '删除测试客户'
      }));
      const newCustomerId = createRes.body.data.id;
      const familyId = createRes.body.data.family_id;

      await query(
        "INSERT INTO records (member_id, family_id, type, name, value, date, note, status) VALUES ($1, $2, 'stock', '测试股票', 100000, '2026-05-20', '', 'valid')",
        [newCustomerId, familyId]
      );

      const deleteRes = await authRequest(request(app).delete(`/api/customers/${newCustomerId}`));
      expect(deleteRes.status).toBe(200);

      const remainingRecords = await query('SELECT * FROM records WHERE family_id = $1', [familyId]);
      expect(remainingRecords.rows.length).toBe(0);

      const remainingMembers = await query('SELECT * FROM members WHERE family_id = $1', [familyId]);
      expect(remainingMembers.rows.length).toBe(0);

      const remainingFamily = await query('SELECT * FROM families WHERE id = $1', [familyId]);
      expect(remainingFamily.rows.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array when no customers exist', async () => {
      await query('DELETE FROM records');
      await query("DELETE FROM users WHERE role != 'admin'");
      await query('DELETE FROM members');
      await query('DELETE FROM families');

      const res = await authRequest(request(app).get('/api/customers'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });
});
