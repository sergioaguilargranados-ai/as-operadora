/**
 * SCRIPT DE PRUEBA - Verificación de Email
 * Prueba el flujo completo de verificación
 */

const testUser = {
    name: 'Usuario Prueba',
    email: 'test-verification@example.com',
    password: 'password123'
};

async function testEmailVerification() {
    console.log('🧪 Probando sistema de verificación de email...\n');

    try {
        // 1. Registrar usuario
        console.log('1️⃣ Registrando usuario...');
        const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        const registerData = await registerResponse.json();
        console.log('Respuesta:', registerData);

        if (!registerData.success) {
            throw new Error(registerData.error || 'Error al registrar');
        }

        console.log('✅ Usuario registrado. Email de verificación enviado!\n');

        // 2. Instrucciones
        console.log('📧 SIGUIENTE PASO:');
        console.log('1. Revisa tu email:', testUser.email);
        console.log('2. Copia el token del link que recibiste');
        console.log('3. Ejecuta: node scripts/test-email-verification-step2.js TOKEN');
        console.log('\nEjemplo:');
        console.log('node scripts/test-email-verification-step2.js abc123def456\n');

        // 3. Opción para reenviar
        console.log('💡 Si no recibiste el email, puedes reenviar con:');
        console.log('node scripts/test-email-verification-resend.js', testUser.email, '\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testEmailVerification();
