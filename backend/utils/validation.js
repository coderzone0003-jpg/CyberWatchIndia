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
  } else if (/^[\W\d_]+$/.test(data.title.trim())) {
    errors.push('Title must contain descriptive text, not only symbols or numbers');
  }
  
  // Description validation
  if (!data.description || typeof data.description !== 'string' || data.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (data.description.length > 5000) {
    errors.push('Description is too long (max 5000 characters)');
  } else if (data.description.length < 20) {
    errors.push('Description is too short (min 20 characters)');
  } else {
    const uniqueWords = data.description.trim().split(/\s+/).filter(w => w.length > 1).length;
    if (uniqueWords < 5) {
      errors.push('Description must contain at least 5 meaningful words');
    }
  }
  
  // Category validation
  if (!data.category_id) {
    errors.push('Category is required');
  } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(data.category_id))) {
    errors.push('Invalid category ID format');
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
    } else if (data.location.trim().length < 2) {
      errors.push('Location is too short (min 2 characters if provided)');
    } else if (/[<>]/.test(data.location)) {
      errors.push('Location cannot contain HTML tags');
    }
  }
  
  // Incident date validation (optional)
  if (data.incident_date) {
    const dateStr = String(data.incident_date).trim();
    const parsed = new Date(dateStr);
    if (!validator.isISO8601(dateStr) && !validator.isDate(dateStr) && isNaN(parsed.getTime())) {
      errors.push('Invalid incident date format');
    } else if (!isNaN(parsed.getTime())) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsed > today) {
        errors.push('Incident date cannot be in the future');
      } else {
        const oldest = new Date();
        oldest.setFullYear(oldest.getFullYear() - 50);
        if (parsed < oldest) {
          errors.push('Incident date is too far in the past');
        }
      }
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
