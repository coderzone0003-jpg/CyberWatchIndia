# 🚀 Production Deployment Guide

This guide provides step-by-step instructions for deploying the Cyber Crime Portal to production.

---

## 📋 Overview

**Recommended Deployment Stack:**
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

**Total: $0 - $7/month** depending on platform choice.

---

## 🎯 Step 1: Prepare for Deployment

### 1.1 Update Environment Variables

**Backend (.env):**
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

**Frontend (.env):**
```env
REACT_APP_API_URL=https://your-backend-domain.onrender.com
```

### 1.2 Test Production Build Locally

```bash
# Backend
cd backend
npm test
NODE_ENV=production npm start

# Frontend
cd Frontend
npm test
npm run build
```

### 1.3 Create Git Repository

```bash
git init
git add .
git commit -m "Initial commit for production deployment"
```

Push to GitHub (required for all platforms):
```bash
git remote add origin https://github.com/your-username/cyberwatch-india.git
git push -u origin main
```

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com/)
2. Sign up with GitHub (recommended)
3. Authorize Vercel to access your GitHub repository

### 2.2 Deploy Frontend

1. Click "Add New Project"
2. Select your GitHub repository: `cyberwatch-india`
3. Configure project settings:

**Root Directory:**
```
Frontend
```

**Build Command:**
```
npm run build
```

**Output Directory:**
```
build
```

**Environment Variables:**
```
REACT_APP_API_URL = https://your-backend-domain.onrender.com
```

4. Click "Deploy"
5. Wait for deployment to complete (2-3 minutes)
6. Your frontend will be available at: `https://your-project-name.vercel.app`

### 2.3 Update Backend CORS

After frontend deployment, update backend `.env`:
```env
FRONTEND_URL=https://your-project-name.vercel.app
```

---

## 🔧 Step 3: Deploy Backend to Render

### 3.1 Create Render Account

