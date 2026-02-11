require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const tables = ['agency_commissions', 'agency_commission_config', 'commission_by_service', 'commission_tiers', 'referral_clicks', 'referral_conversions', 'agency_clients', 'tenant_users'];

    for (const t of tables) {
        const res = await pool.query(
            "SELECT column_name FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position",
            [t]
        );
        if (res.rows.length > 0) {
            console.log(t + ': ' + res.rows.map(r => r.column_name).join(', '));
        } else {
            console.log(t + ': NOT FOUND');
        }
    }
    pool.end();
}
main().catch(e => { console.error(e.message); pool.end(); });
