/**
 * GOOGLE ONE TAP API ENDPOINT
 * Procesa el credential de Google One Tap y autentica al usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { queryOne, query } from '@/lib/db';
import { sign } from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
    try {
        const { credential } = await request.json();

        if (!credential) {
            return NextResponse.json({
                success: false,
                error: 'Credential requerido'
            }, { status: 400 });
        }

        // Verificar el token con Google
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload || !payload.email) {
            return NextResponse.json({
                success: false,
                error: 'Token inválido'
            }, { status: 400 });
        }

        console.log('🔵 One Tap verificado:', payload.email);

        // Buscar o crear usuario
        let user = await queryOne<any>(
            'SELECT * FROM users WHERE email = $1',
            [payload.email]
        );

        if (!user) {
            // Crear nuevo usuario
            console.log('✅ Creando nuevo usuario desde One Tap');
            user = await queryOne<any>(
                `INSERT INTO users 
         (name, email, email_verified, email_verified_at, avatar_url, oauth_provider, oauth_id, user_type, tenant_id)
         VALUES ($1, $2, true, NOW(), $3, 'google', $4, 'cliente', 1)
         RETURNING *`,
                [
                    payload.name || 'Usuario',
                    payload.email,
                    payload.picture,
                    payload.sub
                ]
            );
        } else {
            // Actualizar info de Google
            console.log('✅ Actualizando usuario existente');
            await query(
                `UPDATE users 
         SET avatar_url = COALESCE($1, avatar_url),
             oauth_provider = 'google',
             oauth_id = $2,
             email_verified = true,
             email_verified_at = COALESCE(email_verified_at, NOW()),
             updated_at = NOW()
         WHERE id = $3`,
                [payload.picture, payload.sub, user.id]
            );
        }

        // Generar JWT para la sesión
        const token = sign(
            {
                id: user.id,
                email: user.email,
                name: user.name
            },
            process.env.NEXTAUTH_SECRET!,
            { expiresIn: '30d' }
        );

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.avatar_url
            },
            token
        });

    } catch (error) {
        console.error('❌ Error en One Tap:', error);
        return NextResponse.json({
            success: false,
            error: 'Error al procesar autenticación'
        }, { status: 500 });
    }
}
