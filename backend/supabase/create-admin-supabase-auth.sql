-- ============================================
-- CREATE ADMIN USER (Supabase Auth)
-- Step 6: Admin user creation
-- ============================================

-- Option 1: Create admin via Supabase Dashboard (Recommended)
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add user"
-- 3. Enter email: coderzone0003@gmail.com
-- 4. Enter password: Coderzone@0003
-- 5. Click "Auto Confirm User" (so they don't need email verification)
-- 6. The trigger will auto-create the profile row

-- Option 2: Create admin via SQL (for automation)
-- Note: This is for reference - Supabase doesn't allow direct INSERT into auth.users via SQL
-- You must use the Dashboard or Supabase Auth API

-- ============================================
-- UPDATE EXISTING USER TO ADMIN ROLE
-- ============================================

-- After creating the user via Dashboard, update their role to admin:
UPDATE profiles
SET role = 'admin',
    full_name = 'System Administrator'
WHERE email = 'coderzone0003@gmail.com';

-- Verify the admin user
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.is_active,
    u.email AS auth_email,
    u.email_confirmed_at,
    u.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.email = 'coderzone0003@gmail.com';

-- ============================================
-- Alternative: Create admin using Supabase client
-- ============================================

-- If you want to create admin programmatically, use the Supabase client:
-- supabase.auth.signUp({
--   email: 'coderzone0003@gmail.com',
--   password: 'Coderzone@0003',
--   options: {
--     data: {
--       full_name: 'System Administrator',
--       role: 'admin'
--     },
--     emailRedirectTo: 'http://localhost:3000',
--     noAutoConfirm: false // Auto-confirm the user
--   }
-- })

-- The trigger will automatically create the profile with the role from metadata
