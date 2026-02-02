// execute-scraping-now.js - Ejecutar scraping inmediatamente
import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_SECRET = 'admin-scraping-secret-2026';
const BATCH_SIZE = 10;
const TOTAL_TOURS = 325;

async function executeScraping() {
    console.log('🚀 EJECUTANDO SCRAPING COMPLETO DE MEGATRAVEL\n');
    console.log('='.repeat(70));
    console.log(`Inicio: ${new Date().toLocaleString('es-MX')}`);
    console.log(`API: ${API_URL}`);
    console.log(`Batch size: ${BATCH_SIZE} tours`);
    console.log(`Total: ${TOTAL_TOURS} tours`);
    console.log('='.repeat(70));

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;
    let offset = 0;

    const totalBatches = Math.ceil(TOTAL_TOURS / BATCH_SIZE);

    while (offset < TOTAL_TOURS) {
        const batchNumber = Math.floor(offset / BATCH_SIZE) + 1;
        const toursInBatch = Math.min(BATCH_SIZE, TOTAL_TOURS - offset);

        console.log(`\n📦 BATCH ${batchNumber}/${totalBatches} (Tours ${offset + 1}-${offset + toursInBatch})`);
        console.log('-'.repeat(70));

        try {
            const response = await fetch(`${API_URL}/api/admin/scrape-all`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_SECRET}`
                },
                body: JSON.stringify({
                    limit: BATCH_SIZE,
                    offset: offset
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                const batchSuccess = data.results.filter(r => r.status === 'success').length;
                const batchErrors = data.results.filter(r => r.status === 'error').length;

                totalProcessed += data.processed;
                totalSuccess += batchSuccess;
                totalErrors += batchErrors;

                console.log(`✅ Batch completado: ${batchSuccess} exitosos, ${batchErrors} errores`);

                // Mostrar resultados detallados
                data.results.forEach((r, idx) => {
                    if (r.status === 'success') {
                        console.log(`   ${idx + 1}. ✓ ${r.mt_code}: $${r.price || 'N/A'} USD, ${r.includes} includes`);
                    } else {
                        console.log(`   ${idx + 1}. ✗ ${r.mt_code}: Error`);
                    }
                });

                // Progreso
                const progress = Math.round((totalProcessed / TOTAL_TOURS) * 100);
                console.log(`\n📊 Progreso: ${progress}% (${totalProcessed}/${TOTAL_TOURS} tours)`);
                console.log(`   ✅ Exitosos: ${totalSuccess} | ❌ Errores: ${totalErrors}`);

            } else {
                console.error(`❌ Error en batch: ${data.error}`);
                totalErrors += BATCH_SIZE;
            }

        } catch (error) {
            console.error(`❌ Error en batch ${batchNumber}:`, error.message);
            totalErrors += BATCH_SIZE;
        }

        offset += BATCH_SIZE;

        // Pausa entre batches
        if (offset < TOTAL_TOURS) {
            console.log(`⏸️  Esperando 3 segundos...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }

    // Resumen final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN FINAL');
    console.log('='.repeat(70));
    console.log(`Total procesados: ${totalProcessed}`);
    console.log(`✅ Exitosos: ${totalSuccess} (${((totalSuccess / totalProcessed) * 100).toFixed(1)}%)`);
    console.log(`❌ Errores: ${totalErrors} (${((totalErrors / totalProcessed) * 100).toFixed(1)}%)`);
    console.log(`\nFin: ${new Date().toLocaleString('es-MX')}`);
    console.log('='.repeat(70));
    console.log('\n✅ SCRAPING COMPLETO FINALIZADO');
}

// Ejecutar
executeScraping().catch(console.error);
