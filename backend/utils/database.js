const { supabase, supabaseAdmin } = require('../config/supabase');
const { normalizeComplaint } = require('./complaintStatus');

const OFFICER_FIELDS = 'id, full_name, email, phone, badge_number, specialization';

async function enrichComplaintsWithOfficers(complaints) {
  const list = Array.isArray(complaints) ? complaints : [];
  if (!list.length) return list;

  const officerIds = [...new Set(list.map((c) => c.assigned_officer_id).filter(Boolean))];
  if (!officerIds.length) {
    return list.map((c) => ({ ...c, officer: null }));
  }

  const { data: officers, error } = await supabaseAdmin
    .from('profiles')
    .select(OFFICER_FIELDS)
    .in('id', officerIds);

  if (error) throw error;

  const officerMap = new Map((officers || []).map((o) => [o.id, o]));

  return list.map((c) => normalizeComplaint({
    ...c,
    officer: c.assigned_officer_id ? officerMap.get(c.assigned_officer_id) || null : null,
  }));
}

async function enrichComplaintWithOfficer(complaint) {
  if (!complaint) return complaint;
  const [enriched] = await enrichComplaintsWithOfficers([complaint]);
  return enriched;
}

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

  // Find profile by email
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
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
        category:categories(name, description)
      `)
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return enrichComplaintWithOfficer(data);
  },

  async getById(id) {
    return this.findById(id);
  },

  // Find complaint by tracking ID
  async findByTrackingId(trackingId) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description)
      `)
      .eq('tracking_id', trackingId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return enrichComplaintWithOfficer(data);
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
    return enrichComplaintsWithOfficers(data || []);
  },

  // Get complaints by officer ID
  async getByOfficerId(officerId) {
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description)
      `)
      .eq('assigned_officer_id', officerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Get all complaints with filters
  async getAll(filters = {}) {
    let query = supabaseAdmin
      .from('complaints')
      .select(`
        *,
        category:categories(name, description)
      `);
    
    if (filters.status) {
      const { getDbStatusFilterValues } = require('./complaintStatus');
      const statusValues = getDbStatusFilterValues(filters.status);
      if (statusValues.length > 1) {
        query = query.in('status', statusValues);
      } else {
        query = query.eq('status', statusValues[0]);
      }
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
    return enrichComplaintsWithOfficers(data || []);
  },

  // Update complaint
  async updateById(id, updateData) {
    const { toDbStatus, getAlternateDbStatus } = require('./complaintStatus');
    const payload = { ...updateData };

    if (payload.status) {
      payload.status = toDbStatus(payload.status);
    }

    const runUpdate = async (data) =>
      supabaseAdmin
        .from('complaints')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          category:categories(name, description)
        `)
        .single();

    let { data, error } = await runUpdate(payload);

    if (error?.code === '23514' && payload.status) {
      const alternateStatus = getAlternateDbStatus(payload.status);
      if (alternateStatus) {
        ({ data, error } = await runUpdate({ ...payload, status: alternateStatus }));
      }
    }

    if (error) throw error;
    return enrichComplaintWithOfficer(data);
  },

  // Assign officer to complaint
  async assignOfficer(complaintId, officerId) {
    const officer = await profileOperations.findById(officerId);
    if (!officer || String(officer.role).trim().toLowerCase() !== 'officer') {
      const error = new Error('Selected user is not a valid officer');
      error.statusCode = 400;
      throw error;
    }

    return this.updateById(complaintId, {
      assigned_officer_id: officerId,
      status: 'under investigation',
    });
  },

  async unassignOfficer(complaintId) {
    return this.updateById(complaintId, {
      assigned_officer_id: null,
    });
  },

  // Update complaint status
  async updateStatus(complaintId, status) {
    return this.updateById(complaintId, { status });
  },

  // Get complaint statistics
  async getStatistics() {
    const { fromDbStatus } = require('./complaintStatus');
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
      const status = fromDbStatus(complaint.status);
      stats.by_status[status] = (stats.by_status[status] || 0) + 1;
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
  },

  async update(id, updateData) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
    return true;
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
        file_size: evidenceData.file_size,
        uploaded_by: evidenceData.uploaded_by || null,
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
      .order('created_at', { ascending: false });
    
    if (error) {
      if (error.code === 'PGRST205' || /evidence_files/i.test(error.message || '')) {
        const setupError = new Error(
          'Evidence table is not set up in Supabase. Run backend/supabase/create-evidence-table.sql in the SQL Editor.'
        );
        setupError.code = 'EVIDENCE_TABLE_MISSING';
        throw setupError;
      }
      throw error;
    }
    return data || [];
  },

  /**
   * Get evidence from DB; if empty/missing table, fall back to Supabase storage bucket.
   */
  async getForComplaint(complaint) {
    const { listFilesForUser } = require('./fileUpload');
    let dbFiles = [];
    let tableMissing = false;

    try {
      dbFiles = await this.getByComplaintId(complaint.id);
    } catch (err) {
      if (err.code === 'EVIDENCE_TABLE_MISSING') {
        tableMissing = true;
      } else {
        throw err;
      }
    }

    if (dbFiles.length > 0) {
      return { files: dbFiles, source: 'database', tableMissing: false };
    }

    const storageFiles = await listFilesForUser(complaint.user_id, complaint.id);
    const files = storageFiles.map((file) => ({
      id: file.file_path,
      complaint_id: complaint.id,
      file_path: file.file_path,
      file_name: file.file_name,
      file_type: file.file_type,
      file_size: file.file_size,
      created_at: file.created_at,
    }));

    return {
      files,
      source: storageFiles.length > 0 ? 'storage' : 'none',
      tableMissing,
    };
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
  }
};

