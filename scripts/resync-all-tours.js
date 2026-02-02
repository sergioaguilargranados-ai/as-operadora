/**
 * RE-SINCRONIZACIÓN COMPLETA: Todos los tours de MegaTravel
 * - Itinerario completo desde circuito.php
 * - Imágenes correctas
 * - Clasificaciones/Tags
 * - Precios
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const fs = require('fs')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

// Log file
const logFile = 'resync-progress.log'

function log(message) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] ${message}\n`
    fs.appendFileSync(logFile, logMessage)
    console.log(message)
}

// Funciones de scraping (copiadas del script de prueba)
async function scrapeImages($) {
    const images = { main: null, gallery: [], map: null }
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

    if (mainImage) images.main = mainImage
    images.gallery = tourImages.filter(img => img !== mainImage)

    return images
}

async function scrapeClassifications($) {
    const tags = new Set()
    const title = $('h1').first().text().toLowerCase()
    const description = $('meta[name="description"]').attr('content')?.toLowerCase() || ''
    const primaryText = title + ' ' + description

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
            relatedTags.forEach(tag => tags.add(tag))
        }
    }

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

async function scrapeFromCircuito(tourCode, browser) {
    const url = `https://megatravel.com.mx/tools/circuito.php?viaje=${tourCode}`

    try {
        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
        await page.waitForSelector('body', { timeout: 10000 })

        const html = await page.content()
        await page.close()

        const $ = cheerio.load(html)

        // Itinerario
        const itinerarySection = $('h5:contains("Itinerario")').next('.p-3, .border')
        const days = []
        let dayNumber = 1

        if (itinerarySection.length > 0) {
            const paragraphs = itinerarySection.find('p')

            for (let i = 0; i < paragraphs.length; i++) {
                const p = $(paragraphs[i])
                const boldText = p.find('b').text().trim()

                if (boldText && boldText.length > 0) {
                    let description = ''
                    if (i + 1 < paragraphs.length) {
                        const nextP = $(paragraphs[i + 1])
                        if (nextP.find('b').length === 0) {
                            description = nextP.text().trim()
                            i++
                        }
                    }

                    const cityMatch = boldText.match(/([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)\s*[-–]\s*([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/)
                    const city = cityMatch ? cityMatch[1].trim() : null

                    days.push({
                        day_number: dayNumber++,
                        title: boldText,
                        description: description || '',
                        city: city
                    })
                }
            }
        }

        // Precios
        const prices = { currency: null, base_price: null, price_ranges: [], taxes: null }
        const priceSection = $('h5:contains("Precio")').next()

        if (priceSection.length > 0) {
            const table = priceSection.find('table')

            if (table.length > 0) {
                const headerText = table.find('tr').first().text()
                if (headerText.includes('USD')) prices.currency = 'USD'
                else if (headerText.includes('MXN') || headerText.includes('PESOS')) prices.currency = 'MXN'

                const priceRows = []
                table.find('tr').each((i, row) => {
                    const cells = []
                    $(row).find('td').each((j, cell) => {
                        cells.push($(cell).text().trim())
                    })

                    if (cells.length >= 2) {
                        const category = cells[0]
                        const priceText = cells[1]
                        const priceMatch = priceText.match(/\$?\s*([\d,]+\.?\d*)/)

                        if (priceMatch) {
                            const price = parseFloat(priceMatch[1].replace(/,/g, ''))

                            if (category.toLowerCase().includes('impuesto') || category.toLowerCase().includes('tax')) {
                                prices.taxes = price
                            } else if (!category.toLowerCase().includes('tarifa') &&
                                !category.toLowerCase().includes('precio') &&
                                !category.toLowerCase().includes('suplemento')) {
                                priceRows.push({ category, price })
                            }
                        }
                    }
                })

                if (priceRows.length > 0) {
                    prices.base_price = Math.min(...priceRows.map(p => p.price))
                    prices.price_ranges = priceRows
                }
            }
        }

        return { itinerary: days, prices }

    } catch (error) {
        log(`   ⚠️  Error en circuito.php: ${error.message}`)
        return { itinerary: [], prices: { currency: null, base_price: null, price_ranges: [], taxes: null } }
    }
}

async function resyncAllTours() {
    log('\n🚀 INICIANDO RE-SINCRONIZACIÓN COMPLETA')
    log('========================================\n')

    try {
        // Obtener todos los tours
        const result = await pool.query(`
      SELECT id, mt_code, mt_url, name
      FROM megatravel_packages
      ORDER BY mt_code
    `)

        const tours = result.rows
        log(`📋 Total de tours a procesar: ${tours.length}\n`)

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        let processed = 0
        let succeeded = 0
        let failed = 0

        for (const tour of tours) {
            processed++

            try {
                log(`\n[${processed}/${tours.length}] ${tour.mt_code} - ${tour.name}`)

                // 1. Página principal
                const page = await browser.newPage()
                await page.setViewport({ width: 1920, height: 1080 })
                await page.goto(tour.mt_url, { waitUntil: 'networkidle2', timeout: 60000 })
                await page.waitForSelector('body', { timeout: 10000 })

                const html = await page.content()
                const $ = cheerio.load(html)
                await page.close()

                const images = await scrapeImages($)
                const tags = await scrapeClassifications($)

                log(`   📸 Imágenes: Main=${images.main ? 'Sí' : 'No'}, Gallery=${images.gallery.length}`)
                log(`   🏷️  Tags: ${tags.length > 0 ? tags.join(', ') : 'ninguno'}`)

                // 2. Circuito.php
                const tourCode = tour.mt_url.match(/(\d+)\.html$/)?.[1]
                let circuitoData = { itinerary: [], prices: { currency: null, base_price: null, price_ranges: [], taxes: null } }

                if (tourCode) {
                    circuitoData = await scrapeFromCircuito(tourCode, browser)
                    log(`   📄 Itinerario: ${circuitoData.itinerary.length} días`)
                    log(`   💰 Precios: ${circuitoData.prices.base_price ? `${circuitoData.prices.currency} $${circuitoData.prices.base_price}` : 'No disponible'}`)
                }

                // 3. Guardar en BD
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

                    log(`   ✅ Actualizado en BD`)
                    succeeded++
                } else {
                    log(`   ℹ️  Sin cambios`)
                }

                // Esperar entre tours
                await new Promise(resolve => setTimeout(resolve, 2000))

            } catch (error) {
                log(`   ❌ Error: ${error.message}`)
                failed++
            }
        }

        await browser.close()

        log('\n\n✅ RE-SINCRONIZACIÓN COMPLETADA!')
        log(`📊 RESUMEN:`)
        log(`   Total: ${tours.length}`)
        log(`   Exitosos: ${succeeded}`)
        log(`   Fallidos: ${failed}`)
        log(`\n`)

    } catch (error) {
        log(`\n❌ Error fatal: ${error.message}`)
    } finally {
        await pool.end()
    }
}

resyncAllTours()
