import { query } from '../src/lib/db';

async function test() {
    try {
        const res = await query(`SELECT id, provider_id, name, image_url FROM hotels LIMIT 5;`);
        console.log("HOTELS:", res.rows);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
