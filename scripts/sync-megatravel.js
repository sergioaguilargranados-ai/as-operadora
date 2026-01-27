// Script para sincronizar paquetes de MegaTravel
// Ejecutar con: node scripts/sync-megatravel.js
// 
// Este script carga los paquetes de ejemplo en la base de datos.
// En producción, aquí iría el scraping real con Puppeteer.

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Paquetes de ejemplo con datos completos
const SAMPLE_PACKAGES = [
    {
        mt_code: 'MT-12117',
        mt_url: 'https://www.megatravel.com.mx/viaje/viviendo-europa-12117.html',
        name: 'Viviendo Europa',
        description: 'Viaje desde México a España, Francia, Suiza, Italia. Visitando: Madrid, Burgos, Burdeos, París, Lucerna, Zúrich, Venecia, Florencia, Roma, Pisa, Riviera Francesa, Barcelona, Zaragoza',
        destination_region: 'Europa',
        cities: ['Madrid', 'Burgos', 'Burdeos', 'París', 'Lucerna', 'Zúrich', 'Venecia', 'Florencia', 'Roma', 'Pisa', 'Riviera Francesa', 'Barcelona', 'Zaragoza'],
        countries: ['España', 'Francia', 'Suiza', 'Italia', 'Mónaco'],
        main_country: 'Europa',
        days: 17,
        nights: 15,
        price_usd: 1699,
        taxes_usd: 799,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Doble',
        includes_flight: true,
        flight_origin: 'CDMX',
        includes: [
            'Boleto de avión México – Madrid / Madrid - México volando en clase turista',
            '15 noches de alojamiento en categoría indicada',
            'Régimen alimenticio de acuerdo a itinerario',
            'Visitas según itinerario',
            'Guía profesional de habla hispana',
            'Traslados los indicados',
            'Transporte en autocar turístico',
            'Documentos electrónicos código QR'
        ],
        not_includes: [
            'Alimentos, gastos de índole personal',
            'Ningún servicio no especificado',
            'Todas las excursiones que se mencionan como opcionales',
            'Impuestos aéreos por persona',
            '75 EUR que corresponden a propinas para guías acompañantes, choferes, tasas municipales, se paga en destino'
        ],
        hotel_category: 'Turista',
        meal_plan: 'Desayuno incluido',
        optional_tours: [
            { name: 'Paseo en góndola por los canales de Venecia', description: 'Sumérgete en la vida veneciana navegando por los emblemáticos canales venecianos', price_usd: 45 },
            { name: 'Roma Barroca y Coliseo Romano', description: 'Pedir tu deseo al pie de la fuente de Trevi, apreciar el Pantheon, Plaza Navona y el Coliseo Romano', price_usd: 65 },
            { name: 'Museo del Vaticano y la Capilla Sixtina', description: 'Visita los Museos Vaticanos hasta la Capilla Sixtina y Basílica de San Pedro', price_usd: 75 },
            { name: 'Montmarte, Versalles y Torre Eiffel', description: 'Barrio de Montmartre, Palacio de Versalles y subida a la Torre Eiffel', price_usd: 95 },
            { name: 'Ciudad imperial de Toledo', description: 'Toledo con entrada guiada a la Catedral Primada de España', price_usd: 55 },
            { name: 'Mónaco', description: 'Ópera, Casino de Monte-Carlo y parte del circuito de Fórmula 1', price_usd: 40 }
        ],
        main_image: 'https://images.unsplash.com/photo-1499856871958-5b9337606a3e?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800',
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800',
            'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800',
            'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800'
        ],
        category: 'Europa',
        subcategory: 'Tour Completo',
        tags: ['europa', 'paris', 'roma', 'barcelona', 'vuelo incluido'],
        is_featured: true,
        is_offer: false,
        tips_amount: '75 EUR'
    },
    {
        mt_code: 'MT-20043',
        mt_url: 'https://www.megatravel.com.mx/viaje/mega-turquia-y-dubai-20043.html',
        name: 'Mega Turquía y Dubái',
        description: 'Descubre los tesoros de Turquía y el lujo de Dubái en un solo viaje. Visita Estambul, Capadocia, Pamukkale y termina en el glamuroso Dubái.',
        destination_region: 'Medio Oriente',
        cities: ['Estambul', 'Ankara', 'Capadocia', 'Pamukkale', 'Kusadasi', 'Éfeso', 'Dubái'],
        countries: ['Turquía', 'Emiratos Árabes Unidos'],
        main_country: 'Turquía',
        days: 15,
        nights: 13,
        price_usd: 999,
        taxes_usd: 999,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Doble',
        includes_flight: true,
        flight_airline: 'Turkish Airlines',
        flight_origin: 'CDMX',
        includes: [
            'Vuelo redondo México-Estambul-Dubái-México',
            '13 noches de alojamiento',
            'Desayunos diarios',
            'Guía de habla hispana',
            'Traslados y transporte terrestre',
            'Entradas según itinerario'
        ],
        not_includes: [
            'Comidas no especificadas',
            'Propinas sugeridas',
            'Gastos personales',
            'Seguro de viaje (recomendado)'
        ],
        hotel_category: 'Primera clase',
        meal_plan: 'Desayuno incluido',
        optional_tours: [
            { name: 'Vuelo en globo Capadocia', description: 'Sobrevuela las chimeneas de hadas al amanecer', price_usd: 250 },
            { name: 'Cena crucero por el Bósforo', description: 'Cena con show turco navegando el Bósforo', price_usd: 65 },
            { name: 'Safari en Dubai', description: 'Safari en el desierto con cena beduina', price_usd: 80 }
        ],
        main_image: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800',
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
        ],
        category: 'Medio Oriente',
        subcategory: 'Turquía + Dubai',
        tags: ['turquia', 'dubai', 'capadocia', 'estambul', 'vuelo incluido'],
        is_featured: true,
        is_offer: false,
        tips_amount: '50 EUR'
    },
    {
        mt_code: 'MT-30208',
        mt_url: 'https://www.megatravel.com.mx/viaje/japon-el-camino-del-samurai-30208.html',
        name: 'Japón: El Camino del Samurái',
        description: 'Recorre la tierra del sol naciente desde Tokyo hasta Kyoto, pasando por lo mejor de Japón. Tradición, modernidad y cultura milenaria.',
        destination_region: 'Asia',
        cities: ['Tokyo', 'Hakone', 'Nagoya', 'Kyoto', 'Nara', 'Osaka'],
        countries: ['Japón'],
        main_country: 'Japón',
        days: 12,
        nights: 10,
        price_usd: 1999,
        taxes_usd: 999,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Doble',
        includes_flight: true,
        flight_origin: 'CDMX',
        includes: [
            'Vuelo redondo México-Tokyo',
            '10 noches de alojamiento',
            'Desayunos diarios',
            'Traslados en tren bala (Shinkansen)',
            'Guía de habla hispana',
            'Entradas a templos y atracciones'
        ],
        not_includes: [
            'Comidas no especificadas',
            'JR Pass adicional',
            'Gastos personales'
        ],
        hotel_category: 'Primera clase',
        meal_plan: 'Desayuno incluido',
        optional_tours: [
            { name: 'Ceremonia del Té', description: 'Experiencia tradicional japonesa', price_usd: 45 },
            { name: 'Cena de Sumo', description: 'Cena con los famosos luchadores de sumo', price_usd: 120 }
        ],
        main_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
            'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800'
        ],
        category: 'Asia',
        subcategory: 'Japón',
        tags: ['japon', 'tokyo', 'kyoto', 'samurai', 'cultura', 'vuelo incluido'],
        is_featured: true,
        is_offer: false,
        tips_amount: '40 USD'
    },
    {
        mt_code: 'MT-42472',
        mt_url: 'https://www.megatravel.com.mx/viaje/nueva-york-semana-santa-42472.html',
        name: 'Nueva York Semana Santa',
        description: 'Vive la Gran Manzana en Semana Santa con toda la familia. Manhattan, Times Square, Estatua de la Libertad y más.',
        destination_region: 'Norte América',
        cities: ['Nueva York'],
        countries: ['Estados Unidos'],
        main_country: 'Estados Unidos',
        days: 6,
        nights: 5,
        price_usd: 799,
        taxes_usd: 499,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Cuádruple',
        price_variants: { cuadruple: 799, triple: 899, doble: 999, sencilla: 1299 },
        includes_flight: true,
        flight_origin: 'CDMX',
        includes: [
            'Vuelo redondo México-Nueva York',
            '5 noches de alojamiento en Manhattan',
            'Traslados aeropuerto-hotel-aeropuerto',
            'City tour panorámico',
            'Crucero a la Estatua de la Libertad'
        ],
        not_includes: [
            'Entradas a atracciones',
            'Comidas',
            'Propinas'
        ],
        hotel_category: 'Turista Superior',
        meal_plan: 'Solo hospedaje',
        optional_tours: [
            { name: 'Top of the Rock', description: 'Mirador del Rockefeller Center', price_usd: 45 },
            { name: 'Broadway Show', description: 'Musical en Broadway', price_usd: 150 }
        ],
        main_image: 'https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=800'
        ],
        category: 'Estados Unidos',
        subcategory: 'Nueva York',
        tags: ['nueva york', 'semana santa', 'familia', 'manhattan'],
        is_featured: false,
        is_offer: true,
        tips_amount: '30 USD'
    },
    {
        mt_code: 'MT-52104',
        mt_url: 'https://www.megatravel.com.mx/viaje/disfruta-una-experiencia-andina-52104.html',
        name: 'Experiencia Andina',
        description: 'Descubre Perú: Lima, Cusco y la maravilla de Machu Picchu. Una de las 7 maravillas del mundo moderno.',
        destination_region: 'Sudamérica',
        cities: ['Lima', 'Cusco', 'Valle Sagrado', 'Machu Picchu'],
        countries: ['Perú'],
        main_country: 'Perú',
        days: 8,
        nights: 7,
        price_usd: 899,
        taxes_usd: 499,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Doble',
        includes_flight: true,
        flight_origin: 'CDMX',
        includes: [
            'Vuelo México-Lima-Cusco-Lima-México',
            '7 noches de alojamiento',
            'Desayunos diarios',
            'Tren a Machu Picchu',
            'Entrada a Machu Picchu',
            'Guía en español',
            'Tour Valle Sagrado'
        ],
        not_includes: [
            'Propinas',
            'Comidas no indicadas',
            'Seguro de altitud'
        ],
        hotel_category: 'Primera clase',
        meal_plan: 'Desayuno incluido',
        optional_tours: [
            { name: 'Rainbow Mountain', description: 'Caminata a la Montaña de 7 Colores', price_usd: 65 },
            { name: 'Cena peruana con show', description: 'Gastronomía y danzas típicas', price_usd: 55 }
        ],
        main_image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800'
        ],
        category: 'Sudamérica',
        subcategory: 'Perú',
        tags: ['peru', 'machu picchu', 'cusco', 'lima', 'andes'],
        is_featured: false,
        is_offer: false,
        tips_amount: '25 USD'
    },
    {
        mt_code: 'MT-60867',
        mt_url: 'https://www.megatravel.com.mx/viaje/caribe-msc-world-america-60867.html',
        name: 'Caribe MSC World America',
        description: 'Crucero por el Caribe a bordo del nuevo MSC World America. Incluye Cozumel, Roatán y Costa Maya.',
        destination_region: 'Caribe',
        cities: ['Miami', 'Cozumel', 'Isla de Roatán', 'Costa Maya'],
        countries: ['Estados Unidos', 'México', 'Honduras'],
        main_country: 'Caribe',
        days: 8,
        nights: 7,
        price_usd: 691,
        taxes_usd: 304,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Interior',
        price_variants: { interior: 691, exterior: 891, balcon: 1091, suite: 1591 },
        includes_flight: false,
        flight_origin: 'N/A',
        includes: [
            '7 noches de crucero',
            'Todas las comidas a bordo',
            'Entretenimiento y shows',
            'Uso de instalaciones',
            'Tasas portuarias'
        ],
        not_includes: [
            'Vuelo a Miami',
            'Propinas de crucero ($16 USD/día)',
            'Excursiones en tierra',
            'Bebidas alcohólicas'
        ],
        hotel_category: 'Crucero MSC',
        meal_plan: 'Todo incluido (no bebidas)',
        optional_tours: [
            { name: 'Snorkel en Cozumel', description: 'Arrecifes del Caribe Mexicano', price_usd: 75 },
            { name: 'Playas de Roatán', description: 'Día de playa en Honduras', price_usd: 55 }
        ],
        main_image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1599640842225-85d111c60e6b?w=800'
        ],
        category: 'Cruceros',
        subcategory: 'MSC Cruceros',
        tags: ['crucero', 'caribe', 'msc', 'cozumel', 'miami'],
        is_featured: false,
        is_offer: true,
        tips_amount: '$16 USD/día'
    },
    {
        mt_code: 'MT-16300',
        mt_url: 'https://www.megatravel.com.mx/viaje/europa-clasica-16300.html',
        name: 'Europa Clásica',
        description: 'Lo mejor de Europa en un recorrido clásico: Madrid, París, ciudades suizas, Venecia, Florencia, Roma y Barcelona.',
        destination_region: 'Europa',
        cities: ['Madrid', 'San Sebastián', 'Burdeos', 'París', 'Lucerna', 'Milán', 'Venecia', 'Florencia', 'Roma', 'Pisa', 'Niza', 'Barcelona', 'Zaragoza'],
        countries: ['España', 'Francia', 'Suiza', 'Italia'],
        main_country: 'Europa',
        days: 19,
        nights: 17,
        price_usd: 1999,
        taxes_usd: 799,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Doble',
        includes_flight: true,
        flight_origin: 'CDMX',
        includes: [
            'Vuelo redondo México-Madrid',
            '17 noches de alojamiento',
            'Desayunos diarios',
            'Guía de habla hispana',
            'Transporte en autocar de lujo',
            'Visitas panorámicas en cada ciudad'
        ],
        not_includes: [
            'Comidas no especificadas',
            '80 EUR propinas',
            'Entradas a atracciones opcionales'
        ],
        hotel_category: 'Turista Superior',
        meal_plan: 'Desayuno incluido',
        optional_tours: [
            { name: 'Paseo en góndola Venecia', description: 'Romántico paseo por los canales', price_usd: 45 },
            { name: 'Versalles y Torre Eiffel', description: 'Palacio + subida a la torre', price_usd: 95 },
            { name: 'Coliseo y Vaticano', description: 'Lo imperdible de Roma', price_usd: 85 }
        ],
        main_image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1499856871958-5b9337606a3e?w=800',
            'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800'
        ],
        category: 'Europa',
        subcategory: 'Tour Clásico',
        tags: ['europa', 'clasico', 'paris', 'roma', 'venecia'],
        is_featured: true,
        is_offer: false,
        tips_amount: '80 EUR'
    },
    {
        mt_code: 'MT-20287',
        mt_url: 'https://www.megatravel.com.mx/viaje/estambul-crucero-islas-griegas-y-dubai-20287.html',
        name: 'Estambul, Crucero Islas Griegas y Dubái',
        description: 'Combina lo mejor de Turquía con un espectacular crucero por las Islas Griegas y termina en el lujoso Dubái.',
        destination_region: 'Medio Oriente',
        cities: ['Estambul', 'Mykonos', 'Santorini', 'Atenas', 'Dubái'],
        countries: ['Turquía', 'Grecia', 'Emiratos Árabes Unidos'],
        main_country: 'Medio Oriente',
        days: 14,
        nights: 12,
        price_usd: 1499,
        taxes_usd: 999,
        currency: 'USD',
        price_per_person_type: 'Por persona en habitación Doble',
        includes_flight: true,
        flight_airline: 'Turkish Airlines',
        flight_origin: 'CDMX',
        includes: [
            'Vuelos internacionales e internos',
            '3 noches crucero Islas Griegas',
            'Hoteles 4-5 estrellas',
            'Desayunos y comidas en crucero',
            'Guía profesional'
        ],
        not_includes: [
            'Excursiones en las islas',
            'Propinas',
            'Bebidas'
        ],
        hotel_category: 'Primera clase + Crucero',
        meal_plan: 'Desayunos + Crucero todo incluido',
        optional_tours: [
            { name: 'Tour Santorini', description: 'Recorrido por la isla más fotogénica', price_usd: 85 },
            { name: 'Burj Khalifa', description: 'Subida al edificio más alto del mundo', price_usd: 60 }
        ],
        main_image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200',
        gallery_images: [
            'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800'
        ],
        category: 'Medio Oriente',
        subcategory: 'Turquía + Grecia + Dubai',
        tags: ['turquia', 'grecia', 'santorini', 'dubai', 'crucero', 'islas'],
        is_featured: true,
        is_offer: false,
        tips_amount: '60 EUR + 12 USD/día crucero'
    }
];

