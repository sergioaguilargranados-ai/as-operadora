/**
 * WEBHOOK: Recibir mensajes de WhatsApp
 * Twilio enviará mensajes entrantes a este endpoint
 * 
 * Configurar en Twilio Console:
 * WhatsApp Sandbox > When a message comes in
 * URL: https://app.asoperadora.com/api/webhooks/whatsapp
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
        const numMedia = parseInt(formData.get('NumMedia') as string || '0');

        // Extraer URLs de medios (imágenes, videos, etc.)
        const mediaUrl: string[] = [];
        for (let i = 0; i < numMedia; i++) {
            const url = formData.get(`MediaUrl${i}`) as string;
            if (url) mediaUrl.push(url);
        }

        console.log('📥 WhatsApp recibido:', { from, body });

        // Procesar mensaje
        const result = await processIncomingMessage({
            from,
            to,
            body,
            mediaUrl,
            messageId,
            timestamp: new Date(),
            channel: 'whatsapp'
        });

        if (!result.success) {
            console.error('❌ Error procesando WhatsApp:', result.error);
        }

        // Responder a Twilio (TwiML vacío = sin respuesta automática)
        // Si quieres responder automáticamente, usa MessagingResponse
        const twiml = new twilio.twiml.MessagingResponse();

        // Opcional: Respuesta automática
        // twiml.message('Gracias por tu mensaje. Un agente te responderá pronto.');

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml'
            }
        });

    } catch (error) {
        console.error('❌ Error en webhook WhatsApp:', error);
        return NextResponse.json({
            success: false,
            error: 'Error procesando webhook'
        }, { status: 500 });
    }
}
