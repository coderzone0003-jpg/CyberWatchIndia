const { supabase } = require('./config/supabase');

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    console.log('Anon Key:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
    
    // Test connection by checking if we can query the database
    // We'll try to query a table that should exist
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('This might be because:');
      console.error('1. The table "users" does not exist yet (we will create it in Section 2)');
      console.error('2. Your Supabase credentials are incorrect');
      console.error('3. Your anon key is not the correct JWT format');
      process.exit(1);
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Database is accessible');
    console.log('User count:', data);
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testConnection();