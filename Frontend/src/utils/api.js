import { clearAuthVerifyCache } from '../components/ProtectedRoute';
import { API_URL, IS_PRODUCTION_HOST } from './apiConfig';

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
 * Get the auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('cyberAuthToken');
};

/**
 * Get the auth user from localStorage
 */
const getAuthUser = () => {
  const user = localStorage.getItem('cyberAuthUser');
  return user ? JSON.parse(user) : null;
};

const downloadAuthenticatedFile = async (endpoint, filename) => {
  const token = getAuthToken();
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
  const isPublicAuth = endpoint === '/api/auth/login' || endpoint === '/api/auth/register';
  const token = isPublicAuth ? null : getAuthToken();
  
  const headers = {
    ...options.headers,
  };

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    cache: 'no-store',
  };

  try {
    const response = await fetchWithRetry(`${API_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Clear auth data
      localStorage.removeItem('cyberAuthToken');
      localStorage.removeItem('cyberAuthUser');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
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
          clearAuthVerifyCache();
          localStorage.removeItem('cyberAuthToken');
          localStorage.removeItem('cyberAuthUser');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
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

  logout: () => 
    apiRequest('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () => 
    apiRequest('/api/auth/me'),

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
      `complaints-report-${Date.now()}.pdf`
    ),

  exportExcel: (filters = {}) =>
    downloadAuthenticatedFile(
      `/api/admin/export/excel${buildQueryString(filters)}`,
      `complaints-report-${Date.now()}.xlsx`
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