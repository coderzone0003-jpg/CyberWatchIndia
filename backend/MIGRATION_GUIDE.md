# MongoDB to Supabase Migration Guide

## What Has Changed

### Removed Dependencies
- ❌ `mongoose` - MongoDB ODM
- ✅ `@supabase/supabase-js` - Supabase client library

### New Files Created
- ✅ `config/supabase.js` - Supabase client configuration
- ✅ `utils/database.js` - Database operation functions
- ✅ `supabase/schema.sql` - Complete PostgreSQL schema
- ✅ `.env.example` - Updated environment variables template

### Modified Files
- ✅ `package.json` - Updated dependencies
- ✅ `server.js` - Added Supabase connection and health check
- ✅ `routes/auth.js` - Updated to use Supabase for user operations
- ✅ `routes/complaints.js` - Updated to use Supabase for complaint operations
- ✅ `routes/users.js` - Updated to use Supabase for user operations
- ✅ `routes/admin.js` - Updated to use Supabase for admin operations
- ✅ `middleware/auth.js` - Updated JWT handling for UUID user IDs
- ✅ `README.md` - Updated documentation

### Deleted Files
- ❌ `models/User.js` - Replaced with Supabase operations
- ❌ `models/Complaint.js` - Replaced with Supabase operations

## Setup Instructions

### 1. Install New Dependencies
```bash
cd backend
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be ready (2-3 minutes)
4. Go to Project Settings > API
5. Copy the following:
   - Project URL
   - anon public key
   - service_role key (keep this secret!)

### 3. Configure Environment Variables
Create a `.env` file in the backend directory:
```bash
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=generate-a-secure-random-string-here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 4. Set Up Database
1. Open your Supabase project
2. Go to SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute the SQL
5. This will create all tables, indexes, triggers, and RLS policies

### 5. Test the Connection
```bash
npm start
```

Then test the health endpoint:
```bash
curl http://localhost:5000/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Key Differences

### Data Types
- **MongoDB**: Uses `_id` (ObjectId)
- **Supabase**: Uses `id` (UUID)

### Authentication
- **MongoDB**: Used Mongoose middleware
- **Supabase**: Uses custom JWT middleware with UUID user IDs

### Relationships
- **MongoDB**: Used `populate()` for references
- **Supabase**: Uses SQL JOINs with `select()` syntax

### Timestamps
- **MongoDB**: Automatic `createdAt` and `updatedAt`
- **Supabase**: Uses PostgreSQL triggers for automatic timestamps

### Security
- **MongoDB**: Application-level security
- **Supabase**: Row Level Security (RLS) at database level

## Database Schema Overview

### Users Table
```sql
- id (UUID, Primary Key)
- name, email, password (hashed)
- phone, role (user/admin/officer)
- is_verified, is_active
- created_at, updated_at
```

### Complaints Table
```sql
- id (UUID, Primary Key)
- complaint_number (auto-generated: CC-YYYYMMDD-XXXX)
- title, description, category_id
- severity, status, user_id
- assigned_officer_id, location
- incident_date, created_at, updated_at
```

### Additional Tables
- `categories` - Crime classifications
- `officers` - Officer profiles and assignments
- `evidence` - File attachments
- `notifications` - User notifications
- `audit_logs` - System activity tracking
- `feedback` - User feedback and ratings
- `contact_messages` - Contact form submissions

## API Changes

### Authentication
- JWT tokens now contain UUID user IDs instead of ObjectIds
- User registration now requires all fields (name, email, password)
- Password validation is enforced

### Complaints
- Complaint numbers are auto-generated in format: CC-YYYYMMDD-XXXX
- Complaint tracking is now available via `/api/complaints/number/:complaintNumber`
- Category relationships use foreign keys instead of string matching

### Admin Operations
- Dashboard statistics are calculated from real database queries
- Officer assignment uses foreign key relationships
- All admin actions are logged to audit_logs table

## Testing the Migration

### 1. Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "phone": "1234567890"
  }'
```

### 2. Test User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Complaint Creation (requires auth token)
```bash
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -H "x-auth-token: YOUR_JWT_TOKEN" \
  -d '{
    "title": "Test Complaint",
    "description": "This is a test complaint",
    "category_id": "CATEGORY_UUID_HERE",
    "severity": "medium",
    "location": "Test Location"
  }'
```

## Rollback Plan

If you need to rollback to MongoDB:

1. Restore original `package.json` dependencies
2. Restore `models/User.js` and `models/Complaint.js`
3. Revert route files to use Mongoose
4. Remove Supabase configuration files
5. Update `.env` to use MongoDB connection string

## Next Steps

1. **Set up Supabase Storage** for file uploads
2. **Configure Supabase Auth** for additional authentication options
3. **Set up Real-time subscriptions** for live updates
4. **Configure Supabase Edge Functions** for serverless logic
5. **Set up database backups** in Supabase dashboard
6. **Configure email templates** in Supabase Auth

## Troubleshooting

### Connection Issues
- Verify SUPABASE_URL is correct
- Check that your keys are valid
- Ensure your Supabase project is active

### Permission Errors
- Check RLS policies in Supabase dashboard
- Verify user roles are set correctly
- Ensure JWT_SECRET matches between backend and any services

### UUID Issues
- All IDs are now UUIDs, not ObjectIds
- Update any frontend code that expects ObjectId format
- UUIDs are strings, not objects

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase GitHub](https://github.com/supabase/supabase)
- [Supabase Discord](https://supabase.com/discord)

For project-specific issues:
- Check the database schema in `supabase/schema.sql`
- Review the database operations in `utils/database.js`
- Check API route implementations in `routes/` directory
