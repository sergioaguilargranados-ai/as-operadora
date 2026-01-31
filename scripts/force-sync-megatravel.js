// Script para forzar sincronización de MegaTravel
require('dotenv').config({ path: '.env.local' });
const { MegaTravelSyncService } = require('../src/services/MegaTravelSyncService');

async function forceSyncMegaTravel() {
    try {
        console.log('🔄 Iniciando sincronización forzada de MegaTravel...\n');

        const result = await MegaTravelSyncService.syncPackages(true); // force = true

        console.log('\n✅ Sincronización completada!');
        console.log('📊 Resultado:', JSON.stringify(result, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error en sincronización:', error);
        process.exit(1);
    }
}

forceSyncMegaTravel();
