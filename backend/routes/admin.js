const express = require('express');
const router = express.Router();
const { complaintOperations, profileOperations, categoryOperations, auditLogOperations } = require('../utils/database');
const { supabaseAdmin } = require('../config/supabase');
const { generatePDFReport, generateExcelReport } = require('../utils/export');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard data
// @access  Private (Admin only)
router.get('/dashboard', auth, checkRole('admin'), async (req, res) => {
  try {
    // Get complaint statistics
    const complaintStats = await complaintOperations.getStatistics();

    // Get user count
    const allUsers = await profileOperations.getAll();
    const userCount = allUsers.length;

    // Get recent complaints
    const recentComplaints = await complaintOperations.getAll({ limit: 10 });

    // Get category breakdown
    const categories = await categoryOperations.getAll();

    // Get recent activity from audit logs
    const recentActivity = await auditLogOperations.getAll({ limit: 5 });

    // Format recent activity
    const formattedActivity = recentActivity.map(log => {
      const actionMap = {
        'COMPLAINT_CREATED': `Complaint #${log.details?.tracking_id || 'N/A'} created`,
        'COMPLAINT_STATUS_UPDATED': `Complaint #${log.details?.tracking_id || 'N/A'} status updated`,
        'OFFICER_ASSIGNED': `Officer assigned to case #${log.details?.tracking_id || 'N/A'}`,
        'USER_REGISTERED': 'New user registered',
        'USER_LOGIN': 'User logged in',
        'ADMIN_LOGIN': 'Admin logged in'
      };
      return actionMap[log.action] || log.action;
    });

    // Calculate category statistics
    const categoryStats = [];
    if (complaintStats.by_category) {
      const total = Object.values(complaintStats.by_category).reduce((a, b) => a + b, 0) || 1;
      Object.entries(complaintStats.by_category).forEach(([name, count]) => {
        const categoryName = categories.find(c => c.id === name)?.name || name;
        categoryStats.push({
          name: categoryName,
          count,
          percent: Math.round((count / total) * 100)
        });
      });
    }

    // Sort by count and take top 5
    categoryStats.sort((a, b) => b.count - a.count);
    const topCategories = categoryStats.slice(0, 5);

    // Get today's complaints
    const today = new Date().toISOString().split('T')[0];
    const todayComplaints = await complaintOperations.getAll({
      filters: { created_at_gte: today }
    });

    res.json({
      total_complaints: complaintStats.total || 0,
      pending_complaints: complaintStats.by_status?.['pending'] || 0,
      investigation_complaints: complaintStats.by_status?.['under investigation'] || 0,
      resolved_complaints: complaintStats.by_status?.['resolved'] || 0,
      today_complaints: todayComplaints.length || 0,
      recent_activity: formattedActivity,
      category_stats: topCategories
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get comprehensive analytics reports
// @access  Private (Admin only)
router.get('/reports', auth, checkRole('admin'), async (req, res) => {
  try {
    const { start_date, end_date, category_id, status, officer_id } = req.query;

    // Get all complaints with filters
    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (status) filters.status = status;
    if (officer_id) filters.assigned_officer_id = officer_id;
    if (start_date) filters.created_at_gte = start_date;
    if (end_date) filters.created_at_lte = end_date;

    const complaints = await complaintOperations.getAll(filters);

    // Calculate statistics
    const stats = {
      total: complaints.length,
      by_status: {},
      by_category: {},
      by_severity: {},
      by_officer: {},
      by_date: {},
      timeline: []
    };

    // Count by status
    complaints.forEach(c => {
      stats.by_status[c.status] = (stats.by_status[c.status] || 0) + 1;
    });

    // Count by category
    complaints.forEach(c => {
      const categoryName = c.category?.name || 'Uncategorized';
      stats.by_category[categoryName] = (stats.by_category[categoryName] || 0) + 1;
    });

    // Count by severity
    complaints.forEach(c => {
      stats.by_severity[c.severity] = (stats.by_severity[c.severity] || 0) + 1;
    });

    // Count by officer
    complaints.forEach(c => {
      if (c.assigned_officer_id) {
        const officerName = c.officer_profile?.full_name || c.officer_profile?.name || 'Unknown';
        stats.by_officer[officerName] = (stats.by_officer[officerName] || 0) + 1;
      }
    });

    // Count by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    complaints.forEach(c => {
      const date = new Date(c.created_at).toISOString().split('T')[0];
      if (new Date(c.created_at) >= thirtyDaysAgo) {
        stats.by_date[date] = (stats.by_date[date] || 0) + 1;
      }
    });

    // Create timeline data
    Object.entries(stats.by_date)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([date, count]) => {
        stats.timeline.push({ date, count });
      });

    // Get user statistics
    const allUsers = await profileOperations.getAll();
    stats.total_users = allUsers.length;
    stats.active_users = allUsers.filter(u => u.is_active).length;
    stats.admin_users = allUsers.filter(u => u.role === 'admin').length;
    stats.officer_users = allUsers.filter(u => u.role === 'officer').length;

    // Get average resolution time (for resolved complaints)
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
    if (resolvedComplaints.length > 0) {
      const resolutionTimes = resolvedComplaints.map(c => {
        const created = new Date(c.created_at);
        const updated = new Date(c.updated_at);
        return Math.floor((updated - created) / (1000 * 60 * 60 * 24)); // days
      });
      const avgResolutionTime = resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length;
      stats.avg_resolution_days = Math.round(avgResolutionTime * 10) / 10;
    } else {
      stats.avg_resolution_days = 0;
    }

    // Add filter info to response
    stats.filters_applied = {
      start_date: start_date || null,
      end_date: end_date || null,
      category_id: category_id || null,
      status: status || null,
      officer_id: officer_id || null
    };

    res.json(stats);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error while fetching reports' });
  }
});

// @route   GET /api/admin/export/pdf
// @desc    Export complaints as PDF
// @access  Private (Admin only)
router.get('/export/pdf', auth, checkRole('admin'), async (req, res) => {
  try {
    const { start_date, end_date, category_id, status, officer_id } = req.query;

    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (status) filters.status = status;
    if (officer_id) filters.assigned_officer_id = officer_id;
    if (start_date) filters.created_at_gte = start_date;
    if (end_date) filters.created_at_lte = end_date;

    const pdfBuffer = await generatePDFReport(filters);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=complaints-report-${Date.now()}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Server error while generating PDF' });
  }
});

// @route   GET /api/admin/export/excel
// @desc    Export complaints as Excel
// @access  Private (Admin only)
router.get('/export/excel', auth, checkRole('admin'), async (req, res) => {
  try {
    const { start_date, end_date, category_id, status, officer_id } = req.query;

    const filters = {};
    if (category_id) filters.category_id = category_id;
    if (status) filters.status = status;
    if (officer_id) filters.assigned_officer_id = officer_id;
    if (start_date) filters.created_at_gte = start_date;
    if (end_date) filters.created_at_lte = end_date;

    const excelBuffer = await generateExcelReport(filters);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=complaints-report-${Date.now()}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Server error while generating Excel' });
  }
});

// @route   GET /api/admin/audit-logs
// @desc    Get audit logs with filtering
// @access  Private (Admin only)
router.get('/audit-logs', auth, checkRole('admin'), async (req, res) => {
  try {
    const { user_id, action, entity_type, start_date, end_date, search, limit = 50, offset = 0 } = req.query;

    const filters = {};
    if (user_id) filters.user_id = user_id;
    if (action) filters.action = action;
    if (entity_type) filters.entity_type = entity_type;
    if (start_date) filters.created_at_gte = start_date;
    if (end_date) filters.created_at_lte = end_date;
    if (search) filters.search = search;
    filters.limit = parseInt(limit);
    filters.offset = parseInt(offset);

    const logs = await auditLogOperations.getAll(filters);
    
    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    res.json({
      logs,
      pagination: {
        total: count || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Server error while fetching audit logs' });
  }
});

// @route   GET /api/admin/complaints
// @desc    Get all complaints for admin
// @access  Private (Admin only)
router.get('/complaints', auth, checkRole('admin'), async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);

    const complaints = await complaintOperations.getAll(filters);
    res.json(complaints);
  } catch (error) {
    console.error('Get admin complaints error:', error);
    res.status(500).json({ message: 'Server error while fetching complaints' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users for admin
// @access  Private (Admin only)
router.get('/users', auth, checkRole('admin'), async (req, res) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.is_active === 'true') filters.is_active = true;
    if (req.query.is_active === 'false') filters.is_active = false;

    const users = await profileOperations.getAll(filters);
    
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   PUT /api/admin/complaints/:id/status
// @desc    Update complaint status
// @access  Private (Admin only)
router.put('/complaints/:id/status', auth, checkRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Please provide status' });
    }

    const updatedComplaint = await complaintOperations.updateStatus(req.params.id, status);

    // Log the status update
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'COMPLAINT_STATUS_UPDATED',
      entity_type: 'complaint',
      entity_id: req.params.id,
      details: { new_status: status, updated_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Complaint status updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    const statusCode = error.code === '23514' ? 400 : 500;
    res.status(statusCode).json({
      message:
        error.code === '23514'
          ? 'Invalid status value for this database. Allowed: pending, under investigation, resolved, rejected.'
          : 'Server error while updating complaint status',
    });
  }
});

// @route   PUT /api/admin/complaints/:id/assign
// @desc    Assign officer to complaint
// @access  Private (Admin only)
router.put('/complaints/:id/assign', auth, checkRole('admin'), async (req, res) => {
  try {
    const officerId = req.body?.officer_id || req.body?.officerId;

    if (!officerId) {
      return res.status(400).json({ message: 'Please select an officer to assign' });
    }

    const complaint = await complaintOperations.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const updatedComplaint = await complaintOperations.assignOfficer(req.params.id, officerId);

    try {
      await auditLogOperations.create({
        user_id: req.user.userId,
        action: 'OFFICER_ASSIGNED',
        entity_type: 'complaint',
        entity_id: req.params.id,
        details: {
          officer_id: officerId,
          tracking_id: updatedComplaint.tracking_id,
          assigned_by: req.user.email,
        },
        ip_address: req.ip,
        user_agent: req.get('user-agent'),
      });
    } catch (auditError) {
      console.warn('Audit log failed for officer assignment:', auditError.message);
    }

    res.json({
      message: 'Officer assigned successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Assign officer error:', error);
    const statusCode = error.statusCode || (error.code === '23514' ? 400 : 500);
    res.status(statusCode).json({
      message:
        error.code === '23514'
          ? 'Invalid complaint status for this database. Please run the status migration SQL or contact support.'
          : error.message || 'Server error while assigning officer',
    });
  }
});

router.put('/complaints/:id/unassign', auth, checkRole('admin'), async (req, res) => {
  try {
    const complaint = await complaintOperations.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const updatedComplaint = await complaintOperations.unassignOfficer(req.params.id);

    res.json({
      message: 'Officer unassigned successfully',
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error('Unassign officer error:', error);
    res.status(500).json({ message: error.message || 'Server error while unassigning officer' });
  }
});

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Private (Admin only)
router.get('/categories', auth, checkRole('admin'), async (req, res) => {
  try {
    const categories = await categoryOperations.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   POST /api/admin/categories
// @desc    Create new category
// @access  Private (Admin only)
router.post('/categories', auth, checkRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide category name' });
    }

    const newCategory = await categoryOperations.create({ name, description });

    // Log the category creation
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'CATEGORY_CREATED',
      entity_type: 'category',
      entity_id: newCategory.id,
      details: { name, created_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error while creating category' });
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/categories/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Please provide category name' });
    }

    const updatedCategory = await categoryOperations.update(req.params.id, { name, description });

    // Log the category update
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'CATEGORY_UPDATED',
      entity_type: 'category',
      entity_id: req.params.id,
      details: { name, updated_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error while updating category' });
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/categories/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const category = await categoryOperations.getById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await categoryOperations.delete(req.params.id);

    // Log the category deletion
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'CATEGORY_DELETED',
      entity_type: 'category',
      entity_id: req.params.id,
      details: { category_name: category.name, deleted_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error while deleting category' });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user active status
// @access  Private (Admin only)
router.put('/users/:id/status', auth, checkRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (typeof status !== 'boolean') {
      return res.status(400).json({ message: 'Please provide valid status (true/false)' });
    }

    const updatedUser = await profileOperations.update(req.params.id, { is_active: status });

    // Log the status update
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'USER_STATUS_UPDATED',
      entity_type: 'user',
      entity_id: req.params.id,
      details: { new_status: status, updated_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'User status updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/users/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    // Prevent deleting admins
    const user = await profileOperations.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    await profileOperations.update(req.params.id, { is_active: false });

    // Log the deletion
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'USER_DELETED',
      entity_type: 'user',
      entity_id: req.params.id,
      details: { deleted_user_email: user.email, deleted_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

// @route   GET /api/admin/officers
// @desc    Get all officers with workload
// @access  Private (Admin only)
router.get('/officers', auth, checkRole('admin'), async (req, res) => {
  try {
    const officers = await profileOperations.getAll({ role: 'officer', is_active: true });
    
    // Get workload for each officer
    const officersWithWorkload = await Promise.all(
      officers.map(async (officer) => {
        const { complaintOperations } = require('../utils/database');
        const assignedComplaints = await complaintOperations.getAll({
          assigned_officer_id: officer.id
        });
        
        // Calculate workload breakdown
        const workload = {
          total: assignedComplaints.length,
          pending: assignedComplaints.filter(c => c.status === 'pending').length,
          investigation: assignedComplaints.filter(c => {
            const s = String(c.status || '').toLowerCase();
            return s === 'under investigation' || s === 'investigating';
          }).length,
          resolved: assignedComplaints.filter(c => c.status === 'resolved').length
        };
        
        // Remove password from response
        const { password, ...officerWithoutPassword } = officer;
        
        return {
          ...officerWithoutPassword,
          workload
        };
      })
    );

    res.json(officersWithWorkload);
  } catch (error) {
    console.error('Get officers error:', error);
    res.status(500).json({ message: 'Server error while fetching officers' });
  }
});

// @route   POST /api/admin/officers
// @desc    Create new officer
// @access  Private (Admin only)
router.post('/officers', auth, checkRole('admin'), async (req, res) => {
  try {
    const { name, email, password, specialization, badge_number } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Step 1: Check if officer already exists in Supabase Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingAuthUser) {
      return res.status(409).json({ message: 'Officer with this email already exists' });
    }

    // Also check profiles table just to be safe
    const existingProfile = await profileOperations.findByEmail(email);
    if (existingProfile) {
      return res.status(409).json({ message: 'Officer with this email already exists' });
    }

    // Step 2: Create officer in Supabase Auth (this handles password + auth)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: 'officer'
      }
    });

    if (createError) {
      console.error('Supabase create officer auth error:', createError);
      return res.status(500).json({ 
        message: createError.message || 'Failed to create officer account' 
      });
    }

    // Wait for DB trigger (on_auth_user_created) to auto-create the profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Update the auto-created profile with officer-specific fields (role, specialization, badge_number)
    const { data: updatedProfile, error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: name,
        role: 'officer',
        specialization: specialization || null,
        badge_number: badge_number || null,
        is_active: true
      })
      .eq('id', newUser.user.id)
      .select()
      .single();

    // If trigger didn't create profile, create it manually
    let finalProfile = updatedProfile;
    if (profileUpdateError || !updatedProfile) {
      console.warn('Profile trigger may have missed, creating profile manually...');
      const { data: manualProfile, error: manualError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: newUser.user.id,
          full_name: name,
          email: email,
          role: 'officer',
          specialization: specialization || null,
          badge_number: badge_number || null,
          is_active: true
        })
        .select()
        .single();

      if (manualError) throw manualError;
      finalProfile = manualProfile;
    }

    // Log the officer creation
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'OFFICER_CREATED',
      entity_type: 'user',
      entity_id: newUser.user.id,
      details: { 
        officer_name: name, 
        officer_email: email,
        created_by: req.user.email 
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    const { password: _, ...officerWithoutPassword } = finalProfile;

    res.status(201).json({
      message: 'Officer created successfully',
      officer: officerWithoutPassword
    });
  } catch (error) {
    console.error('Create officer error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error while creating officer' 
    });
  }
});

// @route   DELETE /api/admin/officers/:id
// @desc    Delete officer (soft delete + disable in Supabase Auth)
// @access  Private (Admin only)
router.delete('/officers/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const officer = await profileOperations.findById(req.params.id);
    if (!officer) {
      return res.status(404).json({ message: 'Officer not found' });
    }

    if (officer.role !== 'officer') {
      return res.status(400).json({ message: 'User is not an officer' });
    }

    // Soft delete in profiles table
    await profileOperations.update(req.params.id, { is_active: false });

    // Also disable the user in Supabase Auth so they can't log in
    try {
      await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
        ban_duration: 'indefinite'
      });
    } catch (authError) {
      console.warn('Could not disable officer in Supabase Auth (may have been already deleted):', authError.message);
    }

    // Log the deletion
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'OFFICER_DELETED',
      entity_type: 'user',
      entity_id: req.params.id,
      details: { 
        officer_name: officer.full_name || officer.name, 
        officer_email: officer.email,
        deleted_by: req.user.email 
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({
      message: 'Officer deleted successfully'
    });
  } catch (error) {
    console.error('Delete officer error:', error);
    res.status(500).json({ message: 'Server error while deleting officer' });
  }
});

module.exports = router;
