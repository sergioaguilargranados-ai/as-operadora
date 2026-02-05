/**
 * SCRIPT DE PRUEBA - Notificación de Cambio de Fecha
 * Simula un cambio de fecha con ajuste de precio
 */

const bookingId = 1; // Cambiar por un ID de reserva real

async function testDateChange() {
    console.log('🧪 Probando notificación de cambio de fecha...\n');

    try {
        const response = await fetch('http://localhost:3000/api/bookings/notify-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: bookingId,
                changeType: 'date',
                changeDescription: 'Cambio de fecha de viaje',
                oldDate: '15 de Marzo de 2026',
                newDate: '22 de Marzo de 2026',
                changeReason: 'Solicitud del cliente por cambio en disponibilidad',
                priceChange: true,
                priceDifference: 150.00,
                priceIncrease: true
            })
        });

        const data = await response.json();
        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al enviar notificación');
        }

        console.log('\n✅ Notificación de cambio de fecha enviada!');
        console.log(`📧 Email enviado a: ${data.booking.email}`);
        console.log(`📋 Reserva: #${data.booking.id} - ${data.booking.serviceName}`);
        console.log('\n💡 El cliente recibirá un email con los detalles del cambio y ajuste de precio');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testDateChange();
