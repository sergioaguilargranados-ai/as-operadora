/**
 * POST /api/auth/forgot-password
 * Solicitar recuperación de contraseña
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/emailHelper';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validar email
        if (!email || typeof email !== 'string') {
            return NextResponse.json({
                success: false,
                error: 'Email requerido'
            }, { status: 400 });
        }

        // Buscar usuario por email
        const user = await queryOne<any>(
            'SELECT id, name, email FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        // Por seguridad, siempre responder con éxito aunque el usuario no exista
        // Esto evita que se pueda enumerar usuarios válidos
        if (!user) {
            console.log(`⚠️ Intento de reset para email no registrado: ${email}`);
            return NextResponse.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
            });
        }

        // Generar token único y seguro
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Obtener IP y User Agent para seguridad
        const ipAddress = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Guardar token en base de datos
        await query(
            `INSERT INTO password_reset_tokens 
       (user_id, token, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
            [user.id, token, expiresAt, ipAddress, userAgent]
        );

        // Generar URL de reset
        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

        // Enviar email de recuperación
        try {
            await sendPasswordResetEmail({
                name: user.name,
                email: user.email,
                resetUrl,
                expiryTime: '1 hora'
            });

            console.log(`✅ Email de recuperación enviado a: ${user.email}`);
        } catch (emailError) {
            console.error('❌ Error enviando email de recuperación:', emailError);
            // No fallar la petición si el email falla
            // El token ya está guardado, el usuario podría intentar de nuevo
        }

        return NextResponse.json({
            success: true,
            message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
        });

    } catch (error) {
        console.error('❌ Error en forgot-password:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al procesar solicitud'
        }, { status: 500 });
    }
}
