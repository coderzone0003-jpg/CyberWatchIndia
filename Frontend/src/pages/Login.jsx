import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { clearAuthVerifyCache } from '../components/ProtectedRoute';
import {
  clearAdminSession,
  clearUserSession,
  getAdminToken,
  setAdminSession,
  setUserSession,
} from '../utils/authStorage';

function LoginPage({ onUserLogin, onAdminLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });

  // Redirect if already logged in as admin
  useEffect(() => {
    const redirectMessage = location.state?.message;
    if (redirectMessage) {
      setError(redirectMessage);
    }

    const adminToken = getAdminToken();
    if (adminToken) {
      navigate('/admin', { replace: true });
    }
  }, [navigate, location.state]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!form.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!validateEmail(form.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!form.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (!validatePassword(form.password)) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: '', password: '' });

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    clearAuthVerifyCache();

    try {
      const loginData = await api.login(
        form.email.trim().toLowerCase(),
        form.password.trim()
      );

      const profileData = await api.getCurrentUser(null, loginData.token);
      const user = profileData.user;
      const role = String(user.role || '').toLowerCase();

      if (role === 'admin') {
        clearUserSession();
        setAdminSession(user, loginData.token);
        onAdminLogin(user, loginData.token);
        navigate('/admin', { replace: true });
        return;
      }

      clearAdminSession();
      setUserSession(user, loginData.token);
      onUserLogin(user, loginData.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      let message = err.message || 'Login failed. Please check your credentials.';

      if (message.includes('Too many authentication attempts')) {
        message = 'Too many failed attempts. Wait 15 minutes or restart the backend server, then try again.';
      } else if (message.includes('Insufficient permissions')) {
        message = 'Your account does not have admin access. Contact an administrator.';
      } else if (message === 'Invalid email or password' || message === 'Invalid login credentials') {
        message = 'Invalid email or password. Please try again.';
      } else if (message === 'Profile not found') {
        message = 'Account found but profile is missing. Run: cd backend && npm run create-admin';
      } else if (message.includes('Cannot reach the server')) {
        message = `${message}. Start it with: cd backend && npm run dev`;
      }

      setError(message);
      clearUserSession();
      clearAdminSession();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section py-5">
      <div className="container d-flex justify-content-center">
        <form onSubmit={handleSubmit} className="contact-form p-4 rounded-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
          <h3 className="fw-bold mb-3">Login</h3>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
              }}
              disabled={loading}
              required
            />
            {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                placeholder="Password"
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
              {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
            </div>
          </div>
          <div className="mb-3">
            <Link to="/forgot-password" className="text-decoration-none small">
              Forgot password?
            </Link>
          </div>
          <button
            className="btn btn-success w-100"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
