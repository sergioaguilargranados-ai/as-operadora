import { pool } from './src/lib/db';

async function run() {
    try {
        console.log('Inserting API features...');

        const features = [
            {
                code: 'API_AMADEUS',
                name: 'API Amadeus',
                description: 'Motor de búsqueda de vuelos (GDS tradicional)',
                category: 'sistema',
                icon: 'Plane'
            },
            {
                code: 'API_DUFFEL',
                name: 'API Duffel',
                description: 'Motor de búsqueda de vuelos (NDC moderno)',
                category: 'sistema',
                icon: 'PlaneTakeoff'
            },
            {
                code: 'API_HOTELBEDS',
                name: 'API Hotelbeds',
                description: 'Motor de búsqueda de hoteles (Bedbank global)',
                category: 'sistema',
                icon: 'Hotel'
            },
            {
                code: 'API_RATEHAWK',
                name: 'API RateHawk',
                description: 'Motor de búsqueda de hoteles B2B',
                category: 'sistema',
                icon: 'Building'
            }
        ];

        for (let i = 0; i < features.length; i++) {
            const f = features[i];
            await pool.query(`
                INSERT INTO features (code, name, description, category, is_global_enabled, web_enabled, mobile_enabled, icon, sort_order)
                VALUES ($1, $2, $3, $4, true, true, true, $5, $6)
                ON CONFLICT (code) DO NOTHING
            `, [f.code, f.name, f.description, f.category, f.icon, 100 + i]);
            console.log(`Inserted/Checked ${f.code}`);
        }

        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
