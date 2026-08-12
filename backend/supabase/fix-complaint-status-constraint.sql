-- Fix complaints status check constraint to match the application
-- Run this in Supabase SQL Editor if officer assignment fails with:
-- "violates check constraint complaints_status_check"

ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE complaints
  ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('pending', 'under investigation', 'investigating', 'resolved', 'rejected'));

-- Normalize any legacy values
UPDATE complaints
SET status = 'under investigation'
WHERE status = 'investigating';

-- Optional: use one canonical value after migration
-- ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
-- ALTER TABLE complaints
--   ADD CONSTRAINT complaints_status_check
--   CHECK (status IN ('pending', 'under investigation', 'resolved', 'rejected'));
