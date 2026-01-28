// Script para inicializar features y settings en la base de datos
// Ejecutar con: node scripts/init-features.js

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function initFeatures() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Inicializando features y settings...\n');

        // Verificar si la tabla features existe
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'features'
            )
        `);

        if (!tableCheck.rows[0].exists) {
            console.log('⚠️  Tabla features no existe, creando...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS features (
                    id SERIAL PRIMARY KEY,
                    code VARCHAR(100) UNIQUE NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    category VARCHAR(100) DEFAULT 'general',
                    is_global_enabled BOOLEAN DEFAULT true,
                    web_enabled BOOLEAN DEFAULT true,
                    mobile_enabled BOOLEAN DEFAULT true,
                    icon VARCHAR(50),
                    sort_order INTEGER DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            `);
            console.log('✅ Tabla features creada');
        }

        // Verificar si la tabla feature_role_access existe
        const roleTableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'feature_role_access'
            )
        `);

        if (!roleTableCheck.rows[0].exists) {
            console.log('⚠️  Tabla feature_role_access no existe, creando...');
            await pool.query(`
                CREATE TABLE IF NOT EXISTS feature_role_access (
                    id SERIAL PRIMARY KEY,
                    feature_code VARCHAR(100) NOT NULL,
                    role_name VARCHAR(50) NOT NULL,
                    web_enabled BOOLEAN DEFAULT true,
                    mobile_enabled BOOLEAN DEFAULT true,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(feature_code, role_name)
                )
            `);
            console.log('✅ Tabla feature_role_access creada');
        }

        // Insertar features básicas
        const features = [
            // Secciones de Home
            ['HOME_SEARCH_HOTELS', 'Búsqueda de Hoteles', 'Muestra el buscador de hoteles en home', 'home', false, false, false, 'Hotel', 10],
            ['HOME_PACKAGES_CTA', 'CTA Vuelo+Hotel', 'Muestra sección de ahorro vuelo+hotel', 'home', false, false, false, 'Package', 20],
            ['HOME_OFFERS_SECTION', 'Ofertas Especiales', 'Muestra sección de ofertas especiales', 'home', false, false, false, 'Tag', 30],
            ['HOME_FLIGHTS_SECTION', 'Vuelos', 'Muestra sección de vuelos favoritos', 'home', false, false, false, 'Plane', 40],
            ['HOME_ACCOMMODATION_SECTION', 'Hospedajes Favoritos', 'Muestra sección de hospedajes', 'home', false, false, false, 'Home', 50],
            ['HOME_WEEKEND_SECTION', 'Ofertas Fin de Semana', 'Muestra ofertas de última hora', 'home', false, false, false, 'Calendar', 60],
            ['HOME_VACATION_PACKAGES', 'Paquetes Vacacionales', 'Muestra paquetes vacacionales', 'home', false, false, false, 'Palmtree', 70],
            ['HOME_UNIQUE_STAYS', 'Hospedajes Únicos', 'Muestra hospedajes únicos', 'home', false, false, false, 'Star', 80],
            ['HOME_EXPLORE_WORLD', 'Explora el Mundo', 'Muestra sección explora el mundo', 'home', false, false, false, 'Globe', 90],

            // Tours
            ['TOURS_ENABLED', 'Tours Grupales', 'Habilita sección de tours grupales', 'tours', true, true, true, 'Users', 100],

            // Módulos generales
            ['RESERVATIONS', 'Reservaciones', 'Módulo de reservaciones', 'general', true, true, true, 'Calendar', 200],
            ['PAYMENTS', 'Pagos', 'Módulo de pagos', 'general', true, true, true, 'CreditCard', 210],
            ['NOTIFICATIONS', 'Notificaciones', 'Sistema de notificaciones', 'general', true, true, true, 'Bell', 220],
        ];

        console.log('📦 Insertando features...');
        for (const [code, name, description, category, globalEnabled, webEnabled, mobileEnabled, icon, sortOrder] of features) {
            await pool.query(`
                INSERT INTO features (code, name, description, category, is_global_enabled, web_enabled, mobile_enabled, icon, sort_order)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (code) DO UPDATE SET 
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    category = EXCLUDED.category,
                    icon = EXCLUDED.icon,
                    sort_order = EXCLUDED.sort_order
            `, [code, name, description, category, globalEnabled, webEnabled, mobileEnabled, icon, sortOrder]);
            console.log(`  ✅ ${code}`);
        }

        // Insertar role access para cada feature
        const roles = ['SUPER_ADMIN', 'ADMIN', 'cliente', 'corporativo_admin', 'corporativo_employee', 'agencia_admin', 'agencia_operator', 'interno'];

        console.log('\n👥 Configurando acceso por rol...');
        for (const [code] of features) {
            for (const role of roles) {
                await pool.query(`
                    INSERT INTO feature_role_access (feature_code, role_name, web_enabled, mobile_enabled)
                    VALUES ($1, $2, true, true)
                    ON CONFLICT (feature_code, role_name) DO NOTHING
                `, [code, role]);
            }
        }
        console.log('✅ Acceso por rol configurado');

        // Verificar resultado
        const count = await pool.query('SELECT COUNT(*) FROM features');
        console.log(`\n📊 Total de features: ${count.rows[0].count}`);

        console.log('\n✅ Inicialización completada exitosamente');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

initFeatures();
