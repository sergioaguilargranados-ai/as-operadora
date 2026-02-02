/**
 * Diagnóstico: Estructura de precios en circuito.php
 */

require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

async function diagnosePrices() {
    console.log('\n💰 DIAGNÓSTICO DE PRECIOS\n')

    const tours = [
        { code: '60965', name: 'Bahamas Scarlet Lady' },
        { code: '12115', name: 'Quinceañeras a Europa' }
    ]

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    for (const tour of tours) {
        console.log(`${'='.repeat(60)}`)
        console.log(`${tour.name} (${tour.code})`)
        console.log(`${'='.repeat(60)}\n`)

        const url = `https://megatravel.com.mx/tools/circuito.php?viaje=${tour.code}`

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await page.waitForSelector('body', { timeout: 10000 })
        const html = await page.content()
        await page.close()

        const $ = cheerio.load(html)

        // Buscar sección de precios
        const priceSection = $('h5:contains("Precio")').next()

        if (priceSection.length > 0) {
            console.log('✅ Sección de precios encontrada\n')

            // Buscar tabla
            const table = priceSection.find('table')

            if (table.length > 0) {
                console.log('📊 Tabla de precios:\n')

                // Extraer filas
                const rows = []
                table.find('tr').each((i, row) => {
                    const cells = []
                    $(row).find('td, th').each((j, cell) => {
                        cells.push($(cell).text().trim())
                    })
                    if (cells.length > 0) {
                        rows.push(cells)
                    }
                })

                rows.forEach((row, i) => {
                    console.log(`   Fila ${i + 1}: ${row.join(' | ')}`)
                })
                console.log('')

                // Buscar precios específicos
                const pricePattern = /\$\s*[\d,]+\.?\d*/g
                const tableText = table.text()
                const prices = tableText.match(pricePattern) || []

                console.log(`💵 Precios encontrados: ${prices.length}`)
                if (prices.length > 0) {
                    console.log(`   ${prices.join(', ')}\n`)
                }
            } else {
                console.log('⚠️  No se encontró tabla de precios\n')
            }

            // Mostrar HTML de la sección
            console.log('📄 HTML de sección de precios (primeros 500 caracteres):\n')
            console.log(priceSection.html()?.substring(0, 500) + '...\n')
        } else {
            console.log('❌ No se encontró sección de precios\n')
        }
    }

    await browser.close()
    console.log('\n✅ DIAGNÓSTICO COMPLETADO!\n')
}

diagnosePrices()
