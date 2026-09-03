require('dotenv').config();
const fs = require('fs');
const path = require('path');

function getProjectRef() {
  const url = process.env.SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = getProjectRef();

  if (!password || !ref) {
    return null;
  }

  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

async function setupContactTable() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'create-contact-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const ref = getProjectRef();
  const databaseUrl = getDatabaseUrl();

  console.log('Setting up contact_messages table in Supabase...\n');

  if (!databaseUrl) {
    console.log('NOTICE: No direct database connection string configured in backend/.env.');
    console.log('Run the SQL script directly in Supabase SQL Editor:');
    console.log(`  https://supabase.com/dashboard/project/${ref || 'YOUR_PROJECT'}/sql/new`);
    console.log(`  File: backend/supabase/create-contact-table.sql\n`);
    return;
  }

  let pg;
  try {
    pg = require('pg');
  } catch {
    console.error('Missing "pg" package.');
    return;
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres.');
    await client.query(sql);
    console.log('contact_messages table created successfully in Supabase!\n');
  } catch (err) {
    console.error('Setup failed:', err.message);
  } finally {
    await client.end();
  }
}

setupContactTable()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
