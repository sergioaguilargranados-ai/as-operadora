/**
 * WHATSAPP & SMS SERVICE
 * Servicio para enviar y recibir mensajes de WhatsApp y SMS usando Twilio
 */

import twilio from 'twilio';
import { query, queryOne, queryMany } from '@/lib/db';

// Cliente de Twilio
const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// ================================================================
// INTERFACES
// ================================================================

export interface WhatsAppMessage {
    to: string; // Número con código de país: +52XXXXXXXXXX
    body: string;
    mediaUrl?: string[]; // URLs de imágenes/archivos
    threadId?: number; // ID del hilo de conversación
    userId?: number; // ID del usuario
}

export interface SMSMessage {
    to: string; // Número con código de país: +52XXXXXXXXXX
    body: string;
    threadId?: number;
    userId?: number;
}

export interface IncomingMessage {
    from: string;
    to: string;
    body: string;
    mediaUrl?: string[];
    messageId: string;
    timestamp: Date;
    channel: 'whatsapp' | 'sms';
}

// ================================================================
// ENVIAR WHATSAPP
// ================================================================

export async function sendWhatsAppMessage(params: WhatsAppMessage): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}> {
    try {
        console.log('📱 Enviando WhatsApp a:', params.to);

        // Validar número
        if (!params.to.startsWith('+')) {
            throw new Error('El número debe incluir código de país (+52...)');
        }

        // Enviar mensaje con Twilio
        const message = await twilioClient.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
            to: `whatsapp:${params.to}`,
            body: params.body,
            mediaUrl: params.mediaUrl
        });

        console.log('✅ WhatsApp enviado:', message.sid);

        // Registrar en Centro de Comunicación
        await registerMessageDelivery({
            channel: 'whatsapp',
            recipient: params.to,
            body: params.body,
            providerMessageId: message.sid,
            status: 'sent',
            threadId: params.threadId,
            userId: params.userId
        });

        return {
            success: true,
            messageId: message.sid
        };

    } catch (error) {
        console.error('❌ Error enviando WhatsApp:', error);

        // Registrar error
        await registerMessageDelivery({
            channel: 'whatsapp',
            recipient: params.to,
            body: params.body,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Error desconocido',
            threadId: params.threadId,
            userId: params.userId
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al enviar WhatsApp'
        };
    }
}

// ================================================================
// ENVIAR SMS
// ================================================================

export async function sendSMSMessage(params: SMSMessage): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}> {
    try {
        console.log('📲 Enviando SMS a:', params.to);

        // Validar número
        if (!params.to.startsWith('+')) {
            throw new Error('El número debe incluir código de país (+52...)');
        }

        // Enviar mensaje con Twilio
        const message = await twilioClient.messages.create({
            from: process.env.TWILIO_PHONE_NUMBER,
            to: params.to,
            body: params.body
        });

        console.log('✅ SMS enviado:', message.sid);

        // Registrar en Centro de Comunicación
        await registerMessageDelivery({
            channel: 'sms',
            recipient: params.to,
            body: params.body,
            providerMessageId: message.sid,
            status: 'sent',
            threadId: params.threadId,
            userId: params.userId
        });

        return {
            success: true,
            messageId: message.sid
        };

    } catch (error) {
        console.error('❌ Error enviando SMS:', error);

        // Registrar error
        await registerMessageDelivery({
            channel: 'sms',
            recipient: params.to,
            body: params.body,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Error desconocido',
            threadId: params.threadId,
            userId: params.userId
        });

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al enviar SMS'
        };
    }
}

// ================================================================
// PROCESAR MENSAJE ENTRANTE
// ================================================================

export async function processIncomingMessage(incoming: IncomingMessage): Promise<{
    success: boolean;
    threadId?: number;
    error?: string;
}> {
    try {
        console.log(`📥 Mensaje ${incoming.channel} recibido de:`, incoming.from);

        // Limpiar número (quitar "whatsapp:" si existe)
        const phoneNumber = incoming.from.replace('whatsapp:', '');

        // Buscar usuario por número de teléfono
        const user = await queryOne<any>(
            `SELECT id, name, email 
       FROM users 
       WHERE phone = $1 OR whatsapp_number = $1`,
            [phoneNumber]
        );

        if (!user) {
            console.log('⚠️ Usuario no encontrado para:', phoneNumber);
            // Crear usuario temporal o enviar mensaje de bienvenida
            return {
                success: false,
                error: 'Usuario no encontrado'
            };
        }

        // Buscar o crear hilo de conversación
        let thread = await queryOne<any>(
            `SELECT id 
       FROM communication_threads 
       WHERE client_id = $1 
         AND thread_type = $2 
         AND status != 'closed'
       ORDER BY created_at DESC 
       LIMIT 1`,
            [user.id, incoming.channel]
        );

        if (!thread) {
            // Crear nuevo hilo
            thread = await queryOne<any>(
                `INSERT INTO communication_threads 
         (thread_type, subject, client_id, status, priority, message_count, unread_count_agent, tenant_id)
         VALUES ($1, $2, $3, 'open', 'normal', 0, 0, 1)
         RETURNING id`,
                [
                    incoming.channel,
                    `Conversación ${incoming.channel.toUpperCase()} - ${user.name}`,
                    user.id
                ]
            );
            console.log('✅ Nuevo hilo creado:', thread.id);
        }

        // Guardar mensaje en el hilo
        await query(
            `INSERT INTO messages 
       (thread_id, sender_id, sender_type, sender_name, sender_email, body, message_type, metadata, status, tenant_id)
       VALUES ($1, $2, 'client', $3, $4, $5, $6, $7, 'sent', 1)`,
            [
                thread.id,
                user.id,
                user.name,
                user.email,
                incoming.body,
                incoming.channel,
                JSON.stringify({
                    from: incoming.from,
                    to: incoming.to,
                    messageId: incoming.messageId,
                    mediaUrl: incoming.mediaUrl,
                    timestamp: incoming.timestamp
                })
            ]
        );

        // Actualizar contador de mensajes y no leídos
        await query(
            `UPDATE communication_threads 
       SET message_count = message_count + 1,
           unread_count_agent = unread_count_agent + 1,
           last_message_at = NOW(),
           last_message_by = $2,
           updated_at = NOW()
       WHERE id = $1`,
            [thread.id, user.id]
        );

        console.log('✅ Mensaje guardado en hilo:', thread.id);

        return {
            success: true,
            threadId: thread.id
        };

    } catch (error) {
        console.error('❌ Error procesando mensaje entrante:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error al procesar mensaje'
        };
    }
}

