# Complete SQL Setup Generated - Instructions

## **SQL SCRIPTS GENERATED**

I've generated two complete SQL scripts for your Cyber Crime Portal:

### **1. Complete Database Setup**
**File:** `backend/supabase/complete-database-setup.sql`

This comprehensive script includes:
- ✅ All 8 tables (profiles, complaints, evidence_files, categories, notifications, audit_logs, feedback, contact_messages)
- ✅ All foreign key relationships with proper constraints
- ✅ Auto-generated tracking IDs (CYB-YYYY-XXXXX format) with function + trigger
- ✅ Auto-updating updated_at timestamps with trigger
- ✅ Auto-create profile trigger on user signup (auth.users)
- ✅ 13 performance indexes on frequently queried columns
- ✅ Complete Row Level Security (RLS) policies for all tables
- ✅ 8 default crime categories pre-populated
- ✅ Verification queries to check setup

### **2. Storage Policies**
**File:** `backend/supabase/storage-policies.sql`

Storage bucket policies for the "evidence" bucket:
- ✅ Authenticated users can upload files
- ✅ Users can view their own uploaded files
- ✅ Officers can view all files
- ✅ Admins can view all files
- ✅ Users can delete their own files
- ✅ Admins can delete any files

---

## **HOW TO RUN THE SETUP**

### **Step 1: Run Complete Database Setup**

1. Go to Supabase Dashboard
2. Click on **SQL Editor**
3. Open `backend/supabase/complete-database-setup.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click **"Run"**

**Expected:** All tables, triggers, indexes, and RLS policies will be created automatically.

### **Step 2: Create Storage Bucket**

1. Go to Supabase Dashboard
2. Click on **Storage** icon
3. Click **"New bucket"**
4. Name: `evidence`
5. Public bucket: Yes
6. Click **"Create bucket"**

### **Step 3: Apply Storage Policies**

1. Go to Supabase Dashboard
2. Click on **SQL Editor**
3. Open `backend/supabase/storage-policies.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click **"Run"**

---

## **WHAT THE SQL CREATES**

### **Tables:**
1. **profiles** - User profiles linked to auth.users
2. **complaints** - Complaint records with auto-generated tracking IDs
3. **evidence_files** - File attachments for complaints
4. **categories** - Crime categories (8 defaults included)
5. **notifications** - User notifications
6. **audit_logs** - System audit trail
7. **feedback** - User feedback
8. **contact_messages** - Contact form submissions

### **Auto-Features:**
- **Tracking IDs:** CYB-2026-00001, CYB-2026-00002, etc.
- **Timestamps:** Auto-updates on every complaint/profile update
- **Profile Creation:** Automatically creates profile when user signs up via Supabase Auth

### **Security:**
- **RLS Enabled:** On all tables
- **User Access:** Can only see/edit their own data
- **Admin Access:** Can see and manage all data
- **Officer Access:** Can see complaints, update assigned ones
- **Storage Access:** Proper file access control

### **Performance:**
- **13 Indexes** on frequently queried columns
- **Foreign Keys** with proper CASCADE rules

---

## **VERIFICATION**

After running the SQL, verify in Supabase Dashboard:

1. **Table Editor:** All 8 tables should be visible
2. **Database > Triggers:** 3 triggers should be active
3. **Database > Indexes:** 13 indexes should be present
4. **Database > Policies:** RLS policies should be enabled
5. **Categories table:** Should have 8 default categories

---

## **NEXT STEPS**

Once you complete Steps 1-3 above:

1. Test the database by creating a test user via Supabase Auth
2. Verify that a profile is auto-created in the profiles table
3. Test complaint submission (will auto-generate tracking ID)
4. Verify RLS policies are working

**Then I will integrate Supabase Auth into the frontend to replace the old Express-based authentication system.**

---

**The SQL scripts are complete and ready to run - just copy-paste into Supabase SQL Editor!**