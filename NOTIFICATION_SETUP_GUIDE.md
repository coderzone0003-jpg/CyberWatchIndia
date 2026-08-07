# 🔔 Notification System Setup Guide

## 📧 Email Service Setup (Resend.com)

### **Step 1: Sign Up for Resend**
1. Go to [https://resend.com](https://resend.com)
2. Click "Sign Up" and create an account
3. Verify your email address
4. **Free Tier**: 3,000 emails/month (perfect for development/testing)

### **Step 2: Get Your API Key**
1. Go to [https://resend.com/api-keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name like "Cyber Crime Portal"
4. Copy the API key (starts with `re_`)

### **Step 3: Configure Environment Variables**
Add these to your `backend/.env` file:

```bash
# Email Configuration (Resend)
RESEND_API_KEY=re_your_actual_api_key_here
FROM_EMAIL=noreply@cyberportal.gov
FROM_NAME=Cyber Crime Portal
```

### **Step 4: Verify Your Domain (for Production)**
For development, Resend allows sending from any email. For production:
1. Go to [https://resend.com/domains](https://resend.com/domains)
2. Add your domain (e.g., `cyberportal.gov`)
3. Add DNS records as instructed by Resend
4. Wait for DNS propagation (usually 1-24 hours)

### **Step 5: Test Email Sending**
You can test email sending without a real domain using Resend's free tier.

---

## 🗄️ Database Updates

### **Run the Updated Schema**
Since we modified the notifications table structure, run this in your Supabase SQL Editor:

```sql
-- Drop existing notifications table (WARNING: This will delete existing notifications)
DROP TABLE IF EXISTS notifications CASCADE;

-- Create updated notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    related_complaint_id UUID REFERENCES complaints(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_complaint_id ON notifications(related_complaint_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can insert notifications"
ON notifications FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
```

---

## 🧪 Testing the Notification System

### **Test 1: Create a Complaint**
1. Login as a regular user
2. Submit a new complaint
3. **Expected**: 
   - ✅ In-app notification appears
   - ✅ Email sent to user's email (check spam folder)

### **Test 2: Update Complaint Status**
1. Login as admin
2. Go to "Manage Complaints"
3. Change a complaint status from "pending" to "under investigation"
4. **Expected**:
   - ✅ User receives in-app notification
   - ✅ User receives email about status change

### **Test 3: Assign Officer**
1. Login as admin
2. Assign an officer to a complaint
4. **Expected**:
   - ✅ Officer receives in-app notification
   - ✅ Officer receives email about assignment

### **Test 4: Notification Bell**
1. Login as any user
2. Check the bell icon in the navbar
3. **Expected**:
   - ✅ Shows unread count badge
   - ✅ Clicking opens dropdown with notifications
   - ✅ Clicking "Mark all as read" clears the badge

---

## 🔧 Troubleshooting

### **Email Not Sending**
1. Check that `RESEND_API_KEY` is set in `.env`
2. Verify the API key is correct (starts with `re_`)
3. Check backend logs for email errors
4. Ensure your Resend account is active

### **Notifications Not Appearing**
1. Check that the notifications table exists in Supabase
2. Verify RLS policies are correctly set
3. Check browser console for API errors
4. Ensure the user is properly authenticated

### **RLS Policy Issues**
If you get permission errors:
```sql
-- Temporarily disable RLS for testing (NOT recommended for production)
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
```

---

## 📊 Notification Types

The system supports 4 notification types:

1. **`info`** - General information (blue)
2. **`success`** - Successful operations (green)
3. **`warning`** - Warnings (yellow)
4. **`error`** - Errors (red)

---

## 🔄 How Notifications Work

### **Automatic Triggers**
- **Complaint Created** → User gets confirmation email + in-app notification
- **Status Changed** → User gets email + in-app notification
- **Officer Assigned** → Officer gets email + in-app notification

### **Manual Notifications**
You can create custom notifications in your routes:

```javascript
await notificationOperations.create({
  user_id: userId,
  title: 'Custom Title',
  message: 'Custom message here',
  type: 'info',
  related_complaint_id: complaintId
});
```

---

## 🚀 Production Checklist

Before going to production:

- [ ] Verify your domain is properly configured in Resend
- [ ] Update `FROM_EMAIL` to your actual domain
- [ ] Test email delivery with real email addresses
- [ ] Set up proper DNS records for your domain
- [ ] Monitor email deliverability
- [ ] Set up email bounces and complaint handling
- [ ] Configure email rate limits (Resend handles this automatically)

---

## 📧 Alternative Email Services

If you prefer not to use Resend, you can easily swap to:

1. **SendGrid** - More established, 100 emails/day free
2. **Mailgun** - 5,000 emails/month free trial
3. **AWS SES** - Very cheap at scale, but complex setup
4. **Postmark** - Focused on transactional emails

To switch services, just update `backend/utils/email.js` with the new service's SDK.

---

## 🎯 Next Steps

1. **Set up Resend account** and get API key
2. **Update backend/.env** with your API key
3. **Run the database schema updates** in Supabase
4. **Test the notification system** with a real complaint
5. **Monitor email delivery** in Resend dashboard

The notification system is now fully integrated and ready to use!