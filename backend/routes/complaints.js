const express = require('express');
const router = express.Router();
const { complaintOperations, categoryOperations, auditLogOperations, evidenceOperations, notificationOperations, profileOperations } = require('../utils/database');
const { supabaseAdmin } = require('../config/supabase');
const { sendComplaintConfirmation, sendStatusUpdate, sendOfficerAssignment } = require('../utils/email');
const { auth, isAdminOrOfficer } = require('../middleware/auth');
const { validateComplaint, sanitizeString } = require('../utils/validation');
const { uploadMultiple, uploadFile, deleteFile } = require('../utils/fileUpload');
const { complaintLimiter, apiLimiter } = require('../middleware/security');
const { handleValidationErrors, validationRules, sanitizeRequest } = require('../middleware/validation');

async function canAccessComplaint(user, complaint) {
  if (!complaint || !user) return false;
  if (complaint.user_id === user.userId) return true;

  const profile = await profileOperations.findById(user.userId);
  const role = String(profile?.role || '').toLowerCase();
  return role === 'admin' || role === 'officer';
}

// @route   GET /api/complaints/my
// @desc    Get current user's complaints with pagination and filtering
// @access  Private
router.get('/my', auth, async (req, res) => {
  try {
    const filters = { user_id: req.user.userId };

    // Apply filters
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    if (req.query.offset) filters.offset = parseInt(req.query.offset);

    const complaints = await complaintOperations.getAll(filters);

    // Get total count for pagination
    const allComplaints = await complaintOperations.getAll({ user_id: req.user.userId });
    const totalCount = allComplaints.length;

    res.json({
      complaints,
      pagination: {
        total: totalCount,
        limit: filters.limit || totalCount,
        offset: filters.offset || 0
      }
    });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ message: 'Server error while fetching complaints' });
  }
});

