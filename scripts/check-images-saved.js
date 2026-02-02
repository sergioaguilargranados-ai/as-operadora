/**
 * Validación: ¿Qué imágenes estamos capturando vs las disponibles?
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function checkImages() {
    console.log('\n📊 VALIDACIÓN DE IMÁGENES GUARDADAS\n')

    const result = await pool.query(`
    SELECT mt_code, name, main_image, gallery_images
    FROM megatravel_packages
    WHERE mt_code IN ('MT-60965', 'MT-60959', 'MT-60954')
    ORDER BY mt_code
  `)

    result.rows.forEach(row => {
        console.log(`${row.mt_code}: ${row.name}`)
        console.log(`  Main: ${row.main_image || 'NULL'}`)
        console.log(`  Gallery (${row.gallery_images?.length || 0}):`)
        if (row.gallery_images && row.gallery_images.length > 0) {
            row.gallery_images.forEach((img, i) => {
                console.log(`    ${i + 1}. ${img}`)
            })
        }
        console.log('')
    })

    await pool.end()
}

checkImages()
