// check-progress.js - Verificar progreso del scraping
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkProgress() {
    try {
        console.log('\n📊 PROGRESO DEL SCRAPING\n');
        console.log('='.repeat(60));

        // Total de tours
        const totalResult = await pool.query('SELECT COUNT(*) FROM megatravel_packages');
        const total = parseInt(totalResult.rows[0].count);

        // Tours con precio
        const priceResult = await pool.query('SELECT COUNT(*) FROM megatravel_packages WHERE pricing IS NOT NULL AND (pricing->\'totalPrice\')::numeric > 0');
        const withPrice = parseInt(priceResult.rows[0].count);

        // Tours actualizados recientemente (últimos 10 minutos)
        const recentResult = await pool.query(`
            SELECT COUNT(*) FROM megatravel_packages 
            WHERE updated_at > NOW() - INTERVAL '10 minutes'
        `);
        const recentUpdates = parseInt(recentResult.rows[0].count);

        console.log(`Total de tours: ${total}`);
        console.log(`Tours con precio: ${withPrice} (${((withPrice / total) * 100).toFixed(1)}%)`);
        console.log(`Actualizados en últimos 10 min: ${recentUpdates}`);
        console.log('='.repeat(60));

        // Últimos 5 tours actualizados
        const lastUpdated = await pool.query(`
            SELECT mt_code, name, 
                   (pricing->>'totalPrice')::numeric as price,
                   updated_at
            FROM megatravel_packages
            ORDER BY updated_at DESC
            LIMIT 5
        `);

        console.log('\n📋 Últimos 5 tours actualizados:\n');
        lastUpdated.rows.forEach((tour, idx) => {
            const time = new Date(tour.updated_at).toLocaleTimeString('es-MX');
            console.log(`   ${idx + 1}. ${tour.mt_code}: $${tour.price || 'N/A'} USD (${time})`);
        });

        console.log('\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkProgress();
