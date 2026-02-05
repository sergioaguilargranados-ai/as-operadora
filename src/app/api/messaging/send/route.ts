/**
 * POST /api/messaging/send
 * Enviar mensaje por WhatsApp o SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, sendSMSMessage } from '@/services/MessagingService';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { channel, to, message, threadId, userId, mediaUrl } = body;

        // Validaciones
        if (!channel || !['whatsapp', 'sms'].includes(channel)) {
            return NextResponse.json({
                success: false,
                error: 'Canal inválido. Debe ser "whatsapp" o "sms"'
            }, { status: 400 });
        }

        if (!to || !message) {
            return NextResponse.json({
                success: false,
                error: 'Número de destino y mensaje son requeridos'
            }, { status: 400 });
        }

        // Enviar según el canal
        let result;

        if (channel === 'whatsapp') {
            result = await sendWhatsAppMessage({
                to,
                body: message,
                mediaUrl,
                threadId,
                userId
            });
        } else {
            result = await sendSMSMessage({
                to,
                body: message,
                threadId,
                userId
            });
        }

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            message: `Mensaje ${channel} enviado exitosamente`
        });

    } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al enviar mensaje'
        }, { status: 500 });
    }
}
