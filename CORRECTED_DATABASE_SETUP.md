# Database Setup - Corrected SQL

## **Issue Found**

The `enhanced-rls.sql` file referenced a `users` table that doesn't exist. It should use the `profiles` table instead, which is linked to Supabase's built-in `auth.users` table.

## **Solution**

I've created a **corrected, complete SQL script** that:

1. ✅ Drops any existing tables (including old `users` table if it exists)
2. ✅ Creates `profiles` table linked to `auth.users(id)`
3. ✅ Creates auto-create profile trigger on user signup
4. ✅ Creates all other tables with correct foreign keys to `profiles(id)`
5. ✅ All RLS policies reference `profiles` instead of `users`
6. ✅ All queries use `profiles` table for role checks

## **File Created**

**`backend/supabase/corrected-database-setup.sql`** - Complete, ready-to-run SQL script

## **Changes Made**

### **1. SQL Script Corrections**

**Fixed table references:**
- Changed all `users` table references to `profiles`
- Changed `complaint_number` to `tracking_id` (auto-generated format)
- Changed `evidence` table to `evidence_files` (matches SQL schema)
- Removed references to non-existent `officers` table

**Corrected foreign keys:**
- `complaints.user_id` → references `profiles(id)` ✅
- `complaints.assigned_officer_id` → references `profiles(id)` ✅
- `notifications.user_id` → references `profiles(id)` ✅
- `audit_logs.user_id` → references `profiles(id)` ✅
- `feedback.user_id` → references `profiles(id)` ✅

**Corrected RLS policies:**
- All role checks now use `profiles` table
- Example: `SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'`

### **2. Backend Code Updates**

**Updated `backend/utils/database.js`:**
- Renamed `userOperations` to `profileOperations`
- Changed all table references from `users` to `profiles`
- Updated foreign key relationships in queries
- Changed `findByNumber` to `findByTrackingId`
- Updated join queries to use `profiles` instead of `users` and `officers`

**Note:** `backend/routes/auth.js` still uses the old Express auth system. This will be completely replaced when we implement Supabase Auth in Section 2.

## **How to Run the Corrected SQL**

### **Step 1: Run the Corrected SQL**

1. Go to Supabase Dashboard
2. Click on **SQL Editor**
3. Open `backend/supabase/corrected-database-setup.sql`
4. Copy the entire SQL content
5. Paste into SQL Editor
6. Click **"Run"**

**This will:**
- Drop any existing tables (including wrong `users` table)
- Create all tables with correct structure
- Set up triggers for auto-tracking ID and profile creation
- Create all indexes
- Enable RLS with correct policies
- Insert default categories

### **Step 2: Verify Setup**

After running the SQL, the verification queries at the end will show:
- ✅ All 8 tables created
- ✅ 3 triggers active (tracking ID, updated_at, profile creation)
- ✅ 13 indexes created
- ✅ RLS policies enabled on all tables
- ✅ 8 default categories inserted

## **Execution Order in the SQL**

The SQL script runs in this order:

1. **DROP** existing tables (reverse dependency order)
2. **ENABLE** extensions (uuid-ossp, pgcrypto)
3. **CREATE** profiles table (linked to auth.users)
4. **CREATE** auto-create profile trigger
5. **CREATE** all other tables (categories, complaints, evidence_files, etc.)
6. **CREATE** functions (tracking ID, updated_at)
7. **CREATE** triggers (tracking ID, updated_at)
8. **CREATE** indexes (performance)
9. **INSERT** default categories
10. **ENABLE** RLS on all tables
11. **CREATE** RLS policies (all reference profiles)
12. **RUN** verification queries

## **What Was Wrong Before**

### **Old (Incorrect) RLS Policy:**
```sql
CREATE POLICY "Admins can read all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```
❌ References non-existent `users` table

### **New (Correct) RLS Policy:**
```sql
CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```
✅ References `profiles` table

## **Database Schema After Correction**

```
auth.users (Supabase built-in)
    ↓ (1:1)
profiles (user profile data)
    ↓ (1:N)
complaints, notifications, audit_logs, feedback

complaints
    ↓ (1:N)
evidence_files

categories (independent)
```

## **Important Notes**

1. **`users` table no longer exists** - All user data is in `profiles` table
2. **`officers` table no longer exists** - Officers are just users with `role = 'officer'` in `profiles`
3. **`complaint_number` changed to `tracking_id`** - Auto-generated format: CYB-YYYY-XXXXX
4. **`evidence` changed to `evidence_files`** - Table name matches SQL schema
5. **Profile auto-creation** - Trigger creates profile when user signs up via Supabase Auth

## **Next Steps**

1. ✅ Run the corrected SQL in Supabase SQL Editor
2. ✅ Verify tables are created correctly
3. ✅ Test profile auto-creation by signing up a user via Supabase Auth
4. ⏳ Implement Supabase Auth in frontend (Section 2)
5. ⏳ Replace Express auth routes with Supabase Auth
6. ⏳ Update all backend code to use profiles table

## **Files Modified**

- ✅ `backend/supabase/corrected-database-setup.sql` - New corrected SQL
- ✅ `backend/utils/database.js` - Updated to use profiles table
- ⏳ `backend/routes/auth.js` - Will be replaced with Supabase Auth (Section 2)

---

**The corrected SQL is ready to run. Just copy-paste into Supabase SQL Editor and execute!**