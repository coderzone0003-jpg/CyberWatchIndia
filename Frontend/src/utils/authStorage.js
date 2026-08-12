export const AUTH_SCOPES = {
  USER: 'user',
  ADMIN: 'admin',
};

const STORAGE_KEYS = {
  [AUTH_SCOPES.USER]: {
    token: 'user_token',
    session: 'user_session',
  },
  [AUTH_SCOPES.ADMIN]: {
    token: 'admin_token',
    session: 'admin_session',
  },
};

const LEGACY_KEYS = {
  token: 'cyberAuthToken',
  session: 'cyberAuthUser',
};

const ADMIN_ROUTE_PATTERNS = [
  /^\/admin(\/|$)/,
  /^\/manage-/,
  /^\/reports(\/|$)/,
  /^\/audit-logs(\/|$)/,
  /^\/settings(\/|$)/,
];

export function isAdminRoute(pathname = window.location.pathname) {
  return ADMIN_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function resolveAuthScope(endpoint, pathname = window.location.pathname) {
  if (endpoint?.startsWith('/api/admin')) {
    return AUTH_SCOPES.ADMIN;
  }

  if (isAdminRoute(pathname)) {
    return AUTH_SCOPES.ADMIN;
  }

  return AUTH_SCOPES.USER;
}

export function getToken(scope) {
  return localStorage.getItem(STORAGE_KEYS[scope].token);
}

export function getSession(scope) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[scope].session);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(scope, user, token) {
  localStorage.setItem(STORAGE_KEYS[scope].token, token);
  localStorage.setItem(STORAGE_KEYS[scope].session, JSON.stringify(user));
}

export function clearSession(scope) {
  localStorage.removeItem(STORAGE_KEYS[scope].token);
  localStorage.removeItem(STORAGE_KEYS[scope].session);
}

export function getAuthPair(scope) {
  const token = getToken(scope);
  const user = getSession(scope);

  if (token && user) {
    return { token, user };
  }

  return null;
}

export function migrateLegacyAuth() {
  const legacyToken = localStorage.getItem(LEGACY_KEYS.token);
  const legacySessionRaw = localStorage.getItem(LEGACY_KEYS.session);

  if (!legacyToken || !legacySessionRaw) {
    return;
  }

  try {
    const user = JSON.parse(legacySessionRaw);
    const scope =
      String(user.role || '').toLowerCase() === 'admin'
        ? AUTH_SCOPES.ADMIN
        : AUTH_SCOPES.USER;

    if (!getToken(scope)) {
      setSession(scope, user, legacyToken);
    }
  } catch {
    // Ignore invalid legacy session payloads.
  }

  localStorage.removeItem(LEGACY_KEYS.token);
  localStorage.removeItem(LEGACY_KEYS.session);
}

export const getUserToken = () => getToken(AUTH_SCOPES.USER);
export const getUserSession = () => getSession(AUTH_SCOPES.USER);
export const setUserSession = (user, token) => setSession(AUTH_SCOPES.USER, user, token);
export const clearUserSession = () => clearSession(AUTH_SCOPES.USER);

export const getAdminToken = () => getToken(AUTH_SCOPES.ADMIN);
export const getAdminSession = () => getSession(AUTH_SCOPES.ADMIN);
export const setAdminSession = (user, token) => setSession(AUTH_SCOPES.ADMIN, user, token);
export const clearAdminSession = () => clearSession(AUTH_SCOPES.ADMIN);
