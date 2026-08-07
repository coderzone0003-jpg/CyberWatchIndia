const express = require('express');
const router = express.Router();
const { profileOperations, auditLogOperations } = require('../utils/database');
const { auth, checkRole } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin only)
router.get('/', auth, checkRole('admin'), async (req, res) => {
  try {
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

    const users = await profileOperations.getAll(filters);
    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await profileOperations.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions - users can only view their own profile
    if (req.user.role === 'user' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error while fetching user' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    // Password update should be handled separately with proper validation
    if (password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Check permissions - users can only update their own profile
    if (req.user.role === 'user' && req.user.userId !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedUser = await profileOperations.updateById(req.params.id, updateData);

    // Log the update
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'USER_UPDATED',
      entity_type: 'user',
      entity_id: req.params.id,
      details: { updated_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    res.json({
      message: 'User updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error while updating user' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Private (Admin only)
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
  try {
    await profileOperations.softDeleteById(req.params.id);

    // Log the deletion
    await auditLogOperations.create({
      user_id: req.user.userId,
      action: 'USER_DELETED',
      entity_type: 'user',
      entity_id: req.params.id,
      details: { deleted_by: req.user.email },
      ip_address: req.ip,
      user_agent: req.get('user-agent')
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

module.exports = router;
