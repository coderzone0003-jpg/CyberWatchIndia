const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');

async function createAdminUser() {
  try {
    console.log('Creating admin user via Supabase Auth...');
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cyberportal.gov';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';
    
    // Step 1: Check if admin already exists in Supabase Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = users.find(u => u.email === adminEmail);

    if (existingAuthUser) {
      console.log('Admin auth user already exists:', adminEmail);
      console.log('Updating password to match .env...');

      // Update password in Supabase Auth
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAuthUser.id,
        { password: adminPassword, email_confirm: true }
      );
      if (updateError) throw updateError;
      console.log('✅ Auth password updated.');

      // Ensure profile exists and has admin role
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();

      if (!profile) {
        // Profile missing — create it
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .insert({
            id: existingAuthUser.id,
            full_name: adminName,
            email: adminEmail,
            role: 'admin',
            is_active: true
          });
        if (insertError) throw insertError;
        console.log('✅ Admin profile created.');
      } else {
        // Profile exists — ensure role is admin
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({ role: 'admin', is_active: true })
          .eq('id', existingAuthUser.id);
        if (updateProfileError) throw updateProfileError;
        console.log('✅ Admin profile updated.');
      }
    } else {
      // Step 2: Create new admin user in Supabase Auth
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          role: 'admin'
        }
      });

      if (createError) throw createError;
      console.log('✅ Admin auth user created:', newUser.user.id);

      // The on_auth_user_created trigger should auto-create the profile.
      // Wait a moment for the trigger to execute.
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify profile was created and update role to admin
      const { error: updateRoleError } = await supabaseAdmin
        .from('profiles')
        .update({ role: 'admin', is_active: true })
        .eq('id', newUser.user.id);

      if (updateRoleError) {
        console.warn('⚠️  Could not update role via trigger profile. Creating profile manually...');
        const { error: insertError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: newUser.user.id,
            full_name: adminName,
            email: adminEmail,
            role: 'admin',
            is_active: true
          });
        if (insertError) throw insertError;
      }
      console.log('✅ Admin profile ready.');
    }

    console.log('\n--- Admin Credentials ---');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Role: admin');
    console.log('\n⚠️  IMPORTANT: Save these credentials securely!');
    console.log('⚠️  Change the password after first login!\n');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
