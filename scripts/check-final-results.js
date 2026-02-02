/**
 * Script de prueba final: 4 tours con TODO
 * - MT-60965, MT-60959, MT-60954 (cruceros)
 * - MT-12115 (quinceañeras)
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function runFinalTest() {
    console.log('\n🎯 PRUEBA FINAL: 4 Tours Completos\n')

    const tourCodes = ['MT-60965', 'MT-60959', 'MT-60954', 'MT-12115']

    const result = await pool.query(`
    SELECT mt_code, name,
           main_image IS NOT NULL as has_main,
           array_length(gallery_images, 1) as gallery_count,
           array_length(tags, 1) as tags_count,
           tags
    FROM megatravel_packages
    WHERE mt_code = ANY($1)
    ORDER BY mt_code
  `, [tourCodes])

    console.log('📊 RESULTADOS:\n')

    result.rows.forEach(row => {
        console.log(`${row.mt_code}: ${row.name}`)
        console.log(`  Main image: ${row.has_main ? '✅' : '❌'}`)
        console.log(`  Gallery: ${row.gallery_count || 0} imágenes`)
        console.log(`  Tags: ${row.tags_count || 0}`)
        if (row.tags && row.tags.length > 0) {
            console.log(`  📌 ${row.tags.join(', ')}`)
        }
        console.log('')
    })

    await pool.end()
}

runFinalTest()
