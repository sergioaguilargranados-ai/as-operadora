/**
 * Script de prueba: Proceso COMPLETO de scraping
 * - Itinerario completo desde circuito.php
 * - Imágenes
 * - Clasificaciones/Tags
 * - Todos los datos
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

// Importar funciones de scraping (simuladas aquí)
async function scrapeImages($) {
    const images = {
        main: null,
        gallery: [],
        map: null
    }

    // Buscar todas las imágenes del tour
    const tourImages = []
    $('img[src*="cdnmega.com/images/viajes"]').each((i, elem) => {
        const src = $(elem).attr('src')
        if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('brand')) {
            tourImages.push(src)
        }
    })

    // Extraer código del tour de la URL canónica
    const pageUrl = $('link[rel="canonical"]').attr('href') || ''
    const tourCodeMatch = pageUrl.match(/(\d+)\.html$/)
    const tourCode = tourCodeMatch ? tourCodeMatch[1] : null

    // Buscar imagen principal por código del tour
    let mainImage = null

    if (tourCode) {
        mainImage = tourImages.find(img =>
            img.includes('/covers/') &&
            (img.includes(tourCode) || img.includes(`-${tourCode}-`))
        )
    }

    // Si no encontramos por código, buscar la primera con /covers/ que NO sea de otro tour
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

    // El resto son galería
    images.gallery = tourImages.filter(img => img !== mainImage)

    return images
}

async function scrapeClassifications($) {
    const tags = new Set()
    const title = $('h1').first().text().toLowerCase()
    const description = $('meta[name="description"]').attr('content')?.toLowerCase() || ''
    const primaryText = title + ' ' + description

    // Eventos especiales
    if (primaryText.includes('quinceañera') || primaryText.includes('quince años')) {
        tags.add('quinceañeras')
        tags.add('eventos-especiales')
    }
    if (primaryText.includes('luna de miel') || primaryText.includes('honeymoon')) {
        tags.add('bodas')
        tags.add('luna-de-miel')
    }
    if (primaryText.includes('crucero') || primaryText.includes('cruise')) {
        tags.add('cruceros')
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

        // Buscar sección de itinerario
        const itinerarySection = $('h5:contains("Itinerario")').next('.p-3, .border')

        if (!itinerarySection.length) {
            console.log('   ⚠️  No se encontró sección de itinerario')
            return []
        }

        const days = []
        let dayNumber = 1

        // Parsear días del itinerario
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

async function scrapePricesFromCircuito(tourCode) {
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

        const prices = {
            currency: null,
            base_price: null,
            price_ranges: [],
            taxes: null
        }

        // Buscar sección de precios
        const priceSection = $('h5:contains("Precio")').next()

        if (!priceSection.length) {
            return prices
        }

        // Buscar tabla de precios
        const table = priceSection.find('table')

        if (!table.length) {
            return prices
        }

        // Detectar moneda del encabezado
        const headerText = table.find('tr').first().text()
        if (headerText.includes('USD')) {
            prices.currency = 'USD'
        } else if (headerText.includes('MXN') || headerText.includes('PESOS')) {
            prices.currency = 'MXN'
        }

        // Extraer filas de precios
        const priceRows = []
        table.find('tr').each((i, row) => {
            const cells = []
            $(row).find('td').each((j, cell) => {
                const text = $(cell).text().trim()
                cells.push(text)
            })

            if (cells.length >= 2) {
                const category = cells[0]
                const priceText = cells[1]

                // Extraer número del precio
                const priceMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/)
                if (priceMatch) {
                    const price = parseFloat(priceMatch[1].replace(/,/g, ''))

                    // Clasificar el precio
                    if (category.toLowerCase().includes('impuesto') ||
                        category.toLowerCase().includes('tax')) {
                        prices.taxes = price
                    } else if (!category.toLowerCase().includes('tarifa') &&
                        !category.toLowerCase().includes('precio') &&
                        !category.toLowerCase().includes('suplemento')) {
                        priceRows.push({
                            category: category,
                            price: price
                        })
                    }
                }
            }
        })

        // Asignar precio base (el más bajo)
        if (priceRows.length > 0) {
            const minPrice = Math.min(...priceRows.map(p => p.price))
            prices.base_price = minPrice
            prices.price_ranges = priceRows
        }

        return prices

    } catch (error) {
        console.error(`   ❌ Error scraping precios:`, error.message)
        return {
            currency: null,
            base_price: null,
            price_ranges: [],
            taxes: null
        }
    }
}

async function testCompleteScraping() {
    console.log('\n🧪 PRUEBA COMPLETA DE SCRAPING')
    console.log('==============================\n')

    try {
        // Seleccionar los 4 tours específicos para probar
        const tourCodes = ['MT-60965', 'MT-60959', 'MT-60954', 'MT-12115']

        const result = await pool.query(`
      SELECT id, mt_code, mt_url, name
      FROM megatravel_packages
      WHERE mt_code = ANY($1)
      ORDER BY mt_code
    `, [tourCodes])

        const tours = result.rows

        if (tours.length === 0) {
            console.log('❌ No se encontraron tours para probar')
            return
        }

        console.log(`📋 Tours a procesar: ${tours.length}`)
        tours.forEach(t => console.log(`   - ${t.mt_code}: ${t.name}`))
        console.log('')

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        for (const tour of tours) {
            console.log(`${'='.repeat(70)}`)
            console.log(`${tour.mt_code} - ${tour.name}`)
            console.log(`${'='.repeat(70)}`)
            console.log(`URL: ${tour.mt_url}\n`)

            try {
                // 1. Scraping de página principal
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

                // 2. Extraer imágenes
                console.log('📸 Extrayendo imágenes...')
                const images = await scrapeImages($)
                console.log(`   ✅ Main: ${images.main ? 'Sí' : 'No'}`)
                console.log(`   ✅ Gallery: ${images.gallery.length} imágenes\n`)

                // 3. Extraer tags
                console.log('🏷️  Extrayendo tags...')
                const tags = await scrapeClassifications($)
                console.log(`   ✅ Tags: ${tags.join(', ') || 'ninguno'}\n`)

                // 4. Extraer código del tour
                const tourCode = tour.mt_url.match(/(\d+)\.html$/)?.[1]

                if (!tourCode) {
                    console.log('⚠️  No se pudo extraer código del tour\n')
                    continue
                }

                // 5. Scraping de itinerario completo desde circuito.php
                console.log(`📄 Extrayendo itinerario completo (código: ${tourCode})...`)
                const itinerary = await scrapeItineraryFromCircuito(tourCode)
                console.log(`   ✅ Días de itinerario: ${itinerary.length}\n`)

                if (itinerary.length > 0) {
                    console.log('   📝 Primeros 3 días:')
                    itinerary.slice(0, 3).forEach(day => {
                        console.log(`      Día ${day.day_number}: ${day.title}`)
                        console.log(`         ${day.description.substring(0, 100)}...\n`)
                    })
                }

                // 6. Scraping de precios desde circuito.php
                console.log(`💰 Extrayendo precios (código: ${tourCode})...`)
                const prices = await scrapePricesFromCircuito(tourCode)

                if (prices.base_price) {
                    console.log(`   ✅ Precio base: ${prices.currency} $${prices.base_price.toLocaleString()}`)
                    if (prices.taxes) {
                        console.log(`   ✅ Impuestos: ${prices.currency} $${prices.taxes.toLocaleString()}`)
                    }
                    console.log(`   ✅ Categorías: ${prices.price_ranges.length}`)
                    prices.price_ranges.slice(0, 3).forEach(range => {
                        console.log(`      - ${range.category}: $${range.price.toLocaleString()}`)
                    })
                    console.log('')
                } else {
                    console.log(`   ⚠️  No se encontraron precios\n`)
                }

                // 7. Actualizar en base de datos
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

                // Esperar entre tours
                if (tours.indexOf(tour) < tours.length - 1) {
                    console.log('⏳ Esperando 3 segundos...\n')
                    await new Promise(resolve => setTimeout(resolve, 3000))
                }

            } catch (error) {
                console.error(`\n❌ Error procesando ${tour.mt_code}:`, error.message, '\n')
            }
        }

        await browser.close()

        console.log('\n\n✅ PRUEBA COMPLETADA!\n')
        console.log('📊 RESUMEN:')
        console.log(`   Tours procesados: ${tours.length}`)
        console.log('\n💡 Revisa los datos en la base de datos\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await pool.end()
    }
}

testCompleteScraping()