1. Go to [render.com](https://render.com/)
2. Sign up with GitHub
3. Authorize Render to access your GitHub repository

### 3.2 Deploy Backend as Web Service

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository: `cyberwatch-india`
4. Configure settings:

**Name:**
```
cyberwatch-backend
```

**Root Directory:**
```
backend
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Environment Variables:**
```
PORT = 5000
NODE_ENV = production
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
JWT_SECRET = your-production-secret-min-32-characters
FRONTEND_URL = https://your-project-name.vercel.app
RESEND_API_KEY = re_your-resend-api-key
RESEND_FROM_EMAIL = noreply@yourdomain.com
MAX_FILE_SIZE = 10485760
```

5. Click "Create Web Service"
6. Wait for deployment (3-5 minutes)
7. Your backend will be available at: `https://cyberwatch-backend.onrender.com`

### 3.3 Update Frontend API URL

After backend deployment, update frontend environment variables in Vercel:
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Update `REACT_APP_API_URL` to your Render backend URL
5. Redeploy frontend

---

## 🚄 Alternative: Deploy Backend to Railway

### 1. Create Railway Account

1. Go to [railway.app](https://railway.app/)
2. Sign up with GitHub
3. Authorize Railway to access your GitHub repository

### 2. Deploy Backend

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your repository: `cyberwatch-india`
4. Configure:

**Root Directory:**
```
backend
```

**Build Command:**
```
npm install
```

**Start Command:**
```
npm start
```

**Environment Variables:**
Add all the same variables as Render (see Step 3.2)

5. Click "Deploy"
6. Your backend will be available at Railway's provided URL

---

## 🗄 Step 4: Configure Supabase (Already Hosted)

Supabase is already hosted, but verify these settings:

### 4.1 Update CORS Settings

1. Go to Supabase Dashboard → Project Settings → API
2. Add your frontend URL to CORS allowed origins:
   ```
   https://your-project-name.vercel.app
   ```

### 4.2 Configure Storage Bucket

1. Go to Storage → evidence bucket
2. Ensure bucket is public or configured with RLS
3. Test file upload functionality

### 4.3 Verify Database Schema

1. Go to SQL Editor
2. Run schema.sql if not already done
3. Verify all tables exist:
   - profiles
   - complaints
   - categories
   - evidence
   - notifications
   - audit_logs
   - contact_messages

---

## 📧 Step 5: Configure Resend (Email)

### 5.1 Verify API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Copy your API key
3. Ensure it's set in backend environment variables

### 5.2 Configure Domain (Optional)

For production email:
1. Go to Resend → Domains
2. Add your custom domain (e.g., `noreply@yourdomain.com`)
3. Follow DNS verification steps
4. Update `RESEND_FROM_EMAIL` in backend env vars

### 5.3 Test Email Sending

```bash
# Test email endpoint
curl -X POST https://your-backend.onrender.com/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

---

## 🔐 Step 6: Create Admin User

After deployment, create your admin account:

### Option 1: Via SSH (Render/Railway)

1. Go to Render/Railway dashboard
2. Open web shell/SSH
3. Run:
```bash
cd /opt/render/project/src/backend
npm run create-admin
```

### Option 2: Via Temporary Route

Add a temporary admin creation route, create admin, then remove it:

```javascript
// In backend/routes/admin.js (temporary)
router.post('/create-temp-admin', async (req, res) => {
  const { name, email, password } = req.body;
  // Create admin logic
  // Remove this route after creating admin
});
```

### Option 3: Direct Database Insert

1. Go to Supabase SQL Editor
2. Run:
```sql
INSERT INTO profiles (full_name, email, password, role, is_active)
VALUES (
  'Admin Name',
  'admin@example.com',
  'hashed_password_here', -- Use bcrypt to hash
  'admin',
  true
);
```

---

## ✅ Step 7: Verify Deployment

### 7.1 Health Checks

**Backend:**
```bash
curl https://your-backend.onrender.com/ping
# Expected: {"status":"ok","message":"Server is running"}

curl https://your-backend.onrender.com/health
# Expected: {"status":"healthy","database":"connected"}
```

**Frontend:**
1. Open your Vercel URL
2. Verify page loads
3. Check browser console for errors

### 7.2 Test Critical Flows

1. **User Registration**
   - Navigate to `/register`
   - Create a test account
   - Verify email sent (check Resend logs)

2. **User Login**
   - Navigate to `/login`
   - Login with test account
   - Verify dashboard loads

3. **Create Complaint**
   - Navigate to `/report`
   - Submit a test complaint
   - Verify complaint appears in My Complaints

4. **Admin Login**
   - Login with admin account
   - Verify admin dashboard loads
   - Check all admin features work

### 7.3 Check Logs

**Render:**
- Go to Render dashboard
- Select your web service
- Click "Logs" tab
- Check for errors

**Vercel:**
- Go to Vercel dashboard
- Select your project
- Click "Logs" tab
- Check for errors

---

## 🔄 Step 8: Set Up Continuous Deployment

### Frontend (Vercel)

Vercel automatically deploys on push to main branch.

To enable preview deployments:
1. Go to Vercel project settings
2. Enable "Preview Deployments"
3. Every PR will get a preview URL

### Backend (Render)

Render automatically deploys on push to main branch.

To configure:
1. Go to Render web service settings
2. Configure branch: `main`
3. Enable "Auto-deploy"

---

## 📊 Step 9: Monitor and Maintain

### 9.1 Set Up Monitoring

**Render:**
- Go to Metrics tab
- Monitor CPU, memory, response time
- Set up alerts

**Vercel:**
- Go to Analytics tab
- Monitor page views, errors
- Set up alerts

**Supabase:**
- Go to Database → Logs
- Monitor database queries
- Check storage usage

### 9.2 Regular Backups

Supabase automatically backs up daily. Verify:
1. Go to Supabase Dashboard → Database → Backups
2. Ensure backups are running
3. Set up point-in-time recovery if needed

### 9.3 Update Dependencies

Regularly update dependencies:
```bash
# Backend
cd backend
npm audit fix
npm update

# Frontend
cd Frontend
npm audit fix
npm update
```

---

## 🚨 Step 10: Security Checklist

### Before Going Live:

- [ ] Change JWT_SECRET to a strong random value
- [ ] Remove all test data from database
- [ ] Enable RLS policies in Supabase
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up domain names (optional)
- [ ] Configure custom email domain
- [ ] Enable rate limiting (already configured)
- [ ] Remove temporary admin creation route
- [ ] Test all security features
- [ ] Set up monitoring alerts
- [ ] Configure error tracking (optional: Sentry)

---

## 🌍 Step 11: Custom Domain (Optional)

### Frontend (Vercel)

1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `cyberwatch.gov.in`)
3. Follow DNS instructions
4. Enable HTTPS (automatic)

### Backend (Render)

1. Go to Render web service → Settings → Domains
2. Add your domain (e.g., `api.cyberwatch.gov.in`)
3. Follow DNS instructions
4. Enable HTTPS (automatic)

---

## 📝 Environment Variables Summary

### Frontend (Vercel)

```
REACT_APP_API_URL = https://your-backend.onrender.com
```

### Backend (Render/Railway)

```
PORT = 5000
NODE_ENV = production
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = your-anon-key
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key
JWT_SECRET = your-production-secret-min-32-characters
FRONTEND_URL = https://your-project-name.vercel.app
RESEND_API_KEY = re_your-resend-api-key
RESEND_FROM_EMAIL = noreply@yourdomain.com
MAX_FILE_SIZE = 10485760
```

### Supabase (Already Configured)

- Project URL
- API Keys
- Storage Bucket
- Database Schema

---

## 🆘 Troubleshooting Deployment

### Backend Deployment Fails

**Problem**: Build fails on Render

**Solution**:
1. Check Render logs for specific error
2. Ensure all dependencies are in package.json
3. Verify Node.js version compatibility
4. Check for missing environment variables

### Frontend Shows API Errors

**Problem**: "Network Error" in browser

**Solution**:
1. Verify backend is running
2. Check REACT_APP_API_URL is correct
3. Verify CORS is configured in backend
4. Check browser console for specific error

### File Upload Fails

**Problem**: "File upload failed" error

**Solution**:
1. Verify Supabase storage bucket exists
2. Check bucket is public or RLS configured
3. Verify MAX_FILE_SIZE is set correctly
4. Check Supabase API keys are valid

### Email Not Sending

**Problem**: No emails received

**Solution**:
1. Check Resend API key is valid
2. Verify RESEND_FROM_EMAIL is configured
3. Check Resend dashboard for email logs
4. Verify email templates are correct

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Supabase Documentation](https://supabase.com/docs)
- [Resend Documentation](https://resend.com/docs)

---

## ✅ Deployment Complete!

Your Cyber Crime Portal is now live!

**Next Steps:**
1. Test all functionality thoroughly
2. Monitor logs and metrics
3. Set up alerting
4. Plan regular maintenance
5. Update documentation as needed

**Congratulations! 🎉**