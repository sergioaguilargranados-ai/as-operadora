// test-scraping-simple.js - Prueba simple de scraping
// Ejecutar: node scripts/test-scraping-simple.js

import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

async function testScrapingSimple() {
    console.log('🧪 PRUEBA SIMPLE DE SCRAPING - PRECIOS E INCLUDES\n');
    console.log('='.repeat(60));

    const testUrl = 'https://www.megatravel.com.mx/viaje/viviendo-europa-12117.html';
    console.log(`\n📍 URL: ${testUrl}\n`);

    try {
        // Abrir navegador
        console.log('🌐 Abriendo navegador...');
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1920, height: 1080 });

        // Navegar a la página
        console.log('📄 Cargando página...');
        await page.goto(testUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        await page.waitForSelector('body', { timeout: 30000 });

        // Obtener HTML
        const html = await page.content();
        await browser.close();

        // Parsear con Cheerio
        const $ = cheerio.load(html);
        const bodyText = $('body').text();

        console.log('✅ Página cargada\n');
        console.log('='.repeat(60));
        console.log('📊 EXTRAYENDO DATOS');
        console.log('='.repeat(60));

        // EXTRAER PRECIOS
        console.log(`\n💰 PRECIOS:`);

        const pricePattern1 = /Desde\s+([\d,]+)\s*USD\s*\+\s*([\d,]+)\s*IMP/i;
        const match1 = bodyText.match(pricePattern1);

        if (match1) {
            const price_usd = parseFloat(match1[1].replace(/,/g, ''));
            const taxes_usd = parseFloat(match1[2].replace(/,/g, ''));
            console.log(`   ✅ Precio: $${price_usd} USD`);
            console.log(`   ✅ Impuestos: $${taxes_usd} USD`);
        } else {
            console.log(`   ❌ No se encontró precio`);
        }

        // Tipo de habitación
        const roomTypePattern = /Por persona en habitación (Doble|Triple|Cuádruple|Sencilla)/i;
        const roomMatch = bodyText.match(roomTypePattern);

        if (roomMatch) {
            console.log(`   ✅ Tipo: Por persona en habitación ${roomMatch[1]}`);
        }

        // EXTRAER INCLUDES
        console.log(`\n✅ INCLUYE:`);
        const bodyHtml = $('body').html() || '';
        const includesMatch = bodyHtml.match(/El viaje incluye([\s\S]*?)(?=El viaje no incluye|Itinerario|Mapa del tour|$)/i);

        if (includesMatch) {
            const includesHtml = includesMatch[1];
            const $includes = cheerio.load(includesHtml);
            const includes = [];

            $includes('li, p').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 3 && !text.startsWith('El viaje')) {
                    const cleanText = text.replace(/^[-•*]\s*/, '').trim();
                    if (cleanText) {
                        includes.push(cleanText);
                    }
                }
            });

            console.log(`   Total: ${includes.length} items`);
            includes.slice(0, 5).forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.substring(0, 70)}${item.length > 70 ? '...' : ''}`);
            });
            if (includes.length > 5) {
                console.log(`   ... y ${includes.length - 5} más`);
            }
        } else {
            console.log(`   ❌ No se encontró sección "El viaje incluye"`);
        }

        // EXTRAER NOT INCLUDES
        console.log(`\n❌ NO INCLUYE:`);
        const notIncludesMatch = bodyHtml.match(/El viaje no incluye([\s\S]*?)(?=Itinerario|Mapa del tour|Tours opcionales|$)/i);

        if (notIncludesMatch) {
            const notIncludesHtml = notIncludesMatch[1];
            const $notIncludes = cheerio.load(notIncludesHtml);
            const not_includes = [];

            $notIncludes('li, p').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text && text.length > 3 && !text.startsWith('El viaje')) {
                    const cleanText = text.replace(/^[-•*]\s*/, '').trim();
                    if (cleanText) {
                        not_includes.push(cleanText);
                    }
                }
            });

            console.log(`   Total: ${not_includes.length} items`);
            not_includes.slice(0, 5).forEach((item, i) => {
                console.log(`   ${i + 1}. ${item.substring(0, 70)}${item.length > 70 ? '...' : ''}`);
            });
            if (not_includes.length > 5) {
                console.log(`   ... y ${not_includes.length - 5} más`);
            }
        } else {
            console.log(`   ❌ No se encontró sección "El viaje no incluye"`);
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ PRUEBA COMPLETADA');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERROR:', error);
        process.exit(1);
    }
}

// Ejecutar
testScrapingSimple();
