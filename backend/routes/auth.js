const express = require('express');
const router = express.Router();
const { profileOperations, auditLogOperations } = require('../utils/database');
const { sanitizeUser, passwordRequirements } = require('../utils/validation');
const { authLimiter } = require('../middleware/security');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { auth } = require('../middleware/auth');

async function getProfileForUser(userId, email) {
  let profile = await profileOperations.findById(userId);

  if (!profile && email) {
    const normalizedEmail = email.trim().toLowerCase();
    profile = await profileOperations.findByEmail(normalizedEmail);

    if (profile) {
      try {
        await supabaseAdmin
          .from('profiles')
          .update({ id: userId })
          .eq('email', normalizedEmail);
        profile.id = userId;
      } catch (linkError) {
        console.warn('Could not link profile to auth user:', linkError.message);
      }
    }
  }

  if (profile && process.env.NODE_ENV !== 'production') {
    const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const userEmail = (email || profile.email || '').trim().toLowerCase();

    if (adminEmail && userEmail === adminEmail && String(profile.role).trim().toLowerCase() !== 'admin') {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin', is_active: true })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data) {
        profile = data;
      }
    }
  }

  return profile;
}

const formatProfileResponse = (profile) => ({
  id: profile.id,
  full_name: profile.full_name,
  email: profile.email,
  phone: profile.phone,
  role: profile.role,
  is_active: profile.is_active,
  specialization: profile.specialization,
  badge_number: profile.badge_number,
});

// @route   POST /api/auth/login
// @desc    Login with email and password via Supabase
// @access  Public
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (error || !data.session) {
      console.error('Login failed:', error?.message || 'No session returned');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

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
    const profile = await getProfileForUser(req.user.userId, req.user.email);

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ user: formatProfileResponse(profile) });
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
