import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/services/AuthService';
import { pool } from '@/lib/db';

const ALLOWED_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export interface AdminAuthResult {
    authorized: boolean;
    user?: {
        id: string;
        email: string;
        role: string;
    };
    error?: string;
    status: number;
}

/**
 * Verifica la autenticación de administrador para las APIs de administración.
 * Soporta: 
 * 1. Cookie 'as_token' (JWT)
 * 2. Header 'Authorization: Bearer <token>'
 * 3. Fallback: Cookie 'as_user' verificada contra la base de datos
 * 4. Header 'Authorization: Bearer <ADMIN_SECRET_KEY>'
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
    try {
        const cookieStore = await cookies();
        const tokenCookie = cookieStore.get('as_token');
        const authHeader = request.headers.get('authorization');
        
        let token = tokenCookie?.value || (authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null);

        // 1. Intentar con JWT (Cookie o Header)
        if (token) {
            // Verificar si es el secreto de admin o cron
            if (token === process.env.ADMIN_SECRET_KEY || token === process.env.CRON_SECRET) {
                return { authorized: true, user: { id: 'system', email: 'system@asoperadora.com', role: 'SUPER_ADMIN' }, status: 200 };
            }

            try {
                const decoded = await verifyToken(token);
                if (decoded && ALLOWED_ROLES.includes(decoded.role.toUpperCase())) {
                    return { 
                        authorized: true, 
                        user: { 
                            id: decoded.userId.toString(), 
                            email: decoded.email, 
                            role: decoded.role 
                        }, 
                        status: 200 
                    };
                }
            } catch (e) {
                // Token expirado o inválido, continuamos al fallback
                console.log('AdminAuth: JWT inválido o expirado, intentando fallback...');
            }
        }

        // 2. Fallback: Cookie 'as_user' verificada contra la DB
        const userCookie = cookieStore.get('as_user');
        if (userCookie?.value) {
            try {
                let rawValue = userCookie.value;
                try { rawValue = decodeURIComponent(rawValue); } catch { /* ya estaba sin encode */ }
                const userData = JSON.parse(rawValue);

                if (userData.email && (userData.id || userData.userId)) {
                    const userId = userData.id || userData.userId;
                    const userRes = await pool.query(
                        'SELECT id, email, role FROM users WHERE id = $1 AND email = $2 LIMIT 1',
                        [userId, userData.email]
                    );

                    if (userRes.rows.length > 0) {
                        const user = userRes.rows[0];
                        if (ALLOWED_ROLES.includes(user.role.toUpperCase())) {
                            console.log(`AdminAuth: Autenticado vía as_user fallback: ${user.email}`);
                            return { 
                                authorized: true, 
                                user: { 
                                    id: user.id.toString(), 
                                    email: user.email, 
                                    role: user.role 
                                }, 
                                status: 200 
                            };
                        }
                    }
                }
            } catch (e: any) {
                console.error('AdminAuth: Error en fallback as_user:', e.message);
            }
        }

        return { authorized: false, error: 'No autorizado o sesión expirada', status: 401 };
    } catch (error: any) {
        console.error('AdminAuth: Error crítico:', error);
        return { authorized: false, error: 'Error interno de autenticación', status: 500 };
    }
}