// ============================================
// CONTACT MESSAGES OPERATIONS
// ============================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const LOCAL_CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contact_messages.json');

function getLocalContacts() {
  try {
    if (!fs.existsSync(path.dirname(LOCAL_CONTACTS_FILE))) {
      fs.mkdirSync(path.dirname(LOCAL_CONTACTS_FILE), { recursive: true });
    }
    if (!fs.existsSync(LOCAL_CONTACTS_FILE)) {
      fs.writeFileSync(LOCAL_CONTACTS_FILE, JSON.stringify([]));
      return [];
    }
    const raw = fs.readFileSync(LOCAL_CONTACTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    console.error('Error reading local contacts:', err);
    return [];
  }
}

function saveLocalContacts(contacts) {
  try {
    if (!fs.existsSync(path.dirname(LOCAL_CONTACTS_FILE))) {
      fs.mkdirSync(path.dirname(LOCAL_CONTACTS_FILE), { recursive: true });
    }
    fs.writeFileSync(LOCAL_CONTACTS_FILE, JSON.stringify(contacts, null, 2));
  } catch (err) {
    console.error('Error writing local contacts:', err);
  }
}

const contactOperations = {
  async create(msgData) {
    const record = {
      name: msgData.name,
      email: msgData.email.toLowerCase().trim(),
      phone: msgData.phone || null,
      subject: msgData.subject.trim(),
      message: msgData.message.trim(),
      status: 'new',
      is_read: false,
      ip_address: msgData.ip_address || null,
      user_agent: msgData.user_agent || null
    };

    try {
      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .insert([record])
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      throw error;
    } catch (dbErr) {
      console.warn('Falling back to local persistent store for contact message:', dbErr.message);
      const fallbackRecord = {
        id: crypto.randomUUID(),
        ...record,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      const all = getLocalContacts();
      all.unshift(fallbackRecord);
      saveLocalContacts(all);
      return fallbackRecord;
    }
  },

  async getAll(filters = {}) {
    try {
      let query = supabaseAdmin
        .from('contact_messages')
        .select('*');

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.is_read !== undefined && filters.is_read !== '') {
        query = query.eq('is_read', filters.is_read === true || filters.is_read === 'true');
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,subject.ilike.%${term}%,message.ilike.%${term}%`);
      }

      query = query.order('created_at', { ascending: false });

      if (filters.limit) {
        const offset = filters.offset || 0;
        query = query.range(offset, offset + filters.limit - 1);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data;
      }
      throw error;
    } catch (dbErr) {
      console.warn('Using local persistent store for contact_messages list:', dbErr.message);
      let list = getLocalContacts();
      if (filters.status && filters.status !== 'all') {
        list = list.filter(m => m.status === filters.status);
      }
      if (filters.is_read !== undefined && filters.is_read !== '') {
        const isReadBool = filters.is_read === true || filters.is_read === 'true';
        list = list.filter(m => m.is_read === isReadBool);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        list = list.filter(m => 
          (m.name || '').toLowerCase().includes(s) ||
          (m.email || '').toLowerCase().includes(s) ||
          (m.subject || '').toLowerCase().includes(s) ||
          (m.message || '').toLowerCase().includes(s)
        );
      }
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const offset = filters.offset || 0;
      const limit = filters.limit || 10;
      return list.slice(offset, offset + limit);
    }
  },

  async count(filters = {}) {
    try {
      let query = supabaseAdmin
        .from('contact_messages')
        .select('*', { count: 'exact', head: true });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.is_read !== undefined && filters.is_read !== '') {
        query = query.eq('is_read', filters.is_read === true || filters.is_read === 'true');
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,subject.ilike.%${term}%,message.ilike.%${term}%`);
      }

      const { count, error } = await query;
      if (!error && typeof count === 'number') {
        return count;
      }
      throw error;
    } catch (dbErr) {
      let list = getLocalContacts();
      if (filters.status && filters.status !== 'all') {
        list = list.filter(m => m.status === filters.status);
      }
      if (filters.is_read !== undefined && filters.is_read !== '') {
        const isReadBool = filters.is_read === true || filters.is_read === 'true';
        list = list.filter(m => m.is_read === isReadBool);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        list = list.filter(m => 
          (m.name || '').toLowerCase().includes(s) ||
          (m.email || '').toLowerCase().includes(s) ||
          (m.subject || '').toLowerCase().includes(s) ||
          (m.message || '').toLowerCase().includes(s)
        );
      }
      return list.length;
    }
  },

  async findById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return data;
      }
      throw error;
    } catch (dbErr) {
      const list = getLocalContacts();
      return list.find(m => m.id === id) || null;
    }
  },

  async updateById(id, updateData) {
    try {
      const payload = {
        ...updateData,
        updated_at: new Date().toISOString()
      };
      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return data;
      }
      throw error;
    } catch (dbErr) {
      const list = getLocalContacts();
      const index = list.findIndex(m => m.id === id);
      if (index !== -1) {
        list[index] = {
          ...list[index],
          ...updateData,
          updated_at: new Date().toISOString()
        };
        saveLocalContacts(list);
        return list[index];
      }
      return null;
    }
  },

  async deleteById(id) {
    try {
      const { error } = await supabaseAdmin
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (dbErr) {
      let list = getLocalContacts();
      list = list.filter(m => m.id !== id);
      saveLocalContacts(list);
      return true;
    }
  },

  async getStatistics() {
    try {
      const { data, error } = await supabaseAdmin
        .from('contact_messages')
        .select('status, is_read');

      if (!error && data) {
        return {
          total: data.length,
          new: data.filter(m => m.status === 'new').length,
          read: data.filter(m => m.status === 'read').length,
          replied: data.filter(m => m.status === 'replied').length,
          archived: data.filter(m => m.status === 'archived').length,
          unread: data.filter(m => !m.is_read).length
        };
      }
      throw error;
    } catch (dbErr) {
      const list = getLocalContacts();
      return {
        total: list.length,
        new: list.filter(m => m.status === 'new').length,
        read: list.filter(m => m.status === 'read').length,
        replied: list.filter(m => m.status === 'replied').length,
        archived: list.filter(m => m.status === 'archived').length,
        unread: list.filter(m => !m.is_read).length
      };
    }
  }
};

module.exports = {
  profileOperations,
  complaintOperations,
  categoryOperations,
  evidenceOperations,
  notificationOperations,
  auditLogOperations,
  contactOperations
};
