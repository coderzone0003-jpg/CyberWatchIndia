# 🔐 Migration to Supabase Auth - Step-by-Step Guide

## Overview
This migration will convert the custom auth system (bcrypt + JWT + database passwords) to use Supabase Auth (built-in authentication with JWT tokens managed by Supabase).

---

## ⚠️ Important Notes

**Before starting:**
1. BACKUP your existing data if needed
2. This will DROP the old `users` table
3. Any existing users will need to be recreated via Supabase Auth
4. Passwords cannot be migrated (users will need to reset)

---

## Step 1: Run Migration SQL

### 1.1 Check Existing Data (Optional)

Run this in Supabase SQL Editor to check if you have data to preserve:

```sql
-- Copy from: backend/supabase/migration-to-supabase-auth.sql
```

### 1.2 Run the Main Migration

Run this in Supabase SQL Editor:

```sql
-- Copy from: backend/supabase/supabase-auth-schema.sql
```

**What this does:**
- Drops old `users` table
- Creates new `profiles` table linked to `auth.users`
- Creates trigger to auto-create profiles on signup
- Sets up RLS policies
- Updates foreign key references

---

## Step 2: Create Admin User

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add user"**
3. Enter:
   - Email: `coderzone0003@gmail.com`
   - Password: `Coderzone@0003`
   - Check **"Auto Confirm User"** (bypasses email verification)
4. Click **"Create user"**
5. After creation, run this SQL to set admin role:

```sql
UPDATE profiles
SET role = 'admin',
    full_name = 'System Administrator'
WHERE email = 'coderzone0003@gmail.com';
```

### Option B: Via SQL Script

After dashboard creation, run:

```sql
-- Copy from: backend/supabase/create-admin-supabase-auth.sql
```

---

## Step 3: Verification

Run this to verify everything is set up:

```sql
-- Check profiles table
SELECT * FROM profiles;

-- Check trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

---

## ✅ Step 1 Complete

**What's done:**
- ✅ Schema cleaned up
- ✅ Profiles table created with Supabase Auth integration
- ✅ Auto-create trigger installed
- ✅ RLS policies configured
- ✅ Admin user created

**Next Steps:**
- Step 2: Remove custom auth code from backend
- Step 3: Rewrite registration flow
- Step 4: Rewrite login flow
- Step 5: Update backend middleware
- Step 6: Update frontend auth integration
- Step 7: Test

---

**Please confirm Step 1 is complete before proceeding to Step 2.**
