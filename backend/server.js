/**
 * Cyber Crime Portal API Server
 * Developers: Shubham Bhojane, Vinanti Bendure, Darshan Seleke, Chaitrali Karale
 */
const dotenv = require('dotenv');

dotenv.config();

const PRODUCTION_FRONTEND_URL = 'https://cyber-watch-india-gilt.vercel.app';
const PRODUCTION_ORIGINS = [
  PRODUCTION_FRONTEND_URL,
  'https://cyber-watch-india.vercel.app',
  'https://cyber-watch-india-git-main-coderzone0003-jpg.vercel.app',
];

function isRenderHost() {
  return (
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_SERVICE_ID) ||
    Boolean(process.env.RENDER_EXTERNAL_URL) ||
    /onrender\.com/i.test(process.env.RENDER_EXTERNAL_HOSTNAME || '')
  );
}

function isLocalhostUrl(url) {
  return /localhost|127\.0\.0\.1/i.test(url || '');
}

function resolveFrontendUrl() {
  const configured = (process.env.FRONTEND_URL || '').trim().replace(/\/$/, '');

  if (configured && !isLocalhostUrl(configured)) {
    return configured;
  }

  if (isRenderHost()) {
    console.warn(
      `Using production frontend URL on Render: ${PRODUCTION_FRONTEND_URL}` +
        (configured ? ` (configured FRONTEND_URL was ${configured})` : '')
    );
    return PRODUCTION_FRONTEND_URL;
  }

  return configured || 'http://localhost:3000';
}

function bootstrapEnvironment() {
  if (isRenderHost() && process.env.NODE_ENV !== 'production') {
    console.warn('Render host detected with NODE_ENV!=production; forcing production mode.');
    process.env.NODE_ENV = 'production';
  }

  process.env.FRONTEND_URL = resolveFrontendUrl();
}

bootstrapEnvironment();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { supabase } = require('./config/supabase');
const { helmetConfig, apiLimiter } = require('./middleware/security');
const { sanitizeRequest } = require('./middleware/validation');

function getAllowedOrigins() {
  const origins = new Set();
  origins.add(process.env.FRONTEND_URL);

  PRODUCTION_ORIGINS.forEach((origin) => origins.add(origin));

  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
    .forEach((origin) => origins.add(origin));

  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }

  return [...origins];
}

function isAllowedOrigin(origin, allowed = allowedOrigins) {
  if (!origin) return true;
  if (allowed.includes(origin)) return true;
  if (/^https:\/\/cyber-watch-india[a-z0-9-]*\.vercel\.app$/i.test(origin)) return true;
  return false;
}

function applyCorsHeaders(req, res, allowed = allowedOrigins) {
  const origin = req.headers.origin;

  if (origin && isAllowedOrigin(origin, allowed)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, x-auth-token, Authorization'
  );
  res.setHeader('Access-Control-Expose-Headers', 'x-auth-token');
  res.setHeader('Access-Control-Max-Age', '3600');
}

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'FRONTEND_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\nPlease copy .env.example to .env and fill in the required values.');
  process.exit(1);
}

// Warn if JWT_SECRET is too short
if (process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters for security');
}

// Warn if in production with default/weak secrets
if (process.env.NODE_ENV === 'production') {
  if (process.env.JWT_SECRET === 'your-jwt-secret-key-here' || 
      process.env.JWT_SECRET === 'your-jwt-secret-key-here-min-32-characters') {
    console.error('❌ ERROR: JWT_SECRET is set to default value in production!');
    console.error('   Please set a strong, random JWT_SECRET in production.');
    process.exit(1);
  }
}

// CORS must run before helmet so preflight gets Access-Control headers
const allowedOrigins = getAllowedOrigins();
const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin, allowedOrigins)) {
      callback(null, true);
      return;
    }
    console.warn('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-auth-token', 'Authorization'],
  exposedHeaders: ['x-auth-token'],
  maxAge: 3600,
};

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use((req, res, next) => {
  applyCorsHeaders(req, res, allowedOrigins);
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmetConfig);

// Request logging
if (process.env.NODE_ENV === 'production') {
  // Combined log format for production
  app.use(morgan('combined'));
} else {
  // Dev log format for development
  app.use(morgan('dev'));
}

// Prevent stale cached API responses (fixes assigned officer not appearing after update)
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  next();
});

// Rate limiting for general API
app.use('/api/', apiLimiter);

// XSS Protection - sanitize all incoming requests (after body is parsed)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(sanitizeRequest);

// ============================================
// ROUTES
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Cyber Crime Portal API Server' });
});

// Basic health check that doesn't require database
app.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
    frontend_url: process.env.FRONTEND_URL,
    allowed_origins: allowedOrigins,
    render_host: isRenderHost(),
    timestamp: new Date().toISOString(),
  });
});

// Test Supabase connection
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').single();
    if (error) throw error;
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
  }
});

// Import routes
const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const contactRoutes = require('./routes/contact');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);

// ============================================
// GLOBAL ERROR HANDLER
// ============================================

// 404 handler (must be after all routes)
app.use((req, res, next) => {
  res.status(404).json({
    message: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak sensitive information in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle specific error types
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      message: 'File size exceeds limit',
      code: 'FILE_TOO_LARGE',
      maxSize: '10MB'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      message: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      message: 'Too many files uploaded',
      code: 'TOO_MANY_FILES',
      maxFiles: 5
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token has expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      message: 'Unauthorized access',
      code: 'UNAUTHORIZED'
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: isDevelopment ? err.errors : undefined
    });
  }

  // Handle rate limit errors
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Request payload too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    message: isDevelopment ? message : 'An error occurred while processing your request',
    code: isDevelopment ? err.code : 'INTERNAL_ERROR',
    error: isDevelopment ? {
      message: err.message,
      stack: err.stack
    } : undefined
  });
});

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Render host: ${isRenderHost()}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`Health check: /ping`);
});
