/**
 * Script de prueba: Scraping completo con MUESTRA de 3 tours
 * Valida imágenes y clasificaciones (versión standalone)
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// Función para extraer imágenes
async function scrapeImages($) {
    const images = {
        main: null,
        gallery: [],
        map: null
    }

    const tourImages = []

    $('img').each((i, elem) => {
        const src = $(elem).attr('src')
        if (src && src.includes('cdnmega.com/images/viajes')) {
            if (!src.includes('logo') && !src.includes('icon') && !src.includes('brand')) {
                tourImages.push(src)
            }
        }
    })

    const mainImage = tourImages.find(img => img.includes('/covers/'))
    if (mainImage) {
        images.main = mainImage
    }

    images.gallery = tourImages.filter(img => img !== mainImage)

    const mapImage = tourImages.find(img => img.includes('map') || img.includes('mapa'))
    if (mapImage) {
        images.map = mapImage
        images.gallery = images.gallery.filter(img => img !== mapImage)
    }

    return images
}

// Función para extraer tags/clasificaciones
async function scrapeClassifications($) {
    const tags = new Set()

    const breadcrumbText = $('.breadcrumb, [class*="breadcrumb"], nav').text().toLowerCase()
    const title = $('h1').first().text().toLowerCase()
    const description = $('meta[name="description"]').attr('content')?.toLowerCase() || ''
    const fullText = breadcrumbText + ' ' + title + ' ' + description

    const tagMappings = {
        'quinceañeras': ['quinceañeras', 'eventos-especiales'],
        'quince años': ['quinceañeras', 'eventos-especiales'],
        'luna de miel': ['bodas', 'luna-de-miel', 'romantico'],
        'boda': ['bodas', 'romantico'],
        'semana santa': ['semana-santa', 'ofertas'],
        'oferta': ['ofertas'],
        'crucero': ['cruceros'],
        'europa': ['europa'],
        'asia': ['asia'],
        'medio oriente': ['medio-oriente']
    }

    for (const [keyword, relatedTags] of Object.entries(tagMappings)) {
        if (fullText.includes(keyword)) {
            relatedTags.forEach(tag => tags.add(tag))
        }
    }

    return Array.from(tags)
}

async function testScrapingWithSample() {
    console.log('\n🧪 PRUEBA DE SCRAPING COMPLETO - MUESTRA DE 3 TOURS')
    console.log('===================================================\n')

    try {
        const result = await pool.query(`
      SELECT id, mt_code, mt_url, name
      FROM megatravel_packages
      WHERE (main_image IS NULL OR gallery_images IS NULL OR array_length(gallery_images, 1) IS NULL)
      ORDER BY created_at DESC
      LIMIT 3
    `)

        const tours = result.rows

        if (tours.length === 0) {
            console.log('❌ No se encontraron tours sin imágenes')
            return
        }

        console.log(`📋 Tours seleccionados:`)
        tours.forEach((tour, i) => {
            console.log(`   ${i + 1}. ${tour.mt_code}: ${tour.name}`)
        })
        console.log('')

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        for (const tour of tours) {
            console.log(`\n${'='.repeat(70)}`)
            console.log(`🔄 ${tour.mt_code} - ${tour.name}`)
            console.log(`${'='.repeat(70)}\n`)

            try {
                const page = await browser.newPage()
                await page.setViewport({ width: 1920, height: 1080 })

                console.log('⏳ Navegando...')
                await page.goto(tour.mt_url, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                })

                await page.waitForSelector('body', { timeout: 10000 })
                const html = await page.content()
                const $ = cheerio.load(html)

                console.log('📸 Extrayendo imágenes...')
                const images = await scrapeImages($)

                console.log('🏷️ Extrayendo tags...')
                const tags = await scrapeClassifications($)

                console.log('\n📊 RESULTADOS:')
                console.log(`   Main: ${images.main ? '✅' : '❌'}`)
                console.log(`   Gallery: ${images.gallery.length} imágenes`)
                console.log(`   Tags: ${tags.length > 0 ? tags.join(', ') : '❌'}`)

                // Guardar en BD
                console.log('\n💾 Guardando...')
                const updateFields = []
                const updateValues = []
                let paramCounter = 1

                if (images.main) {
                    updateFields.push(`main_image = $${paramCounter++}`)
                    updateValues.push(images.main)
                }
                if (images.gallery.length > 0) {
                    updateFields.push(`gallery_images = $${paramCounter++}`)
                    updateValues.push(images.gallery)
                }
                if (images.map) {
                    updateFields.push(`map_image = $${paramCounter++}`)
                    updateValues.push(images.map)
                }
                if (tags.length > 0) {
                    updateFields.push(`tags = $${paramCounter++}`)
                    updateValues.push(tags)
                }

                if (updateFields.length > 0) {
                    updateFields.push(`updated_at = NOW()`)
                    updateValues.push(tour.id)

                    await pool.query(`
            UPDATE megatravel_packages
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCounter}
          `, updateValues)
                }

                console.log('✅ Guardado!')

                await page.close()

                if (tours.indexOf(tour) < tours.length - 1) {
                    console.log('\n⏳ Esperando 3 segundos...')
                    await new Promise(resolve => setTimeout(resolve, 3000))
                }

            } catch (error) {
                console.error(`\n❌ Error: ${error.message}`)
            }
        }

        await browser.close()

        // Verificación
        console.log('\n\n' + '='.repeat(70))
        console.log('📊 VERIFICACIÓN')
        console.log('='.repeat(70) + '\n')

        for (const tour of tours) {
            const verification = await pool.query(`
        SELECT 
          mt_code,
          main_image,
          array_length(gallery_images, 1) as gallery_count,
          tags
        FROM megatravel_packages
        WHERE id = $1
      `, [tour.id])

            const updated = verification.rows[0]
            console.log(`${updated.mt_code}:`)
            console.log(`   Main: ${updated.main_image ? '✅' : '❌'}`)
            console.log(`   Gallery: ${updated.gallery_count || 0} imágenes`)
            console.log(`   Tags: ${updated.tags?.length > 0 ? updated.tags.join(', ') : '❌'}`)
            console.log('')
        }

        console.log('✅ PRUEBA COMPLETADA!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await pool.end()
    }
}

testScrapingWithSample()
