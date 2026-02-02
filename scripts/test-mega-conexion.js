/**
 * Script de prueba: Investigar URLs de Mega Conexión
 * Validar si tienen itinerario completo
 */

require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

async function testMegaConexion() {
    console.log('\n🔍 INVESTIGACIÓN: URLs de Mega Conexión')
    console.log('========================================\n')

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        // 1. Probar URL de listado (Europa)
        console.log('📋 PASO 1: Probando URL de listado de Europa')
        console.log('URL: https://www.megatravel.com.mx/tools/vi.php?Dest=1\n')

        await page.goto('https://www.megatravel.com.mx/tools/vi.php?Dest=1', {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await new Promise(resolve => setTimeout(resolve, 3000)) // Esperar carga de JS

        const listHtml = await page.content()
        const $list = cheerio.load(listHtml)

        // Buscar enlaces a tours
        const tourLinks = []
        $list('a[href*="viaje"]').each((i, elem) => {
            const href = $list(elem).attr('href')
            if (href && !tourLinks.includes(href)) {
                tourLinks.push(href)
            }
        })

        console.log(`✅ Tours encontrados: ${tourLinks.length}`)
        if (tourLinks.length > 0) {
            console.log('   Ejemplos:')
            tourLinks.slice(0, 3).forEach((link, i) => {
                console.log(`   ${i + 1}. ${link}`)
            })
        }

        // 2. Buscar si hay un patrón de URL para detalles
        console.log('\n📄 PASO 2: Buscando patrón de URL para detalles de tour\n')

        // Buscar iframes o enlaces especiales
        const iframes = []
        $list('iframe').each((i, elem) => {
            const src = $list(elem).attr('src')
            if (src) iframes.push(src)
        })

        if (iframes.length > 0) {
            console.log(`✅ iframes encontrados: ${iframes.length}`)
            iframes.forEach((src, i) => {
                console.log(`   ${i + 1}. ${src}`)
            })
        }

        // 3. Probar URL de tour individual con código
        console.log('\n🎯 PASO 3: Probando URL de tour individual\n')

        // Intentar diferentes patrones de URL
        const tourCode = '60968' // Código de ejemplo
        const urlPatterns = [
            `https://www.megatravel.com.mx/tools/viaje.php?code=${tourCode}`,
            `https://www.megatravel.com.mx/tools/vi-detalle.php?code=${tourCode}`,
            `https://www.megatravel.com.mx/tools/itinerario.php?code=${tourCode}`,
            `https://www.megatravel.com.mx/tools/paquete.php?id=${tourCode}`
        ]

        for (const testUrl of urlPatterns) {
            try {
                console.log(`   Probando: ${testUrl}`)
                const response = await page.goto(testUrl, {
                    waitUntil: 'networkidle2',
                    timeout: 10000
                })

                if (response.status() === 200) {
                    const html = await page.content()
                    const $ = cheerio.load(html)

                    // Buscar itinerario
                    const itineraryText = $('body').text().toLowerCase()
                    const hasItinerary = itineraryText.includes('itinerario') ||
                        itineraryText.includes('día 1') ||
                        itineraryText.includes('day 1')

                    if (hasItinerary) {
                        console.log(`   ✅ ENCONTRADO! Esta URL tiene itinerario`)
                        console.log(`   Guardando HTML para análisis...\n`)

                        // Guardar HTML para inspección
                        const fs = require('fs')
                        fs.writeFileSync('debug-mega-conexion.html', html)
                        console.log(`   📄 HTML guardado en: debug-mega-conexion.html\n`)

                        // Mostrar estructura
                        console.log('   📊 Estructura encontrada:')

                        // Buscar días del itinerario
                        const days = []
                        $('[class*="day"], [class*="dia"], [id*="day"], [id*="dia"]').each((i, elem) => {
                            const text = $(elem).text().trim().substring(0, 100)
                            if (text) days.push(text)
                        })

                        if (days.length > 0) {
                            console.log(`   ✅ Días de itinerario: ${days.length}`)
                            days.slice(0, 3).forEach((day, i) => {
                                console.log(`      Día ${i + 1}: ${day}...`)
                            })
                        }

                        break
                    } else {
                        console.log(`   ❌ No tiene itinerario`)
                    }
                } else {
                    console.log(`   ❌ Error ${response.status()}`)
                }
            } catch (error) {
                console.log(`   ❌ Error: ${error.message}`)
            }
        }

        await browser.close()

        console.log('\n\n✅ INVESTIGACIÓN COMPLETADA!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    }
}

testMegaConexion()
