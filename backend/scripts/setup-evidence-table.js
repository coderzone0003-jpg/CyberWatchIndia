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

async function runSql(client, sql) {
  await client.query(sql);
}

async function setupEvidenceTable() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'create-evidence-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const ref = getProjectRef();
  const databaseUrl = getDatabaseUrl();

  console.log('Setting up evidence_files table in Supabase...\n');

  if (!databaseUrl) {
    console.error('Cannot connect to Postgres automatically.');
    console.error('');
    console.error('Option A — add to backend/.env and run again:');
    console.error('  SUPABASE_DB_PASSWORD=your-database-password');
    console.error('  (from Supabase Dashboard → Project Settings → Database → Database password)');
    console.error('');
    console.error('Option B — run SQL manually in Supabase SQL Editor:');
    console.error(`  https://supabase.com/dashboard/project/${ref || 'YOUR_PROJECT'}/sql/new`);
    console.error(`  File: backend/supabase/create-evidence-table.sql`);
    console.error('');
    console.error('After the table exists, run: npm run sync-evidence');
    process.exit(1);
  }

  let pg;
  try {
    pg = require('pg');
  } catch {
    console.error('Missing "pg" package. Run: npm install');
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres.');
    await runSql(client, sql);
    console.log('evidence_files table and storage bucket are ready.\n');
  } catch (err) {
    console.error('Setup failed:', err.message);
    if (/password authentication failed/i.test(err.message)) {
      console.error('Check SUPABASE_DB_PASSWORD in backend/.env');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupEvidenceTable()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
