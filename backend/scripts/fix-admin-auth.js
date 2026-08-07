const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');

async function fixAdminAuth() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberportal.gov';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
  
  console.log(`Setting up Supabase Auth for admin: ${adminEmail}`);

  // Try to create the user in auth.users
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('already been registered')) {
      console.log('User already exists in auth.users. Updating password to ensure it matches...');
      // Fetch the user ID to update password
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === adminEmail);
      
      if (existingUser) {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          { password: adminPassword, email_confirm: true }
        );
        if (updateError) {
          console.error('Failed to update password:', updateError.message);
        } else {
          console.log(`✅ Admin password updated to: ${adminPassword}`);
        }
      }
    } else {
      console.error('Error creating auth user:', error.message);
    }
  } else {
    console.log(`✅ Created admin in auth.users with password: ${adminPassword}`);
  }
}

fixAdminAuth();
