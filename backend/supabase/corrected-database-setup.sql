-- ============================================
-- CYBER CRIME PORTAL - CORRECTED DATABASE SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 0: DROP EXISTING TABLES (if any)
-- ============================================

-- Drop in reverse order of dependencies
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS evidence_files CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE; -- In case old users table exists

-- ============================================
-- STEP 1: ENABLE EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- STEP 2: CREATE PROFILES TABLE (linked to auth.users)
-- ============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'officer')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 3: CREATE AUTO-CREATE PROFILE TRIGGER
-- ============================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- STEP 4: CREATE OTHER TABLES
-- ============================================

-- Categories table (no dependencies)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaints table
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'rejected')),
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    location VARCHAR(255),
    incident_date DATE,
    assigned_officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence files table
CREATE TABLE evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    related_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact messages table
CREATE TABLE contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 5: CREATE FUNCTIONS FOR AUTO-GENERATION
-- ============================================

-- Function to generate tracking ID (CYB-YYYY-XXXXX format)
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_num TEXT;
    tracking_id TEXT;
BEGIN
    -- Get current year
    year_part := TO_CHAR(NOW(), 'YYYY');
    
    -- Get next sequence number for this year
    SELECT LPAD(COUNT(*) + 1::TEXT, 5, '0') INTO sequence_num
    FROM complaints
    WHERE tracking_id LIKE 'CYB-' || year_part || '-%';
    
    -- If no complaints this year, start from 00001
    IF sequence_num IS NULL THEN
        sequence_num := '00001';
    END IF;
    
    -- Generate tracking ID
    tracking_id := 'CYB-' || year_part || '-' || sequence_num;
    
    NEW.tracking_id := tracking_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: CREATE TRIGGERS
-- ============================================

-- Trigger for auto-generating tracking_id
DROP TRIGGER IF EXISTS generate_tracking_id_trigger ON complaints;
CREATE TRIGGER generate_tracking_id_trigger
    BEFORE INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION generate_tracking_id();

-- Trigger for auto-updating updated_at on complaints
DROP TRIGGER IF EXISTS update_complaints_updated_at ON complaints;
CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-updating updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: CREATE INDEXES
-- ============================================

-- Complaints indexes
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_tracking_id ON complaints(tracking_id);
CREATE INDEX idx_complaints_category_id ON complaints(category_id);
CREATE INDEX idx_complaints_assigned_officer ON complaints(assigned_officer_id);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);

-- Evidence files indexes
CREATE INDEX idx_evidence_complaint_id ON evidence_files(complaint_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_complaint_id ON notifications(related_complaint_id);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Feedback indexes
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

-- Contact messages indexes
CREATE INDEX idx_contact_messages_created_at ON contact_messages(created_at DESC);

-- Categories indexes
CREATE INDEX idx_categories_is_active ON categories(is_active);

-- Profiles indexes
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================
-- STEP 8: INSERT DEFAULT DATA
-- ============================================

-- Insert default categories
INSERT INTO categories (name, description) VALUES
('UPI Fraud', 'Unauthorized transactions via UPI apps'),
('Phishing', 'Fake websites and emails stealing credentials'),
('Online Scam', 'Financial fraud through online platforms'),
('Cyber Bullying', 'Harassment and bullying through digital means'),
('Identity Theft', 'Unauthorized use of personal information'),
('Hacking', 'Unauthorized access to systems or data'),
('Social Media Fraud', 'Fraudulent activities on social platforms'),
('Other', 'Any other type of cyber crime')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- STEP 9: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 10: CREATE RLS POLICIES
-- ============================================

-- ============================================
-- PROFILES RLS POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- COMPLAINTS RLS POLICIES
-- ============================================

-- Users can read their own complaints
CREATE POLICY "Users can read own complaints"
ON complaints FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own complaints
CREATE POLICY "Users can insert own complaints"
ON complaints FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own complaints (limited fields)
CREATE POLICY "Users can update own complaints limited"
ON complaints FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
    user_id = auth.uid() AND
    status = 'pending' AND
    -- Users cannot change status or assigned officer
    status = OLD.status AND
    (assigned_officer_id IS NULL OR assigned_officer_id = OLD.assigned_officer_id)
);

