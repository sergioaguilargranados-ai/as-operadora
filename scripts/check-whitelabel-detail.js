// Script para verificar estructura de tenants y White-Label configs
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function check() {
  try {
    // 1. Columnas de tenants
    console.log('=== Columnas de tabla tenants ===')
    const tenantCols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tenants'
      ORDER BY ordinal_position
    `)
    tenantCols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type}) ${c.is_nullable === 'YES' ? 'nullable' : 'required'}`))

    // 2. Tenants existentes (sin subdomain)
    console.log('\n=== Tenants existentes ===')
    const tenants = await pool.query(`SELECT * FROM tenants ORDER BY id`)
    tenants.rows.forEach(t => {
      console.log(`  ID: ${t.id}`)
      Object.keys(t).forEach(k => {
        if (t[k] !== null && t[k] !== undefined) {
          console.log(`    ${k}: ${t[k]}`)
        }
      })
      console.log('  ---')
    })

    // 3. White-Label configs
    console.log('\n=== White-Label Configs ===')
    const wlConfigs = await pool.query(`SELECT * FROM white_label_config ORDER BY id`)
    wlConfigs.rows.forEach(c => {
      console.log(`  Config ID: ${c.id} — Tenant ID: ${c.tenant_id}`)
      Object.keys(c).forEach(k => {
        if (c[k] !== null && c[k] !== undefined && k !== 'id') {
          console.log(`    ${k}: ${c[k]}`)
        }
      })
      console.log('  ---')
    })

    // 4. TenantService — verificar qué columnas usa
    console.log('\n=== Columnas white_label_config ===')
    const wlCols = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'white_label_config'
      ORDER BY ordinal_position
    `)
    wlCols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`))

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

check()
