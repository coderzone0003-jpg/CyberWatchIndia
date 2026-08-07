const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize client with ANON key (simulating frontend)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const { supabaseAdmin } = require('../config/supabase');

async function testRegistrationFlow() {
  const testEmail = `testuser${Math.floor(Math.random() * 10000)}@gmail.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`[Step 1] Attempting to register ${testEmail} via Supabase Auth...`);
  
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: {
      full_name: 'E2E Test User',
      phone: '1234567890'
    }
  });

  if (authError) {
    console.error('❌ Registration failed:', authError.message);
    return;
  }
  
  console.log('✅ Registration successful. User ID:', authData.user.id);
  
  console.log('[Step 2] Waiting 2 seconds for trigger to execute...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('[Step 3] Verifying if profile was auto-created in profiles table...');
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();
    
  if (profileError || !profile) {
    console.error('❌ Profile not found! The auto-create trigger failed or does not exist.');
    console.error(profileError);
  } else {
    console.log('✅ Profile found! Trigger works correctly.');
    console.log('Profile Role:', profile.role);
    console.log('Profile Name:', profile.full_name);
  }
  
  console.log('\n[Cleanup] Deleting test user...');
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  // Also clean up profile in case cascade delete fails
  await supabaseAdmin.from('profiles').delete().eq('id', authData.user.id);
  console.log('✅ Cleanup complete.');
}

testRegistrationFlow();
