const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');

async function checkOrphans() {
  console.log('--- Auth Users vs Profiles Check ---');
  
  // Get all auth users
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error('Error fetching auth users:', authError);
    return;
  }
  
  // Get all profiles
  const { data: profiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*');
    
  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }
  
  console.log(`Total Auth Users: ${users.length}`);
  console.log(`Total Profiles: ${profiles.length}`);
  
  const authUserIds = new Set(users.map(u => u.id));
  const profileIds = new Set(profiles.map(p => p.id));
  
  const orphanedAuthUsers = users.filter(u => !profileIds.has(u.id));
  const orphanedProfiles = profiles.filter(p => !authUserIds.has(p.id));
  
  console.log('\n--- Orphaned Auth Users (in auth.users but no profile) ---');
  if (orphanedAuthUsers.length === 0) console.log('None! ✅');
  else orphanedAuthUsers.forEach(u => console.log(`- ${u.email} (${u.id})`));
  
  console.log('\n--- Orphaned Profiles (in profiles but no auth.users) ---');
  if (orphanedProfiles.length === 0) console.log('None! ✅');
  else orphanedProfiles.forEach(p => console.log(`- ${p.email} (${p.id})`));
}

checkOrphans();
