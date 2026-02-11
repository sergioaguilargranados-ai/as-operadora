// Actualizar custom_domain del tenant M&MTravelAgency
// De: mmta.app-asoperadora.com (guión) 
// A:  mmta.app.asoperadora.com (punto)

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // Actualizar tenant
        await pool.query(`
      UPDATE tenants SET 
        custom_domain = 'mmta.app.asoperadora.com',
        updated_at = CURRENT_TIMESTAMP
      WHERE company_name = 'M&MTravelAgency'
    `);
        console.log('✅ Tenant custom_domain actualizado');

        // Verificar
        const result = await pool.query(
            "SELECT id, company_name, custom_domain FROM tenants WHERE company_name = 'M&MTravelAgency'"
        );
        console.log('📋 Resultado:', result.rows[0]);
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        pool.end();
    }
}
main();
