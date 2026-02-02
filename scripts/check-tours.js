require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
})

async function checkTours() {
    try {
        // Consultar estadísticas de tours
        const stats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN (gallery_images IS NOT NULL AND array_length(gallery_images, 1) > 0) OR main_image IS NOT NULL THEN 1 END) as with_images,
        COUNT(CASE WHEN (gallery_images IS NULL OR array_length(gallery_images, 1) IS NULL) AND main_image IS NULL THEN 1 END) as without_images,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h
      FROM megatravel_packages
    `)

        console.log('\n📊 ESTADÍSTICAS DE TOURS:')
        console.log('========================')
        console.log(`Total de tours: ${stats.rows[0].total}`)
        console.log(`Con imágenes: ${stats.rows[0].with_images}`)
        console.log(`Sin imágenes: ${stats.rows[0].without_images}`)
        console.log(`Creados últimas 24h: ${stats.rows[0].last_24h}`)

        // Mostrar algunos tours sin imágenes
        const toursWithoutImages = await pool.query(`
      SELECT mt_code, name, destination_region, created_at
      FROM megatravel_packages
      WHERE (gallery_images IS NULL OR array_length(gallery_images, 1) IS NULL) AND main_image IS NULL
      ORDER BY created_at DESC
      LIMIT 10
    `)

        console.log('\n🔍 TOURS SIN IMÁGENES (últimos 10):')
        console.log('====================================')
        toursWithoutImages.rows.forEach(tour => {
            console.log(`- ${tour.mt_code}: ${tour.name} (${tour.destination_region}) - ${new Date(tour.created_at).toLocaleString('es-MX')}`)
        })

        // Mostrar algunos tours CON imágenes
        const toursWithImages = await pool.query(`
      SELECT mt_code, name, destination_region, 
             array_length(gallery_images, 1) as num_gallery,
             CASE WHEN main_image IS NOT NULL THEN 1 ELSE 0 END as has_main
      FROM megatravel_packages
      WHERE (gallery_images IS NOT NULL AND array_length(gallery_images, 1) > 0) OR main_image IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 5
    `)

        console.log('\n✅ TOURS CON IMÁGENES (últimos 5):')
        console.log('===================================')
        toursWithImages.rows.forEach(tour => {
            const gallery = tour.num_gallery || 0
            const main = tour.has_main
            console.log(`- ${tour.mt_code}: ${tour.name} (Main: ${main ? 'Sí' : 'No'}, Gallery: ${gallery})`)
        })

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await pool.end()
    }
}

checkTours()