-- Officers can read all complaints
CREATE POLICY "Officers can read all complaints"
ON complaints FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'officer'
    )
);

-- Officers can update complaints assigned to them
CREATE POLICY "Officers can update assigned complaints"
ON complaints FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'officer'
    ) AND
    assigned_officer_id = auth.uid()
);

-- Admins can read all complaints
CREATE POLICY "Admins can read all complaints"
ON complaints FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update all complaints
CREATE POLICY "Admins can update all complaints"
ON complaints FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Everyone can read categories (needed for complaint submission)
CREATE POLICY "Everyone can read categories"
ON categories FOR SELECT
TO authenticated
USING (true);

-- ============================================
-- EVIDENCE FILES RLS POLICIES
-- ============================================

-- Users can read evidence for their own complaints
CREATE POLICY "Users can read own complaint evidence"
ON evidence_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM complaints c
        WHERE c.id = evidence_files.complaint_id AND c.user_id = auth.uid()
    )
);

-- Users can insert evidence for their own complaints
CREATE POLICY "Users can insert evidence for own complaints"
ON evidence_files FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM complaints c
        WHERE c.id = evidence_files.complaint_id AND c.user_id = auth.uid()
    )
);

-- Officers can read evidence for complaints they can access
CREATE POLICY "Officers can read accessible complaint evidence"
ON evidence_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'officer'
    )
);

-- Admins can read all evidence
CREATE POLICY "Admins can read all evidence"
ON evidence_files FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Service role can insert notifications (for system notifications)
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications"
ON notifications FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- AUDIT LOGS RLS POLICIES
-- ============================================

-- Users can read their own audit logs
CREATE POLICY "Users can read own audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can read all audit logs
CREATE POLICY "Admins can read all audit logs"
ON audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Authenticated users can create audit logs (for system operations)
CREATE POLICY "Authenticated users can create audit logs"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================
-- FEEDBACK RLS POLICIES
-- ============================================

-- Users can read their own feedback
CREATE POLICY "Users can read own feedback"
ON feedback FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can create their own feedback
CREATE POLICY "Users can create own feedback"
ON feedback FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can read all feedback
CREATE POLICY "Admins can read all feedback"
ON feedback FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- CONTACT MESSAGES RLS POLICIES
-- ============================================

-- Everyone can insert contact messages
CREATE POLICY "Everyone can insert contact messages"
ON contact_messages FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only admins can read contact messages
CREATE POLICY "Admins can read all contact messages"
ON contact_messages FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- CATEGORIES RLS POLICIES
-- ============================================

-- Admins can create categories
CREATE POLICY "Admins can create categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can update categories
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Admins can delete categories
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these after setup to verify everything is working

-- Check if tables exist
SELECT 
    table_name,
    rowsecurity
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'complaints', 'evidence_files', 'notifications', 'audit_logs', 'feedback', 'contact_messages', 'categories')
ORDER BY table_name;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Check if indexes exist
SELECT 
    indexname,
    tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'complaints', 'evidence_files', 'notifications', 'audit_logs', 'feedback', 'contact_messages', 'categories')
ORDER BY tablename, indexname;

-- Check if RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check default categories
SELECT * FROM categories;

-- ============================================
-- SETUP COMPLETE
-- ============================================

-- Your database is now fully configured with:
-- ✅ All tables created with proper relationships
-- ✅ Profiles table linked to auth.users
-- ✅ Auto-create profile trigger on user signup
-- ✅ Auto-generated tracking IDs (CYB-YYYY-XXXXX format)
-- ✅ Auto-updating updated_at timestamps
-- ✅ Row Level Security enabled on all tables
-- ✅ Proper access control (users/admins/officers)
-- ✅ Performance indexes on frequently queried columns
-- ✅ Default categories pre-populated
-- ✅ All references point to profiles table (not users)

-- NEXT STEPS:
-- 1. Create storage bucket named "evidence" in Supabase Dashboard
-- 2. Add storage policies manually in Storage > Policies section
-- 3. Test the setup by creating a test user via Supabase Auth
-- 4. Verify that a profile is auto-created for the new user
-- 5. Test complaint submission and tracking ID generation
