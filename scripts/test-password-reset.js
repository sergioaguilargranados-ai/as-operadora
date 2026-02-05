/**
 * SCRIPT DE PRUEBA - Recuperación de Contraseña
 * Prueba el flujo completo de recuperación
 */

const testEmail = 'sergio.aguilar.granados@gmail.com'; // Cambiar por tu email

async function testPasswordReset() {
    console.log('🧪 Probando sistema de recuperación de contraseña...\n');

    try {
        // 1. Solicitar recuperación
        console.log('1️⃣ Solicitando recuperación de contraseña...');
        const forgotResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });

        const forgotData = await forgotResponse.json();
        console.log('Respuesta:', forgotData);

        if (!forgotData.success) {
            throw new Error('Error al solicitar recuperación');
        }

        console.log('✅ Solicitud enviada. Revisa tu email!\n');

        // 2. Instrucciones para continuar
        console.log('📧 SIGUIENTE PASO:');
        console.log('1. Revisa tu email:', testEmail);
        console.log('2. Copia el token del link que recibiste');
        console.log('3. Ejecuta: node scripts/test-password-reset-step2.js TOKEN NUEVA_CONTRASEÑA');
        console.log('\nEjemplo:');
        console.log('node scripts/test-password-reset-step2.js abc123def456 MiNuevaContraseña123\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testPasswordReset();
