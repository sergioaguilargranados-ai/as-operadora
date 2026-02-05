/**
 * HELPER: Notificaciones de Cambio de Itinerario
 * Funciones helper para facilitar el envío de notificaciones
 */

import { sendItineraryChangeEmail } from '@/lib/emailHelper';
import { queryOne } from '@/lib/db';

/**
 * Notificar cambio de vuelo
 */
export async function notifyFlightChange(params: {
    bookingId: number;
    oldFlightInfo: string;
    newFlightInfo: string;
    changeReason: string;
}) {
    const booking = await getBookingInfo(params.bookingId);

    return await sendItineraryChangeEmail({
        name: booking.name,
        email: booking.email,
        bookingId: booking.id,
        serviceName: booking.service_name,
        travelDate: booking.travel_date_formatted,
        passengers: booking.passengers,
        changeType: 'flight',
        changeDescription: `Cambio de vuelo: ${params.oldFlightInfo} → ${params.newFlightInfo}`,
        oldFlightInfo: params.oldFlightInfo,
        newFlightInfo: params.newFlightInfo,
        changeReason: params.changeReason,
        currency: booking.currency
    });
}

/**
 * Notificar cambio de hotel
 */
export async function notifyHotelChange(params: {
    bookingId: number;
    oldHotelInfo: string;
    newHotelInfo: string;
    changeReason: string;
}) {
    const booking = await getBookingInfo(params.bookingId);

    return await sendItineraryChangeEmail({
        name: booking.name,
        email: booking.email,
        bookingId: booking.id,
        serviceName: booking.service_name,
        travelDate: booking.travel_date_formatted,
        passengers: booking.passengers,
        changeType: 'hotel',
        changeDescription: `Cambio de hotel: ${params.oldHotelInfo} → ${params.newHotelInfo}`,
        oldHotelInfo: params.oldHotelInfo,
        newHotelInfo: params.newHotelInfo,
        changeReason: params.changeReason,
        currency: booking.currency
    });
}

/**
 * Notificar cambio de fecha
 */
export async function notifyDateChange(params: {
    bookingId: number;
    oldDate: string;
    newDate: string;
    changeReason: string;
    priceDifference?: number;
    priceIncrease?: boolean;
}) {
    const booking = await getBookingInfo(params.bookingId);

    return await sendItineraryChangeEmail({
        name: booking.name,
        email: booking.email,
        bookingId: booking.id,
        serviceName: booking.service_name,
        travelDate: booking.travel_date_formatted,
        passengers: booking.passengers,
        changeType: 'date',
        changeDescription: `Cambio de fecha: ${params.oldDate} → ${params.newDate}`,
        oldDate: params.oldDate,
        newDate: params.newDate,
        changeReason: params.changeReason,
        priceChange: !!params.priceDifference,
        totalPrice: booking.total_price,
        priceDifference: params.priceDifference,
        priceIncrease: params.priceIncrease,
        priceDecrease: !params.priceIncrease,
        currency: booking.currency
    });
}

/**
 * Notificar cambio general
 */
export async function notifyItineraryChange(params: {
    bookingId: number;
    changeDescription: string;
    changeReason: string;
    priceChange?: boolean;
    priceDifference?: number;
    priceIncrease?: boolean;
}) {
    const booking = await getBookingInfo(params.bookingId);

    return await sendItineraryChangeEmail({
        name: booking.name,
        email: booking.email,
        bookingId: booking.id,
        serviceName: booking.service_name,
        travelDate: booking.travel_date_formatted,
        passengers: booking.passengers,
        changeType: 'other',
        changeDescription: params.changeDescription,
        changeReason: params.changeReason,
        priceChange: params.priceChange,
        totalPrice: booking.total_price,
        priceDifference: params.priceDifference,
        priceIncrease: params.priceIncrease,
        priceDecrease: params.priceChange && !params.priceIncrease,
        currency: booking.currency
    });
}

/**
 * Helper: Obtener información de la reserva
 */
async function getBookingInfo(bookingId: number) {
    const booking = await queryOne<any>(
        `SELECT 
      b.id,
      b.user_id,
      b.service_name,
      b.travel_date,
      b.passengers,
      b.total_price,
      b.currency,
      b.destination,
      u.name,
      u.email
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.id = $1`,
        [bookingId]
    );

    if (!booking) {
        throw new Error(`Reserva #${bookingId} no encontrada`);
    }

    return {
        ...booking,
        travel_date_formatted: new Date(booking.travel_date).toLocaleDateString('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        currency: booking.currency || 'MXN'
    };
}
