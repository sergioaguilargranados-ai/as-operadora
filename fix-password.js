const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('password123', salt);
    
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [hash, 'test_cliente@ejemplo.com']
    );
    console.log('✅ Password hash updated successfully.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    pool.end();
  }
}

run();
