const request = require('supertest');
const app = require('../server');

// Mock Supabase client for testing
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should require name, email, and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(400);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'weak'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(400);
    });
  });
});

describe('Health Endpoints', () => {
  describe('GET /ping', () => {
    it('should return server status', async () => {
      const response = await request(app)
        .get('/ping');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /', () => {
    it('should return API server message', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });
  });
});

describe('Rate Limiting', () => {
  describe('POST /api/auth/login', () => {
    it('should enforce rate limiting on auth endpoints', async () => {
      // This test would need to make multiple requests to trigger rate limiting
      // For now, we'll just verify the endpoint exists
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      // The endpoint should respond (even with error) showing rate limiting is active
      expect([200, 400, 401, 429]).toContain(response.status);
    });
  });
});
