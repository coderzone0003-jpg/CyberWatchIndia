const request = require('supertest');
const express = require('express');
const authRoutes = require('../routes/auth');

// Mock database operations
jest.mock('../utils/database', () => ({
  userOperations: {
    findByEmail: jest.fn(),
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn()
  },
  auditLogOperations: {
    create: jest.fn()
  }
}));

// Mock validation
jest.mock('../utils/validation', () => ({
  validateRegistration: jest.fn(() => ({ valid: true, errors: [] })),
  validateLogin: jest.fn(() => ({ valid: true, errors: [] })),
  sanitizeUser: jest.fn((user) => {
    const { password, ...sanitized } = user;
    return sanitized;
  })),
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true
  },
  validatePassword: jest.fn(() => ({ valid: true, errors: [] }))
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    req.user = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };
    next();
  },
  checkRole: (role) => (req, res, next) => next()
}));

// Mock security middleware
jest.mock('../middleware/security', () => ({
  authLimiter: (req, res, next) => next(),
  strictLimiter: (req, res, next) => next()
}));

// Mock validation middleware
jest.mock('../middleware/validation', () => ({
  handleValidationErrors: (req, res, next) => next(),
  validationRules: {},
  sanitizeRequest: (req, res, next) => next()
}));

describe('Auth Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const { userOperations, auditLogOperations } = require('../utils/database');
      
      userOperations.findByEmail.mockResolvedValue(null);
      userOperations.create.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      });
      auditLogOperations.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(userOperations.create).toHaveBeenCalled();
    });

    it('should return error if email already exists', async () => {
      const { userOperations } = require('../utils/database');
      
      userOperations.findByEmail.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const { userOperations } = require('../utils/database');
      const bcrypt = require('bcryptjs');
      
      const hashedPassword = await bcrypt.hash('TestPass123!', 12);
      
      userOperations.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        role: 'user',
        is_active: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.user.password).toBeUndefined();
    });

    it('should return error for invalid credentials', async () => {
      const { userOperations } = require('../utils/database');
      const bcrypt = require('bcryptjs');
      
      const hashedPassword = await bcrypt.hash('DifferentPass123!', 12);
      
      userOperations.findByEmail.mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
        is_active: true
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPass123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const { userOperations } = require('../utils/database');
      
      userOperations.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid credentials');
    });
  });

  describe('GET /api/auth/password-requirements', () => {
    it('should return password requirements', async () => {
      const response = await request(app)
        .get('/api/auth/password-requirements');

      expect(response.status).toBe(200);
      expect(response.body.requirements).toBeDefined();
      expect(response.body.requirements.minLength).toBeDefined();
    });
  });
});