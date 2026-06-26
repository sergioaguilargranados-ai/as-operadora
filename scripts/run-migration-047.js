// Ejecutar migración 047: agregar columna sections_json a la tabla mobile_app_content
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function run() {
  try {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'migrations', '047_add_sections_json_to_mobile_content.sql'),
      'utf8'
    )
    
    console.log('Ejecutando migración 047...')
    const result = await pool.query(sql)
    console.log('✅ Migración 047 ejecutada exitosamente')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

run()
