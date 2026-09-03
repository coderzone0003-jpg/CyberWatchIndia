const { supabaseAdmin } = require('../config/supabase');
const multer = require('multer');
const path = require('path');

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const BUCKET_NAME = 'evidence';

function guessMimeType(filename) {
  const ext = path.extname(filename || '').toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * List evidence files in storage for a user folder or complaint
 */
async function listFilesForUser(userId, complaintId = null) {
  if (!userId) return [];

  const folder = complaintId ? `${userId}/${complaintId}` : String(userId);
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list(folder, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Storage list error:', error.message);
    return [];
  }

  return (data || [])
    .filter((item) => item?.name && !item.name.endsWith('/'))
    .map((item) => ({
      file_path: complaintId ? `${userId}/${complaintId}/${item.name}` : `${userId}/${item.name}`,
      file_name: item.name.replace(/^\d+_/, ''),
      file_type: guessMimeType(item.name),
      file_size: item.metadata?.size || item.metadata?.contentLength || 0,
      created_at: item.created_at || item.updated_at || null,
    }));
}

/**
 * List all files in the evidence bucket (all user folders)
 */
async function listAllBucketFiles() {
  const { data: rootItems, error: rootError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .list('', { limit: 1000 });

  if (rootError) {
    throw new Error(`Failed to list evidence bucket: ${rootError.message}`);
  }

  const allFiles = [];

  for (const item of rootItems || []) {
    if (!item?.name) continue;

    const userFiles = await listFilesForUser(item.name);
    allFiles.push(...userFiles);
  }

  return allFiles;
}

/**
 * Validate file type
 */
function isValidFileType(mimeType) {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file size
 */
function isValidFileSize(size) {
  return size <= MAX_FILE_SIZE;
}

/**
 * Sanitize filename
 */
function sanitizeFilename(filename) {
  // Remove path traversal attempts
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Add timestamp to prevent conflicts
  const timestamp = Date.now();
  const ext = path.extname(filename);
  const name = path.basename(filename, ext);
  return `${timestamp}_${name}${ext}`;
}

/**
 * Upload file to Supabase Storage
 */
async function uploadFile(file, userId, complaintId = null) {
  try {
    const sanitizedFilename = sanitizeFilename(file.originalname);
    const filePath = complaintId ? `${userId}/${complaintId}/${sanitizedFilename}` : `${userId}/${sanitizedFilename}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    // Get public URL (if bucket is public) or signed URL (if private)
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      path: filePath,
      filename: sanitizedFilename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: publicUrl
    };
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`File upload failed: ${error.message}`);
  }
}

/**
 * Delete file from Supabase Storage
 */
async function deleteFile(filePath) {
  try {
    const { error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new Error(`File deletion failed: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    throw new Error(`File deletion failed: ${error.message}`);
  }
}

/**
 * Get signed URL for private file access (valid for 1 hour by default)
 */
async function getSignedUrl(filePath, expiresIn = 3600) {
  try {
    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL generation error:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }
}

/**
 * Multer configuration for memory storage
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (!isValidFileType(file.mimetype)) {
      return cb(new Error('Invalid file type. Allowed types: ' + ALLOWED_MIME_TYPES.join(', ')));
    }
    cb(null, true);
  }
});

/**
 * Handle multiple file uploads
 */
const uploadMultiple = upload.array('evidence', 5); // Max 5 files

module.exports = {
  uploadFile,
  deleteFile,
  getSignedUrl,
  listFilesForUser,
  listAllBucketFiles,
  guessMimeType,
  upload,
  uploadMultiple,
  isValidFileType,
  isValidFileSize,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  BUCKET_NAME,
};
