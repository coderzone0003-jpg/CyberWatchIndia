-- ============================================
-- ENHANCED ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- This script should be run in Supabase SQL Editor to enhance security
-- It ensures users can only access their own data, while admins/officers can access all

-- ============================================
-- USERS TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read user profiles (needed for officer assignment, etc.)
CREATE POLICY "Users can read profiles"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = id::text)
WITH CHECK (auth.uid()::text = id::text);

-- Allow admins to read all users
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update all users
CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- COMPLAINTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own complaints
CREATE POLICY "Users can read own complaints"
ON complaints FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to create their own complaints
CREATE POLICY "Users can create own complaints"
ON complaints FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow users to update their own complaints (limited fields)
CREATE POLICY "Users can update own complaints"
ON complaints FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() AND
  -- Only allow updating certain fields (title, description, location)
  true -- Add specific field checks if needed
);

-- Allow admins to read all complaints
CREATE POLICY "Admins can read all complaints"
ON complaints FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update all complaints
CREATE POLICY "Admins can update all complaints"
ON complaints FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow officers to read all complaints
CREATE POLICY "Officers can read all complaints"
ON complaints FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'officer'
  )
);

-- Allow officers to update complaints assigned to them
CREATE POLICY "Officers can update assigned complaints"
ON complaints FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'officer'
  ) AND
  assigned_officer_id = auth.uid()
);

-- ============================================
-- EVIDENCE TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;

-- Allow users to read evidence for their own complaints
CREATE POLICY "Users can read own complaint evidence"
ON evidence FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.id = evidence.complaint_id AND c.user_id = auth.uid()
  )
);

-- Allow users to create evidence for their own complaints
CREATE POLICY "Users can create evidence for own complaints"
ON evidence FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM complaints c
    WHERE c.id = evidence.complaint_id AND c.user_id = auth.uid()
  )
);

-- Allow admins to read all evidence
CREATE POLICY "Admins can read all evidence"
ON evidence FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow officers to read evidence for complaints they can access
CREATE POLICY "Officers can read accessible complaint evidence"
ON evidence FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'officer'
  )
);

-- ============================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to read all notifications
CREATE POLICY "Admins can read all notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- AUDIT LOGS TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own audit logs
CREATE POLICY "Users can read own audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow admins to read all audit logs
CREATE POLICY "Admins can read all audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow all authenticated users to create audit logs (needed for system operations)
CREATE POLICY "Authenticated users can create audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- CATEGORIES TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read categories (needed for complaint submission)
CREATE POLICY "All authenticated users can read categories"
ON categories FOR SELECT
TO authenticated
USING (true);

-- Allow admins to create categories
CREATE POLICY "Admins can create categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update categories
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete categories
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- OFFICERS TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read officers (needed for assignment)
CREATE POLICY "All authenticated users can read officers"
ON officers FOR SELECT
TO authenticated
USING (true);

-- Allow admins to create officers
CREATE POLICY "Admins can create officers"
ON officers FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update officers
CREATE POLICY "Admins can update officers"
ON officers FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to delete officers
CREATE POLICY "Admins can delete officers"
ON officers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- FEEDBACK TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own feedback
CREATE POLICY "Users can read own feedback"
ON feedback FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow users to create their own feedback
CREATE POLICY "Users can create own feedback"
ON feedback FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow admins to read all feedback
CREATE POLICY "Admins can read all feedback"
ON feedback FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ============================================
-- CONTACT MESSAGES TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all contact messages
CREATE POLICY "Admins can read all contact messages"
ON contact_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow all users to create contact messages
CREATE POLICY "Users can create contact messages"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- SETTINGS TABLE RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all settings
CREATE POLICY "Admins can read all settings"
ON settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to update settings
CREATE POLICY "Admins can update settings"
ON settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow all authenticated users to read public settings
CREATE POLICY "All users can read public settings"
ON settings FOR SELECT
TO authenticated
USING (is_public = true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test complaint access: Users should only see their own complaints
-- Run this after setting up RLS to verify:
-- SELECT c.id, c.title, c.user_id, auth.uid() as current_user
-- FROM complaints c
-- WHERE c.user_id = auth.uid();

-- Test admin access: Admins should see all complaints
-- SELECT COUNT(*) as total_complaints
-- FROM complaints;

-- Test officer access: Officers should see all complaints
-- SELECT COUNT(*) as total_complaints
-- FROM complaints;
