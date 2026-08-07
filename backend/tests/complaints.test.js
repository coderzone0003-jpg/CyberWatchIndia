const request = require('supertest');
const express = require('express');
const complaintRoutes = require('../routes/complaints');

// Mock database operations
jest.mock('../utils/database', () => ({
  complaintOperations: {
    create: jest.fn(),
    getById: jest.fn(),
    getAll: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
    findByTrackingId: jest.fn(),
    getByUserId: jest.fn()
  },
  categoryOperations: {
    getAll: jest.fn(),
    getById: jest.fn()
  },
  evidenceOperations: {
    create: jest.fn(),
    getByComplaintId: jest.fn(),
    deleteById: jest.fn()
  },
  notificationOperations: {
    create: jest.fn()
  },
  auditLogOperations: {
    create: jest.fn()
  }
}));

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabaseAdmin: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://test-url.com/file.pdf' } }))
      }))
    }
  }
}));

// Mock email
jest.mock('../utils/email', () => ({
  sendComplaintConfirmation: jest.fn()
}));

// Mock file upload
jest.mock('../utils/fileUpload', () => ({
  uploadMultiple: jest.fn((req, res, next) => {
    req.files = [];
    next();
  }),
  uploadFile: jest.fn(),
  deleteFile: jest.fn()
}));

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    req.user = { userId: 'test-user-id', email: 'test@example.com', role: 'user' };
    next();
  },
  isAdminOrOfficer: (req, res, next) => next()
}));

// Mock security middleware
jest.mock('../middleware/security', () => ({
  complaintLimiter: (req, res, next) => next(),
  apiLimiter: (req, res, next) => next()
}));

// Mock validation middleware
jest.mock('../middleware/validation', () => ({
  handleValidationErrors: (req, res, next) => next(),
  validationRules: {},
  sanitizeRequest: (req, res, next) => next()
}));

describe('Complaint Routes', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/complaints', complaintRoutes);
    
    jest.clearAllMocks();
  });

  describe('POST /api/complaints', () => {
    it('should create a new complaint successfully', async () => {
      const { complaintOperations, auditLogOperations, notificationOperations } = require('../utils/database');
      
      complaintOperations.create.mockResolvedValue({
        id: 'complaint-123',
        tracking_id: 'CYB-2024-00001',
        title: 'Test Complaint',
        status: 'pending'
      });
      auditLogOperations.create.mockResolvedValue({});
      notificationOperations.create.mockResolvedValue({});

      const response = await request(app)
        .post('/api/complaints')
        .send({
          title: 'Test Complaint',
          description: 'Test description',
          category_id: 'cat-123',
          severity: 'medium'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Complaint submitted successfully');
      expect(response.body.complaint).toBeDefined();
      expect(complaintOperations.create).toHaveBeenCalled();
    });

    it('should return error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/complaints')
        .send({
          title: 'Test Complaint'
          // Missing description, category_id
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/complaints/:id', () => {
    it('should get complaint by ID', async () => {
      const { complaintOperations, evidenceOperations } = require('../utils/database');
      
      complaintOperations.getById.mockResolvedValue({
        id: 'complaint-123',
        tracking_id: 'CYB-2024-00001',
        title: 'Test Complaint'
      });
      evidenceOperations.getByComplaintId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/complaints/complaint-123');

      expect(response.status).toBe(200);
      expect(response.body.complaint).toBeDefined();
      expect(complaintOperations.getById).toHaveBeenCalledWith('complaint-123');
    });

    it('should return 404 for non-existent complaint', async () => {
      const { complaintOperations } = require('../utils/database');
      
      complaintOperations.getById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/complaints/nonexistent');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/complaints/my', () => {
    it('should get current user complaints', async () => {
      const { complaintOperations } = require('../utils/database');
      
      complaintOperations.getAll.mockResolvedValue([
        { id: 'complaint-1', title: 'Complaint 1' },
        { id: 'complaint-2', title: 'Complaint 2' }
      ]);

      const response = await request(app)
        .get('/api/complaints/my');

      expect(response.status).toBe(200);
      expect(response.body.complaints).toBeDefined();
      expect(Array.isArray(response.body.complaints)).toBe(true);
    });
  });

  describe('PUT /api/complaints/:id', () => {
    it('should update complaint successfully', async () => {
      const { complaintOperations, auditLogOperations } = require('../utils/database');
      
      complaintOperations.getById.mockResolvedValue({
        id: 'complaint-123',
        user_id: 'test-user-id',
        status: 'pending'
      });
      complaintOperations.updateById.mockResolvedValue({
        id: 'complaint-123',
        title: 'Updated Title'
      });
      auditLogOperations.create.mockResolvedValue({});

      const response = await request(app)
        .put('/api/complaints/complaint-123')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Complaint updated successfully');
    });

    it('should return 403 when trying to update another user complaint', async () => {
      const { complaintOperations } = require('../utils/database');
      
      complaintOperations.getById.mockResolvedValue({
        id: 'complaint-123',
        user_id: 'different-user-id',
        status: 'pending'
      });

      const response = await request(app)
        .put('/api/complaints/complaint-123')
        .send({ title: 'Updated Title' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/complaints/:id', () => {
    it('should delete complaint successfully', async () => {
      const { complaintOperations, auditLogOperations } = require('../utils/database');
      
      complaintOperations.getById.mockResolvedValue({
        id: 'complaint-123',
        user_id: 'test-user-id',
        status: 'pending'
      });
      complaintOperations.deleteById.mockResolvedValue(true);
      auditLogOperations.create.mockResolvedValue({});

      const response = await request(app)
        .delete('/api/complaints/complaint-123');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Complaint deleted successfully');
    });
  });
});