import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const message = 'Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${message}. Set these in Vercel environment variables before building.`);
  }
  console.error(`WARNING: ${message}`);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export default supabase;