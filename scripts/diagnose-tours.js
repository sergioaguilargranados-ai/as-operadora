// Diagnóstico tours v2 — corregido para manejar tipo de cities
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function diagnose() {
  try {
    console.log('═══════════════════════════════════════════════════')
    console.log('🗺️  DIAGNÓSTICO DEL SISTEMA DE TOURS')
    console.log('═══════════════════════════════════════════════════\n')

    // 1. Total de paquetes
    const total = await pool.query('SELECT COUNT(*) as count FROM megatravel_packages')
    console.log(`Total paquetes: ${total.rows[0].count}\n`)

    // 2. Tipo de la columna cities
    const colType = await pool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'megatravel_packages' 
      AND column_name IN ('cities', 'countries', 'main_country', 'image_url', 'price_usd', 'days')
      ORDER BY column_name
    `)
    console.log('=== Tipos de columna ===')
    colType.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.udt_name})`))

    // 3. Datos faltantes
    console.log('\n=== Datos faltantes ===')
    const noCountry = await pool.query(`SELECT COUNT(*) as c FROM megatravel_packages WHERE main_country IS NULL OR main_country = ''`)
    const noImage = await pool.query(`SELECT COUNT(*) as c FROM megatravel_packages WHERE image_url IS NULL OR image_url = ''`)
    const noPrice = await pool.query(`SELECT COUNT(*) as c FROM megatravel_packages WHERE price_usd IS NULL OR price_usd = 0`)
    const noDays = await pool.query(`SELECT COUNT(*) as c FROM megatravel_packages WHERE days IS NULL OR days = 0`)
    console.log(`  Sin país principal: ${noCountry.rows[0].c}`)
    console.log(`  Sin imagen: ${noImage.rows[0].c}`)
    console.log(`  Sin precio: ${noPrice.rows[0].c}`)
    console.log(`  Sin duración: ${noDays.rows[0].c}`)

    // 4. Top países
    console.log('\n=== Top 10 países ===')
    const countries = await pool.query(`
      SELECT main_country, COUNT(*) as count 
      FROM megatravel_packages 
      WHERE main_country IS NOT NULL AND main_country != ''
      GROUP BY main_country 
      ORDER BY count DESC LIMIT 10
    `)
    countries.rows.forEach(r => console.log(`  ${r.main_country}: ${r.count}`))

    // 5. Imágenes genéricas
    console.log('\n=== Imágenes genéricas ===')
    const generic = await pool.query(`
      SELECT tour_code, SUBSTRING(title, 1, 40) as title, image_url 
      FROM megatravel_packages 
      WHERE image_url IS NOT NULL AND image_url != '' AND (
        image_url LIKE '%placeholder%' OR image_url LIKE '%generic%'
      ) LIMIT 5
    `)
    console.log(`  Encontradas: ${generic.rows.length}`)
    generic.rows.forEach(r => console.log(`  ⚠️ [${r.tour_code}] ${r.title}`))

    // 6. Muestra de tours sin país
    console.log('\n=== Muestra sin país (debug) ===')
    const noPais = await pool.query(`
      SELECT tour_code, SUBSTRING(title, 1, 50) as title, cities, countries 
      FROM megatravel_packages 
      WHERE main_country IS NULL OR main_country = ''
      LIMIT 5
    `)
    noPais.rows.forEach(r => console.log(`  [${r.tour_code}] ${r.title} — cities: ${JSON.stringify(r.cities)} — countries: ${JSON.stringify(r.countries)}`))

    // 7. Tablas de soporte
    console.log('\n=== Tablas de soporte ===')
    for (const table of ['megatravel_itinerary', 'megatravel_departures', 'megatravel_policies', 'megatravel_additional_info']) {
      try {
        const count = await pool.query(`SELECT COUNT(*) as c FROM ${table}`)
        console.log(`  ✅ ${table}: ${count.rows[0].c} registros`)
      } catch {
        console.log(`  ❌ ${table}: NO EXISTE`)
      }
    }

    // 8. Últimos actualizados
    console.log('\n=== Últimos 5 actualizados ===')
    const recent = await pool.query(`
      SELECT tour_code, SUBSTRING(title, 1, 40) as title, main_country, days, price_usd, updated_at
      FROM megatravel_packages ORDER BY updated_at DESC LIMIT 5
    `)
    recent.rows.forEach(r => console.log(`  [${r.tour_code}] ${r.title} — ${r.main_country || '?'} — ${r.days}d — $${r.price_usd} — ${new Date(r.updated_at).toLocaleDateString('es-MX')}`))

    // 9. Conteo itinerarios
    console.log('\n=== Cobertura ===')
    const withItin = await pool.query(`SELECT COUNT(DISTINCT package_id) as c FROM megatravel_itinerary`)
    console.log(`  Con itinerario: ${withItin.rows[0].c} de ${total.rows[0].count}`)
    const withDepart = await pool.query(`SELECT COUNT(DISTINCT package_id) as c FROM megatravel_departures`)
    console.log(`  Con fechas salida: ${withDepart.rows[0].c} de ${total.rows[0].count}`)

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

diagnose()
