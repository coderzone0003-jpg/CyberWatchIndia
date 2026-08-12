import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { API_URL } from '../utils/apiConfig';
import {
  AUTH_SCOPES,
  clearSession,
  getSession,
  getToken,
  setSession,
} from '../utils/authStorage';

const AUTH_VERIFY_TTL_MS = 60 * 1000;

const authVerifyCaches = {
  [AUTH_SCOPES.USER]: { token: null, user: null, expiresAt: 0 },
  [AUTH_SCOPES.ADMIN]: { token: null, user: null, expiresAt: 0 },
};

const pendingVerifications = {
  [AUTH_SCOPES.USER]: null,
  [AUTH_SCOPES.ADMIN]: null,
};

const verifyAuthToken = async (token, scope) => {
  const now = Date.now();
  const cache = authVerifyCaches[scope];

  if (cache.token === token && cache.expiresAt > now) {
    return cache.user;
  }

  if (pendingVerifications[scope]?.token === token) {
    return pendingVerifications[scope].promise;
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
    authVerifyCaches[scope] = {
      token,
      user: data.user,
      expiresAt: Date.now() + AUTH_VERIFY_TTL_MS,
    };
    setSession(scope, data.user, token);
    return data.user;
  })();

  pendingVerifications[scope] = { token, promise };

  try {
    return await promise;
  } finally {
    if (pendingVerifications[scope]?.promise === promise) {
      pendingVerifications[scope] = null;
    }
  }
};

export const clearAuthVerifyCache = (scope) => {
  if (scope) {
    authVerifyCaches[scope] = { token: null, user: null, expiresAt: 0 };
    pendingVerifications[scope] = null;
    return;
  }

  clearAuthVerifyCache(AUTH_SCOPES.USER);
  clearAuthVerifyCache(AUTH_SCOPES.ADMIN);
};

function ProtectedRoute({
  children,
  authScope = AUTH_SCOPES.USER,
  authUser,
  authToken,
  allowedRoles = [],
  onUserVerified,
}) {
  const [verifiedUser, setVerifiedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const effectiveToken = authToken || getToken(authScope);
  const effectiveUser = authUser || getSession(authScope);

  useEffect(() => {
    let cancelled = false;

    const verifyToken = async () => {
      const token = authToken || getToken(authScope);

      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }

      try {
        const user = await verifyAuthToken(token, authScope);
        if (cancelled) return;
        setVerifiedUser(user);
        onUserVerified?.(user);
      } catch (err) {
        console.error('Token verification failed:', err);
        clearAuthVerifyCache(authScope);
        clearSession(authScope);
        if (!cancelled) setVerifiedUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    verifyToken();

    return () => {
      cancelled = true;
    };
  }, [authToken, authScope, onUserVerified]);

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

  const activeUser = allowedRoles.length > 0 ? verifiedUser : verifiedUser || effectiveUser;

  if (!activeUser || !effectiveToken) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length && !allowedRoles.includes(String(activeUser.role || '').toLowerCase())) {
    clearAuthVerifyCache(authScope);
    clearSession(authScope);

    return (
      <Navigate
        to="/login"
        replace
        state={{
          message: allowedRoles.includes('admin')
            ? 'Sign in with an admin account to continue.'
            : 'You do not have permission to view this page.',
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;
