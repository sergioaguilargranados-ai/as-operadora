/**
 * MIGRACIÓN DE BASE DE DATOS
 * Agregar columnas para tracking de correos enviados
 * 
 * Ejecutar con: node scripts/migrate-email-tracking-simple.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log('🔄 Iniciando migración de tracking de correos...');

    const client = await pool.connect();

    try {
        // 1. Agregar columnas a group_quotes
        console.log('📝 Agregando columnas a group_quotes...');
        await client.query(`
      ALTER TABLE group_quotes 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;
    `);
        console.log('✅ Columnas agregadas a group_quotes');

        // 2. Agregar columnas a bookings
        console.log('📝 Agregando columnas a bookings...');
        await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS pre_trip_reminder_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS pre_trip_reminder_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS survey_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS survey_sent_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS survey_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS return_date DATE;
    `);
        console.log('✅ Columnas agregadas a bookings');

        // 3. Crear índices para mejorar performance
        console.log('📝 Creando índices...');

        // Índice para group_quotes
        try {
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_group_quotes_reminder 
        ON group_quotes(valid_until, reminder_sent) WHERE status = 'quoted';
      `);
            console.log('✅ Índice creado para group_quotes');
        } catch (e) {
            console.log('⚠️ No se pudo crear índice para group_quotes (puede que la columna status no exista)');
        }

        // Índices para bookings
        try {
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_pre_trip 
        ON bookings(travel_date, pre_trip_reminder_sent);
      `);
            console.log('✅ Índice creado para pre_trip_reminder');
        } catch (e) {
            console.log('⚠️ No se pudo crear índice para pre_trip_reminder');
        }

        try {
            await client.query(`
        CREATE INDEX IF NOT EXISTS idx_bookings_survey 
        ON bookings(return_date, survey_sent);
      `);
            console.log('✅ Índice creado para survey');
        } catch (e) {
            console.log('⚠️ No se pudo crear índice para survey');
        }

        console.log('✅ Índices completados');

        console.log('🎉 Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Ejecutar migración
migrate()
    .then(() => {
        console.log('✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
