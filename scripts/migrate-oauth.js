/**
 * MIGRACIÓN: Agregar soporte para OAuth
 * Ejecutar con: node scripts/migrate-oauth.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log('🔄 Agregando soporte para OAuth...');

    const client = await pool.connect();

    try {
        // Agregar columnas para OAuth
        console.log('📝 Agregando columnas a users...');
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(50),
      ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    `);
        console.log('✅ Columnas agregadas');

        // Crear índice
        console.log('📝 Creando índice...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_oauth 
      ON users(oauth_provider, oauth_id);
    `);
        console.log('✅ Índice creado');

        console.log('🎉 Migración completada exitosamente');

    } catch (error) {
        console.error('❌ Error en migración:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate()
    .then(() => {
        console.log('✅ Proceso completado');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    });
