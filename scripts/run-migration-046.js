// Ejecutar migración 046: agregar columna logo_mobile_url a tenants
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
      path.join(process.cwd(), 'migrations', '046_add_logo_mobile_to_tenants.sql'),
      'utf8'
    )
    
    console.log('Ejecutando migración 046...')
    const result = await pool.query(sql)
    console.log('✅ Migración 046 ejecutada exitosamente')
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

run()
