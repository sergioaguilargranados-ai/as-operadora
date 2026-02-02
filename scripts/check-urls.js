// check-urls.js - Verificar cuántos tours tienen URL
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkURLs() {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(mt_url) as con_url,
                COUNT(*) - COUNT(mt_url) as sin_url
            FROM megatravel_packages
        `);

        const stats = result.rows[0];
        console.log('📊 ESTADÍSTICAS DE URLs:');
        console.log(`   Total tours: ${stats.total}`);
        console.log(`   Con URL: ${stats.con_url}`);
        console.log(`   Sin URL: ${stats.sin_url}`);

        // Mostrar algunos ejemplos
        const examples = await pool.query(`
            SELECT id, mt_code, name, mt_url
            FROM megatravel_packages
            LIMIT 5
        `);

        console.log('\n📋 EJEMPLOS:');
        examples.rows.forEach(row => {
            console.log(`   ${row.mt_code}: ${row.mt_url || 'SIN URL'}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkURLs();
