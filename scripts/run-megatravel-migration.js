// Script para ejecutar migración de MegaTravel
// Ejecutar con: node scripts/run-megatravel-migration.js

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Conectando a la base de datos...');

        const sqlPath = path.join(__dirname, '..', 'migrations', '016_create_megatravel_packages.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📄 Ejecutando migración 016_create_megatravel_packages.sql...');

        await pool.query(sql);

        console.log('✅ Migración completada exitosamente');

        // Verificar tablas creadas
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'megatravel%'
            ORDER BY table_name
        `);

        console.log('\n📋 Tablas MegaTravel creadas:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

    } catch (error) {
        console.error('❌ Error en migración:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
