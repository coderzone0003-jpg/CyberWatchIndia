-- ============================================
-- MIGRATION: Rename complaint_number to tracking_id
-- ============================================
-- This migration renames the complaint_number column to tracking_id
-- to maintain consistency across the entire codebase.

-- Run this migration if you have existing data with complaint_number
-- Execute this in your Supabase SQL editor

-- Step 1: Drop the old index if it exists
DROP INDEX IF EXISTS idx_complaints_complaint_number;

-- Step 2: Rename the column
ALTER TABLE complaints RENAME COLUMN complaint_number TO tracking_id;

-- Step 3: Create the new index
CREATE INDEX idx_complaints_tracking_id ON complaints(tracking_id);

-- Step 4: Update any functions that reference complaint_number
-- (If you have custom functions, update them here)

-- Step 5: Verify the change
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'complaints' 
-- AND column_name = 'tracking_id';

-- ============================================
-- NOTES:
-- ============================================
-- 1. This migration is safe for existing data - it only renames the column
-- 2. All existing data will be preserved
-- 3. After running this, update your application code to use tracking_id
-- 4. The corrected-database-setup.sql and complete-database-setup.sql 
--    files already use tracking_id, so they don't need this migration
-- ============================================