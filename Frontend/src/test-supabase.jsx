import { supabase } from './config/supabase';

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
    console.log('Anon Key:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
    
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      console.error('This might be because the table "users" does not exist yet');
      console.error('We will create it in Section 2: Authentication Setup');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Database is accessible');
      console.log('User count:', data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test when component mounts
testConnection();