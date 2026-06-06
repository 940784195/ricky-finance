const request = require('supertest');
const app = require('../../backend/index');
const { resetToSeedData, getAdminToken, getHeadToken, getMemberToken } = require('../helpers/setup');

beforeEach(async () => {
  await resetToSeedData();
});

function authRequest(req, token = getAdminToken()) {
  return req.set('Authorization', `Bearer ${token}`);
}

describe('Stats API', () => {
  describe('GET /api/stats', () => {
    it('should return computed statistics for admin', async () => {
      const res = await authRequest(request(app).get('/api/stats'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('totalValue');
      expect(res.body.data).toHaveProperty('totalRecords');
      expect(res.body.data).toHaveProperty('memberCount');
      expect(res.body.data).toHaveProperty('activeMembers');
      expect(res.body.data).toHaveProperty('monthlyNew');
      expect(res.body.data).toHaveProperty('pendingCount');
      expect(res.body.data).toHaveProperty('typeDistribution');
    });

    it('should return statistics for head', async () => {
      const res = await authRequest(request(app).get('/api/stats'), getHeadToken());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return statistics for member', async () => {
      const res = await authRequest(request(app).get('/api/stats'), getMemberToken());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/stats');
      expect(res.status).toBe(401);
    });

    it('should have correct typeDistribution structure', async () => {
      const res = await authRequest(request(app).get('/api/stats'));
      expect(res.status).toBe(200);
      const dist = res.body.data.typeDistribution;
      expect(Array.isArray(dist)).toBe(true);
      if (dist.length > 0) {
        expect(dist[0]).toHaveProperty('type');
        expect(dist[0]).toHaveProperty('display_name');
        expect(dist[0]).toHaveProperty('color');
        expect(dist[0]).toHaveProperty('total_value');
        expect(dist[0]).toHaveProperty('record_count');
      }
    });

    it('should have non-negative totalValue', async () => {
      const res = await authRequest(request(app).get('/api/stats'));
      expect(res.status).toBe(200);
      expect(res.body.data.totalValue).toBeGreaterThanOrEqual(0);
    });

    it('should have non-negative totalRecords', async () => {
      const res = await authRequest(request(app).get('/api/stats'));
      expect(res.status).toBe(200);
      expect(res.body.data.totalRecords).toBeGreaterThanOrEqual(0);
    });
  });
});
