import { query } from '../src/lib/db';

async function test() {
    try {
        const res = await query(`
            SELECT column_name, column_default, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_name = 'provider_metrics';
        `);
        console.log("SCHEMA:", res.rows);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
