/**
 * Script de diagnóstico: Validar extracción de imágenes
 * Revisar TODAS las imágenes disponibles en la página
 */

require('dotenv').config({ path: '.env.local' })
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

async function diagnoseImages() {
    console.log('\n🔍 DIAGNÓSTICO DE IMÁGENES')
    console.log('==========================\n')

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        // Probar con un tour conocido
        const tourUrl = 'https://www.megatravel.com.mx/viaje/bahamas-scarlet-lady-60965.html'
        const tourCode = '60965'

        console.log(`📄 Tour: ${tourUrl}\n`)

        // 1. Página principal
        console.log('1️⃣ PÁGINA PRINCIPAL\n')
        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        await page.goto(tourUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await page.waitForSelector('body', { timeout: 10000 })
        const html = await page.content()
        const $ = cheerio.load(html)

        await page.close()

        // Buscar TODAS las imágenes
        const allImages = []
        $('img').each((i, elem) => {
            const src = $(elem).attr('src')
            const alt = $(elem).attr('alt') || ''
            const className = $(elem).attr('class') || ''

            if (src) {
                allImages.push({
                    src,
                    alt,
                    className,
                    isCdnMega: src.includes('cdnmega.com'),
                    isViajes: src.includes('/viajes'),
                    isCover: src.includes('/covers/')
                })
            }
        })

        console.log(`📸 Total de imágenes encontradas: ${allImages.length}\n`)

        // Filtrar por categoría
        const cdnMegaImages = allImages.filter(img => img.isCdnMega)
        const viajesImages = allImages.filter(img => img.isViajes)
        const coverImages = allImages.filter(img => img.isCover)

        console.log(`   CDN Mega: ${cdnMegaImages.length}`)
        console.log(`   Viajes: ${viajesImages.length}`)
        console.log(`   Covers: ${coverImages.length}\n`)

        console.log('📋 Imágenes de CDN Mega:\n')
        cdnMegaImages.forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.src}`)
            console.log(`      Alt: ${img.alt}`)
            console.log(`      Cover: ${img.isCover ? '✅' : '❌'}`)
            console.log(`      Viajes: ${img.isViajes ? '✅' : '❌'}\n`)
        })

        // 2. Página de circuito.php
        console.log('\n2️⃣ PÁGINA DE CIRCUITO.PHP\n')
        const circuitoUrl = `https://megatravel.com.mx/tools/circuito.php?viaje=${tourCode}`

        const page2 = await browser.newPage()
        await page2.setViewport({ width: 1920, height: 1080 })

        await page2.goto(circuitoUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        await page2.waitForSelector('body', { timeout: 10000 })
        const html2 = await page2.content()
        const $2 = cheerio.load(html2)

        await page2.close()

        // Buscar imágenes en circuito.php
        const circuitoImages = []
        $2('img').each((i, elem) => {
            const src = $2(elem).attr('src')
            const alt = $2(elem).attr('alt') || ''

            if (src && src.includes('cdnmega.com')) {
                circuitoImages.push({
                    src,
                    alt,
                    isCover: src.includes('/covers/'),
                    isViajes: src.includes('/viajes')
                })
            }
        })

        console.log(`📸 Imágenes en circuito.php: ${circuitoImages.length}\n`)

        circuitoImages.forEach((img, i) => {
            console.log(`   ${i + 1}. ${img.src}`)
            console.log(`      Alt: ${img.alt}`)
            console.log(`      Cover: ${img.isCover ? '✅' : '❌'}\n`)
        })

        await browser.close()

        // 3. Análisis de precios
        console.log('\n3️⃣ ANÁLISIS DE PRECIOS\n')

        // Buscar tablas de precios en página principal
        const priceTables = $('table').length
        console.log(`📊 Tablas encontradas en página principal: ${priceTables}\n`)

        // Buscar texto de precios
        const bodyText = $('body').text()
        const priceMatches = bodyText.match(/\$\s*[\d,]+/g) || []
        console.log(`💰 Menciones de precios: ${priceMatches.length}`)
        if (priceMatches.length > 0) {
            console.log(`   Ejemplos: ${priceMatches.slice(0, 5).join(', ')}\n`)
        }

        // Buscar tablas de precios en circuito.php
        const priceTables2 = $2('table').length
        console.log(`📊 Tablas encontradas en circuito.php: ${priceTables2}\n`)

        // Buscar sección de precios
        const priceSection = $2('h5:contains("Precio")').length
        console.log(`💵 Sección de precios en circuito.php: ${priceSection > 0 ? '✅ SÍ' : '❌ NO'}\n`)

        if (priceSection > 0) {
            const priceHtml = $2('h5:contains("Precio")').next().html()
            console.log('📋 Contenido de sección de precios:\n')
            console.log(priceHtml?.substring(0, 500) + '...\n')
        }

        console.log('\n✅ DIAGNÓSTICO COMPLETADO!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    }
}

diagnoseImages()
