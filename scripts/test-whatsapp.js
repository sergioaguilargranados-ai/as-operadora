/**
 * SCRIPT DE PRUEBA - Enviar WhatsApp
 * Prueba el envío de mensajes de WhatsApp
 */

const testNumber = '+5215512345678'; // Cambiar por tu número de WhatsApp
const testMessage = '¡Hola! Este es un mensaje de prueba desde AS Operadora 🎉';

async function testWhatsApp() {
    console.log('🧪 Probando envío de WhatsApp...\n');

    try {
        const response = await fetch('http://localhost:3000/api/messaging/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                channel: 'whatsapp',
                to: testNumber,
                message: testMessage
            })
        });

        const data = await response.json();
        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al enviar');
        }

        console.log('\n✅ WhatsApp enviado exitosamente!');
        console.log(`📱 Número: ${testNumber}`);
        console.log(`📧 Message ID: ${data.messageId}`);
        console.log('\n💡 Revisa tu WhatsApp para ver el mensaje');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testWhatsApp();
