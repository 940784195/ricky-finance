const request = require('supertest');
const app = require('../../server/index');
const { seedTestData, cleanupTestData, adminToken, headToken, memberToken, testMemberId } = require('../helpers/setup');

beforeEach(() => {
  seedTestData();
});

afterEach(() => {
  cleanupTestData();
});

function authRequest(req, token = adminToken) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Records API', () => {
  describe('GET /api/records', () => {
    it('should return all records for admin', async () => {
      const res = await authRequest(request(app).get('/api/records'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return family records for head', async () => {
      const res = await authRequest(request(app).get('/api/records'), headToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return personal records for member', async () => {
      const res = await authRequest(request(app).get('/api/records'), memberToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter records by name', async () => {
      const res = await authRequest(request(app).get('/api/records?keyword=股票'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/records/asset-names', () => {
    it('should return all unique asset names for admin', async () => {
      const res = await authRequest(request(app).get('/api/records/asset-names'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return family asset names for head', async () => {
      const res = await authRequest(request(app).get('/api/records/asset-names'), headToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return personal asset names for member', async () => {
      const res = await authRequest(request(app).get('/api/records/asset-names'), memberToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should filter names by keyword', async () => {
      const res = await authRequest(request(app).get('/api/records/asset-names?keyword=招商'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      if (res.body.data.length > 0) {
        res.body.data.forEach(name => {
          expect(name.toLowerCase()).toContain('招商');
        });
      }
    });
  });

  describe('POST /api/records', () => {
    it('should create a new record without previousValue', async () => {
      const newRecord = {
        customerId: '1',
        type: 'bond',
        name: '测试债券',
        value: 100000,
        date: '2026-05-25',
        note: '测试'
      };

      const res = await authRequest(request(app).post('/api/records').send(newRecord), headToken);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('测试债券');
    });

    it('should ignore previousValue if provided', async () => {
      const newRecord = {
        customerId: '1',
        type: 'stock',
        name: '测试股票',
        value: 150000,
        date: '2026-05-25',
        previousValue: 140000,
        note: '测试忽略 previousValue'
      };

      const res = await authRequest(request(app).post('/api/records').send(newRecord), headToken);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await authRequest(request(app).post('/api/records').send({}), headToken);
      expect(res.status).toBe(400);
    });

    it('should create record for admin with memberId', async () => {
      const newRecord = {
        memberId: testMemberId,
        type: 'cash',
        name: '管理员创建的现金',
        value: 10000,
        date: '2026-05-25'
      };

      const res = await authRequest(request(app).post('/api/records').send(newRecord));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for admin creating records without memberId', async () => {
      const newRecord = {
        type: 'cash',
        name: '测试现金',
        value: 10000,
        date: '2026-05-25'
      };

      const res = await authRequest(request(app).post('/api/records').send(newRecord));
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/records/:id', () => {
    it('should update a record', async () => {
      const createRes = await authRequest(request(app).post('/api/records').send({
        type: 'fund',
        name: '待更新基金',
        value: 50000,
        date: '2026-05-25'
      }), headToken);

      const updateRes = await authRequest(request(app).put(`/api/records/${createRes.body.data.id}`).send({
        value: 60000
      }), headToken);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.value).toBe(60000);
    });

    it('should update a record as admin', async () => {
      const createRes = await authRequest(request(app).post('/api/records').send({
        type: 'fund',
        name: '管理员更新基金',
        value: 50000,
        date: '2026-05-25'
      }), headToken);

      const updateRes = await authRequest(request(app).put(`/api/records/${createRes.body.data.id}`).send({
        value: 70000
      }));

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.value).toBe(70000);
    });

    it('should ignore previousValue in update', async () => {
      const createRes = await authRequest(request(app).post('/api/records').send({
        type: 'stock',
        name: '测试股票',
        value: 100000,
        date: '2026-05-25'
      }), headToken);

      const updateRes = await authRequest(request(app).put(`/api/records/${createRes.body.data.id}`).send({
        value: 110000,
        previousValue: 90000
      }), headToken);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
    });

    it('should return 404 for non-existent record', async () => {
      const res = await authRequest(request(app).put('/api/records/99999').send({
        value: 10000
      }), headToken);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/records/:id', () => {
    it('should delete a record', async () => {
      const createRes = await authRequest(request(app).post('/api/records').send({
        type: 'cash',
        name: '待删除现金',
        value: 10000,
        date: '2026-05-25'
      }), headToken);

      const deleteRes = await authRequest(request(app).delete(`/api/records/${createRes.body.data.id}`), headToken);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });

    it('should delete a record as admin', async () => {
      const createRes = await authRequest(request(app).post('/api/records').send({
        type: 'cash',
        name: '管理员删除现金',
        value: 10000,
        date: '2026-05-25'
      }), headToken);

      const deleteRes = await authRequest(request(app).delete(`/api/records/${createRes.body.data.id}`));

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
    });
  });
});
