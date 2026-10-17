
const postgres = require('postgres');
const fs = require('fs');

async function runMigration() {
  const sql = fs.readFileSync('C:/NEW/supabase/migrations/0001_init.sql', 'utf8');
  const client = postgres('postgresql://postgres:SatyamMt32Pr@db.etglswbpubgjngzxlmqg.supabase.co:5432/postgres');
  
  try {
    console.log('Applying migration...');
    // Postgres package doesn't support multi-statement strings easily with one call
    // We'll split by semicolon, but some statements (like functions) have semicolons inside.
    // A better way is to use a separate tool or run them one by one.
    // For simplicity in this script, we'll try to run the whole thing.
    await client.unsafe({ sql });
    console.log('Migration applied successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();
