import { query } from '../src/lib/db';

async function test() {
    try {
        const res = await query(`
            SELECT constraint_name, constraint_type 
            FROM information_schema.table_constraints 
            WHERE table_name = 'hotels';
        `);
        console.log("CONSTRAINTS:", res.rows);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
test();
