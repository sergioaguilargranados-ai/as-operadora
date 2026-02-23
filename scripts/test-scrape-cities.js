// Script de diagnóstico para verificar qué datos extrae el scraper
// Ejecutar: node scripts/test-scrape-cities.js

const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const TEST_URL = 'https://www.megatravel.com.mx/viaje/brasil-y-argentina-52172.html';

async function testScrape() {
    console.log('🔍 Iniciando diagnóstico de scraping de ciudades...\n');
    console.log(`URL: ${TEST_URL}\n`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('⏳ Navegando a la página...');
        await page.goto(TEST_URL, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        await page.waitForSelector('body', { timeout: 30000 });

        // Esperar a que se cargue contenido dinámico
        await new Promise(resolve => setTimeout(resolve, 3000));

        // ===== TEST 1: Extraer datos con page.evaluate (ANTES de cerrar browser) =====
        console.log('\n===== TEST 1: page.evaluate() =====');
        const pageData = await page.evaluate(() => {
            const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
            const title = document.title || '';
            const bodyText = document.body?.innerText?.substring(0, 2000) || '';

            return { ogDesc, ogTitle, title, bodyText };
        });

        console.log('OG Description:', pageData.ogDesc || '(VACÍO)');
        console.log('OG Title:', pageData.ogTitle || '(VACÍO)');
        console.log('Title:', pageData.title || '(VACÍO)');
        console.log('Body text (first 500):', pageData.bodyText.substring(0, 500));

        // ===== TEST 2: Extraer HTML y parsear con Cheerio =====
        console.log('\n===== TEST 2: Cheerio parse =====');
        const html = await page.content();
        const $ = cheerio.load(html);

        const cheerioOgDesc = $('meta[property="og:description"]').attr('content') || '';
        const cheerioOgTitle = $('meta[property="og:title"]').attr('content') || '';
        const cheerioTitle = $('title').text() || '';

        console.log('Cheerio OG Description:', cheerioOgDesc || '(VACÍO)');
        console.log('Cheerio OG Title:', cheerioOgTitle || '(VACÍO)');
        console.log('Cheerio Title:', cheerioTitle || '(VACÍO)');

        // ===== TEST 3: Probar los regex de extracción =====
        console.log('\n===== TEST 3: Regex extraction =====');

        const ogDesc = cheerioOgDesc || pageData.ogDesc;
        console.log('Using OG desc:', ogDesc);

        // Ciudades
        const visitandoMatch = ogDesc.match(/Visitando:\s*(.+?)(?:\s+durante|\s*$)/i);
        if (visitandoMatch) {
            const cities = visitandoMatch[1].split(',').map(c => c.trim()).filter(c => c.length > 1);
            console.log('✅ Ciudades extraídas:', cities);
        } else {
            console.log('❌ No se encontró "Visitando:" en OG desc');

            // Intentar desde body text
            const bodyText = $('body').text();
            const visitandoHTML = bodyText.match(/Visitando\s*\n?\s*(.+?)(?:\n|Desde|$)/i);
            if (visitandoHTML) {
                const rawCities = visitandoHTML[1].trim();
                const cities = rawCities.split(',').map(c => c.trim()).filter(c => c.length > 1 && c.length < 50);
                console.log('✅ Ciudades desde HTML body:', cities);
            } else {
                console.log('❌ Tampoco se encontró "Visitando" en body text');
            }
        }

        // Países
        const paisesMatch = ogDesc.match(/Viaje\s+desde\s+M[eé]xico\s+a\s+(.+?)\.\s*Visitando/i);
        if (paisesMatch) {
            const countries = paisesMatch[1].split(',').map(c => c.trim()).filter(c => c.length > 1);
            console.log('✅ Países extraídos:', countries);
        } else {
            console.log('❌ No se encontró patrón países en OG desc');

            // Intentar desde título
            const titleMatch = (cheerioOgTitle || cheerioTitle).match(/Viaje:\s*(.+?)(?:\s+MT-|\s*$)/i);
            if (titleMatch) {
                const titleCountries = titleMatch[1]
                    .split(/\s+y\s+|\s*,\s*/i)
                    .map(c => c.trim())
                    .filter(c => c.length > 1);
                console.log('✅ Países desde título:', titleCountries);
            } else {
                console.log('❌ Tampoco se encontró en título');
            }
        }

        // Duración
        const daysMatch = ogDesc.match(/(\d+)\s*d[ií]as/i);
        console.log('Duración:', daysMatch ? `${daysMatch[1]} días` : 'No encontrada');

        // ===== TEST 4: Meta tags presentes =====
        console.log('\n===== TEST 4: All meta tags =====');
        $('meta').each((i, elem) => {
            const property = $(elem).attr('property') || $(elem).attr('name') || '';
            const content = $(elem).attr('content') || '';
            if (property && content) {
                console.log(`  ${property}: ${content.substring(0, 100)}`);
            }
        });

        await browser.close();
        console.log('\n✅ Diagnóstico completado');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (browser) await browser.close();
    }
}

testScrape();
