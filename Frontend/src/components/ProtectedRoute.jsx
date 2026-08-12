import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const AUTH_VERIFY_TTL_MS = 60 * 1000;

let authVerifyCache = { token: null, user: null, expiresAt: 0 };
let pendingVerification = null;

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('cyberAuthUser');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const verifyAuthToken = async (token) => {
  const now = Date.now();

  if (authVerifyCache.token === token && authVerifyCache.expiresAt > now) {
    return authVerifyCache.user;
  }

  if (pendingVerification?.token === token) {
    return pendingVerification.promise;
  }

  const promise = (async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    authVerifyCache = {
      token,
      user: data.user,
      expiresAt: Date.now() + AUTH_VERIFY_TTL_MS,
    };
    localStorage.setItem('cyberAuthUser', JSON.stringify(data.user));
    return data.user;
  })();

  pendingVerification = { token, promise };

  try {
    return await promise;
  } finally {
    if (pendingVerification?.promise === promise) {
      pendingVerification = null;
    }
  }
};

export const clearAuthVerifyCache = () => {
  authVerifyCache = { token: null, user: null, expiresAt: 0 };
  pendingVerification = null;
};

function ProtectedRoute({ children, authUser, authToken, allowedRoles = [], onUserVerified }) {
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveToken = authToken || localStorage.getItem('cyberAuthToken');
  const effectiveUser = authUser || getStoredUser();

  useEffect(() => {
    let cancelled = false;

    const verifyToken = async () => {
      const token = authToken || localStorage.getItem('cyberAuthToken');

      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const user = await verifyAuthToken(token);
        if (cancelled) return;
        setVerifiedUser(user);
        onUserVerified?.(user);
      } catch (err) {
        console.error('Token verification failed:', err);
        clearAuthVerifyCache();
        localStorage.removeItem('cyberAuthToken');
        localStorage.removeItem('cyberAuthUser');
        if (!cancelled) setVerifiedUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [authToken, onUserVerified]);

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

  const activeUser = allowedRoles.length > 0 ? verifiedUser : (verifiedUser || effectiveUser);

  if (!activeUser || !effectiveToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(String(activeUser.role || '').toLowerCase())) {
    const needsAdmin = allowedRoles.includes('admin');
    const isRegularUser = String(activeUser.role || '').toLowerCase() === 'user';

    if (needsAdmin && isRegularUser) {
      clearAuthVerifyCache();
      localStorage.removeItem('cyberAuthToken');
      localStorage.removeItem('cyberAuthUser');
    }

    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: needsAdmin
            ? 'You are logged in as a regular user. Sign in with an admin account to continue.'
            : 'You do not have permission to view this page.',
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
