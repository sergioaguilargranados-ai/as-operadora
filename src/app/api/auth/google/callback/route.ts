import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { sign } from 'jsonwebtoken'

/**
 * Google OAuth Callback
 * GET /api/auth/google/callback
 * 
 * Recibe el código de autorización de Google, intercambia por token,
 * obtiene info del usuario, crea/actualiza en BD, genera JWT y
 * redirige con sesión activa (compatible con AuthContext).
 * 
 * @version v2.317
 * @date 15 Feb 2026
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/login?error=oauth_cancelled`, request.url))
    }

    if (!code) {
      return NextResponse.redirect(new URL(`/login?error=invalid_code`, request.url))
    }

    // Intercambiar código por token de acceso
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`

    if (!clientId || !clientSecret) {
      console.error('❌ Missing Google OAuth credentials')
      return NextResponse.redirect(new URL(`/login?error=config_missing`, request.url))
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ Google token exchange failed:', errorData)
      return NextResponse.redirect(new URL(`/login?error=token_exchange_failed`, request.url))
    }

    const tokens = await tokenResponse.json()
    const accessToken = tokens.access_token

    // Obtener información del usuario de Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!userInfoResponse.ok) {
      console.error('❌ Failed to fetch Google user info')
      return NextResponse.redirect(new URL(`/login?error=user_info_failed`, request.url))
    }

    const googleUser = await userInfoResponse.json()
    console.log('🔵 Google OAuth user:', googleUser.email)

    // Verificar si el usuario ya existe
    const { query, queryOne } = await import('@/lib/db')
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE email = $1',
      [googleUser.email]
    )

    if (user) {
      // Actualizar información de Google
      console.log('✅ Actualizando usuario existente:', user.email)
      await query(
        `UPDATE users SET
          avatar_url = COALESCE($1, avatar_url),
          email_verified = true,
          email_verified_at = COALESCE(email_verified_at, NOW()),
          updated_at = NOW()
        WHERE id = $2`,
        [googleUser.picture, user.id]
      )
    } else {
      // Crear nuevo usuario
      console.log('✅ Creando nuevo usuario desde Google OAuth:', googleUser.email)
      const randomPassword = Math.random().toString(36).slice(-12) + 'A1!'
      const hashedPassword = await bcrypt.hash(randomPassword, 10)

      user = await queryOne<any>(
        `INSERT INTO users 
         (name, email, password_hash, email_verified, email_verified_at, avatar_url, role)
         VALUES ($1, $2, $3, true, NOW(), $4, 'EMPLOYEE')
         RETURNING *`,
        [
          googleUser.name || 'Usuario',
          googleUser.email,
          hashedPassword,
          googleUser.picture
        ]
      )
    }

    // Generar JWT compatible con AuthContext
    const jwtToken = sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'EMPLOYEE'
      },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    )

    // Preparar datos de usuario para AuthContext
    const userData = {
      id: user.id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'EMPLOYEE',
      phone: user.phone || '',
      memberSince: user.created_at || new Date().toISOString()
    }

    // Redirigir a una página intermedia que guarde la sesión en localStorage
    // (porque no podemos escribir localStorage desde un redirect del servidor)
    const encodedUser = encodeURIComponent(JSON.stringify(userData))
    const encodedToken = encodeURIComponent(jwtToken)

    return NextResponse.redirect(
      new URL(`/auth/callback?user=${encodedUser}&token=${encodedToken}`, request.url)
    )

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error)
    return NextResponse.redirect(new URL(`/login?error=server_error`, request.url))
  }
}
