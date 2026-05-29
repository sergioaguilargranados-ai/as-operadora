// Normalizar nombres de país duplicados
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function normalize() {
  const fixes = [
    ['Japon', 'Japón'],
    ['Cruceros', 'Crucero (Multi-Puerto)'],
    ['Medio Oriente', 'Medio Oriente (Multi-País)'],
  ]

  // No cambiar "Europa" a "Europa (Multi-País)" si ya existe "Europa (Multi-País)"
  // Normalizar "Europa" standalone
  const europaStandalone = await pool.query(
    "SELECT COUNT(*) as c FROM megatravel_packages WHERE main_country = 'Europa'"
  )
  if (parseInt(europaStandalone.rows[0].c) > 0) {
    fixes.push(['Europa', 'Europa (Multi-País)'])
  }

  for (const [oldName, newName] of fixes) {
    const r = await pool.query(
      'UPDATE megatravel_packages SET main_country = $1 WHERE main_country = $2',
      [newName, oldName]
    )
    if (r.rowCount > 0) {
      console.log(`  ${oldName} → ${newName}: ${r.rowCount} actualizados`)
    }
  }

  // Mostrar resumen final
  const summary = await pool.query(`
    SELECT main_country, COUNT(*) as c 
    FROM megatravel_packages 
    GROUP BY main_country 
    ORDER BY c DESC LIMIT 20
  `)
  console.log('\n=== Top 20 países (POST-NORMALIZACIÓN) ===')
  summary.rows.forEach(r => console.log(`  ${r.main_country}: ${r.c}`))

  await pool.end()
}

normalize()
