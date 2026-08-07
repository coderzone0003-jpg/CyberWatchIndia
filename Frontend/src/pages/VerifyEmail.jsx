import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { api } from '../utils/api';

function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(!!token);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Message passed from Register page
  const stateMessage = location.state?.message;

  useEffect(() => {
    if (!token) {
      if (!stateMessage) {
        setError('Invalid or missing verification token');
      }
      setLoading(false);
      return;
    }

    verifyEmail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const verifyEmail = async () => {
    try {
      await api.verifyEmail(token);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section py-5">
      <div className="container d-flex justify-content-center">
        <div className="contact-form p-4 rounded-4 shadow-sm" style={{ maxWidth: '450px', width: '100%' }}>
          <h3 className="fw-bold mb-3">Email Verification</h3>
          
          {loading && (
            <div className="text-center py-4">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Verifying your email...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {!loading && !error && stateMessage && !success && (
            <div className="alert alert-info mb-3" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              {stateMessage}
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-3" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              Email verified successfully! Redirecting to login...
            </div>
          )}

          {!loading && error && (
            <div className="text-center mt-4">
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default VerifyEmail;