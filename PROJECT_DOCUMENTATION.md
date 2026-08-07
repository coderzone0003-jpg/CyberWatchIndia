# 🔐 Cyber Crime Reporting Portal - Complete Project Documentation

A comprehensive web application for reporting and tracking cyber crimes in India, built with React, Node.js, Express, and Supabase.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Prerequisites](#prerequisites)
4. [Installation](#installation)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Authentication System](#authentication-system)
8. [File Storage & Evidence Management](#file-storage--evidence-management)
9. [Core Features](#core-features)
10. [Security Features](#security-features)
11. [API Documentation](#api-documentation)
12. [Project Structure](#project-structure)
13. [Testing](#testing)
14. [Deployment Guide](#deployment-guide)
15. [Troubleshooting](#troubleshooting)

---

## Project Overview

The Cyber Crime Reporting Portal is a full-stack web application designed to help citizens report cyber crimes, track complaint status, and enable law enforcement agencies to manage and investigate cases efficiently.

### Key Capabilities

- **User Features**: Submit complaints with evidence, track status, receive notifications
- **Admin Features**: Manage complaints, assign officers, generate reports, audit logs
- **Security**: JWT authentication, role-based access, complete audit trail
- **Scalability**: Built on Supabase PostgreSQL with Row Level Security

### Current Architecture

- **Frontend**: React 19 with Bootstrap 5 for UI
- **Backend**: Node.js/Express API server
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Authentication**: Custom JWT-based system (not Supabase Auth)
- **File Storage**: Supabase Storage with signed URLs
- **Email Service**: Resend for notifications

---

## Tech Stack

### Frontend
- **React 19** - UI framework
- **React Router DOM 7** - Client-side routing
- **Bootstrap 5** - UI components and styling
- **Bootstrap Icons** - Icon library
- **Supabase JS Client** - Database and storage client

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase (PostgreSQL)** - Database and storage
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Morgan** - Request logging
- **pdfkit** - PDF generation
- **exceljs** - Excel generation
- **Resend** - Email service
- **express-rate-limit** - Rate limiting
- **helmet** - Security headers
- **express-validator** - Input validation

### Database
- **Supabase (PostgreSQL)** - Primary database
- **Row Level Security (RLS)** - Data access control
- **Supabase Storage** - File uploads
- **UUID Primary Keys** - Secure identifiers
- **Triggers** - Auto-generated tracking IDs and timestamps

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Supabase Account** - [Sign up](https://supabase.com/)
- **Resend Account** (for emails) - [Sign up](https://resend.com/)

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd "cyberwatch india"
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../Frontend
npm install
```

### 4. Quick Start (Windows)

Double-click `start-project.bat` in the project root to automatically:
- Check Node.js installation
- Install all dependencies
- Start backend server (port 5000)
- Start frontend server (port 3000)

---

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-secure-random-secret-min-32-characters

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Resend)
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# File Upload Configuration
MAX_FILE_SIZE=10485760
```

**Important Notes:**
- `JWT_SECRET` must be at least 32 characters
- Use a strong, random secret in production
- Get Supabase credentials from your Supabase project settings

### Frontend Environment Variables

Create a `.env` file in the `Frontend` directory:

```bash
cd Frontend
cp .env.example .env
```

Edit `.env` with your values:

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000
```

---

## Database Setup

### 1. Create Supabase Project

1. Go to [Supabase.com](https://supabase.com/)
2. Click "New Project"
3. Enter project name and password
4. Wait for project to be created

### 2. Run Database Schema

Navigate to your Supabase project:
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `backend/supabase/complete-database-setup.sql`
3. Paste and run the SQL script

This will create:
- `profiles` table (users)
- `complaints` table
- `categories` table
- `evidence_files` table (evidence files)
- `notifications` table
- `audit_logs` table
- `contact_messages` table
- Required indexes
- RLS policies
- Auto-generated tracking IDs (CYB-YYYY-XXXXX format)
- 8 default crime categories

### 3. Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click "New Bucket"
3. Name it: `evidence`
4. Make it **Private** (for security)
5. Set file size limit to 10MB
6. Save

### 4. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (for backend only)

### 5. Configure Resend (Email)

1. Go to [Resend.com](https://resend.com/)
2. Create an account
3. Get your API key from API Keys section
4. Add domain (or use resend.dev for testing)
5. Copy API key to backend `.env`

---

## Authentication System

### Current Implementation

The project uses a **custom JWT-based authentication system** (not Supabase Auth):

- Passwords stored in `profiles` table (hashed with bcrypt)
- JWT tokens for session management
- Email verification via custom JWT tokens
- Password reset via custom JWT tokens
- All logic in `backend/routes/auth.js`

### Authentication Features

#### 1. User Registration
- Password validation (12+ characters, complexity requirements)
- Email verification flow
- Auto-login after registration
- Real-time password requirements display

#### 2. User Login
- JWT token generation
- Secure session management
- Role-based access control
- "Forgot password" functionality

#### 3. Password Reset
- JWT-based reset tokens (1-hour expiry)
- Email notification with reset link
- Secure password update
- Token validation

#### 4. Email Verification
- JWT-based verification tokens (24-hour expiry)
- Automatic verification on registration
- Resend verification option
- Professional email templates

### Password Requirements

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)
- No common words (password, 123456, qwerty, admin, user)
- No more than 3 repeating characters

### Security Features

- Bcrypt hashing (12 salt rounds)
- JWT token expiration
- Rate limiting on auth endpoints
- Audit logging for all auth actions
- Email not revealed if account doesn't exist

---

## File Storage & Evidence Management

### Storage Architecture

- **Bucket**: Private Supabase Storage bucket named `evidence`
- **Access**: Signed URLs with 1-hour expiry
- **Validation**: Server-side file type and size validation
- **Organization**: Files stored in user folders (`userId/filename`)

### File Upload Features

#### Validation Rules
- **Allowed types**: Images (jpeg, png, gif, webp), PDF, text, Word, Excel
- **Max size**: 10MB per file
- **Max files**: 5 per complaint
- **Filename sanitization**: Prevents path traversal attacks

#### Upload Flow
1. User selects files in complaint form
2. Frontend validates file size and type
3. Files uploaded through Express backend (for security)
4. Backend stores in Supabase Storage
5. Database records created in `evidence_files` table
6. Signed URLs generated for access

#### Access Control
- **Users**: Can only upload to their own folder
- **Users**: Can only view evidence for their own complaints
- **Officers**: Can view evidence for all complaints
- **Admins**: Can view and delete any evidence

### File Deletion

- Users can delete evidence from pending complaints only
- Officers can delete from assigned complaints
- Admins can delete from any complaint
- Deletes from both Storage and database
- Audit logging for all deletions

---

## Core Features

### User Features

#### 1. Complaint Submission
- Multi-step form with validation
- Evidence file upload (up to 5 files)
- Auto-generated tracking ID (CYB-YYYY-XXXXX)
- Category selection
- Severity classification
- Location information
- Incident date tracking

#### 2. Complaint Tracking
- Public tracking by tracking ID
- Status timeline display
- Evidence file viewing
- Case history
- Real-time status updates

#### 3. User Dashboard
- Personal complaint statistics
- Recent complaints list
- Notification center
- Profile management
- Complaint history

#### 4. Notifications
- In-app notification bell
- Email notifications for status changes
- Real-time updates
- Notification types: info, success, warning, error
- Mark as read functionality

### Admin Features

#### 1. Admin Dashboard
- Real-time statistics
- Recent activity feed
- Category distribution
- Resolution rate tracking
- User statistics

#### 2. Complaint Management
- View all complaints with filters
- Server-side search and filtering
- Status updates (pending, under investigation, resolved, rejected)
- Officer assignment
- Workload tracking
- Export to PDF/Excel

#### 3. User Management
- View all users
- Activate/deactivate accounts
- Role management (user, officer, admin)
- Soft delete functionality
- Audit logging

#### 4. Officer Management
- Create officer accounts
- Assign specializations
- Badge number tracking
- Workload distribution
- Performance tracking

#### 5. Category Management
- Create crime categories
- Edit category details
- Delete unused categories
- Description management
- Category statistics

#### 6. Advanced Reporting
- Date range filtering
- Status breakdown
- Category distribution
- Severity analysis
- Officer performance
- Timeline charts
- Average resolution time

#### 7. Export Functionality
- PDF report generation
- Excel export with full data
- Filter-based exports
- Professional formatting
- Download in new tab

#### 8. Audit Log Viewer
- Complete activity history
- Search and filtering
- Pagination for large datasets
- User information display
- Action type tracking
- IP address logging
- Timestamp tracking

### Advanced Features

#### 1. Server-Side Search
- Full-text search across multiple fields
- Database indexes for performance
- Case-insensitive search
- Partial matches supported
- Combined with other filters

#### 2. Real-Time Filtering
- Status filtering
- Category filtering
- Date range filtering
- Officer filtering
- Combined filter support

#### 3. Officer Assignment Workflow
- Workload tracking per officer
- Visual workload display
- Automatic status changes
- Assignment notifications
- Email notifications to officers

---

## Security Features

### 1. Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes
- **Complaint submission**: 10 complaints per hour
- **General API**: 100 requests per 15 minutes
- **Strict endpoints**: 3 requests per hour

### 2. Input Validation & Sanitization
- Express-validator for declarative validation
- Custom validation middleware
- Automatic XSS protection
- Field-specific validation
- Detailed error messages

### 3. CORS Configuration
- Origin restriction
- Credentials support
- Method restriction
- Header validation
- Proper caching control

### 4. XSS Protection
- Input sanitization middleware
- Output escaping
- Script tag removal
- Attribute sanitization
- Content Security Policy headers

### 5. Secure Password Requirements
- 12+ character minimum
- Complexity requirements
- Forbidden pattern detection
- Repeating character limits
- Bcrypt hashing (12 rounds)

### 6. Row Level Security (RLS)
- User-level access control
- Admin-level access
- Officer-level access
- Database-level security
- Automatic policy enforcement

### 7. Security Headers
- Helmet middleware
- Content Security Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

### 8. Audit Logging
- Complete activity tracking
- User action logging
- IP address recording
- Timestamp tracking
- Action type classification

### 9. Error Handling
- Global error boundary component
- Graceful error recovery
- User-friendly error messages
- Error logging and tracking
- Development vs production error displays
- Recovery options (reload page, go home)
- Error ID generation for support

### 10. Database Features
- Auto-generated complaint numbers (CYB-YYYY-XXXXX format)
- Trigger-based timestamp updates
- Foreign key constraints
- Optimized indexes for performance
- UUID primary keys for security
- JSONB support for flexible data storage
- Auto-create profile trigger on user signup

---

## Error Handling System

### Error Boundary Implementation

The application includes a global error boundary that:

- **Catches JavaScript errors** anywhere in the component tree
- **Displays fallback UI** instead of crashing the entire app
- **Logs error details** to console (can be extended to external services)
- **Provides recovery options** for users (reload page, go home)
- **Shows technical details** only in development mode
- **Generates error IDs** for support tracking

### Error Boundary Features

**Development Mode:**
- Shows full error stack trace
- Shows component stack
- Shows error message
- Shows error ID

**Production Mode:**
- Shows generic error message
- Hides stack traces
- Shows error ID for support
- Still provides recovery options

### Optional External Error Logging

To enable external error logging (e.g., Sentry, LogRocket), configure the `logErrorToService` method in `ErrorBoundary.jsx` to send error data to your error tracking service.

---

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### POST /api/auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "password": "NewSecurePass123!"
}
```

### Complaint Endpoints

#### POST /api/complaints
Create a new complaint with evidence files.

**Request:** multipart/form-data
- title (string)
- description (text)
- category_id (UUID)
- severity (string: low/medium/high/critical)
- location (string)
- incident_date (date)
- evidence[] (files, max 5)

**Response:**
```json
{
  "id": "uuid",
  "tracking_id": "CYB-2024-00001",
  "title": "Complaint Title",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /api/complaints/my
Get current user's complaints with pagination and filtering.

**Query Parameters:**
- status (optional)
- category_id (optional)
- limit (default: 10)
- offset (default: 0)

**Response:**
```json
{
  "complaints": [...],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0
  }
}
```

#### GET /api/complaints/number/:trackingId
Get complaint by tracking ID (public tracking).

**Response:**
```json
{
  "tracking_id": "CYB-2024-00001",
  "title": "Complaint Title",
  "status": "under investigation",
  "category": "UPI Fraud",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### GET /api/complaints/:id/evidence
Get evidence files for a complaint.

**Response:**
```json
{
  "evidence": [
    {
      "id": "uuid",
      "file_name": "evidence.pdf",
      "file_type": "application/pdf",
      "file_size": 12345,
      "signed_url": "https://..."
    }
  ]
}
```

#### DELETE /api/complaints/:id/evidence/:evidenceId
Delete evidence file.

### Admin Endpoints

#### GET /api/admin/dashboard
Get admin dashboard statistics.

**Response:**
```json
{
  "total_complaints": 100,
  "pending": 30,
  "under_investigation": 25,
  "resolved": 40,
  "rejected": 5,
  "recent_activity": [...]
}
```

#### GET /api/admin/reports
Get comprehensive analytics reports.

**Query Parameters:**
- start_date (optional)
- end_date (optional)
- category_id (optional)
- status (optional)

**Response:**
```json
{
  "total": 100,
  "by_status": {...},
  "by_category": {...},
  "by_severity": {...},
  "timeline": [...],
  "avg_resolution_days": 7.5
}
```

#### PUT /api/admin/complaints/:id/status
Update complaint status.

**Request Body:**
```json
{
  "status": "under investigation"
}
```

#### PUT /api/admin/complaints/:id/assign
Assign officer to complaint.

**Request Body:**
```json
{
  "officer_id": "uuid"
}
```

### Health Check

#### GET /ping
Server health check.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

#### GET /health
Database health check.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Project Structure

```
cyberwatch india/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client config
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── security.js          # Security (helmet, rate limiting)
│   │   └── validation.js        # Request validation
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── complaints.js        # Complaint CRUD
│   │   ├── users.js             # User management
│   │   ├── admin.js             # Admin endpoints
│   │   └── notifications.js     # Notification routes
│   ├── scripts/
│   │   └── create-admin.js      # Admin creation script
│   ├── supabase/
│   │   ├── complete-database-setup.sql  # Complete schema
│   │   └── storage-policies.sql # Storage RLS policies
│   ├── tests/
│   │   ├── auth.test.js         # Auth route tests
│   │   └── complaints.test.js   # Complaint route tests
│   ├── utils/
│   │   ├── database.js          # Database operations
│   │   ├── email.js             # Email utilities
│   │   ├── export.js            # PDF/Excel export
│   │   ├── fileUpload.js        # File upload utilities
│   │   └── validation.js        # Validation helpers
│   ├── .env.example             # Environment template
│   ├── .gitignore
│   ├── package.json
│   └── server.js                # Express server
├── Frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar
│   │   │   ├── Sidebar.jsx       # Admin sidebar
│   │   │   ├── ProtectedRoute.jsx # Route protection
│   │   │   └── ErrorBoundary.jsx # Error handling
│   │   ├── config/
│   │   │   └── supabase.js      # Supabase client config
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Landing page
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Register.jsx      # Registration page
│   │   │   ├── UserDashboard.jsx # User dashboard
│   │   │   ├── ReportCrime.jsx    # Complaint submission
│   │   │   ├── MyComplaints.jsx  # User's complaints
│   │   │   ├── TrackComplaint.jsx # Public tracking
│   │   │   ├── AdminDashboard.jsx # Admin dashboard
│   │   │   ├── ManageComplaints.jsx # Complaint management
│   │   │   ├── ManageUsers.jsx   # User management
│   │   │   ├── ManageOfficers.jsx # Officer management
│   │   │   ├── ManageCategories.jsx # Category management
│   │   │   ├── Reports.jsx        # Analytics and reports
│   │   │   └── AuditLogs.jsx     # Audit log viewer
│   │   ├── utils/
│   │   │   └── api.js            # API helper functions
│   │   ├── App.jsx               # Main app component
│   │   └── index.js              # Entry point
│   ├── .env.example              # Environment template
│   ├── .gitignore
│   ├── package.json
│   └── README.md
├── scripts/
│   └── validate-env.bat          # Environment validation
├── start-project.bat             # Windows startup script
├── README.md                     # Main documentation
├── PROJECT_DOCUMENTATION.md      # This file
└── package.json                  # Root package.json
```

---

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Run with coverage:
```bash
npm test -- --coverage
```

Watch mode:
```bash
npm run test:watch
```

### Frontend Tests

```bash
cd Frontend
npm test
```

### Production Build Test

```bash
cd Frontend
npm run build
```

This creates an optimized production build in the `build/` directory.

---

## Deployment Guide

### Recommended Deployment Stack

- **Frontend**: Vercel (free tier available)
- **Backend**: Render or Railway (free tier available)
- **Database**: Supabase (already hosted)
- **Email**: Resend (already configured)

**Cost Estimate:**
- Vercel: Free (with limitations)
- Render: Free tier ($0/month) or $7/month for production
- Railway: Free tier ($5/month after trial)
- Supabase: Free tier ($0/month)
- Resend: Free tier (3000 emails/day)

**Total: $0 - $7/month**

### Deployment Steps

#### 1. Prepare for Deployment

**Update Environment Variables:**

Backend (.env):
```env
PORT=5000
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-production-secret-min-32-characters
FRONTEND_URL=https://your-frontend-domain.vercel.app
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@yourdomain.com
MAX_FILE_SIZE=10485760
```

Frontend (.env):
```env
REACT_APP_API_URL=https://your-backend-domain.onrender.com
```

#### 2. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com/)
2. Sign up with GitHub
3. Click "Add New Project"
4. Select your GitHub repository
5. Configure:
   - Root Directory: `Frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Environment Variable: `REACT_APP_API_URL`
6. Click "Deploy"

#### 3. Deploy Backend to Render

1. Go to [render.com](https://render.com/)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add all backend environment variables
6. Click "Create Web Service"

#### 4. Configure Supabase

1. Go to Supabase Dashboard → Project Settings → API
2. Add your frontend URL to CORS allowed origins
3. Verify storage bucket exists
4. Test database connection

#### 5. Create Admin User

After deployment, create your admin account via:
- Render web shell: `npm run create-admin`
- Direct database insert in Supabase SQL Editor

#### 6. Verify Deployment

Test:
- Backend health: `curl https://your-backend.onrender.com/ping`
- Frontend loads in browser
- User registration works
- Admin login works
- Complaint submission works

---

## Troubleshooting

### Backend Issues

**Server won't start:**
- Check that `.env` file exists with correct Supabase credentials
- Verify Supabase project is active
- Check that database schema has been executed
- Ensure all dependencies are installed

**Database connection errors:**
- Verify SUPABASE_URL is correct
- Check that your keys are valid
- Ensure your Supabase project is active
- Test connection: `curl http://localhost:5000/health`

**Authentication errors:**
- Verify JWT_SECRET is set and at least 32 characters
- Check that tokens are being sent correctly
- Ensure user exists in database
- Verify user role is correct

### Frontend Issues

**Build failures:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for syntax errors in components
- Verify environment variables are set
- Check browser console for specific errors

**API connection errors:**
- Verify REACT_APP_API_URL is correct
- Check that backend server is running
- Ensure CORS is configured correctly
- Check browser console for CORS errors

**File upload failures:**
- Ensure Supabase Storage bucket named "evidence" exists
- Check bucket is properly configured with RLS policies
- Verify file size and type constraints
- Check backend logs for specific errors

### Database Issues

**RLS policy errors:**
- Check RLS policies in Supabase dashboard
- Verify user roles are set correctly
- Ensure JWT_SECRET matches between backend and any services
- Test with RLS disabled temporarily for debugging

**Missing tables:**
- Run `backend/supabase/complete-database-setup.sql`
- Verify all tables were created
- Check for SQL execution errors
- Verify foreign key relationships

**Storage issues:**
- Verify storage bucket exists
- Check storage policies are applied
- Ensure bucket is accessible
- Test file upload manually

### General Issues

**Environment variable validation:**
```bash
# Windows
scripts\validate-env.bat

# Linux/Mac
chmod +x scripts/validate-env.sh
./scripts/validate-env.sh
```

**Dependency issues:**
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install
```

**Port conflicts:**
- Change PORT in backend `.env`
- Kill processes using the port: `npx kill-port 5000`
- Use different ports for frontend and backend

---

## Quick Reference

### Start Development Servers

**Manual:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd Frontend
npm start
```

**Automatic (Windows):**
```bash
# Double-click start-project.bat
```

### Create Admin User

```bash
cd backend
npm run create-admin
```

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd Frontend
npm test

# All tests (from root)
npm run test:all
```

### Build for Production

```bash
# Frontend build
cd Frontend
npm run build

# All builds (from root)
npm run build:all
```

### Common Commands

```bash
# Install all dependencies
npm run install:all

# Start both in dev mode
npm run start:dev

# Validate environment variables
scripts\validate-env.bat
```

---

## Support and Resources

### Documentation Links
- [React Documentation](https://reactjs.org/)
- [Express Documentation](https://expressjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Bootstrap Documentation](https://getbootstrap.com/)

### Troubleshooting Resources
- Check browser console for frontend errors
- Check backend terminal for server errors
- Review Supabase dashboard for database issues
- Check network tab in browser dev tools for API errors

### Security Best Practices
- Never commit `.env` files to version control
- Use strong, random secrets in production
- Keep dependencies updated
- Enable RLS policies in production
- Use HTTPS for all communications
- Regular security audits

---

**Built with ❤️ for Cyber Crime Prevention**