const { supabase, supabaseAdmin } = require('../config/supabase');

// ============================================
// PROFILE OPERATIONS
// ============================================

const profileOperations = {
  // Find profile by user_id (auth.users.id)
  async findByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
    return data;
  },

  // Find profile by profile id
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update profile
  async updateById(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Get all profiles (admin only)
  async getAll(filters = {}) {
    let query = supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (filters.role) {
      query = query.eq('role', filters.role);
    }
    
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    
    if (filters.is_verified !== undefined) {
      query = query.eq('is_verified', filters.is_verified);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Create profile (used for manual profile creation, not registration)
  // Note: Registration uses Supabase Auth which auto-creates profiles via trigger
  async create(profileData) {
    // Remove password field if present (Supabase Auth handles passwords)
    const { password, ...profileFields } = profileData;
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert([profileFields])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update profile
  async update(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Soft delete profile (set is_active to false)
  async softDeleteById(id) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// COMPLAINT OPERATIONS
// ============================================

const complaintOperations = {
  // Create new complaint
  async create(complaintData) {
    // Generate a fallback tracking ID in case the DB trigger is missing
    const year = new Date().getFullYear();
    const randomPart = Math.floor(1000 + Math.random() * 9000);
    const timePart = Date.now().toString().slice(-4);
    const tracking_id = `CYB-${year}-${randomPart}${timePart}`;

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .insert([{
        tracking_id,
        title: complaintData.title,
        description: complaintData.description,
        category_id: complaintData.category_id,
        severity: complaintData.severity || 'medium',
        user_id: complaintData.user_id,
        location: complaintData.location,
        incident_date: complaintData.incident_date
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find complaint by ID
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description),
        user_profile:profiles!complaints_user_id_fkey(full_name, email, phone),
        officer_profile:profiles!complaints_assigned_officer_id_fkey(full_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find complaint by tracking ID
  async findByTrackingId(trackingId) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description),
        user_profile:profiles!complaints_user_id_fkey(full_name, email, phone),
        officer_profile:profiles!complaints_assigned_officer_id_fkey(full_name, email)
      `)
      .eq('tracking_id', trackingId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Get complaints by user ID
  async getByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get complaints by officer ID
  async getByOfficerId(officerId) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description),
        user_profile:profiles!complaints_user_id_fkey(full_name, email, phone)
      `)
      .eq('assigned_officer_id', officerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Get all complaints with filters
  async getAll(filters = {}) {
    let query = supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description),
        user_profile:profiles!complaints_user_id_fkey(full_name, email),
        officer_profile:profiles!complaints_assigned_officer_id_fkey(full_name, email)
      `);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id);
    }
    
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    if (filters.assigned_officer_id) {
      query = query.eq('assigned_officer_id', filters.assigned_officer_id);
    }

    if (filters.created_at_gte) {
      query = query.gte('created_at', filters.created_at_gte);
    }

    if (filters.created_at_lte) {
      query = query.lte('created_at', filters.created_at_lte);
    }

    // Server-side search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(`tracking_id.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
    }

    query = query.order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Update complaint
  async updateById(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Assign officer to complaint
  async assignOfficer(complaintId, officerId) {
    return this.updateById(complaintId, { 
      assigned_officer_id: officerId,
      status: 'under investigation' 
    });
  },

  // Update complaint status
  async updateStatus(complaintId, status) {
    return this.updateById(complaintId, { status });
  },

  // Get complaint statistics
  async getStatistics() {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select('status, severity, category_id');
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      by_status: {},
      by_severity: {},
      by_category: {}
    };
    
    data.forEach(complaint => {
      stats.by_status[complaint.status] = (stats.by_status[complaint.status] || 0) + 1;
      stats.by_severity[complaint.severity] = (stats.by_severity[complaint.severity] || 0) + 1;
      if (complaint.category_id) {
        stats.by_category[complaint.category_id] = (stats.by_category[complaint.category_id] || 0) + 1;
      }
    });
    
    return stats;
  }
};

// ============================================
// CATEGORY OPERATIONS
// ============================================

const categoryOperations = {
  async getAll() {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(categoryData) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// EVIDENCE OPERATIONS
// ============================================

const evidenceOperations = {
  async create(evidenceData) {
    const { data, error } = await supabaseAdmin
      .from('evidence_files')
      .insert([{
        complaint_id: evidenceData.complaint_id,
        file_path: evidenceData.file_path,
        file_name: evidenceData.file_name,
        file_type: evidenceData.file_type,
        file_size: evidenceData.file_size
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByComplaintId(complaintId) {
    const { data, error } = await supabaseAdmin
      .from('evidence_files')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async deleteById(id) {
    // First get the file path to delete from storage
    const { data: file } = await supabaseAdmin
      .from('evidence_files')
      .select('file_path')
      .eq('id', id)
      .single();
    
    if (file && file.file_path) {
      const { deleteFile } = require('./fileUpload');
      await deleteFile(file.file_path);
    }
    
    // Delete from database
    const { error } = await supabaseAdmin
      .from('evidence_files')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};

// ============================================
// NOTIFICATION OPERATIONS
// ============================================

const notificationOperations = {
  async create(notificationData) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert([{
        user_id: notificationData.user_id,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        related_complaint_id: notificationData.related_complaint_id
      }])
      .select()
      .single();

    if (error) {
      console.error('Notification creation error:', error);
      // Don't throw error for notifications - they shouldn't break the main flow
      return null;
    }
    return data;
  },

  async getByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async markAsRead(id) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  },

  async markAllAsRead(userId) {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }
};

// ============================================
// AUDIT LOG OPERATIONS
// ============================================

const auditLogOperations = {
  async create(logData) {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .insert([{
        user_id: logData.user_id,
        action: logData.action,
        entity_type: logData.entity_type,
        entity_id: logData.entity_id,
        details: logData.details,
        ip_address: logData.ip_address,
        user_agent: logData.user_agent
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAll(filters = {}) {
    let query = supabaseAdmin
      .from('audit_logs')
      .select(`
        *,
        user_profile:profiles(full_name, email, role)
      `)
      .order('created_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }
    
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    
    if (filters.created_at_gte) {
      query = query.gte('created_at', filters.created_at_gte);
    }
    
    if (filters.created_at_lte) {
      query = query.lte('created_at', filters.created_at_lte);
    }
    
    // Search in details
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(`action.ilike.%${searchTerm}%,entity_type.ilike.%${searchTerm}%`);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  },

  async getByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getAll(filters = {}) {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*');
    
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    
    query = query.order('created_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
};

module.exports = {
  profileOperations,
  complaintOperations,
  categoryOperations,
  evidenceOperations,
  notificationOperations,
  auditLogOperations
};
