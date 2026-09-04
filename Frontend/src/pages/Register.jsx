import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { supabase } from '../config/supabase';
import { sanitizeMobileInput, validateIndianMobile } from '../utils/phoneValidation';
import { clearUserSession, setUserSession } from '../utils/authStorage';

function RegisterPage({ onRegister }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState(null);
  const [passwordValidation, setPasswordValidation] = useState({ valid: true, errors: [] });
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });

  // Fetch password requirements on component mount
  useEffect(() => {
    fetchPasswordRequirements();
  }, []);

  // Validate password in real-time as user types
  useEffect(() => {
    if (form.password) {
      const validation = validatePassword(form.password);
      setPasswordValidation(validation);
    } else {
      setPasswordValidation({ valid: true, errors: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.password, passwordRequirements]);

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
    setFieldErrors({ name: '', email: '', mobile: '', password: '', confirmPassword: '' });

    const mobileCheck = validateIndianMobile(form.mobile);
    if (!mobileCheck.valid) {
      setFieldErrors((prev) => ({ ...prev, mobile: mobileCheck.error }));
      setError(mobileCheck.error);
      return;
    }

    // Basic validation
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Password strength validation
    if (!passwordValidation.valid) {
      setError(passwordValidation.errors.join(', '));
      return;
    }

    setLoading(true);

    try {
      // 1. Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: mobileCheck.digits
          }
        }
      });

      if (authError) throw authError;

      let session = authData.session;
      
      // If we didn't get a session from signUp (can happen based on Supabase settings),
      // explicitly sign the user in with the credentials they just created.
      if (!session) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password
        });
        
        if (loginError || !loginData.session) {
          throw new Error('Registration successful. Please login now.');
        }
        
        session = loginData.session;
      }

      let profileUser;
      try {
        const profileData = await api.getCurrentUser(null, session.access_token);
        profileUser = profileData.user;
      } catch (profileErr) {
        profileUser = {
          id: authData.user?.id,
          full_name: form.name,
          email: form.email.trim().toLowerCase(),
          phone: mobileCheck.digits,
          role: 'user'
        };
      }

      setUserSession(profileUser, session.access_token);
      onRegister(profileUser, session.access_token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
      clearUserSession();
    } finally {
      setLoading(false);
    }
  };

  const getPasswordRequirementStatus = (requirement, test) => {
    if (!form.password) return { met: false, text: requirement };
    const passed = test(form.password);
    return { met: passed, text: requirement };
  };

  return (
    <section className="section py-5">
      <div className="container d-flex justify-content-center">
        <form onSubmit={handleSubmit} className="contact-form p-4 rounded-4 shadow-sm" style={{ maxWidth: '500px', width: '100%' }}>
          <h3 className="fw-bold mb-3">Register</h3>
          
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          {passwordRequirements && (
            <div className="alert alert-info mb-3" role="alert">
              <small>
                <strong>Password Requirements:</strong><br/>
              </small>
              <div className="mt-2">
                  {getPasswordRequirementStatus(
                    `Minimum ${passwordRequirements.minLength} characters`,
                    p => p.length >= passwordRequirements.minLength
                  ).met ? (
                    <span className="text-success"><i className="bi bi-check-circle me-1"></i>Minimum {passwordRequirements.minLength} characters</span>
                  ) : (
                    <span className="text-muted"><i className="bi bi-circle me-1"></i>Minimum {passwordRequirements.minLength} characters</span>
                  )}
                  <br/>
                  {passwordRequirements.requireUppercase && (
                    getPasswordRequirementStatus(
                      'At least one uppercase letter',
                      p => /[A-Z]/.test(p)
                    ).met ? (
                      <span className="text-success"><i className="bi bi-check-circle me-1"></i>At least one uppercase letter</span>
                    ) : (
                      <span className="text-muted"><i className="bi bi-circle me-1"></i>At least one uppercase letter</span>
                    )
                  )}
                  {passwordRequirements.requireUppercase && <br/>}
                  {passwordRequirements.requireLowercase && (
                    getPasswordRequirementStatus(
                      'At least one lowercase letter',
                      p => /[a-z]/.test(p)
                    ).met ? (
                      <span className="text-success"><i className="bi bi-check-circle me-1"></i>At least one lowercase letter</span>
                    ) : (
                      <span className="text-muted"><i className="bi bi-circle me-1"></i>At least one lowercase letter</span>
                    )
                  )}
                  {passwordRequirements.requireLowercase && <br/>}
                  {passwordRequirements.requireNumbers && (
                    getPasswordRequirementStatus(
                      'At least one number',
                      p => /\d/.test(p)
                    ).met ? (
                      <span className="text-success"><i className="bi bi-check-circle me-1"></i>At least one number</span>
                    ) : (
                      <span className="text-muted"><i className="bi bi-circle me-1"></i>At least one number</span>
                    )
                  )}
                  {passwordRequirements.requireNumbers && <br/>}
                  {passwordRequirements.requireSpecialChars && (
                    getPasswordRequirementStatus(
                      'At least one special character (!@#$%^&*(),.?":{}|<>)',
                      p => /[!@#$%^&*(),.?":{}|<>]/.test(p)
                    ).met ? (
                      <span className="text-success"><i className="bi bi-check-circle me-1"></i>At least one special character</span>
                    ) : (
                      <span className="text-muted"><i className="bi bi-circle me-1"></i>At least one special character</span>
                    )
                  )}
                </div>
            </div>
          )}

          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="register-name">Name *</label>
              <input 
                id="register-name"
                className="form-control" 
                placeholder="Full name" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="register-email">Email *</label>
              <input 
                id="register-email"
                type="email" 
                className="form-control" 
                placeholder="Email" 
                value={form.email} 
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="register-mobile">Mobile Number *</label>
              <input
                id="register-mobile"
                type="tel"
                inputMode="numeric"
                className={`form-control ${fieldErrors.mobile ? 'is-invalid' : ''}`}
                placeholder="10-digit mobile number"
                value={form.mobile}
                onChange={(e) => {
                  const mobile = sanitizeMobileInput(e.target.value);
                  setForm({ ...form, mobile });
                  if (fieldErrors.mobile) {
                    setFieldErrors({ ...fieldErrors, mobile: '' });
                  }
                }}
                disabled={loading}
                maxLength={10}
                required
              />
              {fieldErrors.mobile && <div className="invalid-feedback">{fieldErrors.mobile}</div>}
              <small className="text-muted">Enter a valid 10-digit Indian mobile number (starts with 6–9)</small>
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="register-password">Password *</label>
              <input 
                id="register-password"
                type="password" 
                className="form-control" 
                placeholder="Password" 
                value={form.password} 
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label" htmlFor="register-confirm-password">Confirm Password *</label>
              <input 
                id="register-confirm-password"
                type="password" 
                className="form-control" 
                placeholder="Confirm" 
                value={form.confirmPassword} 
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="col-12">
              <button 
                className="btn btn-success w-100" 
                type="submit" 
                disabled={loading || !passwordValidation.valid}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

export default RegisterPage;
