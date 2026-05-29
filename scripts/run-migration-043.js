// Ejecutar migración 043: slogan en tenants
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
      path.join(process.cwd(), 'migrations', '043_add_slogan_to_tenants.sql'),
      'utf8'
    )
    
    console.log('Ejecutando migración 043...')
    const result = await pool.query(sql)
    console.log('✅ Migración 043 ejecutada exitosamente')
    
    // Mostrar resultado
    if (result && result.length) {
      const lastResult = result[result.length - 1]
      if (lastResult.rows) {
        console.log('\nTenants actualizados:')
        lastResult.rows.forEach(r => console.log(`  [${r.id}] ${r.company_name}: "${r.slogan}"`))
      }
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

run()
