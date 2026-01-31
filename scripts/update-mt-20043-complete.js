// Script para actualizar MT-20043 con datos completos
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Datos completos de MT-20043 (Turquía)
const DETAILED_HOTELS = [
    {
        city: "Estambul",
        hotel_names: ["Grand Harilton", "Clarion Mahmutbey", "Nirvanas", "Grand S", "Ramada Encore Bayrampega", "Gonen Hotel"],
        category: "Primera",
        country: "Turquía",
        stars: 4
    },
    {
        city: "Capadocia",
        hotel_names: ["Signature Spa", "Signature Garden Avanos", "Altinoz", "Eminkoçak", "Alp Otel", "Crystal Kaymakli", "Dilek", "Burcu Kaya"],
        category: "Primera",
        country: "Turquía",
        stars: 4
    },
    {
        city: "Pamukkale",
        hotel_names: ["Ramada By Wyndham Thermal", "Pam Thermal", "Colossae", "Richmond", "Lycus River", "Adempira", "Herakles"],
        category: "Primera",
        country: "Turquía",
        stars: 4
    },
    {
        city: "Kusadasi",
        hotel_names: ["Signature Blue Resort Hotel", "Tusan Beach", "Odelia", "Ramada Suites", "Ramada Fantasia"],
        category: "Primera",
        country: "Turquía",
        stars: 4
    },
    {
        city: "Izmir",
        hotel_names: ["Ramada Izmir", "Radisson Aliaga", "Hilti Efesus Selçuk", "My Hotel", "Ramada Kemalpaşa", "Park Inn Radisson", "Kaya Prestige", "Blanca", "Ramada Çeşme"],
        category: "Primera",
        country: "Turquía",
        stars: 4
    }
];

const SUPPLEMENTS = [
    { dates: ["2026-04-13", "2026-04-29"], price_usd: 199, description: "Abril: 13, 29" },
    { dates: ["2026-08-19", "2026-08-22", "2026-08-26", "2026-08-27", "2026-08-28", "2026-08-29"], price_usd: 199, description: "Agosto: 19, 22, 26, 27, 28, 29" },
    { dates: ["2026-03-11", "2026-03-15"], price_usd: 299, description: "Marzo: 11, 15" },
    { dates: ["2026-05-06", "2026-05-07", "2026-05-14", "2026-05-15", "2026-05-16", "2026-05-21", "2026-05-23"], price_usd: 299, description: "Mayo: 6, 7, 14, 15, 16, 21, 23" },
    { dates: ["2026-09-03", "2026-09-10", "2026-09-12", "2026-09-17"], price_usd: 299, description: "Septiembre: 3, 10, 12, 17" },
    { dates: ["2026-11-05", "2026-11-15", "2026-11-22", "2026-11-25", "2026-11-30"], price_usd: 299, description: "Noviembre: 5, 15, 22, 25, 30" },
    { dates: ["2026-06-01", "2026-06-05", "2026-06-06", "2026-06-20"], price_usd: 399, description: "Junio: 1, 5, 6, 20" },
    { dates: ["2026-07-16"], price_usd: 399, description: "Julio: 16" }
];

const VISA_REQUIREMENTS = [
    {
        country: "Turquía",
        days_before_departure: 20,
        processing_time: "NA",
        cost: "Sin costo",
        application_url: "https://www.evisa.gov.tr/es/",
        notes: "Le informamos que el trámite de visa corresponde ÚNICAMENTE al pasajero, no es responsabilidad de la agencia de viajes, el pasajero deberá de tramitarla directamente en el consulado o embajada correspondiente."
    }
];

const IMPORTANT_NOTES = [
    "ESTE ITINERARIO PUEDE SUFRIR MODIFICACIONES POR CONDICIONES DE CARRETERAS, CLIMA, OTROS ASPECTOS NO PREVISIBLES O DISPONIBILIDAD AL MOMENTO DE RESERVAR",
    "EL ORDEN DE LOS SERVICIOS PUEDE CAMBIAR",
    "Precios indicados por persona en USD",
    "Los precios cambian constantemente, así que te sugerimos la verificación de estos, y no utilizar este documento como definitivo, en caso de no encontrar la fecha dentro del recuadro consultar el precio del suplemento con su ejecutivo.",
    "Precios vigentes hasta el 30/11/2026"
];

const OPTIONAL_TOURS = [
    {
        code: "PAQUETE 1",
        name: "Paquete Completo 1",
        description: "Incluye las mejores experiencias de Turquía",
        price_usd: 295,
        valid_dates: { from: "2026-04-01", to: "2026-10-31" },
        activities: [
            "Joyas de Constantinopla",
            "Crucero por el Bósforo y bazar egipcio",
            "Safari en 4x4"
        ]
    },
    {
        code: "PAQUETE 2 - A",
        name: "Paquete Completo 2-A",
        description: "Experiencia completa con todas las actividades",
        price_usd: 555,
        valid_dates: { from: "2026-04-01", to: "2026-10-31" },
        activities: [
            "Joyas de Constantinopla",
            "Crucero por el Bósforo y bazar egipcio",
            "Safari en 4x4"
        ],
        conditions: "Este precio aplica para salidas con llegada a Turquía del 1 ABR al 31 MAY y del 1 SEP al 31 OCT"
    },
    {
        code: "CAPADOCIA EN GLOBO - A",
        name: "Vuelo en Globo Capadocia",
        description: "Sobrevuela las chimeneas de hadas al amanecer",
        price_usd: 350,
        valid_dates: { from: "2026-04-01", to: "2026-10-31" },
        conditions: "Sujeto a las condiciones climáticas al momento de reservar"
    },
    {
        name: "Cena crucero por el Bósforo",
        description: "Cena con show turco navegando el Bósforo",
        price_usd: 65
    },
    {
        name: "Safari en Dubai",
        description: "Safari en el desierto con cena beduina",
        price_usd: 80
    }
];

const MAP_IMAGE = "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=1200&h=800&fit=crop";

async function updatePackage() {
    const client = await pool.connect();

    try {
        console.log('🔄 Actualizando MT-20043 con datos completos...\n');

        const result = await client.query(`
            UPDATE megatravel_packages 
            SET 
                detailed_hotels = $1,
                supplements = $2,
                visa_requirements = $3,
                important_notes = $4,
                map_image = $5,
                optional_tours = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE mt_code = 'MT-20043'
            RETURNING mt_code, name
        `, [
            JSON.stringify(DETAILED_HOTELS),
            JSON.stringify(SUPPLEMENTS),
            JSON.stringify(VISA_REQUIREMENTS),
            JSON.stringify(IMPORTANT_NOTES),
            MAP_IMAGE,
            JSON.stringify(OPTIONAL_TOURS)
        ]);

        if (result.rows.length > 0) {
            console.log('✅ Paquete actualizado:', result.rows[0].name);
            console.log('\n📊 Datos agregados:');
            console.log('  ✅ detailed_hotels:', DETAILED_HOTELS.length, 'ciudades');
            console.log('  ✅ supplements:', SUPPLEMENTS.length, 'rangos de fechas');
            console.log('  ✅ visa_requirements:', VISA_REQUIREMENTS.length, 'país');
            console.log('  ✅ important_notes:', IMPORTANT_NOTES.length, 'notas');
            console.log('  ✅ optional_tours:', OPTIONAL_TOURS.length, 'tours');
            console.log('  ✅ map_image: URL configurada');
        } else {
            console.log('❌ No se encontró el paquete MT-20043');
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

updatePackage()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
