import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section py-5">
      <div className="container d-flex justify-content-center">
        <div className="contact-form p-4 rounded-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
          <h3 className="fw-bold mb-3">Forgot Password</h3>
          <p className="text-muted mb-4">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-3" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              If an account exists with this email, a password reset link has been sent.
              Check your inbox and spam folder.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="forgot-email">Email Address <span className="text-danger">*</span></label>
              <input 
                id="forgot-email"
                type="email" 
                className="form-control" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-decoration-none">
              <i className="bi bi-arrow-left me-1"></i>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;