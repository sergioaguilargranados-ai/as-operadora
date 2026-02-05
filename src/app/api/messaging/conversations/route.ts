/**
 * GET /api/messaging/conversations
 * Obtener conversaciones de WhatsApp y SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConversations } from '@/services/MessagingService';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const userId = searchParams.get('userId');
        const channel = searchParams.get('channel') as 'whatsapp' | 'sms' | null;
        const status = searchParams.get('status');
        const limit = searchParams.get('limit');

        const conversations = await getConversations({
            userId: userId ? parseInt(userId) : undefined,
            channel: channel || undefined,
            status: status || undefined,
            limit: limit ? parseInt(limit) : undefined
        });

        return NextResponse.json({
            success: true,
            conversations,
            count: conversations.length
        });

    } catch (error) {
        console.error('❌ Error obteniendo conversaciones:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al obtener conversaciones'
        }, { status: 500 });
    }
}
