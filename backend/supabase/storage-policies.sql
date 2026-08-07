-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. First, create the "evidence" bucket in Supabase Dashboard > Storage
-- 2. Then run these policies in Storage > Policies section
--    OR copy these to the SQL Editor and run them
-- 
-- Note: Storage policies use a different syntax than table RLS policies
-- These are for the Supabase Storage bucket named "evidence"
-- ============================================

-- Policy: Authenticated users can upload files
-- Allows any authenticated user to upload files to the evidence bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'evidence' AND
    auth.role() = 'authenticated'
);

-- Policy: Users can view their own uploaded files
-- Users can only see files in folders that match their user ID
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'evidence' AND
    auth.uid()::text = (storage.foldername)[1]
);

-- Policy: Officers can view all files
-- Officers can see all files in the evidence bucket
CREATE POLICY "Officers can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'evidence' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'officer'
    )
);

-- Policy: Admins can view all files
-- Admins can see all files in the evidence bucket
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'evidence' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy: Users can delete their own files
-- Users can only delete files in folders that match their user ID
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'evidence' AND
    auth.uid()::text = (storage.foldername)[1]
);

-- Policy: Admins can delete any files
-- Admins can delete any files in the evidence bucket
CREATE POLICY "Admins can delete any files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'evidence' AND
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ============================================
-- VERIFICATION
-- ============================================

-- To verify storage policies are applied, run:
SELECT * FROM pg_policies WHERE schemaname = 'storage';

-- Expected output should show the policies above with bucket_id = 'evidence'
