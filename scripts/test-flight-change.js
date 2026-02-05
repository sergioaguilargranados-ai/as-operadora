/**
 * SCRIPT DE PRUEBA - Notificación de Cambio de Vuelo
 * Simula un cambio de vuelo en una reserva
 */

const bookingId = 1; // Cambiar por un ID de reserva real

async function testFlightChange() {
    console.log('🧪 Probando notificación de cambio de vuelo...\n');

    try {
        const response = await fetch('http://localhost:3000/api/bookings/notify-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: bookingId,
                changeType: 'flight',
                changeDescription: 'Cambio de aerolínea y horario',
                oldFlightInfo: 'Aeroméxico AM 123 - 10:00 AM',
                newFlightInfo: 'Volaris Y4 456 - 14:30 PM',
                changeReason: 'Cambio de aeronave por mantenimiento programado',
                priceChange: false
            })
        });

        const data = await response.json();
        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al enviar notificación');
        }

        console.log('\n✅ Notificación de cambio de vuelo enviada!');
        console.log(`📧 Email enviado a: ${data.booking.email}`);
        console.log(`📋 Reserva: #${data.booking.id} - ${data.booking.serviceName}`);
        console.log('\n💡 El cliente recibirá un email con los detalles del cambio');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testFlightChange();
