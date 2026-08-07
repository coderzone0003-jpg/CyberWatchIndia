const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');

/**
 * Validation result handler middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Common validation rules
 */
const commonValidators = {
  email: () => body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email is too long'),

  password: () => body('password')
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 12, max: 128 }).withMessage('Password must be between 12 and 128 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
    .custom((value) => {
      const forbiddenPatterns = ['password', '123456', 'qwerty', 'admin', 'user'];
      const lowerValue = value.toLowerCase();
      for (const pattern of forbiddenPatterns) {
        if (lowerValue.includes(pattern)) {
          throw new Error('Password contains common words that are not allowed');
        }
      }
      return true;
    })
    .custom((value) => {
      const repeatingCharsRegex = /(.)\1{3,}/g;
      if (repeatingCharsRegex.test(value)) {
        throw new Error('Password must not contain more than 3 repeating characters');
      }
      return true;
    }),

  name: (fieldName = 'name') => body(fieldName)
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters')
    .matches(/^[a-zA-Z\s'-]+$/).withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  phoneNumber: (fieldName = 'phone') => body(fieldName)
    .optional()
    .trim()
    .matches(/^\+?[\d\s-]{10,20}$/).withMessage('Invalid phone number format'),

  text: (fieldName, minLength = 1, maxLength = 1000) => body(fieldName)
    .trim()
    .optional()
    .isLength({ min: minLength, max: maxLength })
    .withMessage(`Text must be between ${minLength} and ${maxLength} characters`),

  uuid: (fieldName = 'id') => param(fieldName)
    .notEmpty().withMessage('ID is required')
    .isUUID().withMessage('Invalid ID format'),

  mongoId: (fieldName = 'id') => param(fieldName)
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format'),

  boolean: (fieldName) => body(fieldName)
    .optional()
    .isBoolean().withMessage('Must be a boolean value'),

  date: (fieldName) => body(fieldName)
    .optional()
    .isISO8601().withMessage('Invalid date format'),

  enum: (fieldName, allowedValues) => body(fieldName)
    .optional()
    .isIn(allowedValues).withMessage(`Must be one of: ${allowedValues.join(', ')}`)
};

/**
 * Sanitization helpers
 */
const sanitizers = {
  escapeString: (value) => {
    if (typeof value !== 'string') return value;
    return validator.escape(value);
  },

  sanitizeObject: (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = validator.escape(obj[key].trim());
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizers.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  },

  sanitizeArray: (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => {
      if (typeof item === 'string') {
        return validator.escape(item.trim());
      } else if (typeof item === 'object') {
        return sanitizers.sanitizeObject(item);
      }
      return item;
    });
  }
};

/**
 * Request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizers.sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizers.sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizers.sanitizeObject(req.params);
  }
  next();
};

/**
 * Specific validation rule sets
 */
const validationRules = {
  register: [
    commonValidators.name('name'),
    commonValidators.email(),
    commonValidators.password(),
    commonValidators.phoneNumber('phone')
  ],

  login: [
    commonValidators.email(),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
  ],

  complaint: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 10, max: 255 }).withMessage('Title must be between 10 and 255 characters')
      .escape(),
    
    body('description')
      .trim()
      .notEmpty().withMessage('Description is required')
      .isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters')
      .escape(),
    
    body('category_id')
      .notEmpty().withMessage('Category is required')
      .isUUID().withMessage('Invalid category ID'),
    
    body('severity')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid severity level'),
    
    body('location')
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('Location is too long')
      .escape(),
    
    body('incident_date')
      .optional()
      .isISO8601().withMessage('Invalid date format')
  ],

  userUpdate: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2 and 255 characters')
      .escape(),
    
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[\d\s-]{10,20}$/).withMessage('Invalid phone number format')
  ],

  category: [
    body('name')
      .trim()
      .notEmpty().withMessage('Category name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters')
      .escape(),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Description is too long')
      .escape()
  ],

  officer: [
    commonValidators.name('name'),
    commonValidators.email(),
    body('password')
      .trim()
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8, max: 128 }).withMessage('Password must be between 8 and 128 characters'),
    
    body('specialization')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Specialization is too long')
      .escape(),
    
    body('badge_number')
      .optional()
      .trim()
      .isLength({ max: 50 }).withMessage('Badge number is too long')
      .escape()
  ]
};

module.exports = {
  handleValidationErrors,
  commonValidators,
  sanitizers,
  sanitizeRequest,
  validationRules
};
