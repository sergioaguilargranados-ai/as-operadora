
const { SearchService } = require('./src/services/SearchService');
require('dotenv').config({ path: '.env.local' });

async function testHotelSearch() {
    console.log('🧪 Iniciando prueba de búsqueda de hoteles...');

    const searchService = new SearchService();

    const params = {
        city: 'Cancun',
        checkInDate: '2026-02-01',
        checkOutDate: '2026-02-05',
        adults: 2,
        rooms: 1
    };

    try {
        console.log(`🔎 Buscando hoteles en ${params.city}...`);
        const results = await searchService.searchHotels(params);
        console.log('✅ Búsqueda finalizada.');
        console.log(`📊 Resultados encontrados: ${results.length}`);

        if (results.length > 0) {
            console.log('🏨 Primer resultado:', JSON.stringify(results[0], null, 2));
        } else {
            console.log('⚠️ No se encontraron resultados. Revisa los logs anteriores para ver detalles de la respuesta de Amadeus.');
        }
    } catch (error) {
        console.error('❌ Error fatal en la prueba:', error);
    }
}

testHotelSearch();
