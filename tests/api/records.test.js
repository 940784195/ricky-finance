const request = require('supertest');
const app = require('../../server/index');
const { seedTestData, cleanupTestData, adminToken } = require('../helpers/setup');

beforeEach(() => {
  seedTestData();
});

afterEach(() => {
  cleanupTestData();
});

function authRequest(req) {
  return req.set('Authorization', `Bearer ${adminToken}`);
}

describe('Records API', () => {
  describe('GET /api/records', () => {
    it('should return all records', async () => {
      const res = await authRequest(request(app).get('/api/records'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/records', () => {
    it('should create a new record', async () => {
      const newRecord = {
        customerId: '1',
        type: 'bond',
        name: '测试债券',
        value: 100000,
        date: '2026-05-25',
        previousValue: 95000,
        note: '测试'
      };

      const res = await authRequest(request(app).post('/api/records').send(newRecord));
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await authRequest(request(app).post('/api/records').send({}));
      expect(res.status).toBe(400);
    });
  });
});
