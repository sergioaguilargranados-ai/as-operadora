/**
 * NEXTAUTH CONFIGURATION
 * Configuración de autenticación con Google OAuth y credenciales
 */

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query, queryOne } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
    providers: [
        // ================================================================
        // GOOGLE OAUTH
        // ================================================================
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),

        // ================================================================
        // EMAIL/PASSWORD (Mantener compatibilidad)
        // ================================================================
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email y contraseña requeridos');
                }

                try {
                    // Buscar usuario
                    const user = await queryOne<any>(
                        'SELECT * FROM users WHERE email = $1',
                        [credentials.email.toLowerCase()]
                    );

                    if (!user) {
                        throw new Error('Usuario no encontrado');
                    }

                    // Verificar contraseña
                    const isValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    );

                    if (!isValid) {
                        throw new Error('Contraseña incorrecta');
                    }

                    // Retornar usuario
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.avatar_url,
                        emailVerified: user.email_verified
                    };
                } catch (error) {
                    console.error('Error en authorize:', error);
                    return null;
                }
            }
        })
    ],

    // ================================================================
    // CALLBACKS
    // ================================================================
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                // Solo procesar para Google OAuth
                if (account?.provider === 'google') {
                    console.log('🔵 Google Sign In:', user.email);

                    // Buscar usuario existente
                    let dbUser = await queryOne<any>(
                        'SELECT * FROM users WHERE email = $1',
                        [user.email]
                    );

                    if (!dbUser) {
                        // Crear nuevo usuario
                        console.log('✅ Creando nuevo usuario desde Google');
                        dbUser = await queryOne<any>(
                            `INSERT INTO users 
               (name, email, email_verified, email_verified_at, avatar_url, oauth_provider, oauth_id, user_type, tenant_id)
               VALUES ($1, $2, true, NOW(), $3, 'google', $4, 'cliente', 1)
               RETURNING *`,
                            [
                                user.name || 'Usuario',
                                user.email,
                                user.image,
                                profile?.sub
                            ]
                        );

                        console.log('✅ Usuario creado:', dbUser.id);
                    } else {
                        // Actualizar info de Google si no estaba vinculado
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
                            [user.image, profile?.sub, dbUser.id]
                        );
                    }

                    // Actualizar ID del usuario para la sesión
                    user.id = dbUser.id.toString();
                }

                return true;
            } catch (error) {
                console.error('❌ Error en signIn callback:', error);
                return false;
            }
        },

        async jwt({ token, user, account }) {
            // Agregar info del usuario al token
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.picture = user.image;
            }

            // Agregar provider info
            if (account) {
                token.provider = account.provider;
            }

            return token;
        },

        async session({ session, token }) {
            // Agregar info del token a la sesión
            if (session.user) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.picture as string;
            }

            return session;
        }
    },

    // ================================================================
    // PÁGINAS PERSONALIZADAS
    // ================================================================
    pages: {
        signIn: '/login',
        error: '/login',
        signOut: '/login',
    },

    // ================================================================
    // SESIÓN
    // ================================================================
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30 días
    },

    // ================================================================
    // JWT
    // ================================================================
    jwt: {
        maxAge: 30 * 24 * 60 * 60, // 30 días
    },

    // ================================================================
    // DEBUG (solo en desarrollo)
    // ================================================================
    debug: process.env.NODE_ENV === 'development',
};
