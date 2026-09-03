-- ============================================
-- CONTACT MESSAGES TABLE SCHEMA
-- Run this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for rapid query, filtering, and search
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read ON contact_messages(is_read);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Enable Row Level Security (RLS)
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow public insertion (for Contact Us form submissions)
DROP POLICY IF EXISTS "Public insert contact_messages" ON contact_messages;
CREATE POLICY "Public insert contact_messages"
ON contact_messages FOR INSERT
TO public
WITH CHECK (true);

-- Allow service_role full access (for backend API operations)
DROP POLICY IF EXISTS "Service role full access contact_messages" ON contact_messages;
CREATE POLICY "Service role full access contact_messages"
ON contact_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
