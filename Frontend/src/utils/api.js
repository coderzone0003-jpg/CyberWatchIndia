const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

/**
 * Make an authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
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
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear auth data
      localStorage.removeItem('cyberAuthToken');
      localStorage.removeItem('cyberAuthUser');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw new Error('Authentication required. Please login again.');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
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
  getComplaints: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/complaints${params ? `?${params}` : ''}`);
  },

  getComplaintCategories: () => 
    fetch(`${API_URL}/api/complaints/categories`).then(res => res.json()),

  getMyComplaints: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/complaints/my${params ? `?${params}` : ''}`);
  },

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
  getAllUsers: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/users${params ? `?${params}` : ''}`);
  },

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

  getAdminReports: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/admin/reports${params ? `?${params}` : ''}`);
  },

  exportPDF: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = `${API_URL}/api/admin/export/pdf${params ? `?${params}` : ''}`;
    window.open(url, '_blank');
  },

  exportExcel: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const url = `${API_URL}/api/admin/export/excel${params ? `?${params}` : ''}`;
    window.open(url, '_blank');
  },

  getAuditLogs: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/admin/audit-logs${params ? `?${params}` : ''}`);
  },

  getAdminComplaints: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/admin/complaints${params ? `?${params}` : ''}`);
  },

  getAdminUsers: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiRequest(`/api/admin/users${params ? `?${params}` : ''}`);
  },

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
      body: JSON.stringify({ officer_id: officerId }),
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