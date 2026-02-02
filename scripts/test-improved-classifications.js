/**
 * Script de prueba MEJORADO: Validar clasificaciones más precisas
 */

require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

// Función MEJORADA para extraer tags/clasificaciones
async function scrapeClassificationsImproved($) {
    const tags = new Set()

    // Textos para analizar
    const title = $('h1').first().text().toLowerCase()
    const description = $('meta[name="description"]').attr('content')?.toLowerCase() || ''
    const bodyText = $('body').text().toLowerCase()

    // Combinar pero dar más peso a título y descripción
    const primaryText = title + ' ' + description
    const secondaryText = bodyText

    console.log(`\n📝 Analizando:`)
    console.log(`   Título: ${title.substring(0, 80)}...`)
    console.log(`   Descripción: ${description.substring(0, 80)}...`)

    // 1. EVENTOS ESPECIALES (solo si está en título/descripción, NO en menú)
    const eventMappings = {
        'quinceañera': ['quinceañeras', 'eventos-especiales'],
        'quince años': ['quinceañeras', 'eventos-especiales'],
        'xv años': ['quinceañeras', 'eventos-especiales'],
        'luna de miel': ['bodas', 'luna-de-miel', 'romantico'],
        'honeymoon': ['bodas', 'luna-de-miel', 'romantico'],
        'boda': ['bodas', 'romantico'],
        'wedding': ['bodas', 'romantico'],
        'graduación': ['graduaciones', 'eventos-especiales'],
        'graduation': ['graduaciones', 'eventos-especiales'],
        'corporativo': ['corporativo', 'grupos'],
        'empresa': ['corporativo', 'grupos'],
        'corporate': ['corporativo', 'grupos']
    }

    for (const [keyword, relatedTags] of Object.entries(eventMappings)) {
        if (primaryText.includes(keyword)) {
            console.log(`   ✅ Evento detectado: ${keyword}`)
            relatedTags.forEach(tag => tags.add(tag))
        }
    }

    // 2. OFERTAS Y PROMOCIONES (verificar en título/descripción)
    const offerKeywords = ['oferta', 'descuento', 'promoción', 'preventa', 'especial']
    const hasOffer = offerKeywords.some(kw => primaryText.includes(kw))
    if (hasOffer) {
        console.log(`   ✅ Oferta detectada`)
        tags.add('ofertas')
    }

    // 3. SEMANA SANTA (específico)
    if (primaryText.includes('semana santa') || primaryText.includes('pascua')) {
        console.log(`   ✅ Semana Santa detectada`)
        tags.add('semana-santa')
        tags.add('ofertas')
    }

    // 4. CRUCEROS (específico)
    if (primaryText.includes('crucero') || primaryText.includes('cruise')) {
        console.log(`   ✅ Crucero detectado`)
        tags.add('cruceros')
    }

    // 5. REGIÓN/DESTINO (solo del título, no del menú)
    const regionKeywords = {
        'europa': 'europa',
        'european': 'europa',
        'asia': 'asia',
        'asian': 'asia',
        'medio oriente': 'medio-oriente',
        'middle east': 'medio-oriente',
        'dubai': 'medio-oriente',
        'turquía': 'medio-oriente',
        'turkey': 'medio-oriente',
        'sudamerica': 'sudamerica',
        'south america': 'sudamerica',
        'norteamerica': 'norteamerica',
        'north america': 'norteamerica',
        'caribe': 'caribe',
        'caribbean': 'caribe',
        'africa': 'africa',
        'áfrica': 'africa',
        'oceania': 'oceania',
        'oceanía': 'oceania',
        'mexico': 'mexico',
        'méxico': 'mexico'
    }

    for (const [keyword, tag] of Object.entries(regionKeywords)) {
        if (title.includes(keyword)) {
            console.log(`   ✅ Región detectada en título: ${keyword}`)
            tags.add(tag)
        }
    }

    // 6. IMPERDIBLES/DESTACADOS (palabras clave específicas)
    const featuredKeywords = ['imperdible', 'must', 'destacado', 'premium', 'exclusivo']
    const isFeatured = featuredKeywords.some(kw => primaryText.includes(kw))
    if (isFeatured) {
        console.log(`   ✅ Tour destacado`)
        tags.add('imperdibles')
    }

    const tagsArray = Array.from(tags)
    console.log(`   🏷️ Tags finales: ${tagsArray.join(', ') || 'ninguno'}`)
    return tagsArray
}

async function testImprovedClassifications() {
    console.log('\n🧪 PRUEBA DE CLASIFICACIONES MEJORADAS')
    console.log('======================================\n')

    try {
        // Probar con tours variados
        const result = await pool.query(`
      SELECT id, mt_code, mt_url, name
      FROM megatravel_packages
      ORDER BY created_at DESC
      LIMIT 5
    `)

        const tours = result.rows

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        for (const tour of tours) {
            console.log(`\n${'='.repeat(70)}`)
            console.log(`${tour.mt_code} - ${tour.name}`)
            console.log(`${'='.repeat(70)}`)

            try {
                const page = await browser.newPage()
                await page.setViewport({ width: 1920, height: 1080 })

                await page.goto(tour.mt_url, {
                    waitUntil: 'networkidle2',
                    timeout: 60000
                })

                await page.waitForSelector('body', { timeout: 10000 })
                const html = await page.content()
                const $ = cheerio.load(html)

                const tags = await scrapeClassificationsImproved($)

                await page.close()

                if (tours.indexOf(tour) < tours.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000))
                }

            } catch (error) {
                console.error(`\n❌ Error: ${error.message}`)
            }
        }

        await browser.close()
        console.log('\n\n✅ PRUEBA COMPLETADA!\n')

    } catch (error) {
        console.error('\n❌ Error:', error.message)
    } finally {
        await pool.end()
    }
}

testImprovedClassifications()
