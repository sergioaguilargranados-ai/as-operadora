require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        // Check tenants table schema
        const cols = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tenants' ORDER BY ordinal_position"
        );
        console.log('=== TENANTS TABLE COLUMNS ===');
        cols.rows.forEach(row => console.log(`  ${row.column_name} - ${row.data_type}`));

        // Check white_label_config schema
        const wlCols = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'white_label_config' ORDER BY ordinal_position"
        );
        console.log('\n=== WHITE_LABEL_CONFIG COLUMNS ===');
        wlCols.rows.forEach(row => console.log(`  ${row.column_name} - ${row.data_type}`));

        // Check existing tenants
        const tenants = await pool.query("SELECT id, company_name, tenant_type, is_active FROM tenants LIMIT 10");
        console.log('\n=== EXISTING TENANTS ===');
        tenants.rows.forEach(row => console.log(`  [${row.id}] ${row.company_name} (${row.tenant_type}) active=${row.is_active}`));

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
    }
}
main();
