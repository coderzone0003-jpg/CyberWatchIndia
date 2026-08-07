# 🔐 Cyber Crime Reporting Portal

A comprehensive web application for reporting and tracking cyber crimes in India, built with React, Node.js, Express, and Supabase.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### **User Features**
- 📝 Submit cyber crime complaints with evidence uploads
- 🔍 Track complaint status with unique tracking ID
- 👤 User registration and authentication
- 🔔 Real-time notifications for status updates
- 📧 Email notifications for complaint updates
- 🔒 Secure password management with reset functionality
- 📊 View personal complaint statistics and history

### **Admin Features**
- 📈 Advanced analytics and reporting
- 👥 User and officer management
- 🎯 Complaint assignment to officers
- 📊 Workload tracking for officers
- 🔍 Server-side search and filtering
- 📄 Export reports as PDF/Excel
- 📝 Comprehensive audit log viewer
- 🔐 Role-based access control

### **Security Features**
- 🔒 JWT-based authentication
- 🛡️ Rate limiting and security headers
- 🚫 XSS protection and input sanitization
- 📱 Password strength requirements
- 🔐 Role-based permissions
- 📝 Complete audit logging

---

## � Tech Stack

### **Frontend**
- React 19
- React Router DOM 7
- Bootstrap 5
- Bootstrap Icons
- Supabase JS Client

### **Backend**
- Node.js
- Express.js
- Supabase (PostgreSQL)
- JWT (jsonwebtoken)
- bcryptjs (password hashing)
- Multer (file uploads)
- Morgan (request logging)
- pdfkit (PDF generation)
- exceljs (Excel generation)
- Resend (email service)

### **Database**
- Supabase (PostgreSQL)
- RLS (Row Level Security)
- Supabase Storage (file uploads)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Supabase Account** - [Sign up](https://supabase.com/)
- **Resend Account** (for emails) - [Sign up](https://resend.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd cyberwatch india
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

---

## ⚙️ Environment Configuration

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

## 🗄 Database Setup

### 1. Create Supabase Project

1. Go to [Supabase.com](https://supabase.com/)
2. Click "New Project"
3. Enter project name and password
4. Wait for project to be created

### 2. Run Database Schema

Navigate to your Supabase project:
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `backend/supabase/schema.sql`
3. Paste and run the SQL script

This will create:
- `profiles` table (users)
- `complaints` table
- `categories` table
- `evidence` table (evidence files)
- `notifications` table
- `audit_logs` table
- `contact_messages` table
- Required indexes
- RLS policies

### 3. Run RLS Policies (Optional)

For enhanced security, run the RLS policies:

```bash
# In Supabase SQL Editor
-- Copy and run backend/supabase/enhanced-rls.sql
```

### 4. Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click "New Bucket"
3. Name it: `evidence`
4. Make it **Public** (for now, or use signed URLs for private)
5. Save

### 5. Get Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (for backend only)

### 6. Configure Resend (Email)

1. Go to [Resend.com](https://resend.com/)
2. Create an account
3. Get your API key from API Keys section
4. Add domain (or use resend.dev for testing)
5. Copy API key to backend `.env`

---

## 🏃 Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

### Start Frontend Development Server

In a new terminal:

```bash
cd Frontend
npm start
```

Frontend will run on `http://localhost:3000`

### Create Admin User

```bash
cd backend
npm run create-admin
```

Follow the prompts to create an admin account.

---

## 🧪 Testing

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

## 📁 Project Structure

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
│   │   ├── schema.sql           # Database schema
│   │   └── enhanced-rls.sql     # RLS policies
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
│   ├── .env                     # Your environment (gitignored)
│   ├── package.json
│   ├── server.js                # Server entry point
│   └── jest.config.js           # Jest configuration
├── Frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Notifications.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   ├── MyComplaints.jsx
│   │   │   ├── ReportCrime.jsx
│   │   │   ├── TrackComplaint.jsx
│   │   │   ├── ComplaintDetails.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── ManageComplaints.jsx
│   │   │   ├── ManageUsers.jsx
│   │   │   ├── ManageOfficers.jsx
│   │   │   ├── ManageCategories.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   └── Settings.jsx
│   │   ├── utils/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── setupTests.js
│   │   └── index.js
│   ├── .env.example             # Environment template
│   ├── .env                     # Your environment (gitignored)
│   ├── package.json
│   └── README.md
└── README.md                    # This file
```

---

## 📡 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/password-requirements` - Get password rules
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email

### Complaint Endpoints

- `POST /api/complaints` - Create complaint
- `GET /api/complaints/:id` - Get complaint by ID
- `GET /api/complaints/my` - Get user's complaints
- `PUT /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `GET /api/complaints/:id/evidence` - Get complaint evidence
- `DELETE /api/complaints/:id/evidence/:evidenceId` - Delete evidence

### Admin Endpoints

- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/reports` - Analytics reports
- `GET /api/admin/complaints` - Get all complaints
- `GET /api/admin/users` - Get all users
- `GET /api/admin/officers` - Get officers with workload
- `POST /api/admin/officers` - Create officer
- `PUT /api/admin/complaints/:id/assign` - Assign officer
- `GET /api/admin/export/pdf` - Export PDF
- `GET /api/admin/export/excel` - Export Excel
- `GET /api/admin/audit-logs` - Get audit logs

### Health Check

- `GET /ping` - Basic health check
- `GET /health` - Database health check

---

## 🔧 Troubleshooting

### Backend Won't Start

**Problem**: Server fails to start with "Missing required environment variables"

**Solution**:
```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

### Database Connection Error

**Problem**: "Supabase connection failed"

**Solution**:
1. Verify SUPABASE_URL and keys in `.env`
2. Check Supabase project is active
3. Test connection: `curl http://localhost:5000/health`

### Frontend API Errors

**Problem**: "Network Error" or CORS errors

**Solution**:
1. Verify `REACT_APP_API_URL` in Frontend `.env`
2. Verify `FRONTEND_URL` in backend `.env`
3. Ensure backend is running on port 5000

### File Upload Fails

**Problem**: "File upload failed"

**Solution**:
1. Create `evidence` bucket in Supabase Storage
2. Make bucket public or configure RLS
3. Check MAX_FILE_SIZE in `.env`

### Email Not Sending

**Problem**: "Email service error"

**Solution**:
1. Verify RESEND_API_KEY in `.env`
2. Check Resend API key is valid
3. Verify RESEND_FROM_EMAIL is configured

### Tests Failing

**Problem**: Jest tests fail

**Solution**:
```bash
cd backend
npm test -- --verbose
# Check specific error messages
```

---

## 📚 Additional Documentation

- [Notification Setup Guide](NOTIFICATION_SETUP_GUIDE.md)
- [API Integration Summary](API_INTEGRATION_SUMMARY.md)
- [Auth Features Summary](AUTH_FEATURES_SUMMARY.md)
- [Features Implementation Summary](FEATURES_IMPLEMENTATION_SUMMARY.md)
- [Admin Features Summary](ADMIN_FEATURES_SUMMARY.md)
- [Supabase Auth Setup Guide](SUPABASE_AUTH_SETUP_GUIDE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🆘 Support

For issues and questions:
- Check the troubleshooting section
- Review additional documentation
- Open an issue on GitHub

---

**Built with ❤️ for Cyber Crime Prevention**#   c y b e r i n d i a  
 #   c y b e r W a t c h  
 