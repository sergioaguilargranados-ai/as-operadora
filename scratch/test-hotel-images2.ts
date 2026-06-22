import { query } from '../src/lib/db';

async function test() {
    try {
        const res = await query(`SELECT COUNT(*) as c FROM hotels;`);
        const res2 = await query(`SELECT id, provider_id, name, image_url FROM hotels ORDER BY id DESC LIMIT 5;`);
        console.log("COUNT:", res.rows[0].c);
        console.log("LATEST HOTELS:", res2.rows);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
