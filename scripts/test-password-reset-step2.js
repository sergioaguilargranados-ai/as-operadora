/**
 * SCRIPT DE PRUEBA - Paso 2: Confirmar Reset
 * Uso: node scripts/test-password-reset-step2.js TOKEN NUEVA_CONTRASEÑA
 */

const token = process.argv[2];
const newPassword = process.argv[3];

if (!token || !newPassword) {
    console.log('❌ Uso: node scripts/test-password-reset-step2.js TOKEN NUEVA_CONTRASEÑA');
    console.log('Ejemplo: node scripts/test-password-reset-step2.js abc123def456 MiNuevaContraseña123');
    process.exit(1);
}

async function testResetPassword() {
    console.log('🧪 Probando confirmación de reset...\n');

    try {
        // 1. Verificar token
        console.log('1️⃣ Verificando token...');
        const verifyResponse = await fetch(`http://localhost:3000/api/auth/reset-password?token=${token}`);
        const verifyData = await verifyResponse.json();
        console.log('Verificación:', verifyData);

        if (!verifyData.valid) {
            throw new Error('Token inválido o expirado');
        }

        console.log('✅ Token válido\n');

        // 2. Cambiar contraseña
        console.log('2️⃣ Cambiando contraseña...');
        const resetResponse = await fetch('http://localhost:3000/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password: newPassword })
        });

        const resetData = await resetResponse.json();
        console.log('Respuesta:', resetData);

        if (!resetData.success) {
            throw new Error(resetData.error || 'Error al cambiar contraseña');
        }

        console.log('\n✅ ¡Contraseña actualizada exitosamente!');
        console.log(`📧 Email: ${verifyData.email}`);
        console.log(`🔑 Nueva contraseña: ${newPassword}`);
        console.log('\n🎉 Ahora puedes iniciar sesión con tu nueva contraseña');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testResetPassword();
