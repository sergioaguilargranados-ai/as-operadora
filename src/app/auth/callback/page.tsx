"use client"

/**
 * Auth Callback Page
 * Página intermedia que recibe los datos de autenticación OAuth
 * y los guarda en localStorage para que AuthContext los tome.
 * 
 * @version v2.317
 * @date 15 Feb 2026
 */

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthCallbackContent() {
    const searchParams = useSearchParams()

    useEffect(() => {
        const userParam = searchParams.get('user')
        const tokenParam = searchParams.get('token')

        if (userParam && tokenParam) {
            try {
                const userData = JSON.parse(decodeURIComponent(userParam))
                const token = decodeURIComponent(tokenParam)

                // Guardar en localStorage (formato AuthContext)
                localStorage.setItem('as_user', JSON.stringify(userData))
                localStorage.setItem('as_token', token)

                // Guardar cookies para el middleware
                const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString()
                document.cookie = `as_user=${encodeURIComponent(JSON.stringify({ id: userData.id, email: userData.email, role: userData.role || 'CLIENT' }))};expires=${expires};path=/;samesite=lax`
                document.cookie = `as_token=${encodeURIComponent(token)};expires=${expires};path=/;samesite=lax`

                console.log('✅ Sesión de Google guardada correctamente')

                // Redirigir al home
                window.location.href = '/'
            } catch (error) {
                console.error('❌ Error procesando callback de auth:', error)
                window.location.href = '/login?error=callback_failed'
            }
        } else {
            window.location.href = '/login?error=missing_params'
        }
    }, [searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-700">Iniciando sesión con Google...</p>
                <p className="text-sm text-gray-500 mt-2">Espera un momento</p>
            </div>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    )
}
