const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function updateProviders() {
  try {
    const res = await pool.query(`UPDATE crm_contacts SET contact_type = 'provider' WHERE notes LIKE 'Provee:%'`);
    console.log('Updated rows:', res.rowCount);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
updateProviders();
