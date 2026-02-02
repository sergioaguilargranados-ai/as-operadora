/**
 * Script de prueba: MT-12115 Quinceañeras a Europa
 * Validar clasificación por eventos y enlaces
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function scrapeImages($) {
    const images = {
        main: null,
        gallery: [],
        map: null
    }

    const tourImages = []
    $('img[src*="cdnmega.com/images/viajes"]').each((i, elem) => {
        const src = $(elem).attr('src')
        if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('brand')) {
            tourImages.push(src)
        }
    })

    const pageUrl = $('link[rel="canonical"]').attr('href') || ''
    const tourCodeMatch = pageUrl.match(/(\d+)\.html$/)
    const tourCode = tourCodeMatch ? tourCodeMatch[1] : null

    let mainImage = null

    if (tourCode) {
        mainImage = tourImages.find(img =>
            img.includes('/covers/') &&
            (img.includes(tourCode) || img.includes(`-${tourCode}-`))
        )
    }

    if (!mainImage) {
        mainImage = tourImages.find(img => {
            if (!img.includes('/covers/')) return false

            const otherTourCode = img.match(/(\d{5})-/)
            if (otherTourCode && tourCode && otherTourCode[1] !== tourCode) {
                return false
            }

            return true
        })
    }

    if (mainImage) {
        images.main = mainImage
    }

    images.gallery = tourImages.filter(img => img !== mainImage)

    return images
}

async function scrapeClassifications($) {
    const tags = new Set()
    const title = $('h1').first().text().toLowerCase()
    const description = $('meta[name="description"]').attr('content')?.toLowerCase() || ''
    const primaryText = title + ' ' + description

    console.log(`\n   📝 Título: ${title.substring(0, 80)}...`)
    console.log(`   📝 Descripción: ${description.substring(0, 80)}...\n`)

    // Eventos especiales
    const eventMappings = {
        'quinceañera': ['quinceañeras', 'eventos-especiales', 'grupos'],
        'quince años': ['quinceañeras', 'eventos-especiales', 'grupos'],
        'xv años': ['quinceañeras', 'eventos-especiales', 'grupos'],
        'luna de miel': ['bodas', 'luna-de-miel', 'romantico'],
        'honeymoon': ['bodas', 'luna-de-miel', 'romantico'],
        'boda': ['bodas', 'romantico'],
        'graduación': ['graduaciones', 'eventos-especiales'],
        'corporativo': ['corporativo', 'grupos'],
        'crucero': ['cruceros']
    }

    for (const [keyword, relatedTags] of Object.entries(eventMappings)) {
        if (primaryText.includes(keyword)) {
            console.log(`   ✅ Evento detectado: "${keyword}"`)
            relatedTags.forEach(tag => tags.add(tag))
        }
    }

    // Regiones
    const regionKeywords = {
        'europa': 'europa',
        'asia': 'asia',
        'medio oriente': 'medio-oriente',
        'dubai': 'medio-oriente'
    }

    for (const [keyword, tag] of Object.entries(regionKeywords)) {
        if (title.includes(keyword)) {
            console.log(`   ✅ Región detectada: "${keyword}"`)
            tags.add(tag)
        }
    }

    return Array.from(tags)
}

async function scrapeItineraryFromCircuito(tourCode) {
    const url = `https://megatravel.com.mx/tools/circuito.php?viaje=${tourCode}`

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await page.waitForSelector('body', { timeout: 10000 })
        const html = await page.content()
        await browser.close()

        const $ = cheerio.load(html)

        const itinerarySection = $('h5:contains("Itinerario")').next('.p-3, .border')

        if (!itinerarySection.length) {
            console.log('   ⚠️  No se encontró sección de itinerario')
            return []
        }

        const days = []
        let dayNumber = 1

        const paragraphs = itinerarySection.find('p')

        for (let i = 0; i < paragraphs.length; i++) {
            const p = $(paragraphs[i])
            const boldText = p.find('b').text().trim()

            if (boldText && boldText.length > 0) {
                const title = boldText

                let description = ''
                if (i + 1 < paragraphs.length) {
                    const nextP = $(paragraphs[i + 1])
                    if (nextP.find('b').length === 0) {
                        description = nextP.text().trim()
                        i++
                    }
                }

                const cityMatch = title.match(/([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s*[-–]\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/)
                const city = cityMatch ? cityMatch[1].trim() : null

                days.push({
                    day_number: dayNumber++,
                    title: title,
                    description: description || '',
                    city: city
                })
            }
        }

        return days

    } catch (error) {
        console.error(`   ❌ Error scraping circuito.php:`, error.message)
        return []
    }
}

async function testQuinceaneras() {
    console.log('\n🎉 PRUEBA: MT-12115 Quinceañeras a Europa')
    console.log('==========================================\n')

    try {
        // Buscar el tour en la BD
        const result = await pool.query(`
      SELECT id, mt_code, mt_url, name
      FROM megatravel_packages
      WHERE mt_code = 'MT-12115'
    `)

        if (result.rows.length === 0) {
            console.log('❌ Tour MT-12115 no encontrado en la base de datos')
            console.log('💡 Asegúrate de que el tour esté sincronizado\n')
            return
        }

        const tour = result.rows[0]

        console.log(`📋 Tour encontrado:`)
        console.log(`   Código: ${tour.mt_code}`)
        console.log(`   Nombre: ${tour.name}`)
        console.log(`   URL: ${tour.mt_url}\n`)

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        console.log('🌐 Scraping de página principal...\n')

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        await page.goto(tour.mt_url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await page.waitForSelector('body', { timeout: 10000 })
        const html = await page.content()
        const $ = cheerio.load(html)

        await page.close()

        // 1. Imágenes
        console.log('📸 Extrayendo imágenes...')
        const images = await scrapeImages($)
        console.log(`   ✅ Main: ${images.main ? 'Sí' : 'No'}`)
        console.log(`   ✅ Gallery: ${images.gallery.length} imágenes`)
        if (images.main) {
            console.log(`   📷 URL: ${images.main}\n`)
        }

        // 2. Tags/Clasificaciones
        console.log('🏷️  Extrayendo tags/clasificaciones...')
        const tags = await scrapeClassifications($)
        console.log(`\n   🎯 Tags detectados: ${tags.length}`)
        if (tags.length > 0) {
            console.log(`   📌 ${tags.join(', ')}\n`)
        } else {
            console.log(`   ⚠️  Ningún tag detectado\n`)
        }

        // 3. Itinerario completo
        const tourCode = tour.mt_url.match(/(\d+)\.html$/)?.[1]

        if (tourCode) {
            console.log(`📄 Extrayendo itinerario completo (código: ${tourCode})...`)
            const itinerary = await scrapeItineraryFromCircuito(tourCode)
            console.log(`   ✅ Días de itinerario: ${itinerary.length}\n`)

            if (itinerary.length > 0) {
                console.log('   📝 Primeros 5 días:')
                itinerary.slice(0, 5).forEach(day => {
                    console.log(`      Día ${day.day_number}: ${day.title}`)
                    if (day.description) {
                        console.log(`         ${day.description.substring(0, 100)}...\n`)
                    }
                })
            }
        }

        await browser.close()

        // 4. Guardar en BD
        console.log('💾 Guardando en base de datos...')

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

            console.log(`   ✅ Actualizado en BD\n`)
        }

        // 5. Verificar resultado
        console.log('📊 RESULTADO FINAL:\n')
        const finalResult = await pool.query(`
      SELECT mt_code, name, 
             main_image IS NOT NULL as has_main,
             array_length(gallery_images, 1) as gallery_count,
             array_length(tags, 1) as tags_count,
             tags
      FROM megatravel_packages
      WHERE mt_code = 'MT-12115'
    `)

        const final = finalResult.rows[0]
        console.log(`   ${final.mt_code}: ${final.name}`)
        console.log(`   Main image: ${final.has_main ? '✅' : '❌'}`)
        console.log(`   Gallery: ${final.gallery_count || 0} imágenes`)
        console.log(`   Tags: ${final.tags_count || 0} tags`)
        if (final.tags && final.tags.length > 0) {
            console.log(`   📌 ${final.tags.join(', ')}`)
        }
        console.log('')

        console.log('\n✅ PRUEBA COMPLETADA!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await pool.end()
    }
}

testQuinceaneras()
