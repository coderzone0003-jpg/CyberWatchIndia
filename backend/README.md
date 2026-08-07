# Cyber Crime Portal Backend

Backend API server for the Cyber Crime Portal project using Supabase (PostgreSQL).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Project Settings > API to get your credentials
   - Copy the URL and anon key

3. Configure environment variables in `.env`:
```bash
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

4. Set up the database:
   - Open your Supabase project's SQL Editor
   - Run the SQL schema from `supabase/schema.sql`
   - This will create all necessary tables, indexes, and RLS policies

5. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Database Schema

The following tables are created in Supabase:

- **users**: User accounts with authentication data
- **categories**: Crime categories for classification
- **officers**: Officer profiles and assignments
- **complaints**: Main complaint records
- **evidence**: File attachments for complaints
- **notifications**: User notifications
- **audit_logs**: System activity logging
- **feedback**: User feedback and ratings
- **contact_messages**: Contact form submissions

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- POST /api/auth/logout - Logout user

### Complaints
- GET /api/complaints - Get all complaints (Admin/Officer)
- GET /api/complaints/my - Get current user's complaints
- GET /api/complaints/number/:complaintNumber - Track complaint by number (Public)
- GET /api/complaints/:id - Get complaint by ID
- POST /api/complaints - Create new complaint
- PUT /api/complaints/:id - Update complaint (Admin/Officer)
- DELETE /api/complaints/:id - Delete complaint (Admin only)

### Users
- GET /api/users - Get all users (Admin only)
- GET /api/users/:id - Get user by ID
- PUT /api/users/:id - Update user profile
- DELETE /api/users/:id - Delete user (Admin only)

### Admin
- GET /api/admin/dashboard - Get admin dashboard data
- GET /api/admin/complaints - Get all complaints for admin
- GET /api/admin/users - Get all users for admin
- PUT /api/admin/complaints/:id/status - Update complaint status
- PUT /api/admin/complaints/:id/assign - Assign officer to complaint
- GET /api/admin/categories - Get all categories
- POST /api/admin/categories - Create new category

### Health Check
- GET /health - Check server and database connection status

## Tech Stack

- Node.js
- Express.js
- Supabase (PostgreSQL)
- JWT for authentication
- bcryptjs for password hashing
- Row Level Security (RLS) for data protection

## Security Features

- Row Level Security (RLS) policies on all tables
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (user, admin, officer)
- Audit logging for all critical actions
- Input validation and sanitization

## Database Features

- Auto-generated complaint numbers
- Trigger-based timestamp updates
- Foreign key constraints
- Optimized indexes for performance
- UUID primary keys for security
- JSONB support for flexible data storage
