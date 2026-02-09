// test-mega-conexion.js
// Script de prueba para verificar extracción desde Mega Conexión
// Uso: npx tsx scripts/test-mega-conexion.js

import { MegaConexionService } from '../src/services/MegaConexionService.ts';

async function main() {
    console.log('\n🧪 PRUEBA: Extracción desde Mega Conexión\n');
    console.log('='.repeat(60));

    // Probar con un tour conocido
    const testCodes = ['MT-12534', 'MT-20043', 'MT-12117'];

    for (const mtCode of testCodes) {
        console.log(`\n📦 Probando: ${mtCode}`);
        console.log('-'.repeat(60));

        try {
            const data = await MegaConexionService.scrapeFromMegaConexion(mtCode);

            if (data) {
                console.log(`\n✅ Datos extraídos:`);
                console.log(`   Itinerario: ${data.itinerary?.length || 0} días`);
                console.log(`   Ciudades: ${data.cities?.length || 0}`);
                console.log(`   Países: ${data.countries?.length || 0}`);
                console.log(`   Precio: ${data.price_usd ? '$' + data.price_usd : 'No encontrado'}`);
                console.log(`   Impuestos: ${data.taxes_usd ? '$' + data.taxes_usd : 'No encontrado'}`);
                console.log(`   Incluye: ${data.includes?.length || 0} items`);
                console.log(`   No Incluye: ${data.not_includes?.length || 0} items`);

                if (data.itinerary && data.itinerary.length > 0) {
                    console.log(`\n   📅 Primeros 3 días del itinerario:`);
                    data.itinerary.slice(0, 3).forEach(day => {
                        console.log(`      Día ${day.day_number}: ${day.title}`);
                        console.log(`         ${day.description.substring(0, 100)}...`);
                        if (day.meals) console.log(`         Comidas: ${day.meals}`);
                    });
                }

                if (data.cities && data.cities.length > 0) {
                    console.log(`\n   🏙️ Ciudades: ${data.cities.slice(0, 10).join(', ')}`);
                }

                if (data.not_includes && data.not_includes.length > 0) {
                    console.log(`\n   ❌ No Incluye (primeros 3):`);
                    data.not_includes.slice(0, 3).forEach(item => {
                        console.log(`      - ${item.substring(0, 80)}`);
                    });
                }
            } else {
                console.log(`\n❌ No se pudo extraer datos`);
            }

        } catch (error) {
            console.error(`\n❌ Error:`, error.message);
        }

        console.log('\n' + '='.repeat(60));

        // Esperar entre tours
        if (testCodes.indexOf(mtCode) < testCodes.length - 1) {
            console.log('\n⏳ Esperando 3 segundos antes del siguiente...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    console.log('\n✅ Prueba completada\n');
    process.exit(0);
}

main().catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
});
