-- ============================================
-- MIGRATION TO SUPABASE AUTH
-- Step 1: Check existing data
-- ============================================

-- Check if users table exists and has data
SELECT COUNT(*) as user_count FROM users;

-- View existing users (if any)
SELECT id, name, email, role, is_active, created_at FROM users;

-- Check if any complaints reference users
SELECT COUNT(*) as complaint_count FROM complaints WHERE user_id IS NOT NULL;

-- Check if any notifications reference users
SELECT COUNT(*) as notification_count FROM notifications WHERE user_id IS NOT NULL;
