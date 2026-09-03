import { clearAuthVerifyCache } from '../components/ProtectedRoute';
import { API_URL, IS_PRODUCTION_HOST } from './apiConfig';
import {
  AUTH_SCOPES,
  clearSession,
  getSession,
  getToken,
  resolveAuthScope,
} from './authStorage';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, config, retries = IS_PRODUCTION_HOST ? 2 : 0) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetch(url, config);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(2500 * (attempt + 1));
      }
    }
  }

  throw lastError;
};

const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.append(key, value);
    }
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

/**
 * Get the auth token for the active request scope.
 */
const getAuthToken = (authScope, tokenOverride) => {
  if (tokenOverride) {
    return tokenOverride;
  }

  const scope = authScope || resolveAuthScope();
  return getToken(scope);
};

/**
 * Get the stored session user for a scope.
 */
const getAuthUser = (authScope = AUTH_SCOPES.USER) => {
  return getSession(authScope);
};

const clearAuthForScope = (authScope) => {
  clearSession(authScope);
  clearAuthVerifyCache(authScope);
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const downloadAuthenticatedFile = async (endpoint, filename, authScope) => {
  const scope = authScope || resolveAuthScope(endpoint);
  const token = getAuthToken(scope);
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      throw new Error(data.message || 'Download failed');
    }
    throw new Error(`Download failed (${response.status})`);
  }

  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const {
    authScope = null,
    tokenOverride = null,
    ...fetchOptions
  } = options;

  const isPublicAuth = endpoint === '/api/auth/login' || endpoint === '/api/auth/register';
  const scope = authScope || resolveAuthScope(endpoint);
  const token = isPublicAuth ? null : getAuthToken(scope, tokenOverride);
  
  const headers = {
    ...fetchOptions.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...fetchOptions,
    headers,
    cache: 'no-store',
  };

  try {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      clearAuthForScope(scope);
      redirectToLogin();
      
      throw new Error('Authentication required. Please login again.');
    }

    const contentType = response.headers.get('content-type') || '';
    let data = null;

    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed (${response.status})`);
    }

    // Handle 429 Too Many Requests
    if (response.status === 429) {
      const retryAfter =
        response.headers.get('Retry-After') ||
        data?.retryAfter ||
        '15 minutes';
      throw new Error(`Too many requests. Please wait ${retryAfter} and try again.`);
    }

    if (!response.ok) {
      const errorMessage =
        (typeof data?.message === 'string' && data.message) ||
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.message?.error === 'string' && data.message.error) ||
        `Request failed (${response.status})`;

      if (response.status === 403 && errorMessage.includes('Insufficient permissions')) {
        const currentRole = String(data?.current_role || '').toLowerCase();
        if (currentRole === 'user' && endpoint.includes('/api/admin')) {
          clearAuthForScope(AUTH_SCOPES.ADMIN);
          redirectToLogin();
        }
        throw new Error(
          `Insufficient permissions (your role: ${data?.current_role || 'unknown'}). Admin login required.`
        );
      }

      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);

    if (error.message === 'Failed to fetch' || error.message === 'fetch failed') {
      const target = API_URL || window.location.origin;
      throw new Error(
        `Cannot reach the server. Make sure the backend is running at ${target}. Start it with: cd backend && npm run dev`
      );
    }

    throw error;
  }
};

/**
 * API methods for common operations
 */
const api = {
  // Auth
  login: (email, password) => 
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (userData) => 
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  logout: (authScope) =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
      authScope,
    }),

  getCurrentUser: (authScope, tokenOverride) =>
    apiRequest('/api/auth/me', { authScope, tokenOverride }),

  getPasswordRequirements: () => 
    fetch(`${API_URL}/api/auth/password-requirements`).then(res => res.json()),

  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword) =>
    apiRequest('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  verifyEmail: (token) =>
    apiRequest('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    }),

  resendVerification: () =>
    apiRequest('/api/auth/resend-verification', {
      method: 'POST',
    }),

  // Complaints
  getComplaints: (filters = {}) =>
    apiRequest(`/api/complaints${buildQueryString(filters)}`),

  getComplaintCategories: () => 
    fetch(`${API_URL}/api/complaints/categories`).then(res => res.json()),

  getComplaintStatistics: () =>
    fetch(`${API_URL}/api/complaints/statistics`).then(res => res.json()),

  getMyComplaints: (filters = {}) =>
    apiRequest(`/api/complaints/my${buildQueryString(filters)}`),

  getMyComplaintStatistics: () =>
    apiRequest('/api/complaints/my/statistics'),

  getComplaintById: (id) => 
    apiRequest(`/api/complaints/${id}`),

  getComplaintByNumber: (number) => 
    fetch(`${API_URL}/api/complaints/number/${number}`).then(res => res.json()),

  getComplaintEvidence: (id) =>
    apiRequest(`/api/complaints/${id}/evidence`),

  deleteEvidence: (complaintId, evidenceId) =>
    apiRequest(`/api/complaints/${complaintId}/evidence/${evidenceId}`, {
      method: 'DELETE',
    }),

  createComplaint: (formData) => 
    apiRequest('/api/complaints', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: formData,
    }),

  updateComplaint: (id, updateData) => 
    apiRequest(`/api/complaints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  // Users
  getAllUsers: (filters = {}) =>
    apiRequest(`/api/users${buildQueryString(filters)}`),

  getUserById: (id) => 
    apiRequest(`/api/users/${id}`),

  updateUser: (id, updateData) => 
    apiRequest(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    }),

  // Admin
  getDashboardData: () =>
    apiRequest('/api/admin/dashboard'),

  getAdminReports: (filters = {}) =>
    apiRequest(`/api/admin/reports${buildQueryString(filters)}`),

  exportPDF: (filters = {}) =>
    downloadAuthenticatedFile(
      `/api/admin/export/pdf${buildQueryString(filters)}`,
      `complaints-report-${Date.now()}.pdf`,
      AUTH_SCOPES.ADMIN
    ),

  exportExcel: (filters = {}) =>
    downloadAuthenticatedFile(
      `/api/admin/export/excel${buildQueryString(filters)}`,
      `complaints-report-${Date.now()}.xlsx`,
      AUTH_SCOPES.ADMIN
    ),

  getAuditLogs: (filters = {}) =>
    apiRequest(`/api/admin/audit-logs${buildQueryString(filters)}`),

  getAdminComplaints: (filters = {}) =>
    apiRequest(`/api/admin/complaints${buildQueryString(filters)}`),

  getAdminUsers: (filters = {}) =>
    apiRequest(`/api/admin/users${buildQueryString(filters)}`),

  getAdminOfficers: () => 
    apiRequest('/api/admin/officers'),

  createOfficer: (officerData) => 
    apiRequest('/api/admin/officers', {
      method: 'POST',
      body: JSON.stringify(officerData),
    }),

  updateOfficer: (id, officerData) => 
    apiRequest(`/api/admin/officers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(officerData),
    }),

  deleteOfficer: (id) => 
    apiRequest(`/api/admin/officers/${id}`, {
      method: 'DELETE',
    }),

  updateComplaintStatus: (id, status) => 
    apiRequest(`/api/admin/complaints/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  assignOfficer: (complaintId, officerId) =>
    apiRequest(`/api/admin/complaints/${complaintId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ officer_id: String(officerId) }),
    }),

  unassignOfficer: (complaintId) =>
    apiRequest(`/api/admin/complaints/${complaintId}/unassign`, {
      method: 'PUT',
    }),

  updateUserStatus: (id, status) => 
    apiRequest(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  deleteUser: (id) => 
    apiRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    }),

  getCategories: () => 
    apiRequest('/api/admin/categories'),

  createCategory: (categoryData) => 
    apiRequest('/api/admin/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    }),

  updateCategory: (id, categoryData) => 
    apiRequest(`/api/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    }),

  deleteCategory: (id) =>
    apiRequest(`/api/admin/categories/${id}`, {
      method: 'DELETE',
    }),

  // Contact Messages (Public)
  submitContactMessage: (contactData) =>
    apiRequest('/api/contact', {
      method: 'POST',
      body: JSON.stringify(contactData),
    }),

  // Contact Messages (Admin)
  getContactMessages: (filters = {}) =>
    apiRequest(`/api/contact${buildQueryString(filters)}`),

  getContactMessageById: (id) =>
    apiRequest(`/api/contact/${id}`),

  updateContactStatus: (id, status) =>
    apiRequest(`/api/contact/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  toggleContactRead: (id) =>
    apiRequest(`/api/contact/${id}/read`, {
      method: 'PUT',
    }),

  deleteContactMessage: (id) =>
    apiRequest(`/api/contact/${id}`, {
      method: 'DELETE',
    }),

  bulkContactAction: (ids, action) =>
    apiRequest('/api/contact/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action }),
    }),

  getContactStats: () =>
    apiRequest('/api/contact/stats'),

  // Notifications
  getNotifications: () =>
    apiRequest('/api/notifications'),

  getUnreadCount: () =>
    apiRequest('/api/notifications/unread-count'),

  markAsRead: (id) =>
    apiRequest(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),

  markAllAsRead: () =>
    apiRequest('/api/notifications/read-all', {
      method: 'PUT',
    }),
};

export { api, getAuthToken, getAuthUser, API_URL };