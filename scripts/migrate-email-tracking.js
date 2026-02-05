/**
 * MIGRACIÓN DE BASE DE DATOS
 * Agregar columnas para tracking de correos enviados
 * 
 * Ejecutar con: node scripts/migrate-email-tracking.js
 */

import { query } from '../src/lib/db.js';

async function migrate() {
    console.log('🔄 Iniciando migración de tracking de correos...');

    try {
        // 1. Agregar columnas a group_quotes
        console.log('📝 Agregando columnas a group_quotes...');
        await query(`
      ALTER TABLE group_quotes 
      ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;
    `);
        console.log('✅ Columnas agregadas a group_quotes');

        // 2. Agregar columnas a bookings
        console.log('📝 Agregando columnas a bookings...');
        await query(`
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
        await query(`
      CREATE INDEX IF NOT EXISTS idx_group_quotes_reminder 
      ON group_quotes(status, valid_until, reminder_sent);
    `);
        await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_pre_trip 
      ON bookings(status, travel_date, pre_trip_reminder_sent);
    `);
        await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_survey 
      ON bookings(status, return_date, survey_sent);
    `);
        console.log('✅ Índices creados');

        console.log('🎉 Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
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
