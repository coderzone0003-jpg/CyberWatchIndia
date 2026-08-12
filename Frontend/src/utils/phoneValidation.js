/**
 * Normalize user input to up to 10 Indian mobile digits.
 * Strips +91 / 91 country code when present.
 */
export function sanitizeMobileInput(value) {
  let digits = String(value || '').replace(/\D/g, '');

  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  }

  return digits.slice(0, 10);
}

/**
 * Validate a 10-digit Indian mobile number.
 */
export function validateIndianMobile(value) {
  const digits = sanitizeMobileInput(value);

  if (!digits) {
    return { valid: false, error: 'Mobile number is required.', digits: '' };
  }

  if (digits.length !== 10) {
    return { valid: false, error: 'Mobile number must be exactly 10 digits.', digits };
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return {
      valid: false,
      error: 'Enter a valid 10-digit Indian mobile number (must start with 6, 7, 8, or 9).',
      digits,
    };
  }

  if (/^(\d)\1{9}$/.test(digits)) {
    return { valid: false, error: 'Mobile number looks invalid.', digits };
  }

  return { valid: true, error: '', digits };
}
