/**
 * Script: Probar URL de circuito.php para itinerario completo
 */

require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const fs = require('fs')

async function testCircuitoUrl() {
    console.log('\n🎯 PRUEBA: URL de circuito.php')
    console.log('==============================\n')

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        // Probar con código de tour conocido
        const tourCode = '60968' // Mediterráneo Azamara Onward
        const url = `https://megatravel.com.mx/tools/circuito.php?viaje=${tourCode}`

        console.log(`📄 URL: ${url}\n`)

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await new Promise(resolve => setTimeout(resolve, 2000))

        const html = await page.content()
        const $ = cheerio.load(html)

        // Guardar HTML para inspección
        fs.writeFileSync('debug-circuito.html', html)
        console.log('📄 HTML guardado en: debug-circuito.html\n')

        // Analizar contenido
        console.log('📊 ANÁLISIS DEL CONTENIDO:\n')

        // 1. Buscar título
        const title = $('h1, h2, title').first().text().trim()
        console.log(`   Título: ${title}\n`)

        // 2. Buscar itinerario
        const itineraryKeywords = ['itinerario', 'día', 'day', 'jornada']
        const bodyText = $('body').text().toLowerCase()

        console.log('   🔍 Buscando itinerario...')
        const hasItinerary = itineraryKeywords.some(kw => bodyText.includes(kw))
        console.log(`   ${hasItinerary ? '✅' : '❌'} Contiene palabras de itinerario\n`)

        // 3. Buscar días específicos
        const dayPatterns = [
            /día\s+\d+/gi,
            /day\s+\d+/gi,
            /\d+º\s+día/gi,
            /\d+\s+día/gi
        ]

        const daysFound = new Set()
        dayPatterns.forEach(pattern => {
            const matches = bodyText.match(pattern)
            if (matches) {
                matches.forEach(match => daysFound.add(match.toLowerCase()))
            }
        })

        if (daysFound.size > 0) {
            console.log(`   ✅ Días encontrados: ${daysFound.size}`)
            Array.from(daysFound).slice(0, 5).forEach(day => {
                console.log(`      - ${day}`)
            })
            console.log('')
        }

        // 4. Buscar estructura de tablas
        const tables = $('table').length
        console.log(`   📋 Tablas encontradas: ${tables}\n`)

        // 5. Buscar divs con clase de itinerario
        const itineraryDivs = $('[class*="itinerario"], [class*="itinerary"], [id*="itinerario"], [id*="itinerary"]')
        console.log(`   📦 Divs de itinerario: ${itineraryDivs.length}\n`)

        // 6. Extraer texto de cada día (si existe)
        if (itineraryDivs.length > 0) {
            console.log('   📝 Contenido de itinerario:\n')
            itineraryDivs.slice(0, 3).each((i, elem) => {
                const text = $(elem).text().trim().substring(0, 200)
                console.log(`      Sección ${i + 1}: ${text}...\n`)
            })
        }

        // 7. Buscar precios (para confirmar que es la página correcta)
        const priceKeywords = ['precio', 'price', 'usd', 'costo']
        const hasPrice = priceKeywords.some(kw => bodyText.includes(kw))
        console.log(`   💰 Contiene precios: ${hasPrice ? '✅' : '❌'}\n`)

        // 8. Longitud del contenido
        const contentLength = bodyText.length
        console.log(`   📏 Longitud del contenido: ${contentLength} caracteres\n`)

        await browser.close()

        console.log('\n✅ PRUEBA COMPLETADA!\n')
        console.log('💡 Revisa el archivo debug-circuito.html para ver el HTML completo\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    }
}

testCircuitoUrl()
