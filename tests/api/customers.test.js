const request = require('supertest');
const app = require('../../server/index');
const { seedTestData, cleanupTestData, adminToken, userToken } = require('../helpers/setup');

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
      expect(res.body.data).toHaveLength(5);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer with stats', async () => {
      const res = await authRequest(request(app).get('/api/customers/1'));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('张三');
      expect(res.body.data.totalValue).toBeGreaterThan(0);
      expect(res.body.data.recordCount).toBeGreaterThan(0);
      expect(res.body.data.records.length).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authRequest(request(app).get('/api/customers/999'));
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/customers', () => {
    it('should create a new customer', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: '新客户',
        shortName: '新',
        code: 'C099'
      }));
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('新客户');
    });

    it('should auto-generate shortName and code if not provided', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({
        name: '自动生成'
      }));
      expect(res.status).toBe(201);
      expect(res.body.data.shortName).toBe('自');
    });

    it('should return 400 when name is missing', async () => {
      const res = await authRequest(request(app).post('/api/customers').send({}));
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update an existing customer', async () => {
      const res = await authRequest(request(app).put('/api/customers/1').send({
        name: '张三改',
        shortName: '改'
      }));
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('张三改');
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authRequest(request(app).put('/api/customers/999').send({ name: 'test' }));
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer and related records', async () => {
      const res = await authRequest(request(app).delete('/api/customers/1'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent customer', async () => {
      const res = await authRequest(request(app).delete('/api/customers/999'));
      expect(res.status).toBe(404);
    });
  });
});
