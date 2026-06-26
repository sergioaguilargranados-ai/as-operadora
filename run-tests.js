const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    console.log('Running DATOS_PRUEBA_ITINERARIO.sql...');
    const sql = fs.readFileSync('DATOS_PRUEBA_ITINERARIO.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Test data inserted successfully.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    pool.end();
  }
}

run();
