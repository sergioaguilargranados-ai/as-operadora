// Script para re-sincronizar tours fallidos de MegaTravel
// Build: 01 Feb 2026 - v2.266
// Ejecuta solo los tours que fallaron en el sync anterior

import dotenv from 'dotenv';
import path from 'path';
import { Pool } from 'pg';
import { MegaTravelScrapingService } from '../src/services/MegaTravelScrapingService';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configurar pool de BD con SSL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

/**
 * IDs de tours que fallaron en el primer sync
 * Extraídos del log: sync-progress.log
 */
const FAILED_TOUR_CODES = [
    'MT-16200', 'MT-12464', 'MT-12017', 'MT-12018', 'MT-12019',
    'MT-12509', 'MT-12459', 'MT-12118', 'MT-12518', 'MT-12534',
    'MT-12545', 'MT-12501', 'MT-12059', 'MT-12798', 'MT-12494',
    'MT-12503', 'MT-12468', 'MT-12422', 'MT-12337', 'MT-12449',
    'MT-12535', 'MT-12526', 'MT-12341', 'MT-12533', 'MT-12540',
    'MT-42925', 'MT-12160', 'MT-12506', 'MT-12157', 'MT-12488',
    'MT-12155', 'MT-12497', 'MT-12423', 'MT-12511', 'MT-12531',
    'MT-12154', 'MT-12454', 'MT-12153', 'MT-12538', 'MT-12152',
    'MT-12460', 'MT-12456', 'MT-12476', 'MT-12465', 'MT-12500',
    'MT-12415', 'MT-12493', 'MT-12151', 'MT-12490', 'MT-12420'
];

interface TourBasic {
    mt_code: string;
    mt_url: string;
    name: string;
    category: string;
}

const MARGIN_PERCENT = 15; // Margen para AS Operadora

/**
 * Obtener datos básicos del tour por código
 */
async function getTourByCode(code: string): Promise<TourBasic | null> {
    const result = await pool.query(
        `SELECT mt_code, mt_url, name, category FROM megatravel_packages WHERE mt_code = $1`,
        [code]
    );
    return result.rows[0] || null;
}

/**
 * Re-sincronizar tour fallido
 */
async function resyncTour(mtCode: string): Promise<boolean> {
    try {
        console.log(`\n🔄 Re-sincronizando ${mtCode}...`);

        const tour = await getTourByCode(mtCode);

        if (!tour) {
            console.log(`   ⚠️  Tour ${mtCode} no encontrado en BD`);
            return false;
        }

        console.log(`   📦 ${tour.name}`);
        console.log(`   🔗 ${tour.mt_url}`);

        // Hacer scraping completo
        const scrapedData = await MegaTravelScrapingService.scrapePackageDetails(tour.mt_url);

        // Obtener package_id
        const pkgResult = await pool.query(
            `SELECT id FROM megatravel_packages WHERE mt_code = $1`,
            [mtCode]
        );

        if (pkgResult.rows.length === 0) {
            console.log(`   ❌ No se encontró package_id para ${mtCode}`);
            return false;
        }

        const packageId = pkgResult.rows[0].id;

        // Guardar datos scrapeados
        await MegaTravelScrapingService.saveScrapedData(packageId, scrapedData, pool);

        // Actualizar estado a "synced"
        await pool.query(
            `UPDATE megatravel_packages SET sync_status = 'synced', last_sync_at = NOW() WHERE id = $1`,
            [packageId]
        );

        console.log(`   ✅ ${mtCode} re-sincronizado exitosamente`);
        return true;

    } catch (error: any) {
        console.error(`   ❌ Error en ${mtCode}:`, error.message);
        return false;
    }
}

/**
 * MAIN - Re-sincronizar todos los tours fallidos
 */
async function resyncFailedTours() {
    console.log('═══════════════════════════════════════════════════');
    console.log('🔄 RE-SYNC DE TOURS FALLIDOS - MEGATRAVEL');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`📊 Total de tours a re-sincronizar: ${FAILED_TOUR_CODES.length}\n`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < FAILED_TOUR_CODES.length; i++) {
        const code = FAILED_TOUR_CODES[i];
        console.log(`[${i + 1}/${FAILED_TOUR_CODES.length}]`);

        const success = await resyncTour(code);

        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        // Esperar 2 segundos entre requests
        if (i < FAILED_TOUR_CODES.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE RE-SINCRONIZACIÓN');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`✅ Tours re-sincronizados: ${successCount}`);
    console.log(`❌ Tours aún fallidos: ${failCount}`);
    console.log(`📈 Tasa de éxito: ${((successCount / FAILED_TOUR_CODES.length) * 100).toFixed(1)}%\n`);

    console.log('═══════════════════════════════════════════════════\n');
    console.log('🎉 ¡RE-SYNC COMPLETADO!\n');

    await pool.end();
}

// Ejecutar
resyncFailedTours().catch(console.error);