// ================================================================
// REGISTRAR ENTREGA EN CENTRO DE COMUNICACIÓN
// ================================================================

async function registerMessageDelivery(params: {
    channel: 'whatsapp' | 'sms';
    recipient: string;
    body: string;
    providerMessageId?: string;
    status: 'sent' | 'failed' | 'delivered' | 'read';
    errorMessage?: string;
    threadId?: number;
    userId?: number;
}) {
    try {
        // Si hay threadId, crear mensaje en el hilo
        if (params.threadId) {
            const message = await queryOne<any>(
                `INSERT INTO messages 
         (thread_id, sender_type, sender_name, body, message_type, metadata, status, tenant_id)
         VALUES ($1, 'agent', 'Sistema', $2, $3, $4, $5, 1)
         RETURNING id`,
                [
                    params.threadId,
                    params.body,
                    params.channel,
                    JSON.stringify({
                        recipient: params.recipient,
                        providerMessageId: params.providerMessageId
                    }),
                    params.status
                ]
            );

            // Registrar entrega
            await query(
                `INSERT INTO message_deliveries 
         (message_id, delivery_method, recipient, status, provider, provider_message_id, error_message, sent_at)
         VALUES ($1, $2, $3, $4, 'twilio', $5, $6, NOW())`,
                [
                    message.id,
                    params.channel,
                    params.recipient,
                    params.status,
                    params.providerMessageId,
                    params.errorMessage
                ]
            );

            // Actualizar hilo
            await query(
                `UPDATE communication_threads 
         SET message_count = message_count + 1,
             last_message_at = NOW(),
             updated_at = NOW()
         WHERE id = $1`,
                [params.threadId]
            );
        } else {
            // Registrar solo en message_deliveries (sin hilo)
            await query(
                `INSERT INTO message_deliveries 
         (delivery_method, recipient, status, provider, provider_message_id, error_message, sent_at, metadata)
         VALUES ($1, $2, $3, 'twilio', $4, $5, NOW(), $6)`,
                [
                    params.channel,
                    params.recipient,
                    params.status,
                    params.providerMessageId,
                    params.errorMessage,
                    JSON.stringify({ body: params.body, userId: params.userId })
                ]
            );
        }
    } catch (error) {
        console.error('❌ Error registrando entrega:', error);
    }
}

// ================================================================
// ACTUALIZAR ESTADO DE MENSAJE (WEBHOOK)
// ================================================================

export async function updateMessageStatus(params: {
    providerMessageId: string;
    status: 'delivered' | 'read' | 'failed';
    errorMessage?: string;
}): Promise<void> {
    try {
        await query(
            `UPDATE message_deliveries 
       SET status = $2,
           ${params.status === 'delivered' ? 'delivered_at = NOW(),' : ''}
           ${params.status === 'read' ? 'read_at = NOW(),' : ''}
           error_message = $3
       WHERE provider_message_id = $1`,
            [params.providerMessageId, params.status, params.errorMessage]
        );

        console.log(`✅ Estado actualizado: ${params.providerMessageId} -> ${params.status}`);
    } catch (error) {
        console.error('❌ Error actualizando estado:', error);
    }
}

// ================================================================
// OBTENER CONVERSACIONES
// ================================================================

export async function getConversations(params: {
    userId?: number;
    channel?: 'whatsapp' | 'sms';
    status?: string;
    limit?: number;
}) {
    try {
        let whereConditions = ['1=1'];
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (params.userId) {
            whereConditions.push(`ct.client_id = $${paramIndex}`);
            queryParams.push(params.userId);
            paramIndex++;
        }

        if (params.channel) {
            whereConditions.push(`ct.thread_type = $${paramIndex}`);
            queryParams.push(params.channel);
            paramIndex++;
        }

        if (params.status) {
            whereConditions.push(`ct.status = $${paramIndex}`);
            queryParams.push(params.status);
            paramIndex++;
        }

        const limit = params.limit || 50;

        const conversations = await queryMany<any>(
            `SELECT 
        ct.*,
        u.name as client_name,
        u.email as client_email,
        u.phone as client_phone,
        (SELECT body FROM messages WHERE thread_id = ct.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM communication_threads ct
       JOIN users u ON ct.client_id = u.id
       WHERE ${whereConditions.join(' AND ')}
       ORDER BY ct.last_message_at DESC NULLS LAST, ct.created_at DESC
       LIMIT ${limit}`,
            queryParams
        );

        return conversations;
    } catch (error) {
        console.error('❌ Error obteniendo conversaciones:', error);
        return [];
    }
}
