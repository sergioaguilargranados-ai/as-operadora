/**
 * CRON JOBS - EMAIL REMINDERS
 * Sistema de recordatorios automáticos por correo
 * 
 * Este archivo debe ejecutarse periódicamente (cada hora o diariamente)
 * usando un cron job del sistema o un servicio como Vercel Cron
 */

import { queryMany } from '@/lib/db';
import {
    sendQuoteReminderEmail,
    sendPreTripReminderEmail,
    sendPostTripSurveyEmail
} from '@/lib/emailHelper';

// ================================================================
// 1. RECORDATORIO DE COTIZACIÓN
// ================================================================

/**
 * Enviar recordatorios de cotizaciones próximas a expirar
 * Ejecutar: Diariamente a las 10:00 AM
 */
export async function sendQuoteReminders() {
    console.log('🔔 Iniciando envío de recordatorios de cotización...');

    try {
        // Buscar cotizaciones que expiran en 24-48 horas
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const quotes = await queryMany<any>(
            `SELECT 
        gq.id,
        gq.reference_id as quote_id,
        gq.contact_name as name,
        gq.contact_email as email,
        gq.destination,
        gq.departure_date,
        gq.return_date,
        gq.total_passengers as passengers,
        gq.total_price,
        gq.currency,
        gq.valid_until,
        gq.status
       FROM group_quotes gq
       WHERE gq.status = 'quoted'
         AND gq.valid_until BETWEEN $1 AND $2
         AND gq.reminder_sent = false
       ORDER BY gq.valid_until ASC`,
            [in24Hours.toISOString(), in48Hours.toISOString()]
        );

        console.log(`📊 Encontradas ${quotes.length} cotizaciones próximas a expirar`);

        let sentCount = 0;
        let errorCount = 0;

        for (const quote of quotes) {
            try {
                // Formatear fechas
                const travelDates = quote.return_date
                    ? `${new Date(quote.departure_date).toLocaleDateString('es-MX')} - ${new Date(quote.return_date).toLocaleDateString('es-MX')}`
                    : new Date(quote.departure_date).toLocaleDateString('es-MX');

                const expiryDate = new Date(quote.valid_until).toLocaleDateString('es-MX', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                // Enviar recordatorio
                const sent = await sendQuoteReminderEmail({
                    name: quote.name,
                    email: quote.email,
                    quoteId: quote.quote_id,
                    destination: quote.destination,
                    travelDates,
                    passengers: quote.passengers,
                    totalPrice: quote.total_price,
                    currency: quote.currency || 'MXN',
                    expiryDate
                });

                if (sent) {
                    // Marcar como enviado
                    const { query } = await import('@/lib/db');
                    await query(
                        `UPDATE group_quotes 
             SET reminder_sent = true, 
                 reminder_sent_at = NOW() 
             WHERE id = $1`,
                        [quote.id]
                    );

                    sentCount++;
                    console.log(`✅ Recordatorio enviado: ${quote.email} (${quote.quote_id})`);
                } else {
                    errorCount++;
                    console.error(`❌ Error enviando a: ${quote.email}`);
                }

                // Pequeña pausa para no saturar el servidor SMTP
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                errorCount++;
                console.error(`❌ Error procesando cotización ${quote.quote_id}:`, error);
            }
        }

        console.log(`✅ Recordatorios de cotización completados: ${sentCount} enviados, ${errorCount} errores`);
        return { success: true, sent: sentCount, errors: errorCount };

    } catch (error) {
        console.error('❌ Error en sendQuoteReminders:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// ================================================================
// 2. RECORDATORIO PRE-VIAJE
// ================================================================

/**
 * Enviar recordatorios pre-viaje (7, 3, 1 día antes)
 * Ejecutar: Diariamente a las 09:00 AM
 */
export async function sendPreTripReminders() {
    console.log('🔔 Iniciando envío de recordatorios pre-viaje...');

    try {
        const now = new Date();
        const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
        const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Buscar reservas con viajes próximos
        const bookings = await queryMany<any>(
            `SELECT 
        b.id,
        b.user_id,
        b.service_name,
        b.destination,
        b.travel_date,
        b.passengers,
        b.metadata,
        u.name,
        u.email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'confirmed'
         AND b.travel_date::date IN ($1::date, $2::date, $3::date)
         AND (b.pre_trip_reminder_sent IS NULL OR b.pre_trip_reminder_sent = false)
       ORDER BY b.travel_date ASC`,
            [
                in1Day.toISOString().split('T')[0],
                in3Days.toISOString().split('T')[0],
                in7Days.toISOString().split('T')[0]
            ]
        );

        console.log(`📊 Encontradas ${bookings.length} reservas con viajes próximos`);

        let sentCount = 0;
        let errorCount = 0;

        for (const booking of bookings) {
            try {
                // Calcular días hasta el viaje
                const travelDate = new Date(booking.travel_date);
                const daysUntilTrip = Math.ceil((travelDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                // Parsear metadata (puede contener info de vuelo, hotel, etc.)
                const metadata = booking.metadata ? JSON.parse(booking.metadata) : {};

                // Enviar recordatorio
                const sent = await sendPreTripReminderEmail({
                    name: booking.name,
                    email: booking.email,
                    bookingId: booking.id,
                    destination: booking.destination || 'tu destino',
                    departureDate: travelDate.toLocaleDateString('es-MX', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    daysUntilTrip,
                    airline: metadata.airline,
                    flightNumber: metadata.flightNumber,
                    departureTime: metadata.departureTime,
                    departureAirport: metadata.departureAirport,
                    arrivalTime: metadata.arrivalTime,
                    arrivalAirport: metadata.arrivalAirport,
                    checkinInfo: metadata.checkinInfo || 'Online 24 horas antes',
                    baggageAllowance: metadata.baggageAllowance || '23kg por persona',
                    hasHotel: !!metadata.hotelName,
                    hotelName: metadata.hotelName,
                    hotelAddress: metadata.hotelAddress
                });

                if (sent) {
                    // Marcar como enviado
                    const { query } = await import('@/lib/db');
                    await query(
                        `UPDATE bookings 
             SET pre_trip_reminder_sent = true,
                 pre_trip_reminder_sent_at = NOW()
             WHERE id = $1`,
                        [booking.id]
                    );

                    sentCount++;
                    console.log(`✅ Recordatorio enviado: ${booking.email} (Reserva #${booking.id}, ${daysUntilTrip} días)`);
                } else {
                    errorCount++;
                    console.error(`❌ Error enviando a: ${booking.email}`);
                }

                // Pausa entre envíos
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                errorCount++;
                console.error(`❌ Error procesando reserva ${booking.id}:`, error);
            }
        }

        console.log(`✅ Recordatorios pre-viaje completados: ${sentCount} enviados, ${errorCount} errores`);
        return { success: true, sent: sentCount, errors: errorCount };

    } catch (error) {
        console.error('❌ Error en sendPreTripReminders:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// ================================================================
// 3. ENCUESTA POST-VIAJE
// ================================================================

/**
 * Enviar encuestas post-viaje (2-3 días después del regreso)
 * Ejecutar: Diariamente a las 11:00 AM
 */
export async function sendPostTripSurveys() {
    console.log('🔔 Iniciando envío de encuestas post-viaje...');

    try {
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

        // Buscar reservas completadas recientemente
        const bookings = await queryMany<any>(
            `SELECT 
        b.id,
        b.user_id,
        b.service_name,
        b.destination,
        b.travel_date,
        b.return_date,
        b.metadata,
        u.name,
        u.email
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       WHERE b.status = 'completed'
         AND b.return_date::date BETWEEN $1::date AND $2::date
         AND (b.survey_sent IS NULL OR b.survey_sent = false)
       ORDER BY b.return_date DESC`,
            [
                threeDaysAgo.toISOString().split('T')[0],
                twoDaysAgo.toISOString().split('T')[0]
            ]
        );

        console.log(`📊 Encontradas ${bookings.length} reservas completadas recientemente`);

        let sentCount = 0;
        let errorCount = 0;

        for (const booking of bookings) {
            try {
                // Formatear fechas
                const travelDates = booking.return_date
                    ? `${new Date(booking.travel_date).toLocaleDateString('es-MX')} - ${new Date(booking.return_date).toLocaleDateString('es-MX')}`
                    : new Date(booking.travel_date).toLocaleDateString('es-MX');

                // Generar URL de encuesta (puede ser un token único)
                const surveyToken = Buffer.from(`${booking.id}-${booking.user_id}-${Date.now()}`).toString('base64');
                const surveyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/encuesta/${surveyToken}`;

                // Enviar encuesta
                const sent = await sendPostTripSurveyEmail({
                    name: booking.name,
                    email: booking.email,
                    destination: booking.destination || 'tu destino',
                    travelDates,
                    surveyUrl
                });

                if (sent) {
                    // Marcar como enviado y guardar token
                    const { query } = await import('@/lib/db');
                    await query(
                        `UPDATE bookings 
             SET survey_sent = true,
                 survey_sent_at = NOW(),
                 survey_token = $2
             WHERE id = $1`,
                        [booking.id, surveyToken]
                    );

                    sentCount++;
                    console.log(`✅ Encuesta enviada: ${booking.email} (Reserva #${booking.id})`);
                } else {
                    errorCount++;
                    console.error(`❌ Error enviando a: ${booking.email}`);
                }

                // Pausa entre envíos
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                errorCount++;
                console.error(`❌ Error procesando reserva ${booking.id}:`, error);
            }
        }

        console.log(`✅ Encuestas post-viaje completadas: ${sentCount} enviadas, ${errorCount} errores`);
        return { success: true, sent: sentCount, errors: errorCount };

    } catch (error) {
        console.error('❌ Error en sendPostTripSurveys:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}

// ================================================================
// EJECUTAR TODOS LOS CRON JOBS
// ================================================================

/**
 * Ejecutar todos los cron jobs de correos
 * Llamar esta función desde un endpoint API o cron job del sistema
 */
export async function runAllEmailCronJobs() {
    console.log('🚀 Ejecutando todos los cron jobs de correos...');

    const results = {
        quoteReminders: await sendQuoteReminders(),
        preTripReminders: await sendPreTripReminders(),
        postTripSurveys: await sendPostTripSurveys()
    };

    console.log('✅ Todos los cron jobs completados:', results);
    return results;
}
