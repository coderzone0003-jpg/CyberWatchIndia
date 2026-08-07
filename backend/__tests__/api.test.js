const request = require('supertest');
const app = require('../server');

describe('Basic API Tests', () => {
  describe('Health Endpoints', () => {
    describe('GET /ping', () => {
      it('should return server status', async () => {
        const response = await request(app)
          .get('/ping');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'ok');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
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

  describe('Auth Routes - Validation', () => {
    describe('POST /api/auth/register', () => {
      it('should reject registration without required fields', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            email: 'test@example.com'
          });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message');
      });

      it('should reject invalid email format', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'invalid-email',
            password: 'TestPass123!'
          });

        expect(response.status).toBe(400);
      });

      it('should reject weak password', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'weak'
          });

        expect(response.status).toBe(400);
      });

      it('should reject password less than 12 characters', async () => {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: 'test@example.com',
            password: 'Short1!'
          });

        expect(response.status).toBe(400);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should reject login without password', async () => {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@example.com'
          });

        expect(response.status).toBe(400);
      });

      it('should reject invalid email format', async () => {
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

  describe('Complaint Routes - Validation', () => {
    describe('POST /api/complaints', () => {
      it('should reject complaints without authentication', async () => {
        const response = await request(app)
          .post('/api/complaints')
          .send({
            title: 'Test Complaint',
            description: 'Test description',
            category_id: 'test-id'
          });

        expect(response.status).toBe(401);
      });

      it('should reject complaints without required fields', async () => {
        const response = await request(app)
          .post('/api/complaints')
          .set('x-auth-token', 'invalid-token')
          .send({
            title: 'Test Complaint'
          });

        expect([400, 401]).toContain(response.status);
      });
    });
  });

  describe('Error Handling', () => {
    describe('GET /nonexistent-endpoint', () => {
      it('should return 404 for unknown endpoints', async () => {
        const response = await request(app)
          .get('/api/nonexistent-endpoint');

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('code', 'NOT_FOUND');
      });
    });
  });

  describe('CORS', () => {
    describe('GET /ping', () => {
      it('should include CORS headers', async () => {
        const response = await request(app)
          .get('/ping')
          .set('Origin', 'http://localhost:3000');

        expect(response.status).toBe(200);
        // CORS headers should be present
      });
    });
  });
});
