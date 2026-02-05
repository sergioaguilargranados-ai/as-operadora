/**
 * SCRIPT DE PRUEBA - Paso 2: Verificar Email
 * Uso: node scripts/test-email-verification-step2.js TOKEN
 */

const token = process.argv[2];

if (!token) {
    console.log('❌ Uso: node scripts/test-email-verification-step2.js TOKEN');
    console.log('Ejemplo: node scripts/test-email-verification-step2.js abc123def456');
    process.exit(1);
}

async function testVerifyEmail() {
    console.log('🧪 Verificando email...\n');

    try {
        const response = await fetch(`http://localhost:3000/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al verificar');
        }

        console.log('\n✅ ¡Email verificado exitosamente!');
        console.log(`📧 Email: ${data.user.email}`);
        console.log(`👤 Nombre: ${data.user.name}`);
        console.log('\n🎉 Ahora deberías recibir un email de bienvenida');
        console.log('💡 Ya puedes iniciar sesión normalmente');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testVerifyEmail();
