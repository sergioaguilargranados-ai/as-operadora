import { pool } from './src/lib/db';

async function run() {
    try {
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hotels'
        `);
        console.log(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
