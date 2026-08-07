-- ============================================
-- SUPABASE STORAGE SETUP FOR EVIDENCE FILES
-- ============================================

-- Enable storage extension (if not already enabled)
-- Note: This should be done in Supabase dashboard under Storage section

-- Create a storage bucket for evidence files
-- Run this in Supabase SQL Editor after enabling Storage

-- Insert storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false, -- private bucket, accessed via signed URLs
  10485760, -- 10MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create Row Level Security policies for the evidence bucket

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence'
  AND auth.role() = 'authenticated'
);

-- Allow users to view their own uploaded files
CREATE POLICY "Users can view own evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all evidence files
CREATE POLICY "Admins can view all evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to delete any evidence files
CREATE POLICY "Admins can delete any evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'evidence'
  AND EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Grant necessary permissions
GRANT ALL ON SCHEMA storage TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated;

-- ============================================
-- STORAGE HELPER FUNCTIONS
-- ============================================

-- Function to generate signed URL for file access
CREATE OR REPLACE FUNCTION get_evidence_url(object_name TEXT, expiration_seconds INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
  signed_url TEXT;
BEGIN
  -- This will be handled by the backend using Supabase client
  -- This is a placeholder for the logic
  RETURN object_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTES FOR MANUAL SETUP IN SUPABASE DASHBOARD
-- ============================================

-- 1. Go to Storage section in Supabase dashboard
-- 2. Create a new bucket named "evidence"
-- 3. Make it private (not public)
-- 4. Set file size limit to 10MB
-- 5. Add allowed MIME types for evidence files
-- 6. The RLS policies above will handle access control
-- 7. For development, you might want to make the bucket public temporarily
