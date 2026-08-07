# 🔐 Supabase Authentication Setup Guide

This guide explains how to configure email verification and password reset features in your Supabase Dashboard.

---

## 📋 **Important Note**

Your project currently uses **custom authentication** (JWT-based with your own user management in the `profiles` table), NOT Supabase Auth. 

The authentication features I've implemented (forgot password, reset password, email verification) use your custom backend system with JWT tokens, **not** Supabase Auth.

**However**, if you want to migrate to Supabase Auth in the future, this guide shows you how to set it up.

---

## 🎯 **Current Implementation (Custom Auth)**

Your project currently uses:
- ✅ Custom JWT-based authentication
- ✅ Passwords stored in `profiles` table (hashed with bcrypt)
- ✅ Email verification via custom JWT tokens
- ✅ Password reset via custom JWT tokens
- ✅ All logic in `backend/routes/auth.js`

**No Supabase Dashboard configuration is needed** for the current implementation.

---

## 🔄 **Migrating to Supabase Auth (Optional)**

If you want to migrate to Supabase Auth for better security and built-in features, follow these steps:

### **Step 1: Enable Email Confirmation in Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Toggle **Confirm email** to **ON**
5. Click **Save**

### **Step 2: Configure Email Templates**

1. Navigate to **Authentication** → **Email Templates**
2. **Confirm signup** template:
   - Customize the email content
   - The link will be: `{{ .ConfirmationURL }}`
   - This redirects to your verify-email page

3. **Reset password** template:
   - Customize the email content
   - The link will be: `{{ .ConfirmationURL }}`
   - This redirects to your reset-password page

### **Step 3: Enable Email Provider**

1. Navigate to **Authentication** → **Providers**
2. Click on **Email**
3. Ensure it's enabled
4. Set **Email confirmation** to your preference

### **Step 4: Configure SMTP Settings (Optional)**

For production, you should configure custom SMTP:

1. Navigate to **Authentication** → **Email Templates**
2. Click **SMTP Settings**
3. Enter your SMTP provider details:
   - **Host**: smtp.gmail.com (for Gmail) or your provider
   - **Port**: 587 (TLS) or 465 (SSL)
   - **Username**: your email
   - **Password**: your email password or app-specific password
   - **Sender name**: Cyber Crime Portal
   - **Sender email**: noreply@yourdomain.com

### **Step 5: Update Your Application Code**

If migrating to Supabase Auth, you'll need to:

1. **Replace custom auth with Supabase Auth**:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Signup
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Reset password
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourdomain.com/reset-password',
  }
)
```

2. **Handle email confirmation**:
```javascript
// On the confirmation page
await supabase.auth.verifyOtp({
  token: searchParams.get('token'),
  type: 'email',
})
```

3. **Update password reset flow**:
```javascript
// On the reset password page
await supabase.auth.updateUser({
  password: newPassword
})
```

---

## 📧 **Current Custom Implementation (Working Now)**

Since you're using custom auth, here's how the current implementation works:

### **Forgot Password Flow**

1. User enters email on `/forgot-password`
2. Backend generates JWT reset token (1 hour expiry)
3. Backend logs the token (currently console.log)
4. **TODO**: Send email with reset link
5. User clicks link → `/reset-password?token=xyz`
6. User enters new password
7. Backend validates token and updates password

### **Email Verification Flow**

1. User registers → Backend creates account
2. Backend generates verification token (24 hour expiry)
3. **TODO**: Send email with verification link
4. User clicks link → `/verify-email?token=xyz`
5. Backend validates token and marks email as verified

### **Password Requirements**

- Minimum 12 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- No common words (password, 123456, qwerty, admin, user)
- No more than 3 repeating characters

---

## 🚀 **Adding Email Sending to Custom Implementation**

To add actual email sending to your custom implementation:

### **Option 1: Use Resend (Recommended)**

You already have Resend configured for notifications. Use it for auth emails too:

```javascript
// In backend/routes/auth.js
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/email');

// In forgot-password endpoint
await sendPasswordResetEmail({
  to: email,
  resetLink: `https://yourdomain.com/reset-password?token=${resetToken}`
});

// In register endpoint
await sendVerificationEmail({
  to: user.email,
  verificationLink: `https://yourdomain.com/verify-email?token=${verificationToken}`
});
```

### **Option 2: Use Nodemailer**

Install Nodemailer:
```bash
npm install nodemailer
```

Configure transporter:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

---

## 📝 **Summary**

### **Current Status**
- ✅ Custom JWT authentication implemented
- ✅ Password reset flow implemented (backend ready, needs email sending)
- ✅ Email verification flow implemented (backend ready, needs email sending)
- ✅ Real-time password requirements validation on register page
- ✅ Forgot password page created
- ✅ Reset password page created
- ✅ Verify email page created

### **What's Missing**
- ⚠️ **Email sending** - Currently logs tokens to console, needs email service integration
- ⚠️ **Resend integration** - Need to add auth email templates to `backend/utils/email.js`

### **Recommended Next Steps**

1. **Add email sending to auth flows** using Resend (already configured)
2. **Add email templates** to `backend/utils/email.js` for:
   - Password reset email
   - Email verification email
3. **Test the flows** end-to-end
4. **Optional**: Consider migrating to Supabase Auth for production

---

## 🔗 **Related Files**

- `backend/routes/auth.js` - Authentication endpoints
- `backend/utils/email.js` - Email sending utilities
- `backend/utils/validation.js` - Password validation rules
- `Frontend/src/pages/ForgotPassword.jsx` - Forgot password page
- `Frontend/src/pages/ResetPassword.jsx` - Reset password page
- `Frontend/src/pages/VerifyEmail.jsx` - Email verification page
- `Frontend/src/pages/Register.jsx` - Register page with real-time validation
- `Frontend/src/pages/Login.jsx` - Login page with forgot password link

---

## ✅ **Testing the Current Implementation**

### **Test Forgot Password**
1. Go to `/forgot-password`
2. Enter email
3. Check backend console for reset token
4. Manually navigate to `/reset-password?token=TOKEN`
5. Enter new password
6. Try logging in with new password

### **Test Email Verification**
1. Register a new account
2. Check backend console for verification token
3. Manually navigate to `/verify-email?token=TOKEN`
4. Verify that user is marked as verified

### **Test Password Requirements**
1. Go to `/register`
2. Start typing password
3. Watch requirements update in real-time
4. Button disabled until all requirements met

---

**No Supabase Dashboard changes needed for current implementation!** 

The current custom auth system works independently. Only configure Supabase Auth if you decide to migrate.