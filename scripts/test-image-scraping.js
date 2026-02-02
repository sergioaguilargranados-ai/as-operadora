/**
 * Script de diagnóstico: Scraping manual de 1 tour para detectar problemas con imágenes
 */

require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

async function testTourScraping() {
    // Usar un tour que sabemos que existe
    const TEST_URL = 'https://www.megatravel.com.mx/viaje/mediterraneo-azamara-onward-60968.html'

    console.log('\n🔍 DIAGNÓSTICO DE SCRAPING - IMÁGENES')
    console.log('=====================================')
    console.log(`URL: ${TEST_URL}\n`)

    try {
        console.log('1️⃣ Abriendo navegador...')
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        console.log('2️⃣ Navegando a la página...')
        await page.goto(TEST_URL, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        console.log('3️⃣ Esperando contenido...')
        await page.waitForSelector('body', { timeout: 10000 })

        console.log('4️⃣ Extrayendo HTML...')
        const html = await page.content()
        const $ = cheerio.load(html)

        console.log('\n📸 BUSCANDO IMÁGENES:')
        console.log('=====================\n')

        // Estrategia 1: Buscar todas las imágenes
        console.log('🔎 Estrategia 1: Todas las imágenes <img>')
        const allImages = []
        $('img').each((i, elem) => {
            const src = $(elem).attr('src')
            const alt = $(elem).attr('alt')
            const className = $(elem).attr('class')
            if (src && !src.includes('logo') && !src.includes('icon')) {
                allImages.push({ src, alt, className })
            }
        })
        console.log(`   Encontradas: ${allImages.length} imágenes`)
        allImages.slice(0, 5).forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.src.substring(0, 80)}...`)
            console.log(`      Alt: ${img.alt || 'N/A'}`)
            console.log(`      Class: ${img.className || 'N/A'}`)
        })

        // Estrategia 2: Buscar carrusel/slider
        console.log('\n🔎 Estrategia 2: Carrusel/Slider')
        const carouselSelectors = [
            '.carousel img',
            '.slider img',
            '.gallery img',
            '[class*="carousel"] img',
            '[class*="slider"] img',
            '[class*="gallery"] img',
            '[id*="carousel"] img',
            '[id*="slider"] img',
            '[id*="gallery"] img'
        ]

        for (const selector of carouselSelectors) {
            const found = $(selector)
            if (found.length > 0) {
                console.log(`   ✅ Selector "${selector}": ${found.length} imágenes`)
                found.slice(0, 2).each((i, elem) => {
                    console.log(`      - ${$(elem).attr('src')?.substring(0, 60)}...`)
                })
            }
        }

        // Estrategia 3: Buscar imagen principal/hero
        console.log('\n🔎 Estrategia 3: Imagen Principal/Hero')
        const heroSelectors = [
            '.hero img',
            '.main-image img',
            '.featured-image img',
            '[class*="hero"] img',
            '[class*="main"] img',
            '[class*="featured"] img'
        ]

        for (const selector of heroSelectors) {
            const found = $(selector)
            if (found.length > 0) {
                console.log(`   ✅ Selector "${selector}": ${found.length} imágenes`)
                console.log(`      - ${$(found.first()).attr('src')?.substring(0, 60)}...`)
            }
        }

        // Estrategia 4: Buscar en backgrounds CSS
        console.log('\n🔎 Estrategia 4: Background Images (CSS)')
        const elementsWithBg = []
        $('[style*="background"]').each((i, elem) => {
            const style = $(elem).attr('style')
            const bgMatch = style?.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/)
            if (bgMatch) {
                elementsWithBg.push(bgMatch[1])
            }
        })
        console.log(`   Encontradas: ${elementsWithBg.length} backgrounds`)
        elementsWithBg.slice(0, 3).forEach((bg, i) => {
            console.log(`   ${i + 1}. ${bg.substring(0, 80)}...`)
        })

        // Estrategia 5: Buscar data attributes
        console.log('\n🔎 Estrategia 5: Data Attributes')
        const dataImages = []
        $('[data-src], [data-image], [data-bg]').each((i, elem) => {
            const dataSrc = $(elem).attr('data-src') || $(elem).attr('data-image') || $(elem).attr('data-bg')
            if (dataSrc) {
                dataImages.push(dataSrc)
            }
        })
        console.log(`   Encontradas: ${dataImages.length} imágenes en data-*`)
        dataImages.slice(0, 3).forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.substring(0, 80)}...`)
        })

        // Resumen
        console.log('\n📊 RESUMEN:')
        console.log('===========')
        console.log(`Total <img>: ${allImages.length}`)
        console.log(`Backgrounds CSS: ${elementsWithBg.length}`)
        console.log(`Data attributes: ${dataImages.length}`)
        console.log(`\nTotal imágenes detectadas: ${allImages.length + elementsWithBg.length + dataImages.length}`)

        // Guardar HTML para inspección manual
        const fs = require('fs')
        fs.writeFileSync('debug-tour.html', html)
        console.log('\n💾 HTML guardado en: debug-tour.html')

        await browser.close()

        console.log('\n✅ Diagnóstico completado!')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
        console.error(error.stack)
    }
}

testTourScraping()
