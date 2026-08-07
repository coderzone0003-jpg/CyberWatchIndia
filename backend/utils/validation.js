const validator = require('validator');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password strength requirements
const passwordRequirements = {
  minLength: 12, // Increased from 8 to 12
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbiddenPatterns: ['password', '123456', 'qwerty', 'admin', 'user'], // Common passwords to reject
  maxRepeatingChars: 3 // Prevent more than 3 repeating characters
};

/**
 * Validate email format
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Invalid email format' };
  }
  
  if (email.length > 255) {
    return { valid: false, message: 'Email is too long' };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  
  if (password.length < passwordRequirements.minLength) {
    return { 
      valid: false, 
      message: `Password must be at least ${passwordRequirements.minLength} characters long` 
    };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Password is too long' };
  }
  
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  // Check for forbidden patterns
  if (passwordRequirements.forbiddenPatterns) {
    const lowerPassword = password.toLowerCase();
    for (const pattern of passwordRequirements.forbiddenPatterns) {
      if (lowerPassword.includes(pattern)) {
        return { valid: false, message: 'Password contains common words that are not allowed' };
      }
    }
  }
  
  // Check for repeating characters
  if (passwordRequirements.maxRepeatingChars) {
    const repeatingCharsRegex = new RegExp(`(.)\\1{${passwordRequirements.maxRepeatingChars},}`, 'g');
    if (repeatingCharsRegex.test(password)) {
      return { valid: false, message: `Password must not contain more than ${passwordRequirements.maxRepeatingChars} repeating characters` };
    }
  }
  
  return { valid: true };
}

/**
 * Validate user registration data
 */
function validateRegistration(data) {
  const errors = [];
  
  // Name validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required');
  } else if (data.name.length > 255) {
    errors.push('Name is too long');
  }
  
  // Email validation
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.message);
  }
  
  // Password validation
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.valid) {
    errors.push(passwordValidation.message);
  }
  
  // Phone validation (optional)
  if (data.phone) {
    if (typeof data.phone !== 'string') {
      errors.push('Phone must be a string');
    } else if (!/^\+?[\d\s-]{10,20}$/.test(data.phone)) {
      errors.push('Invalid phone number format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate login data
 */
function validateLogin(data) {
  const errors = [];
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.push(emailValidation.message);
  }
  
  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate complaint data
 */
function validateComplaint(data) {
  const errors = [];
  
  // Title validation
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.length > 255) {
    errors.push('Title is too long (max 255 characters)');
  } else if (data.title.length < 10) {
    errors.push('Title is too short (min 10 characters)');
  }
  
  // Description validation
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (data.description.length > 5000) {
    errors.push('Description is too long (max 5000 characters)');
  } else if (data.description.length < 20) {
    errors.push('Description is too short (min 20 characters)');
  }
  
  // Category validation
  if (!data.category_id) {
    errors.push('Category is required');
  }
  
  // Severity validation
  if (data.severity && !['low', 'medium', 'high', 'critical'].includes(data.severity)) {
    errors.push('Invalid severity level');
  }
  
  // Location validation (optional)
  if (data.location) {
    if (typeof data.location !== 'string') {
      errors.push('Location must be a string');
    } else if (data.location.length > 255) {
      errors.push('Location is too long');
    }
  }
  
  // Incident date validation (optional)
  if (data.incident_date) {
    if (!validator.isISO8601(data.incident_date) && !validator.isDate(data.incident_date)) {
      errors.push('Invalid incident date format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Enhanced XSS sanitization - removes script tags and dangerous attributes
 */
function sanitizeString(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove dangerous HTML tags and attributes
  let sanitized = input.trim();
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove other dangerous tags
  const dangerousTags = ['<iframe', '<object', '<embed', '<form', '<input', '<button'];
  dangerousTags.forEach(tag => {
    sanitized = sanitized.replace(new RegExp(tag, 'gi'), '');
  });
  
  // Remove dangerous attributes
  const dangerousAttrs = ['onerror=', 'onload=', 'onclick=', 'onmouseover=', 'javascript:', 'data:', 'vbscript:'];
  dangerousAttrs.forEach(attr => {
    sanitized = sanitized.replace(new RegExp(attr, 'gi'), '');
  });
  
  // Escape HTML entities
  sanitized = validator.escape(sanitized);
  
  return sanitized;
}

/**
 * Deep sanitize object for XSS protection
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeString(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  
  return sanitized;
}

/**
 * Sanitize user data for response (remove sensitive fields)
 */
function sanitizeUser(user) {
  const { password, ...sanitized } = user;
  return sanitized;
}

/**
 * Sanitize complaint data for response
 */
function sanitizeComplaint(complaint) {
  // Remove any sensitive fields if needed
  return complaint;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRegistration,
  validateLogin,
  validateComplaint,
  sanitizeString,
  sanitizeObject,
  sanitizeUser,
  sanitizeComplaint,
  passwordRequirements
};
