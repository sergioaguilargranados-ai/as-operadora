/**
 * MIGRACIÓN: Sistema de verificación de email
 * Ejecutar con: node scripts/migrate-email-verification.js
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    console.log('🔄 Configurando sistema de verificación de email...');

    const client = await pool.connect();

    try {
        // 1. Agregar columnas a users
        console.log('📝 Agregando columnas a tabla users...');
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;
    `);
        console.log('✅ Columnas agregadas a users');

        // 2. Crear tabla de tokens de verificación
        console.log('📝 Creando tabla email_verification_tokens...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
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
        console.log('✅ Tabla email_verification_tokens creada');

        // 3. Crear índices
        console.log('📝 Creando índices...');
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token 
      ON email_verification_tokens(token) WHERE used = false;
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user 
      ON email_verification_tokens(user_id, expires_at);
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_verified 
      ON users(email_verified);
    `);
        console.log('✅ Índices creados');

        // 4. Marcar usuarios existentes como verificados (opcional)
        console.log('📝 Marcando usuarios existentes como verificados...');
        const result = await client.query(`
      UPDATE users 
      SET email_verified = true, 
          email_verified_at = created_at 
      WHERE email_verified IS NULL OR email_verified = false;
    `);
        console.log(`✅ ${result.rowCount} usuarios marcados como verificados`);

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
