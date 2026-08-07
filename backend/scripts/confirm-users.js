const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');

async function confirmAllUsers() {
  console.log('Fetching unconfirmed users...');
  
  try {
    // Note: We can't easily query unconfirmed users directly via the JS client listUsers,
    // so we'll just fetch all users and update them if needed, or use the admin API
    const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) throw error;
    
    const unconfirmedUsers = users.filter(user => !user.email_confirmed_at);
    
    if (unconfirmedUsers.length === 0) {
      console.log('✅ All users are already confirmed.');
      return;
    }
    
    console.log(`Found ${unconfirmedUsers.length} unconfirmed users. Auto-confirming them now...`);
    
    for (const user of unconfirmedUsers) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (updateError) {
        console.error(`❌ Failed to confirm user ${user.email}:`, updateError.message);
      } else {
        console.log(`✅ Confirmed user: ${user.email}`);
      }
    }
    
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

confirmAllUsers();
