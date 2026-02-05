/**
 * SCRIPT DE PRUEBA - Notificación de Cambio de Hotel
 * Simula un cambio de hotel en una reserva
 */

const bookingId = 1; // Cambiar por un ID de reserva real

async function testHotelChange() {
    console.log('🧪 Probando notificación de cambio de hotel...\n');

    try {
        const response = await fetch('http://localhost:3000/api/bookings/notify-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bookingId: bookingId,
                changeType: 'hotel',
                changeDescription: 'Cambio de hotel por mejora de categoría',
                oldHotelInfo: 'Hotel Plaza 3★ - Habitación Estándar',
                newHotelInfo: 'Hotel Grand Palace 5★ - Suite Junior',
                changeReason: 'Mejora de categoría sin costo adicional por disponibilidad',
                priceChange: false
            })
        });

        const data = await response.json();
        console.log('Respuesta:', data);

        if (!data.success) {
            throw new Error(data.error || 'Error al enviar notificación');
        }

        console.log('\n✅ Notificación de cambio de hotel enviada!');
        console.log(`📧 Email enviado a: ${data.booking.email}`);
        console.log(`📋 Reserva: #${data.booking.id} - ${data.booking.serviceName}`);
        console.log('\n💡 El cliente recibirá un email con los detalles del cambio');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testHotelChange();
