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

describe('Stats API', () => {
  describe('GET /api/stats', () => {
    it('should return computed statistics', async () => {
      const res = await authRequest(request(app).get('/api/stats'));
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const stats = res.body.data;
      expect(stats.totalValue).toBeGreaterThan(0);
      expect(stats.totalRecords).toBe(10);
      expect(stats.memberCount).toBeGreaterThan(0);
      expect(stats.activeMembers).toBeGreaterThanOrEqual(0);
      expect(stats.monthlyNew).toBeGreaterThanOrEqual(0);
      expect(stats.pendingCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.typeDistribution)).toBe(true);
    });
  });
});
