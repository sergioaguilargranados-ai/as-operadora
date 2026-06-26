const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(
      'UPDATE users SET role = $1 WHERE email = $2',
      ['CLIENT', 'test_cliente@ejemplo.com']
    );
    console.log('✅ Role updated successfully to CLIENT.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    pool.end();
  }
}

run();
