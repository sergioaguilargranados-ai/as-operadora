// Script para verificar datos de MT-20043 en la base de datos
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPackageData() {
    const client = await pool.connect();

    try {
        console.log('🔍 Verificando datos de MT-20043...\n');

        const result = await client.query(`
            SELECT 
                mt_code,
                name,
                detailed_hotels,
                supplements,
                visa_requirements,
                important_notes,
                map_image,
                optional_tours
            FROM megatravel_packages 
            WHERE mt_code = 'MT-20043'
        `);

        if (result.rows.length === 0) {
            console.log('❌ No se encontró el paquete MT-20043');
            return;
        }

        const pkg = result.rows[0];

        console.log('📦 Paquete encontrado:', pkg.name);
        console.log('\n📊 Estado de campos:');
        console.log('  detailed_hotels:', pkg.detailed_hotels ? `✅ ${JSON.stringify(pkg.detailed_hotels).length} chars` : '❌ NULL');
        console.log('  supplements:', pkg.supplements ? `✅ ${JSON.stringify(pkg.supplements).length} chars` : '❌ NULL');
        console.log('  visa_requirements:', pkg.visa_requirements ? `✅ ${pkg.visa_requirements.length} chars` : '❌ NULL');
        console.log('  important_notes:', pkg.important_notes ? `✅ ${pkg.important_notes.length} chars` : '❌ NULL');
        console.log('  map_image:', pkg.map_image ? `✅ ${pkg.map_image}` : '❌ NULL');
        console.log('  optional_tours:', pkg.optional_tours ? `✅ ${JSON.stringify(pkg.optional_tours).length} chars` : '❌ NULL');

        console.log('\n📝 Contenido de campos:');

        if (pkg.detailed_hotels) {
            console.log('\n🏨 DETAILED_HOTELS:');
            console.log(JSON.stringify(pkg.detailed_hotels, null, 2));
        }

        if (pkg.supplements) {
            console.log('\n💰 SUPPLEMENTS:');
            console.log(JSON.stringify(pkg.supplements, null, 2));
        }

        if (pkg.visa_requirements) {
            console.log('\n🛂 VISA_REQUIREMENTS:');
            console.log(pkg.visa_requirements);
        }

        if (pkg.important_notes) {
            console.log('\n⚠️ IMPORTANT_NOTES:');
            console.log(pkg.important_notes);
        }

        if (pkg.optional_tours) {
            console.log('\n🎯 OPTIONAL_TOURS:');
            console.log(JSON.stringify(pkg.optional_tours, null, 2));
        }

    } catch (error) {
        console.error('\n❌ Error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkPackageData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
