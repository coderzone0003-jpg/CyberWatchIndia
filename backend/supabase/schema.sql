-- ============================================
-- CYBER CRIME PORTAL - SUPABASE AUTH SCHEMA
-- This schema uses Supabase Auth (auth.users) for authentication.
-- The "profiles" table is linked to auth.users via profiles.id = auth.users.id.
-- DO NOT add a "password" column — Supabase Auth handles passwords.
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROFILES TABLE (linked to Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'officer')),
    is_active BOOLEAN DEFAULT TRUE,
    specialization TEXT,
    badge_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COMPLAINTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS complaints (
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

-- ============================================
-- EVIDENCE FILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS evidence_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- ============================================
-- FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
    replied_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reply_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category_id ON complaints(category_id);
CREATE INDEX IF NOT EXISTS idx_complaints_assigned_officer_id ON complaints(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking_id ON complaints(tracking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_complaint_id ON evidence_files(complaint_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_complaint_id ON notifications(complaint_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE TRIGGER (on Supabase Auth signup)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRACKING ID GENERATION
-- ============================================
CREATE OR REPLACE FUNCTION generate_tracking_id()
RETURNS TRIGGER AS $$
DECLARE
    tracking VARCHAR;
    year_part VARCHAR;
    seq_num INTEGER;
BEGIN
    year_part := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(tracking_id FROM 10) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM complaints
    WHERE tracking_id LIKE 'CYB-' || year_part || '-%';

    tracking := 'CYB-' || year_part || '-' || LPAD(seq_num::TEXT, 5, '0');
    NEW.tracking_id := tracking;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_tracking_id_trigger
    BEFORE INSERT ON complaints
    FOR EACH ROW
    WHEN (NEW.tracking_id IS NULL)
    EXECUTE FUNCTION generate_tracking_id();

-- ============================================
-- INITIAL DATA SEEDING
-- ============================================
INSERT INTO categories (name, description) VALUES
('Cyber Crime', 'General cyber crime'),
('Online Fraud', 'Fraudulent online activities'),
('Phishing', 'Fake websites and emails stealing credentials'),
('UPI/Banking Fraud', 'Unauthorized transactions via UPI apps or banking'),
('Identity Theft', 'Unauthorized use of personal information'),
('Social Media Crime', 'Fraudulent activities on social platforms'),
('Hacking', 'Unauthorized access to systems or data'),
('Data Theft', 'Stealing of sensitive or confidential data'),
('Cyber Bullying', 'Harassment and bullying through digital means'),
('Fake Website/App', 'Fraudulent websites or mobile applications'),
('OTP Fraud', 'Fraud involving one-time passwords'),
('Investment Scam', 'Scams related to fake investments'),
('Job Scam', 'Scams offering fake employment opportunities'),
('E-commerce Fraud', 'Fraud related to online shopping'),
('Other', 'Any other type of cyber crime')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role full access profiles" ON profiles
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- COMPLAINTS POLICIES
CREATE POLICY "Users can view own complaints" ON complaints
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can create complaints" ON complaints
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all complaints" ON complaints
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'officer')));

CREATE POLICY "Service role full access complaints" ON complaints
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- EVIDENCE FILES POLICIES
CREATE POLICY "Users can view own evidence" ON evidence_files
    FOR SELECT TO authenticated
    USING (complaint_id IN (SELECT id FROM complaints WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all evidence" ON evidence_files
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'officer')));

CREATE POLICY "Service role full access evidence" ON evidence_files
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access notifications" ON notifications
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- AUDIT LOGS POLICIES
CREATE POLICY "Service role full access audit_logs" ON audit_logs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- FEEDBACK POLICIES
CREATE POLICY "Users can create feedback" ON feedback
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access feedback" ON feedback
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CONTACT MESSAGES POLICIES
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins can manage contact messages" ON contact_messages
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role full access contact_messages" ON contact_messages
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- CATEGORIES POLICIES
CREATE POLICY "Anyone can read active categories" ON categories
    FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role full access categories" ON categories
    FOR ALL TO service_role USING (true) WITH CHECK (true);
