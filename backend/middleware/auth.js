const { supabaseAdmin } = require('../config/supabase');

/**
 * Supabase Auth Middleware
 * Verifies Supabase JWT token from Authorization header
 */
const auth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        message: 'No authorization token provided',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      emailVerified: user.email_confirmed_at
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ 
      message: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Role-based access control middleware
 * Checks if user has required role from profiles table
 */
const checkRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get user's profile to check role
      const { supabaseAdmin } = require('../config/supabase');
      
      // First try by Supabase Auth user ID
      let { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('role, is_active')
        .eq('id', req.user.userId)
        .single();

      // If not found by ID, fall back to email lookup (handles admin created via script)
      if ((error || !profile) && req.user.email) {
        const result = await supabaseAdmin
          .from('profiles')
          .select('role, is_active')
          .eq('email', req.user.email)
          .single();
        
        if (!result.error && result.data) {
          profile = result.data;
          error = null;
        }
      }

      if (error || !profile) {
        return res.status(404).json({ 
          message: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      if (!profile.is_active) {
        return res.status(403).json({ 
          message: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      let role = String(profile.role).trim().toLowerCase();

      if (process.env.NODE_ENV !== 'production' && req.user.email) {
        const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
        const userEmail = req.user.email.trim().toLowerCase();

        if (adminEmail && userEmail === adminEmail && role !== 'admin') {
          let updatedProfile = null;
          let updateError = null;

          ({ data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: 'admin', is_active: true })
            .eq('id', req.user.userId)
            .select('role')
            .maybeSingle());

          if (updateError || !updatedProfile) {
            ({ data: updatedProfile, error: updateError } = await supabaseAdmin
              .from('profiles')
              .update({ role: 'admin', is_active: true })
              .eq('email', userEmail)
              .select('role')
              .maybeSingle());
          }

          if (!updateError && updatedProfile) {
            role = 'admin';
          }
        }
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ 
          message: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required_roles: allowedRoles,
          current_role: role
        });
      }

      // Attach role to request
      req.user.role = role;
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ 
        message: 'Error checking user role',
        code: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

// Helper middleware for admin/officer access
const isAdminOrOfficer = checkRole('admin', 'officer');

// Helper middleware for admin only
const isAdmin = checkRole('admin');

module.exports = {
  auth,
  checkRole,
  isAdminOrOfficer,
  isAdmin
};
