const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { supabaseAdmin } = require('../config/supabase');

async function testInsert() {
  console.log('Testing complaint insert...');
  
  // Get a valid user ID and category ID
  const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1);
  const { data: categories } = await supabaseAdmin.from('categories').select('id').limit(1);
  
  if (!users.length || !categories.length) {
    console.log('Need users and categories in DB.');
    return;
  }
  
  const payload = {
    title: 'Test Complaint Title',
    description: 'This is a test description that is long enough.',
    category_id: categories[0].id,
    severity: 'medium',
    user_id: users[0].id,
    location: 'Test Location',
    incident_date: '2023-01-01'
  };
  
  console.log('Payload:', payload);
  
  const { data, error } = await supabaseAdmin
    .from('complaints')
    .insert([payload])
    .select();
    
  if (error) {
    console.error('Insert Failed:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insert Succeeded:', data);
  }
}

testInsert();
