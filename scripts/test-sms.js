/**
 * SCRIPT DE PRUEBA - Enviar SMS
 * Prueba el envío de mensajes de SMS
 */

const testNumber = '+5215512345678'; // Cambiar por tu número
const testMessage = 'Hola! Este es un mensaje de prueba desde AS Operadora';

async function testSMS() {
    console.log('🧪 Probando envío de SMS...\n');

    try {
        const response = await fetch('http://localhost:3000/api/messaging/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: 'sms',
                to: testNumber,
                message: testMessage
            })
        });

        const data = await response.json();
        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al enviar');
        }

        console.log('\n✅ SMS enviado exitosamente!');
        console.log(`📱 Número: ${testNumber}`);
        console.log(`📧 Message ID: ${data.messageId}`);
        console.log('\n💡 Revisa tu teléfono para ver el SMS');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSMS();
