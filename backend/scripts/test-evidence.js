const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function testEvidence() {
  console.log('Testing evidence_files table...');
  const { data, error } = await supabaseAdmin.from('evidence_files').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success, table exists and is accessible. Data:', data);
  }
}

testEvidence();
