/**
 * WEBHOOK: Estado de mensajes (Delivery Status)
 * Twilio notifica cuando un mensaje es entregado o leído
 * 
 * Configurar en Twilio Console:
 * Phone Numbers > Your Number > Messaging > STATUS CALLBACK URL
 * URL: https://app.asoperadora.com/api/webhooks/message-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateMessageStatus } from '@/services/MessagingService';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const messageSid = formData.get('MessageSid') as string;
        const messageStatus = formData.get('MessageStatus') as string;
        const errorCode = formData.get('ErrorCode') as string;
        const errorMessage = formData.get('ErrorMessage') as string;

        console.log('📊 Estado de mensaje:', { messageSid, messageStatus });

        // Mapear estados de Twilio a nuestro sistema
        let status: 'delivered' | 'read' | 'failed' = 'delivered';

        if (messageStatus === 'delivered') {
            status = 'delivered';
        } else if (messageStatus === 'read') {
            status = 'read';
        } else if (['failed', 'undelivered'].includes(messageStatus)) {
            status = 'failed';
        }

        // Actualizar estado en BD
        await updateMessageStatus({
            providerMessageId: messageSid,
            status,
            errorMessage: errorCode ? `${errorCode}: ${errorMessage}` : undefined
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('❌ Error en webhook de estado:', error);
        return NextResponse.json({
            success: false,
            error: 'Error procesando webhook'
        }, { status: 500 });
    }
}
