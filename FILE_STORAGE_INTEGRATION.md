# File Storage Integration - Complete Setup

## **OVERVIEW**

This document explains the complete file storage integration for the Cyber Crime Portal using Supabase Storage. Files are uploaded through the Express backend (for security) and stored in a private Supabase Storage bucket with signed URLs for access.

---

## **STEP 1: BUCKET CREATION (Manual)**

### **Steps:**

1. **Go to Supabase Dashboard**
   - Navigate to [supabase.com](https://supabase.com)
   - Open your project `izyuptpacbnshbgeygux`

2. **Create Storage Bucket**
   - Click on **Storage** icon in the left sidebar
   - Click **"New bucket"** button
   - Fill in:
     - **Name**: `evidence`
     - **Public bucket**: **NO** (private for security)
     - **File size limit**: Keep default (50MB for free tier)
     - **Allowed MIME types**: Leave empty (we validate in code)
   - Click **"Create bucket"**

### **Why Private?**

- **Security**: Evidence files contain sensitive personal information
- **Access Control**: Private buckets work with Row Level Security policies
- **Signed URLs**: We generate temporary secure links (1-hour expiry)
- **Compliance**: Better for data protection regulations

---

## **STEP 2: BACKEND INTEGRATION**

### **Files Modified:**

1. **`backend/utils/fileUpload.js`** - File upload logic
2. **`backend/utils/database.js`** - Evidence operations
3. **`backend/routes/complaints.js`** - API endpoints

### **Key Features:**

#### **File Upload (`fileUpload.js`)**

```javascript
// Uploads file to Supabase Storage
async function uploadFile(file, userId) {
  const sanitizedFilename = sanitizeFilename(file.originalname);
  const filePath = `${userId}/${sanitizedFilename}`;
  
  const { data, error } = await supabaseAdmin
    .storage
    .from('evidence')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });
  
  return {
    path: filePath,
    filename: sanitizedFilename,
    url: publicUrl
  };
}
```

**Validation:**
- File types: images (jpeg, png, gif, webp), PDF, text, Word, Excel
- Max size: 10MB per file
- Max files: 5 per complaint
- Filename sanitization (prevents path traversal)

#### **Signed URL Generation**

```javascript
// Generates temporary secure link (1 hour expiry)
async function getSignedUrl(filePath, expiresIn = 3600) {
  const { data, error } = await supabaseAdmin
    .storage
    .from('evidence')
    .createSignedUrl(filePath, expiresIn);
  
  return data.signedUrl;
}
```

#### **File Deletion**

```javascript
// Deletes file from both storage and database
async function deleteById(id) {
  // Get file path
  const { data: file } = await supabaseAdmin
    .from('evidence_files')
    .select('file_path')
    .eq('id', id)
    .single();
  
  // Delete from storage
  await deleteFile(file.file_path);
  
  // Delete from database
  await supabaseAdmin
    .from('evidence_files')
    .delete()
    .eq('id', id);
}
```

### **API Endpoints Added:**

#### **1. Create Complaint with Evidence**
```
POST /api/complaints
Content-Type: multipart/form-data

Body:
- title, description, category_id, etc.
- evidence[] (files, max 5)
```

#### **2. Get Evidence for Complaint**
```
GET /api/complaints/:id/evidence
Authorization: Bearer <token>

Response:
{
  "evidence": [
    {
      "id": "...",
      "file_path": "...",
      "file_name": "...",
      "file_type": "...",
      "file_size": 12345,
      "signed_url": "https://..." // 1-hour expiry
    }
  ]
}
```

#### **3. Delete Evidence**
```
DELETE /api/complaints/:id/evidence/:evidenceId
Authorization: Bearer <token>
```

---

## **STEP 3: FRONTEND INTEGRATION**

### **Files Modified:**

1. **`Frontend/src/pages/ReportCrime.jsx`** - File upload UI
2. **`Frontend/src/pages/TrackComplaint.jsx`** - Evidence display
3. **`Frontend/src/utils/api.js`** - API method

### **Report Crime Page**

**File Selection:**
```javascript
const handleFileChange = (e) => {
  const files = Array.from(e.target.files);
  
  // Validate file count (max 5)
  if (uploadedFiles.length + files.length > 5) {
    setError('Maximum 5 files allowed');
    return;
  }
  
  // Validate file sizes (10MB max)
  const maxSize = 10 * 1024 * 1024;
  const validFiles = files.filter(file => {
    if (file.size > maxSize) {
      setError(`File ${file.name} is too large (max 10MB)`);
      return false;
    }
    return true;
  });
  
  // Validate file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  // ... validation logic
  
  setUploadedFiles(prev => [...prev, ...validFiles]);
};
```

**Upload:**
```javascript
const submissionData = new FormData();
submissionData.append('title', formData.title);
submissionData.append('description', formData.description);
// ... other fields

// Add files
uploadedFiles.forEach((file) => {
  submissionData.append('evidence', file);
});

const response = await api.createComplaint(submissionData);
```

### **Track Complaint Page**

**Fetch Evidence:**
```javascript
const fetchEvidence = async (complaintId) => {
  setLoadingEvidence(true);
  try {
    const data = await api.getComplaintEvidence(complaintId);
    setEvidence(data.evidence || []);
  } catch (err) {
    console.error('Failed to fetch evidence:', err);
  } finally {
    setLoadingEvidence(false);
  }
};
```

**Display Evidence:**
```javascript
{evidence.map((file, index) => (
  <a
    key={index}
    href={file.signed_url}
    target="_blank"
    rel="noopener noreferrer"
    className="list-group-item"
  >
    <i className="bi bi-file-earmark me-2"></i>
    {file.file_name}
    <small className="text-muted d-block">
      {(file.file_size / 1024).toFixed(2)} KB • {file.file_type}
    </small>
  </a>
))}
```

---

## **STEP 4: SECURITY CONSIDERATIONS**

### **Why Upload Through Backend?**

1. **Authentication**: Only authenticated users can upload
2. **Validation**: Server-side validation of file types and sizes
3. **Service Role Key**: Used safely on backend only
4. **Audit Trail**: All uploads logged in audit_logs table
5. **Rate Limiting**: Upload endpoints rate-limited

### **Access Control:**

- **Users**: Can only upload to their own folder (`userId/`)
- **Users**: Can only view evidence for their own complaints
- **Officers**: Can view evidence for all complaints
- **Admins**: Can view and delete any evidence

### **RLS Policies:**

The storage policies (from `storage-policies.sql`) ensure:
- Authenticated users can upload
- Users can only view their own files
- Officers and admins can view all files
- Admins can delete any files

---

## **STEP 5: CLEANUP**

### **Automatic Cleanup:**

When a complaint is deleted (by admin):
- Evidence files are deleted from Supabase Storage
- Database records are removed
- Audit log is created

### **Manual Cleanup:**

Users can delete individual evidence files via:
```
DELETE /api/complaints/:id/evidence/:evidenceId
```

---

## **TESTING THE INTEGRATION**

### **Test 1: Upload Evidence**

1. Start backend: `cd backend && npm start`
2. Start frontend: `cd Frontend && npm start`
3. Login as a user
4. Go to "Report Crime"
5. Fill in complaint details
6. Select 1-3 files (images or PDF)
7. Submit complaint
8. Verify complaint is created with tracking ID

**Expected Result:**
- Complaint created successfully
- Files uploaded to Supabase Storage
- Evidence records created in database
- Tracking ID displayed (e.g., CYB-2026-00001)

### **Test 2: View Evidence**

1. Go to "Track Complaint"
2. Enter the tracking ID from Test 1
3. Click "Search"
4. Verify evidence files are displayed
5. Click on a file to download/view

**Expected Result:**
- Evidence files displayed with signed URLs
- Files can be downloaded/viewed
- File name, size, and type shown

### **Test 3: Delete Evidence**

1. Login as admin
2. Go to Manage Complaints
3. Open a complaint with evidence
4. Delete an evidence file
5. Verify file is removed from list

**Expected Result:**
- File deleted from Supabase Storage
- Database record removed
- Audit log entry created

### **Test 4: Admin View All Evidence**

1. Login as admin
2. Go to Manage Complaints
3. Open any complaint
4. Verify evidence is visible (even if not owned by admin)

**Expected Result:**
- Admin can see all evidence files
- Signed URLs generated successfully

---

## **TROUBLESHOOTING**

### **Issue: Upload fails with "File upload failed"**

**Solutions:**
1. Verify storage bucket `evidence` exists in Supabase
2. Check bucket is not public (should be private)
3. Verify service role key is correct in backend/.env
4. Check file size doesn't exceed 10MB
5. Verify file type is allowed

### **Issue: Signed URL generation fails**

**Solutions:**
1. Verify bucket is private (signed URLs only work with private buckets)
2. Check service role key is correct
3. Verify file path exists in storage
4. Check RLS policies are applied

### **Issue: Evidence not displayed**

**Solutions:**
1. Check browser console for errors
2. Verify API endpoint is correct
3. Check user has permission to view evidence
4. Verify evidence records exist in database

### **Issue: File deletion fails**

**Solutions:**
1. Verify user has permission (admin or file owner)
2. Check file path is correct in database
3. Verify file exists in storage
4. Check RLS policies allow deletion

---

## **FILE STRUCTURE**

```
backend/
├── config/
│   └── supabase.js              # Supabase client config
├── routes/
│   └── complaints.js            # API endpoints (with evidence routes)
├── utils/
│   ├── database.js              # Database operations (evidence table)
│   └── fileUpload.js            # File upload logic

Frontend/src/
├── pages/
│   ├── ReportCrime.jsx          # Upload UI
│   └── TrackComplaint.jsx       # Evidence display
└── utils/
    └── api.js                   # API methods
```

---

## **NEXT STEPS**

After implementing file storage:

1. ✅ Create storage bucket in Supabase Dashboard
2. ✅ Test file upload functionality
3. ✅ Test evidence display in Track Complaint
4. ✅ Test evidence deletion
5. ✅ Verify signed URLs work correctly
6. ⏳ Implement Supabase Auth (replace Express auth)
7. ⏳ Add progress indicator for uploads
8. ⏳ Add drag-and-drop file upload
9. ⏳ Add image preview before upload

---

**The file storage integration is now complete and ready for testing!**