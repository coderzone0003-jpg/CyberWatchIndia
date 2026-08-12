require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');
const { complaintOperations, evidenceOperations } = require('../utils/database');
const { listAllBucketFiles } = require('../utils/fileUpload');

async function syncEvidenceFromStorage() {
  console.log('Syncing evidence files from Supabase storage bucket to evidence_files table...\n');

  const { error: tableError } = await supabaseAdmin
    .from('evidence_files')
    .select('id')
    .limit(1);

  if (tableError) {
    console.error('ERROR: evidence_files table is missing.');
    console.error('Run this SQL in Supabase SQL Editor first:');
    console.error('  backend/supabase/create-evidence-table.sql\n');
    process.exit(1);
  }

  const bucketFiles = await listAllBucketFiles();
  console.log(`Found ${bucketFiles.length} file(s) in storage bucket.`);

  if (bucketFiles.length === 0) {
    console.log('No files to sync.');
    return;
  }

  const complaints = await complaintOperations.getAll();
  const complaintsByUser = complaints.reduce((acc, complaint) => {
    if (!acc[complaint.user_id]) acc[complaint.user_id] = [];
    acc[complaint.user_id].push(complaint);
    return acc;
  }, {});

  Object.values(complaintsByUser).forEach((list) => {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  });

  let created = 0;
  let skipped = 0;

  for (const file of bucketFiles) {
    const userId = file.file_path.split('/')[0];
    const userComplaints = complaintsByUser[userId] || [];

    if (userComplaints.length === 0) {
      console.warn(`Skip (no complaint): ${file.file_path}`);
      skipped += 1;
      continue;
    }

    const complaint = userComplaints[userComplaints.length - 1];

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('evidence_files')
      .select('id')
      .eq('complaint_id', complaint.id)
      .eq('file_path', file.file_path)
      .maybeSingle();

    if (existingError) {
      console.error(`Check failed for ${file.file_path}:`, existingError.message);
      skipped += 1;
      continue;
    }

    if (existing) {
      skipped += 1;
      continue;
    }

    const { error: insertError } = await supabaseAdmin.from('evidence_files').insert([
      {
        complaint_id: complaint.id,
        file_path: file.file_path,
        file_name: file.file_name,
        file_type: file.file_type,
        file_size: file.file_size,
        uploaded_by: userId,
      },
    ]);

    if (insertError) {
      console.error(`Insert failed for ${file.file_path}:`, insertError.message);
      skipped += 1;
      continue;
    }

    console.log(`Linked: ${file.file_path} -> ${complaint.tracking_id}`);
    created += 1;
  }

  console.log(`\nDone. Created ${created}, skipped ${skipped}.`);
}

syncEvidenceFromStorage()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Sync failed:', err);
    process.exit(1);
  });
