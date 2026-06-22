import { query } from '../src/lib/db';

async function fixDB() {
    try {
        await query(`ALTER TABLE provider_metrics ALTER COLUMN search_type DROP NOT NULL`);
        await query(`ALTER TABLE provider_metrics ALTER COLUMN results_returned DROP NOT NULL`);
        await query(`ALTER TABLE provider_metrics ALTER COLUMN results_found DROP NOT NULL`);
        console.log("Fixed NOT NULL constraints.");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
fixDB();
