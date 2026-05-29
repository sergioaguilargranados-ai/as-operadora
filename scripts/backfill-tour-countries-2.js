// Backfill Fase 2: Tours de región (Europa, Asia, etc.) que no tienen país 
// Les asigna la primera ciudad/país de su array o la región como main_country
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function backfill2() {
  try {
    const tours = await pool.query(`
      SELECT id, name, cities, countries, destination_region 
      FROM megatravel_packages 
      WHERE main_country IS NULL OR main_country = ''
    `)
    
    console.log(`📊 Tours restantes sin país: ${tours.rows.length}\n`)
    
    // Muestra de qué tours son
    const nameFreq = {}
    tours.rows.forEach(t => {
      const firstWord = (t.name || '').split(' ')[0]
      nameFreq[firstWord] = (nameFreq[firstWord] || 0) + 1
    })
    console.log('=== Patrón de nombres ===')
    Object.entries(nameFreq).sort((a,b) => b[1]-a[1]).forEach(([word, count]) => {
      console.log(`  ${word}: ${count}`)
    })
    
    // Estrategia: Para tours que empiezan con un continente, usar la región
    const regionMap = {
      'Europa': 'Europa (Multi-País)',
      'Asia': 'Asia (Multi-País)',
      'Africa': 'África (Multi-País)',
      'África': 'África (Multi-País)',
      'Medio': 'Medio Oriente (Multi-País)',
      'Sudamerica': 'Sudamérica (Multi-País)',
      'Sudamérica': 'Sudamérica (Multi-País)',
      'Norteamerica': 'Norteamérica (Multi-País)',
      'Norteamérica': 'Norteamérica (Multi-País)',
      'Centroamerica': 'Centroamérica (Multi-País)',
      'Centroamérica': 'Centroamérica (Multi-País)',
      'Oceania': 'Oceanía (Multi-País)',
      'Oceanía': 'Oceanía (Multi-País)',
    }
    
    let updated = 0
    let stillEmpty = 0
    
    for (const tour of tours.rows) {
      let country = null
      
      // 1. Si tiene countries array con datos, usar el primero
      if (tour.countries && Array.isArray(tour.countries) && tour.countries.length > 0 && tour.countries[0]) {
        country = tour.countries[0]
      }
      
      // 2. Si el nombre empieza con una región
      if (!country) {
        for (const [prefix, region] of Object.entries(regionMap)) {
          if ((tour.name || '').startsWith(prefix)) {
            country = region
            break
          }
        }
      }
      
      // 3. Usar destination_region si existe
      if (!country && tour.destination_region) {
        country = tour.destination_region
      }
      
      // 4. Asignar "Multi-Destino" como último recurso
      if (!country) {
        // Buscar keywords adicionales en nombre
        const name = (tour.name || '').toLowerCase()
        if (name.includes('crucero')) country = 'Crucero'
        else if (name.includes('aurora')) country = 'Canadá' 
        else if (name.includes('vikingo')) country = 'Europa (Multi-País)'
        else if (name.includes('escandinav')) country = 'Europa (Multi-País)'
        else if (name.includes('balcan')) country = 'Europa (Multi-País)'
        else if (name.includes('mediterr')) country = 'Europa (Multi-País)'
        else country = 'Multi-Destino'
      }
      
      await pool.query('UPDATE megatravel_packages SET main_country = $1 WHERE id = $2', [country, tour.id])
      updated++
      if (updated <= 15) {
        console.log(`\n  ✅ [${tour.id}] "${tour.name?.substring(0, 50)}" → ${country}`)
      }
    }
    
    console.log(`\n\n═══════════════════════════════════════════════════`)
    console.log(`📊 Resultado: ${updated} actualizados`)
    
    // Verificar final
    const remaining = await pool.query(`
      SELECT COUNT(*) as c FROM megatravel_packages 
      WHERE main_country IS NULL OR main_country = ''
    `)
    console.log(`  Tours sin país FINAL: ${remaining.rows[0].c}`)
    
    // Nuevo resumen de países
    const summary = await pool.query(`
      SELECT main_country, COUNT(*) as c 
      FROM megatravel_packages 
      GROUP BY main_country 
      ORDER BY c DESC LIMIT 15
    `)
    console.log(`\n=== Top 15 países (POST-BACKFILL) ===`)
    summary.rows.forEach(r => console.log(`  ${r.main_country}: ${r.c}`))
    console.log(`═══════════════════════════════════════════════════`)
    
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

backfill2()
