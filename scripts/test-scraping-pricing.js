// test-scraping-pricing.js - Probar scraping de precios e includes
// Ejecutar: node scripts/test-scraping-pricing.js

import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: '.env.local' });

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Crear pool de conexiones
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testScrapingPricing() {
    console.log('🧪 PRUEBA DE SCRAPING - PRECIOS E INCLUDES\n');
    console.log('='.repeat(60));

    try {
        // Importar el servicio de scraping
        const { MegaTravelScrapingService } = await import('../src/services/MegaTravelScrapingService.ts');

        // URL de prueba: Viviendo Europa
        const testUrl = 'https://www.megatravel.com.mx/viaje/viviendo-europa-12117.html';
        const testCode = 'MT-12117';

        console.log(`\n📍 URL de prueba: ${testUrl}`);
        console.log(`📍 Código: ${testCode}\n`);

        // Obtener package_id de la base de datos
        const result = await pool.query(`
            SELECT id FROM megatravel_packages WHERE mt_code = $1
        `, [testCode]);

        if (result.rows.length === 0) {
            console.error(`❌ Tour ${testCode} no encontrado en la base de datos`);
            process.exit(1);
        }

        const packageId = result.rows[0].id;
        console.log(`✅ Package ID: ${packageId}\n`);

        // Hacer scraping completo
        console.log('🔍 Iniciando scraping...\n');
        const scrapedData = await MegaTravelScrapingService.scrapeTourComplete(testUrl, packageId);

        // Mostrar resultados
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESULTADOS DEL SCRAPING');
        console.log('='.repeat(60));

        console.log(`\n💰 PRECIOS:`);
        console.log(`   Precio base: $${scrapedData.pricing.price_usd || 'N/A'} USD`);
        console.log(`   Impuestos: $${scrapedData.pricing.taxes_usd || 'N/A'} USD`);
        console.log(`   Tipo: ${scrapedData.pricing.price_per_person_type}`);
        console.log(`   Variantes: ${Object.keys(scrapedData.pricing.price_variants).length > 0 ? Object.keys(scrapedData.pricing.price_variants).join(', ') : 'Ninguna'}`);

        console.log(`\n✅ INCLUYE (${scrapedData.includes.length} items):`);
        scrapedData.includes.slice(0, 5).forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.substring(0, 80)}${item.length > 80 ? '...' : ''}`);
        });
        if (scrapedData.includes.length > 5) {
            console.log(`   ... y ${scrapedData.includes.length - 5} más`);
        }

        console.log(`\n❌ NO INCLUYE (${scrapedData.not_includes.length} items):`);
        scrapedData.not_includes.slice(0, 5).forEach((item, i) => {
            console.log(`   ${i + 1}. ${item.substring(0, 80)}${item.length > 80 ? '...' : ''}`);
        });
        if (scrapedData.not_includes.length > 5) {
            console.log(`   ... y ${scrapedData.not_includes.length - 5} más`);
        }

        console.log(`\n📅 ITINERARIO: ${scrapedData.itinerary.length} días`);
        console.log(`🎫 SALIDAS: ${scrapedData.departures.length} fechas`);
        console.log(`🎨 TOURS OPCIONALES: ${scrapedData.optionalTours.length} tours`);
        console.log(`🖼️  IMÁGENES: ${scrapedData.images.gallery.length} fotos`);
        console.log(`🏷️  TAGS: ${scrapedData.tags.join(', ')}`);

        // Guardar en la base de datos
        console.log(`\n💾 Guardando datos en la base de datos...`);
        await MegaTravelScrapingService.saveScrapedData(packageId, scrapedData, pool);

        // Verificar que se guardó correctamente
        const verification = await pool.query(`
            SELECT 
                price_usd, 
                taxes_usd, 
                price_per_person_type,
                array_length(includes, 1) as includes_count,
                array_length(not_includes, 1) as not_includes_count
            FROM megatravel_packages 
            WHERE id = $1
        `, [packageId]);

        console.log(`\n✅ VERIFICACIÓN EN BASE DE DATOS:`);
        console.log(`   Precio: $${verification.rows[0].price_usd || 'N/A'} USD`);
        console.log(`   Impuestos: $${verification.rows[0].taxes_usd || 'N/A'} USD`);
        console.log(`   Tipo: ${verification.rows[0].price_per_person_type || 'N/A'}`);
        console.log(`   Includes: ${verification.rows[0].includes_count || 0} items`);
        console.log(`   Not Includes: ${verification.rows[0].not_includes_count || 0} items`);

        console.log(`\n${'='.repeat(60)}`);
        console.log('✅ PRUEBA COMPLETADA CON ÉXITO');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERROR EN LA PRUEBA:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Ejecutar prueba
testScrapingPricing();
