const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  try {
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'device_tokens'
      );
    `);
    console.log('device_tokens exists?', res.rows[0].exists);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
checkTable();
