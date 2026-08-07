-- ============================================
-- SUPABASE AUTH FULL IMPLEMENTATION
-- Step 1: Clean up old custom auth
-- ============================================

-- First, if you have data to preserve, run the migration check script
-- If no data exists or you're okay with losing it, proceed:

-- Drop old custom users table (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS users CASCADE;

-- Drop old officers table (if exists)
DROP TABLE IF EXISTS officers CASCADE;

-- ============================================
-- Step 2: Create proper profiles table
-- ============================================

-- Create profiles table (linked to Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'officer')),
    is_active BOOLEAN DEFAULT true,
    specialization TEXT,
    badge_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- ============================================
-- Step 3: Create trigger function for auto-creating profiles
-- ============================================

-- Function to handle new user signup
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

-- ============================================
-- Step 4: Create trigger on auth.users
-- ============================================

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Step 5: Update foreign key references
-- ============================================

-- These tables will reference profiles.id (which is same as auth.users.id)
-- Complaints table already references profiles, so it should work
-- If there are any remaining references to 'users', they need to be updated

-- ============================================
-- Step 6: Enable RLS on profiles
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage profiles"
    ON profiles FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Step 7: Update other tables' RLS policies
-- ============================================

-- Complaints RLS policies (updated to use auth.uid())
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- Users can view their own complaints
CREATE POLICY "Users can view own complaints"
    ON complaints FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create complaints
CREATE POLICY "Users can create complaints"
    ON complaints FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Service role can manage all complaints
CREATE POLICY "Service role can manage complaints"
    ON complaints FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Notifications RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Service role can manage notifications
CREATE POLICY "Service role can manage notifications"
    ON notifications FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Audit logs RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage audit logs
CREATE POLICY "Service role can manage audit logs"
    ON audit_logs FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- Step 8: Update function for getting user role
-- ============================================

-- Create function to get user role from profiles
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS VARCHAR AS $$
    SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- Verification Steps
-- ============================================

-- Check that profiles table was created
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check that trigger was created
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies on profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'profiles';