// @route   GET /api/complaints/my/statistics
// @desc    Get current user's complaint statistics
// @access  Private
router.get('/my/statistics', auth, async (req, res) => {
  try {
    const complaints = (await complaintOperations.getByUserId(req.user.userId)) || [];
    const { isInvestigationStatus } = require('../utils/complaintStatus');

    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      under_investigation: complaints.filter(c => isInvestigationStatus(c.status)).length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      rejected: complaints.filter(c => c.status === 'rejected').length,
      recent: complaints.slice(0, 5)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      message: 'Server error while fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/complaints/number/:trackingId
// @desc    Get complaint by tracking ID (public tracking)
// @access  Public
router.get('/number/:trackingId', async (req, res) => {
  try {
    const complaint = await complaintOperations.findByTrackingId(req.params.trackingId);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Return limited information for public tracking
    res.json({
      id: complaint.id,
      tracking_id: complaint.tracking_id,
      title: complaint.title,
      status: complaint.status,
      category: complaint.category?.name,
      created_at: complaint.created_at,
      updated_at: complaint.updated_at,
      officer: complaint.officer
        ? {
            full_name: complaint.officer.full_name,
            badge_number: complaint.officer.badge_number,
            specialization: complaint.officer.specialization,
          }
        : null,
    });
  } catch (error) {
    console.error('Get complaint by number error:', error);
    res.status(500).json({ message: 'Server error while fetching complaint' });
  }
});

// @route   GET /api/complaints/categories
// @desc    Get all complaint categories (public)
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await categoryOperations.getAll();
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/complaints
// @desc    Get all complaints (with filters and search)
// @access  Private (Admin/Officer)
router.get('/', auth, isAdminOrOfficer, async (req, res) => {
  try {
    const filters = {};
    
    // Admin can see all complaints, officers only their assigned ones
    if (req.user.role === 'officer') {
      // You would need to get the officer ID from the user ID
      // For now, we'll allow officers to see all (modify as needed)
    }
    
    if (req.query.status) filters.status = req.query.status;
    if (req.query.category_id) filters.category_id = req.query.category_id;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.limit) filters.limit = parseInt(req.query.limit);
    
    // Search functionality
    if (req.query.search) {
      // This would require custom SQL query for full-text search
      // For now, we'll filter in the response
    }

    const complaints = await complaintOperations.getAll(filters);
    
    // Apply search filter if provided
    let filteredComplaints = complaints;
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredComplaints = complaints.filter(c =>
        c.title.toLowerCase().includes(searchTerm) ||
        c.description.toLowerCase().includes(searchTerm) ||
        c.tracking_id.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json(filteredComplaints);
  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({ message: 'Server error while fetching complaints' });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get complaint by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const complaint = await complaintOperations.findById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user has permission to view this complaint
    const isOwner = complaint.user_id === req.user.userId;
    if (!isOwner) {
      const profile = await profileOperations.findById(req.user.userId);
      const role = String(profile?.role || '').toLowerCase();
      if (role !== 'admin' && role !== 'officer') {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(complaint);
  } catch (error) {
    console.error('Get complaint error:', error);
    res.status(500).json({ message: 'Server error while fetching complaint' });
  }
});

// @route   POST /api/complaints
// @desc    Create new complaint with file upload
// @access  Private
router.post('/', auth, complaintLimiter, uploadMultiple, sanitizeRequest, validationRules.complaint, handleValidationErrors, async (req, res) => {
  try {
    const { title, description, category_id, severity, location, incident_date } = req.body;

    // Sanitize inputs
    const sanitizedData = {
      title: sanitizeString(title),
      description: sanitizeString(description),
      category_id,
      severity: severity || 'medium',
      location: location ? sanitizeString(location) : null,
      incident_date
    };

    // Validate input
    const validation = validateComplaint(sanitizedData);
    if (!validation.valid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    // Verify category exists
    const category = await categoryOperations.getById(category_id);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Handle file uploads if present
    const uploadedFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadedFile = await uploadFile(file, req.user.userId);
          uploadedFiles.push(uploadedFile);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          // Continue with other files even if one fails
        }
      }
    }

    // Create complaint
    const newComplaint = await complaintOperations.create({
      title: sanitizedData.title,
      description: sanitizedData.description,
      category_id: sanitizedData.category_id,
      severity: sanitizedData.severity,
      user_id: req.user.userId,
      location: sanitizedData.location,
      incident_date: sanitizedData.incident_date
    });

    // Create evidence records for uploaded files
    if (uploadedFiles.length > 0) {
      for (const file of uploadedFiles) {
        try {
          await evidenceOperations.create({
            complaint_id: newComplaint.id,
            file_path: file.path,
            file_name: file.filename,
            file_type: file.mimeType,
            file_size: file.size
          });
        } catch (evidenceError) {
          console.error('Error saving evidence record, skipping:', evidenceError);
        }
      }
    }

    // Log the complaint creation
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'COMPLAINT_CREATED',
      entity_type: 'complaint',
      entity_id: newComplaint.id,
      details: {
        tracking_id: newComplaint.tracking_id,
        title: newComplaint.title,
        evidence_count: uploadedFiles.length
      },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Create notification for the user
    await notificationOperations.create({
      user_id: req.user.userId,
      title: 'Complaint Submitted Successfully',
      message: `Your complaint ${newComplaint.tracking_id} has been submitted successfully. You can track its status using this ID.`,
      type: 'success',
      related_complaint_id: newComplaint.id
    });

    // Send confirmation email
    try {
      await sendComplaintConfirmation({
        to: req.user.email,
        trackingId: newComplaint.tracking_id,
        title: newComplaint.title,
        userName: req.user.name || 'User'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the request if email fails
    }

    // Notify all admins about new complaint
    // (In a real system, you'd fetch admin user IDs and create notifications for them)
    // For now, we'll skip this as it requires admin user management

    res.status(201).json({
      message: 'Complaint created successfully',
      complaint: {
        ...newComplaint,
        evidence_count: uploadedFiles.length,
        evidence_files: uploadedFiles.map(f => ({
          filename: f.filename,
          url: f.url,
          size: f.size
        }))
      }
    });
  } catch (error) {
    console.error('Create complaint error:', error);
    
    // Handle specific database errors
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ 
        message: 'Invalid category or user reference',
        field: 'category_id'
      });
    }
    
    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ 
        message: 'Missing required field',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({ 
      message: 'Server error while creating complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/complaints/:id
// @desc    Update complaint
// @access  Private (Admin/Officer)
router.put('/:id', auth, async (req, res) => {
  try {
    const { status, severity, assigned_officer_id } = req.body;

    // Check permissions
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (severity) updateData.severity = severity;
    if (assigned_officer_id) updateData.assigned_officer_id = assigned_officer_id;

    const updatedComplaint = await complaintOperations.updateById(req.params.id, updateData);

    // Log the update
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'COMPLAINT_UPDATED',
      entity_type: 'complaint',
      entity_id: req.params.id,
      details: updateData,
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Notify user if status changed
    if (status && status !== updatedComplaint.status) {
      await notificationOperations.create({
        user_id: updatedComplaint.user_id,
        title: 'Complaint Status Updated',
        message: `Your complaint ${updatedComplaint.tracking_id} status has been updated to: ${status}`,
        type: 'info',
        related_complaint_id: updatedComplaint.id
      });

      // Send status update email
      try {
        // Get user email for notification
        const user = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', updatedComplaint.user_id)
          .single();

        if (user) {
          await sendStatusUpdate({
            to: user.email,
            trackingId: updatedComplaint.tracking_id,
            title: updatedComplaint.title,
            newStatus: status,
            oldStatus: updatedComplaint.status
          });
        }
      } catch (emailError) {
        console.error('Status update email failed:', emailError);
      }
    }

    // Notify officer if assigned
    if (assigned_officer_id && assigned_officer_id !== updatedComplaint.assigned_officer_id) {
      await notificationOperations.create({
        user_id: assigned_officer_id,
        title: 'New Complaint Assigned',
        message: `You have been assigned to complaint ${updatedComplaint.tracking_id}: ${updatedComplaint.title}`,
        type: 'info',
        related_complaint_id: updatedComplaint.id
      });

      // Send assignment email
      try {
        const officer = await supabaseAdmin
          .from('profiles')
          .select('email, full_name')
          .eq('id', assigned_officer_id)
          .single();

        if (officer) {
          await sendOfficerAssignment({
            to: officer.email,
            trackingId: updatedComplaint.tracking_id,
            title: updatedComplaint.title,
            officerName: officer.full_name || 'Officer'
          });
        }
      } catch (emailError) {
        console.error('Officer assignment email failed:', emailError);
      }
    }

    res.json({
      message: 'Complaint updated successfully',
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Update complaint error:', error);
    res.status(500).json({ message: 'Server error while updating complaint' });
  }
});

// @route   DELETE /api/complaints/:id
// @desc    Delete complaint
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // In PostgreSQL, we would typically soft delete by updating status
    await complaintOperations.updateById(req.params.id, { status: 'closed' });

    // Log the deletion
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'COMPLAINT_DELETED',
      entity_type: 'complaint',
      entity_id: req.params.id,
      details: { deleted_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Server error while deleting complaint' });
  }
});

// @route   GET /api/complaints/:id/evidence
// @desc    Get all evidence files for a complaint
// @access  Private
router.get('/:id/evidence', auth, async (req, res) => {
  try {
    const complaint = await complaintOperations.getById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if user has access to this complaint
    if (!(await canAccessComplaint(req.user, complaint))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const { files: evidence, source, tableMissing } = await evidenceOperations.getForComplaint(complaint);
    
    // Generate signed URLs for each file
    const { getSignedUrl } = require('../utils/fileUpload');
    const evidenceWithUrls = await Promise.all(
      evidence.map(async (file) => {
        try {
          const signedUrl = await getSignedUrl(file.file_path, 3600); // 1 hour expiry
          return {
            ...file,
            signed_url: signedUrl
          };
        } catch (error) {
          console.error('Error generating signed URL:', error);
          return {
            ...file,
            signed_url: null
          };
        }
      })
    );
    
    res.json({
      evidence: evidenceWithUrls,
      source,
      table_missing: tableMissing,
      message: tableMissing
        ? 'Showing files from Supabase storage bucket. Run create-evidence-table.sql and npm run sync-evidence for full tracking.'
        : undefined,
    });
  } catch (error) {
    console.error('Get evidence error:', error);

    if (error.code === 'EVIDENCE_TABLE_MISSING') {
      return res.status(503).json({
        message: error.message,
        evidence: [],
        setup_required: true,
      });
    }

    res.status(500).json({
      message: 'Server error while fetching evidence',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// @route   DELETE /api/complaints/:id/evidence/:evidenceId
// @desc    Delete an evidence file
// @access  Private (Admin or file owner)
router.delete('/:id/evidence/:evidenceId', auth, async (req, res) => {
  try {
    const complaint = await complaintOperations.getById(req.params.id);
    
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }
    
    // Check if user has access
    if (!(await canAccessComplaint(req.user, complaint))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await evidenceOperations.deleteById(req.params.evidenceId);
    
    // Log the deletion
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'EVIDENCE_DELETED',
      entity_type: 'evidence',
      entity_id: req.params.evidenceId,
      details: { complaint_id: req.params.id },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });
    
    res.json({ message: 'Evidence deleted successfully' });
  } catch (error) {
    console.error('Delete evidence error:', error);
    res.status(500).json({ message: 'Server error while deleting evidence' });
  }
});

module.exports = router;
