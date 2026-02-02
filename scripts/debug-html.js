// debug-html.js - Guardar HTML para análisis
import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugHTML() {
    const testUrl = 'https://www.megatravel.com.mx/viaje/viviendo-europa-12117.html';

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(testUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
    });

    await page.waitForSelector('body', { timeout: 30000 });

    const html = await page.content();
    await browser.close();

    // Guardar HTML
    fs.writeFileSync('debug-megatravel.html', html, 'utf-8');
    console.log('✅ HTML guardado en debug-megatravel.html');

    // Buscar texto clave
    const hasDesde = html.includes('Desde');
    const has1699 = html.includes('1,699') || html.includes('1699');
    const hasIncluye = html.includes('incluye');

    console.log(`\nBúsqueda de texto clave:`);
    console.log(`  "Desde": ${hasDesde}`);
    console.log(`  "1,699" o "1699": ${has1699}`);
    console.log(`  "incluye": ${hasIncluye}`);
}

debugHTML();
