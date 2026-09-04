import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../utils/api';

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
    }
    fetchPasswordRequirements();
  }, [token]);

  const fetchPasswordRequirements = async () => {
    try {
      const data = await api.getPasswordRequirements();
      setPasswordRequirements(data.requirements);
    } catch (err) {
      console.error('Failed to fetch password requirements:', err);
    }
  };

  const validatePassword = (password) => {
    if (!passwordRequirements) return { valid: true, errors: [] };

    const errors = [];
    
    if (password.length < passwordRequirements.minLength) {
      errors.push(`Password must be at least ${passwordRequirements.minLength} characters`);
    }
    
    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common patterns
    const forbiddenPatterns = ['password', '123456', 'qwerty', 'admin', 'user'];
    const lowerPassword = password.toLowerCase();
    for (const pattern of forbiddenPatterns) {
      if (lowerPassword.includes(pattern)) {
        errors.push('Password contains common words that are not allowed');
        break;
      }
    }
    
    // Check for repeating characters
    const repeatingCharsRegex = /(.)\1{3,}/g;
    if (repeatingCharsRegex.test(password)) {
      errors.push('Password must not contain more than 3 repeating characters');
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join(', '));
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, formData.password);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <section className="section py-5">
        <div className="container d-flex justify-content-center">
          <div className="contact-form p-4 rounded-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
            <div className="alert alert-danger mb-3" role="alert">
              Invalid or missing reset token. Please request a new password reset link.
            </div>
            <Link to="/forgot-password" className="btn btn-success w-100">
              Request New Reset Link
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section py-5">
      <div className="container d-flex justify-content-center">
        <div className="contact-form p-4 rounded-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
          <h3 className="fw-bold mb-3">Reset Password</h3>
          <p className="text-muted mb-4">
            Enter your new password below.
          </p>
          
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-3" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              Password reset successfully! Redirecting to login...
            </div>
          )}

          {passwordRequirements && !success && (
            <div className="alert alert-info mb-3" role="alert">
              <small>
                <strong>Password Requirements:</strong><br/>
                • Minimum {passwordRequirements.minLength} characters<br/>
                {passwordRequirements.requireUppercase && '• At least one uppercase letter<br/>'}
                {passwordRequirements.requireLowercase && '• At least one lowercase letter<br/>'}
                {passwordRequirements.requireNumbers && '• At least one number<br/>'}
                {passwordRequirements.requireSpecialChars && '• At least one special character (!@#$%^&*(),.?":{}|<>)'}
              </small>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="reset-password">New Password <span className="text-danger">*</span></label>
                <input 
                  id="reset-password"
                  type="password" 
                  className="form-control" 
                  placeholder="Enter new password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password <span className="text-danger">*</span></label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="reset-confirm-password"
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  required
                />
              </div>
              <button 
                className="btn btn-success w-100" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;