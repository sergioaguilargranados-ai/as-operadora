// Script para ejecutar migraciones de MegaTravel
// Ejecuta las migraciones 020-023 para agregar tablas de itinerario, fechas, políticas e info adicional

require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
    const migrations = [
        '020_create_megatravel_itinerary.sql',
        '021_create_megatravel_departures.sql',
        '022_create_megatravel_policies.sql',
        '023_create_megatravel_additional_info.sql'
    ];

    console.log('🚀 Ejecutando migraciones de MegaTravel...\n');

    for (const migration of migrations) {
        try {
            const filePath = path.join(__dirname, '..', 'migrations', migration);
            const sql = fs.readFileSync(filePath, 'utf8');

            console.log(`📝 Ejecutando: ${migration}`);
            await pool.query(sql);
            console.log(`✅ Completado: ${migration}\n`);
        } catch (error) {
            console.error(`❌ Error en ${migration}:`, error.message);
            throw error;
        }
    }

    console.log('✅ Todas las migraciones completadas exitosamente!\n');

    // Verificar tablas creadas
    const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'megatravel_%'
        ORDER BY table_name
    `);

    console.log('📊 Tablas MegaTravel en la base de datos:');
    result.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
    });

    await pool.end();
}

runMigrations().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
});
