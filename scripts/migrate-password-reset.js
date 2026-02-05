/**
 * MIGRACIÓN: Tabla de tokens de recuperación de contraseña
 * Ejecutar con: node scripts/migrate-password-reset.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log('🔄 Creando tabla de tokens de recuperación...');

    const client = await pool.connect();

    try {
        // Crear tabla de tokens de reset
        await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT false,
        used_at TIMESTAMP,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ Tabla password_reset_tokens creada');

        // Crear índices
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
      ON password_reset_tokens(token) WHERE used = false;
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user 
      ON password_reset_tokens(user_id, expires_at);
    `);
        console.log('✅ Índices creados');

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
