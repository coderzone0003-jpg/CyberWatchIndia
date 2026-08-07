const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { supabaseAdmin } = require('../config/supabase');

const newCategories = [
  'Cyber Crime',
  'Online Fraud',
  'Phishing',
  'UPI/Banking Fraud',
  'Identity Theft',
  'Social Media Crime',
  'Hacking',
  'Data Theft',
  'Cyber Bullying',
  'Fake Website/App',
  'OTP Fraud',
  'Investment Scam',
  'Job Scam',
  'E-commerce Fraud',
  'Other'
];

async function syncCategories() {
  console.log('Syncing crime categories...');
  
  try {
    // 1. Get existing categories
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('categories')
      .select('name');
      
    if (fetchError) throw fetchError;
    
    const existingNames = existing.map(c => c.name);
    
    // 2. Insert missing categories
    const missing = newCategories.filter(c => !existingNames.includes(c));
    if (missing.length > 0) {
      console.log(`Inserting ${missing.length} new categories...`);
      const { error: insertError } = await supabaseAdmin
        .from('categories')
        .insert(missing.map(name => ({ name })));
        
      if (insertError) throw insertError;
    }
    
    // 3. Deactivate old categories that are not in the new list
    const old = existingNames.filter(c => !newCategories.includes(c));
    if (old.length > 0) {
      console.log(`Deactivating ${old.length} old categories...`);
      const { error: updateError } = await supabaseAdmin
        .from('categories')
        .update({ is_active: false })
        .in('name', old);
        
      if (updateError) throw updateError;
    }
    
    console.log('✅ Categories synced successfully.');
    
  } catch (error) {
    console.error('Error syncing categories:', error);
  }
}

syncCategories();
