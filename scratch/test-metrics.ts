import { query } from '../src/lib/db';

async function test() {
    try {
        const res = await query(`SELECT * FROM provider_metrics ORDER BY created_at DESC LIMIT 10`);
        console.log("METRICS:", res.rows);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
