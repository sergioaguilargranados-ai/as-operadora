require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

pool.query(`
  SELECT mt_code, name, 
         main_image IS NOT NULL as has_main, 
         array_length(gallery_images,1) as gallery_count, 
         array_length(tags,1) as tags_count 
  FROM megatravel_packages 
  WHERE mt_code IN ('MT-60965','MT-60959','MT-60954') 
  ORDER BY mt_code
`).then(r => {
    console.log('\n📊 RESULTADOS EN BD:\n')
    r.rows.forEach(row => {
        console.log(`${row.mt_code}: ${row.name}`)
        console.log(`  Main image: ${row.has_main ? '✅' : '❌'}`)
        console.log(`  Gallery: ${row.gallery_count || 0} imágenes`)
        console.log(`  Tags: ${row.tags_count || 0} tags\n`)
    })
    pool.end()
})
