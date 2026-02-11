// Check Phase 2 tables in detail
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
    try {
        // Check if users has tenant_id
        const userCols = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name IN ('tenant_id','agent_id','referral_code')"
        );
        console.log('=== USERS: tenant/agent cols ===');
        console.log(userCols.rows.length > 0 ? userCols.rows.map(r => r.column_name).join(', ') : '❌ No tiene tenant_id/agent_id');

        // agency_clients
        const ac = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='agency_clients' ORDER BY ordinal_position"
        );
        console.log('\n=== AGENCY_CLIENTS ===');
        ac.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // agency_commission_config
        const acc = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='agency_commission_config' ORDER BY ordinal_position"
        );
        console.log('\n=== AGENCY_COMMISSION_CONFIG ===');
        acc.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // agency_commissions_summary
        const acs = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='agency_commissions_summary' ORDER BY ordinal_position"
        );
        console.log('\n=== AGENCY_COMMISSIONS_SUMMARY ===');
        acs.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // commission_by_service
        const cbs = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='commission_by_service' ORDER BY ordinal_position"
        );
        console.log('\n=== COMMISSION_BY_SERVICE ===');
        cbs.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // commission_tiers
        const ct = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='commission_tiers' ORDER BY ordinal_position"
        );
        console.log('\n=== COMMISSION_TIERS ===');
        ct.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // batch_payments
        const bp = await pool.query(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='batch_payments' ORDER BY ordinal_position"
        );
        console.log('\n=== BATCH_PAYMENTS ===');
        bp.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

        // Count existing data
        const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM tenants) as tenants_count,
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM tenant_users) as tenant_users_count,
        (SELECT COUNT(*) FROM bookings) as bookings_count,
        (SELECT COUNT(*) FROM agency_commissions) as commissions_count,
        (SELECT COUNT(*) FROM agency_clients) as agency_clients_count
    `);
        console.log('\n=== DATA COUNTS ===');
        const c = counts.rows[0];
        console.log(`  Tenants: ${c.tenants_count}`);
        console.log(`  Users: ${c.users_count}`);
        console.log(`  Tenant Users: ${c.tenant_users_count}`);
        console.log(`  Bookings: ${c.bookings_count}`);
        console.log(`  Commissions: ${c.commissions_count}`);
        console.log(`  Agency Clients: ${c.agency_clients_count}`);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        pool.end();
    }
}
main();
