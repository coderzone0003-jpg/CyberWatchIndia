import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { supabase } from '../config/supabase';

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Authenticate with Supabase directly
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      });

      if (authError) throw authError;

      // 2. Save token so apiRequest works for backend calls
      localStorage.setItem('cyberAuthToken', authData.session.access_token);

      // 3. Fetch user profile from our backend to get role
      const profileData = await api.getCurrentUser();
      
      // 4. Call parent callback
      onLogin(profileData.user, authData.session.access_token);

      // 5. Navigate based on role
      if (profileData.user.role === 'admin' || profileData.user.role === 'officer') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
      // Clean up token if profile fetch failed
      localStorage.removeItem('cyberAuthToken');
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
              className="form-control" 
              placeholder="you@example.com" 
              value={form.email} 
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={loading}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Password" 
              value={form.password} 
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={loading}
              required
            />
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
