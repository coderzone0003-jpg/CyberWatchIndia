const express = require('express');
const router = express.Router();
const { contactOperations } = require('../utils/database');
const { auth, checkRole } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/security');
const { sendContactMessageNotification } = require('../utils/email');

/**
 * Sanitize user input to prevent XSS
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate contact message data
 */
function validateContactMessage(data) {
  const errors = [];
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }
  if (data.name && data.name.trim().length > 255) {
    errors.push('Name must be less than 255 characters');
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('A valid email address is required');
  }
  if (!data.subject || data.subject.trim().length < 3) {
    errors.push('Subject must be at least 3 characters long');
  }
  if (data.subject && data.subject.trim().length > 255) {
    errors.push('Subject must be less than 255 characters');
  }
  if (!data.message || data.message.trim().length < 10) {
    errors.push('Message must be at least 10 characters long');
  }
  if (data.message && data.message.trim().length > 5000) {
    errors.push('Message must be less than 5000 characters');
  }
  if (data.phone && data.phone.trim().length > 0) {
    const digits = data.phone.replace(/[^0-9]/g, '');
    if (digits.length < 7 || digits.length > 15) {
      errors.push('Phone number must be between 7 and 15 digits');
    }
  }
  return errors;
}

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// @route   POST /api/contact
// @desc    Submit a new contact message (public form)
// @access  Public
router.post('/', apiLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const errors = validateContactMessage({ name, email, phone, subject, message });
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors });
    }

    const msgData = {
      name: sanitizeInput(name.trim()),
      email: email.toLowerCase().trim(),
      phone: phone ? sanitizeInput(phone.trim()) : null,
      subject: sanitizeInput(subject.trim()),
      message: message.trim(),
      ip_address: req.ip || req.connection?.remoteAddress || null,
      user_agent: req.headers['user-agent'] || null
    };

    const created = await contactOperations.create(msgData);

    // Attempt admin notification in background (non-blocking)
    sendContactMessageNotification({
      name: msgData.name,
      email: msgData.email,
      phone: msgData.phone,
      subject: msgData.subject,
      message: msgData.message,
      createdAt: created.created_at
    }).catch(err => {
      console.warn('Failed to send contact message admin notification:', err.message);
    });

    res.status(201).json({
      message: 'Your message has been sent successfully. We will get back to you soon.',
      id: created.id
    });
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Failed to send your message. Please try again later.' });
  }
});

// ============================================
// ADMIN ROUTES (auth + admin role required)
// ============================================

// @route   GET /api/contact
// @desc    Get all contact messages (with filters, search, pagination)
// @access  Admin
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.is_read !== undefined) filters.is_read = req.query.is_read;
    if (req.query.search) filters.search = req.query.search;
    if (req.query.limit) filters.limit = parseInt(req.query.limit, 10) || 20;
    if (req.query.offset !== undefined) filters.offset = parseInt(req.query.offset, 10) || 0;

    const messages = await contactOperations.getAll(filters);
    const totalCount = await contactOperations.count(filters);

    res.json({
      messages,
      pagination: {
        total: totalCount,
        limit: filters.limit || totalCount,
        offset: filters.offset || 0
      }
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ message: 'Failed to fetch contact messages' });
  }
});

// @route   GET /api/contact/stats
// @desc    Get contact message statistics
// @access  Admin
router.get('/stats', auth, checkRole('admin'), async (req, res) => {
  try {
    const stats = await contactOperations.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Get contact stats error:', error);
    res.status(500).json({ message: 'Failed to fetch contact statistics' });
  }
});

// @route   GET /api/contact/:id
// @desc    Get a single contact message by ID (auto-marks as read)
// @access  Admin
router.get('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await contactOperations.findById(id);

    if (!msg) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    // Auto-mark as read if not already
    if (!msg.is_read) {
      await contactOperations.updateById(id, {
        is_read: true,
        read_at: new Date().toISOString(),
        status: msg.status === 'new' ? 'read' : msg.status
      });
      msg.is_read = true;
      msg.read_at = new Date().toISOString();
      if (msg.status === 'new') msg.status = 'read';
    }

    res.json(msg);
  } catch (error) {
    console.error('Get contact message error:', error);
    res.status(500).json({ message: 'Failed to fetch contact message' });
  }
});

// @route   PUT /api/contact/:id/status
// @desc    Update status of a contact message
// @access  Admin
router.put('/:id/status', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status value',
        validStatuses
      });
    }

    const msg = await contactOperations.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    const updatePayload = { status };
    if (status === 'read' && !msg.is_read) {
      updatePayload.is_read = true;
      updatePayload.read_at = new Date().toISOString();
    }

    const updated = await contactOperations.updateById(id, updatePayload);
    res.json({ message: 'Status updated successfully', data: updated });
  } catch (error) {
    console.error('Update contact status error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// @route   PUT /api/contact/:id/read
// @desc    Toggle read/unread status of a contact message
// @access  Admin
router.put('/:id/read', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const msg = await contactOperations.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    const newIsRead = !msg.is_read;
    const updatePayload = {
      is_read: newIsRead,
      read_at: newIsRead ? new Date().toISOString() : null
    };

    if (newIsRead && msg.status === 'new') {
      updatePayload.status = 'read';
    }

    const updated = await contactOperations.updateById(id, updatePayload);
    res.json({
      message: newIsRead ? 'Marked as read' : 'Marked as unread',
      data: updated
    });
  } catch (error) {
    console.error('Toggle read status error:', error);
    res.status(500).json({ message: 'Failed to toggle read status' });
  }
});

// @route   DELETE /api/contact/:id
// @desc    Delete a contact message
// @access  Admin
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const msg = await contactOperations.findById(id);
    if (!msg) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    await contactOperations.deleteById(id);
    res.json({ message: 'Contact message deleted successfully' });
  } catch (error) {
    console.error('Delete contact message error:', error);
    res.status(500).json({ message: 'Failed to delete contact message' });
  }
});

// @route   POST /api/contact/bulk
// @desc    Bulk update or delete contact messages
// @access  Admin
router.post('/bulk', auth, checkRole('admin'), async (req, res) => {
  try {
    const { ids, action } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of message IDs' });
    }

    if (!['delete', 'mark_read', 'archive'].includes(action)) {
      return res.status(400).json({
        message: 'Invalid action. Must be: delete, mark_read, or archive'
      });
    }

    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        if (action === 'delete') {
          await contactOperations.deleteById(id);
        } else if (action === 'mark_read') {
          await contactOperations.updateById(id, {
            is_read: true,
            read_at: new Date().toISOString(),
            status: 'read'
          });
        } else if (action === 'archive') {
          await contactOperations.updateById(id, { status: 'archived' });
        }
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Bulk action failed for ID ${id}:`, err.message);
      }
    }

    const actionLabels = {
      delete: 'deleted',
      mark_read: 'marked as read',
      archive: 'archived'
    };

    res.json({
      message: `${successCount} message(s) ${actionLabels[action]}` + (failCount > 0 ? `, ${failCount} failed` : ''),
      successCount,
      failCount
    });
  } catch (error) {
    console.error('Bulk action error:', error);
    res.status(500).json({ message: 'Failed to perform bulk action' });
  }
});

module.exports = router;
