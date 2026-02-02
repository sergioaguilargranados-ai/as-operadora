/**
 * Script de diagnóstico: Clasificaciones y Tags de MegaTravel
 */

require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

async function testTourClassifications() {
    // Probar con varios tours para ver patrones
    const TEST_URLS = [
        'https://www.megatravel.com.mx/viaje/mediterraneo-azamara-onward-60968.html',
        'https://www.megatravel.com.mx/viaje/europa-clasica-16300.html',
        'https://www.megatravel.com.mx/viaje/estambul-crucero-islas-griegas-y-dubai-20287.html'
    ]

    console.log('\n🏷️ DIAGNÓSTICO DE CLASIFICACIONES Y TAGS')
    console.log('==========================================\n')

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        for (const url of TEST_URLS) {
            console.log(`\n📄 Analizando: ${url.split('/').pop()}`)
            console.log('─'.repeat(60))

            const page = await browser.newPage()
            await page.setViewport({ width: 1920, height: 1080 })

            await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 60000
            })

            await page.waitForSelector('body', { timeout: 10000 })
            const html = await page.content()
            const $ = cheerio.load(html)

            // 1. Buscar badges/etiquetas visibles
            console.log('\n🏷️ BADGES/ETIQUETAS:')
            const badges = []
            $('.badge, .tag, .label, [class*="badge"], [class*="tag"], [class*="label"]').each((i, elem) => {
                const text = $(elem).text().trim()
                if (text && text.length < 50) {
                    badges.push(text)
                }
            })
            console.log(badges.length > 0 ? badges.join(', ') : '   ❌ No se encontraron badges')

            // 2. Buscar categorías
            console.log('\n📂 CATEGORÍAS:')
            const categories = []
            $('[class*="category"], [class*="categoria"]').each((i, elem) => {
                const text = $(elem).text().trim()
                if (text && text.length < 100) {
                    categories.push(text)
                }
            })
            console.log(categories.length > 0 ? categories.join(' | ') : '   ❌ No se encontraron categorías')

            // 3. Buscar en breadcrumbs
            console.log('\n🍞 BREADCRUMBS:')
            const breadcrumbs = []
            $('.breadcrumb a, [class*="breadcrumb"] a, nav a').each((i, elem) => {
                const text = $(elem).text().trim()
                if (text && text.length < 50 && !text.toLowerCase().includes('inicio')) {
                    breadcrumbs.push(text)
                }
            })
            console.log(breadcrumbs.length > 0 ? breadcrumbs.join(' > ') : '   ❌ No se encontraron breadcrumbs')

            // 4. Buscar palabras clave en el título y descripción
            console.log('\n🔑 PALABRAS CLAVE EN TÍTULO/DESCRIPCIÓN:')
            const title = $('h1').first().text().trim()
            const description = $('meta[name="description"]').attr('content') || ''
            const fullText = (title + ' ' + description).toLowerCase()

            const keywords = {
                'Quinceañeras': fullText.includes('quinceañera') || fullText.includes('15 años'),
                'Bodas': fullText.includes('boda') || fullText.includes('luna de miel') || fullText.includes('honeymoon'),
                'Imperdibles': fullText.includes('imperdible') || fullText.includes('must') || fullText.includes('destacado'),
                'Ofertas': fullText.includes('oferta') || fullText.includes('descuento') || fullText.includes('promoción'),
                'Semana Santa': fullText.includes('semana santa') || fullText.includes('pascua'),
                'Cruceros': fullText.includes('crucero') || fullText.includes('cruise'),
                'Europa': fullText.includes('europa'),
                'Asia': fullText.includes('asia'),
                'Familiar': fullText.includes('familia') || fullText.includes('niños')
            }

            Object.entries(keywords).forEach(([key, found]) => {
                console.log(`   ${found ? '✅' : '❌'} ${key}`)
            })

            // 5. Buscar metadata/schema.org
            console.log('\n📊 SCHEMA.ORG / METADATA:')
            const schemaScript = $('script[type="application/ld+json"]').html()
            if (schemaScript) {
                try {
                    const schema = JSON.parse(schemaScript)
                    console.log('   ✅ Schema encontrado:')
                    console.log(`      Type: ${schema['@type']}`)
                    if (schema.category) console.log(`      Category: ${schema.category}`)
                    if (schema.keywords) console.log(`      Keywords: ${schema.keywords}`)
                } catch (e) {
                    console.log('   ⚠️ Schema presente pero no parseable')
                }
            } else {
                console.log('   ❌ No se encontró schema.org')
            }

            // 6. Buscar en clases CSS del body/main
            console.log('\n🎨 CLASES CSS DEL CONTENEDOR:')
            const bodyClasses = $('body').attr('class') || ''
            const mainClasses = $('main').attr('class') || ''
            const containerClasses = $('.container').first().attr('class') || ''
            console.log(`   Body: ${bodyClasses || 'N/A'}`)
            console.log(`   Main: ${mainClasses || 'N/A'}`)
            console.log(`   Container: ${containerClasses || 'N/A'}`)

            await page.close()
            await new Promise(resolve => setTimeout(resolve, 2000))
        }

        await browser.close()

        console.log('\n\n✅ Diagnóstico de clasificaciones completado!')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    }
}

testTourClassifications()
