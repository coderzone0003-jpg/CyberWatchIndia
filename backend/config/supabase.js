const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase credentials are configured
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('⚠️  WARNING: Supabase credentials not configured!');
  console.error('Please set up your .env file with SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY');
  console.error('See SETUP_GUIDE.md for detailed instructions');
}

// Create Supabase client with anon key (for client operations - respects RLS)
const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key');

// Create Supabase admin client with service role key (for admin operations - bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseServiceKey || 'placeholder-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Storage will be accessed through the admin client for file operations
const storage = supabaseAdmin.storage;

module.exports = { supabase, supabaseAdmin, storage };
