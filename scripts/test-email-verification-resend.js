/**
 * SCRIPT DE PRUEBA - Reenviar Verificación
 * Uso: node scripts/test-email-verification-resend.js EMAIL
 */

const email = process.argv[2];

if (!email) {
    console.log('❌ Uso: node scripts/test-email-verification-resend.js EMAIL');
    console.log('Ejemplo: node scripts/test-email-verification-resend.js usuario@example.com');
    process.exit(1);
}

async function testResendVerification() {
    console.log('🧪 Reenviando email de verificación...\n');

    try {
        const response = await fetch('http://localhost:3000/api/auth/resend-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al reenviar');
        }

        console.log('\n✅ Email de verificación reenviado!');
        console.log('📧 Revisa tu bandeja de entrada');
        console.log('\n💡 Cuando recibas el email:');
        console.log('node scripts/test-email-verification-step2.js TOKEN\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testResendVerification();
