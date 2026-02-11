require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
    const res = await p.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'bookings' ORDER BY ordinal_position");
    res.rows.forEach(c => console.log(`${c.column_name} | ${c.data_type} | nullable=${c.is_nullable}`));

    // Also check what columns are required (NOT NULL) for bookings
    console.log('\n--- Required (NOT NULL) columns ---');
    res.rows.filter(c => c.is_nullable === 'NO').forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    p.end();
}
main();