async function syncPackages() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Iniciando sincronización de paquetes MegaTravel...\n');

        // Obtener margen configurado
        const marginResult = await pool.query(`
            SELECT value FROM app_settings WHERE key = 'MEGATRAVEL_MARGIN_PERCENT'
        `);
        const margin = parseFloat(marginResult.rows[0]?.value || '15');
        console.log(`📊 Margen configurado: ${margin}%\n`);

        // Crear registro de sincronización
        const syncResult = await pool.query(`
            INSERT INTO megatravel_sync_log (sync_type, triggered_by, status)
            VALUES ('full', 'script', 'running')
            RETURNING id
        `);
        const syncId = syncResult.rows[0].id;

        let synced = 0;
        let failed = 0;

        for (const pkg of SAMPLE_PACKAGES) {
            try {
                const slug = pkg.name.toLowerCase()
                    .replace(/[áàäâ]/g, 'a')
                    .replace(/[éèëê]/g, 'e')
                    .replace(/[íìïî]/g, 'i')
                    .replace(/[óòöô]/g, 'o')
                    .replace(/[úùüû]/g, 'u')
                    .replace(/ñ/g, 'n')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');

                await pool.query(`
                    INSERT INTO megatravel_packages (
                        mt_code, mt_url, slug, name, description, destination_region,
                        cities, countries, main_country, days, nights,
                        price_usd, taxes_usd, currency, price_per_person_type, price_variants,
                        includes_flight, flight_airline, flight_origin,
                        includes, not_includes, hotel_category, meal_plan,
                        optional_tours, main_image, gallery_images,
                        category, subcategory, tags, is_featured, is_offer, tips_amount,
                        our_margin_percent, is_active, last_sync_at, sync_status
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6,
                        $7, $8, $9, $10, $11,
                        $12, $13, $14, $15, $16,
                        $17, $18, $19,
                        $20, $21, $22, $23,
                        $24, $25, $26,
                        $27, $28, $29, $30, $31, $32,
                        $33, true, CURRENT_TIMESTAMP, 'synced'
                    )
                    ON CONFLICT (mt_code) DO UPDATE SET
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        price_usd = EXCLUDED.price_usd,
                        taxes_usd = EXCLUDED.taxes_usd,
                        price_variants = EXCLUDED.price_variants,
                        optional_tours = EXCLUDED.optional_tours,
                        is_featured = EXCLUDED.is_featured,
                        is_offer = EXCLUDED.is_offer,
                        last_sync_at = CURRENT_TIMESTAMP,
                        sync_status = 'synced',
                        updated_at = CURRENT_TIMESTAMP
                `, [
                    pkg.mt_code, pkg.mt_url, slug, pkg.name, pkg.description || null, pkg.destination_region,
                    pkg.cities, pkg.countries, pkg.main_country, pkg.days, pkg.nights,
                    pkg.price_usd, pkg.taxes_usd, pkg.currency, pkg.price_per_person_type, JSON.stringify(pkg.price_variants || {}),
                    pkg.includes_flight, pkg.flight_airline || null, pkg.flight_origin,
                    pkg.includes, pkg.not_includes, pkg.hotel_category || null, pkg.meal_plan || null,
                    JSON.stringify(pkg.optional_tours || []), pkg.main_image, pkg.gallery_images || [],
                    pkg.category, pkg.subcategory || null, pkg.tags || [], pkg.is_featured, pkg.is_offer, pkg.tips_amount || null,
                    margin
                ]);

                synced++;
                console.log(`✅ ${pkg.mt_code}: ${pkg.name}`);

            } catch (err) {
                failed++;
                console.error(`❌ ${pkg.mt_code}: Error - ${err.message}`);
            }
        }

        // Actualizar registro de sincronización
        await pool.query(`
            UPDATE megatravel_sync_log 
            SET completed_at = CURRENT_TIMESTAMP,
                packages_found = $1,
                packages_synced = $2,
                packages_failed = $3,
                status = 'completed'
            WHERE id = $4
        `, [SAMPLE_PACKAGES.length, synced, failed, syncId]);

        // Actualizar última sincronización
        await pool.query(`
            UPDATE app_settings SET value = $1 WHERE key = 'MEGATRAVEL_LAST_SYNC'
        `, [new Date().toISOString()]);

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Sincronización completada`);
        console.log(`   • Paquetes encontrados: ${SAMPLE_PACKAGES.length}`);
        console.log(`   • Sincronizados: ${synced}`);
        console.log(`   • Fallidos: ${failed}`);
        console.log(`   • Margen aplicado: ${margin}%`);
        console.log('='.repeat(50));

        // Mostrar precios calculados
        console.log('\n📋 Precios con margen aplicado:');
        const prices = await pool.query(`
            SELECT mt_code, name, price_usd, 
                   ROUND(price_usd * (1 + our_margin_percent / 100), 2) as sale_price,
                   taxes_usd,
                   ROUND(price_usd * (1 + our_margin_percent / 100) + taxes_usd, 2) as total
            FROM megatravel_packages
            ORDER BY category, price_usd
        `);

        prices.rows.forEach(row => {
            console.log(`   ${row.mt_code}: $${row.price_usd} → $${row.sale_price} + $${row.taxes_usd} IMP = $${row.total} USD`);
        });

    } catch (error) {
        console.error('❌ Error en sincronización:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

syncPackages();
