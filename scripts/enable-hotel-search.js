// Script: enable-hotel-search.js
// Habilita HOME_SEARCH_HOTELS en app_settings para mostrar el buscador de hoteles
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  try {
    const res = await pool.query(`
      INSERT INTO app_settings (key, value, description)
      VALUES ('HOME_SEARCH_HOTELS', 'true', 'Muestra buscador de hoteles en home')
      ON CONFLICT (key) DO UPDATE SET value = 'true';
    `)
    console.log('✅ HOME_SEARCH_HOTELS habilitado correctamente')

    // Verificar
    const check = await pool.query(`SELECT key, value FROM app_settings WHERE key = 'HOME_SEARCH_HOTELS'`)
    console.log('Valor actual:', check.rows[0])
  } catch (err) {
    console.error('❌ Error:', err.message)
  } finally {
    await pool.end()
  }
}

main()
