const express = require('express');
const router = express.Router();
const { profileOperations, auditLogOperations } = require('../utils/database');
const { sanitizeUser, passwordRequirements } = require('../utils/validation');
const { authLimiter } = require('../middleware/security');
const { supabaseAdmin } = require('../config/supabase');
const { auth } = require('../middleware/auth');

// @route   GET /api/auth/password-requirements
// @desc    Get password requirements for frontend validation
// @access  Public
router.get('/password-requirements', (req, res) => {
  res.json({
    requirements: passwordRequirements
  });
});

// @route   GET /api/auth/me
// @desc    Get current user profile with role
// @access  Private (verified by Supabase auth middleware)
router.get('/me', auth, async (req, res) => {
  try {
    // First try finding profile by Supabase Auth user ID
    let profile = await profileOperations.findById(req.user.userId);
    
    // If not found by ID, try finding by email (handles admin created via script)
    if (!profile && req.user.email) {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', req.user.email)
        .single();
      
      if (!error && data) {
        profile = data;
        
        // Link this profile to the Supabase Auth user for future lookups
        // by updating the profile's id to match the auth user's id
        try {
          await supabaseAdmin
            .from('profiles')
            .update({ id: req.user.userId })
            .eq('email', req.user.email);
          profile.id = req.user.userId;
        } catch (linkError) {
          console.warn('Could not link profile to auth user:', linkError.message);
          // Continue anyway — profile was still found
        }
      }
    }
    
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ 
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        is_active: profile.is_active,
        specialization: profile.specialization,
        badge_number: profile.badge_number
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      message: 'Server error while fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Trigger Supabase password reset email
// @access  Public
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Use Supabase's built-in password reset
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
    });

    if (error) {
      console.error('Password reset error:', error);
      // Don't reveal if email exists for security
      return res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    }

    res.json({ 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      message: 'Server error during password reset request',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Update password using Supabase (user must be logged in)
// @access  Private
router.post('/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    // Update password using Supabase
    const { data, error } = await supabaseAdmin.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error('Password update error:', error);
      return res.status(400).json({ 
        message: error.message || 'Failed to update password' 
      });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      message: 'Server error during password update',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify email using Supabase token
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Verify email using Supabase
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token,
      type: 'email'
    });

    if (error) {
      console.error('Email verification error:', error);
      return res.status(400).json({ 
        message: error.message || 'Invalid or expired verification token' 
      });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ 
      message: 'Server error during email verification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email using Supabase
// @access  Private
router.post('/resend-verification', auth, async (req, res) => {
  try {
    // Resend verification email using Supabase
    const { data, error } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: req.user.email,
    });

    if (error) {
      console.error('Resend verification error:', error);
      return res.status(400).json({ 
        message: error.message || 'Failed to resend verification email' 
      });
    }

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      message: 'Server error while sending verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
