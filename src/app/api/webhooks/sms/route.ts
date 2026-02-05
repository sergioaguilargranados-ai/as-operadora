/**
 * WEBHOOK: Recibir mensajes de SMS
 * Twilio enviará mensajes entrantes a este endpoint
 * 
 * Configurar en Twilio Console:
 * Phone Numbers > Your Number > Messaging > A MESSAGE COMES IN
 * URL: https://app.asoperadora.com/api/webhooks/sms
 */

import { NextRequest, NextResponse } from 'next/server';
import { processIncomingMessage } from '@/services/MessagingService';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extraer datos del mensaje
        const from = formData.get('From') as string;
        const to = formData.get('To') as string;
        const body = formData.get('Body') as string;
        const messageId = formData.get('MessageSid') as string;

        console.log('📥 SMS recibido:', { from, body });

        // Procesar mensaje
        const result = await processIncomingMessage({
            from,
            to,
            body,
            messageId,
            timestamp: new Date(),
            channel: 'sms'
        });

        if (!result.success) {
            console.error('❌ Error procesando SMS:', result.error);
        }

        // Responder a Twilio (TwiML vacío = sin respuesta automática)
        const twiml = new twilio.twiml.MessagingResponse();

        // Opcional: Respuesta automática
        // twiml.message('Gracias por tu mensaje. Un agente te responderá pronto.');

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml'
            }
        });

    } catch (error) {
        console.error('❌ Error en webhook SMS:', error);
        return NextResponse.json({
            success: false,
            error: 'Error procesando webhook'
        }, { status: 500 });
    }
}
