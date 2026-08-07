import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ProtectedRoute({ children, authUser, authToken, allowedRoles = [] }) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!authToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          // Token is invalid, clear local storage
          localStorage.removeItem('cyberAuthToken');
          localStorage.removeItem('cyberAuthUser');
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        // Update auth user data from server
        localStorage.setItem('cyberAuthUser', JSON.stringify(data.user));
        setIsVerified(true);
      } catch (err) {
        console.error('Token verification failed:', err);
        localStorage.removeItem('cyberAuthToken');
        localStorage.removeItem('cyberAuthUser');
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [authToken]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!authUser || !authToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(authUser.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
