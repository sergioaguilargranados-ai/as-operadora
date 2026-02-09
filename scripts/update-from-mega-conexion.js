// update-from-mega-conexion.js
// Script para actualizar tours desde Mega Conexión
// Uso: node scripts/update-from-mega-conexion.js [MT-CODE]

import { MegaConexionService } from '../src/services/MegaConexionService.ts';

async function main() {
    const mtCode = process.argv[2];

    if (mtCode) {
        // Actualizar un tour específico
        console.log(`\n🎯 Actualizando tour específico: ${mtCode}\n`);
        const success = await MegaConexionService.updateTourFromMegaConexion(mtCode);

        if (success) {
            console.log(`\n✅ Tour ${mtCode} actualizado exitosamente`);
        } else {
            console.log(`\n❌ Error actualizando tour ${mtCode}`);
            process.exit(1);
        }
    } else {
        // Actualizar todos los tours que necesitan datos
        console.log(`\n🎯 Actualizando todos los tours que necesitan datos...\n`);
        await MegaConexionService.updateAllToursFromMegaConexion();
    }

    console.log(`\n✅ Proceso completado`);
    process.exit(0);
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
