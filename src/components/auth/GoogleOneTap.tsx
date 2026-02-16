/**
 * GOOGLE ONE TAP
 * Componente que muestra la burbuja flotante de Google One Tap
 * para registro/login rápido con Google.
 * 
 * Usa el AuthContext personalizado del proyecto (NO next-auth).
 * 
 * @version v2.317
 * @date 15 Feb 2026
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Script from 'next/script';

export default function GoogleOneTap() {
    const { isAuthenticated } = useAuth();
    const initializedRef = useRef(false);

    useEffect(() => {
        // Solo mostrar si no está autenticado
        if (isAuthenticated) return;
        // Evitar doble inicialización
        if (initializedRef.current) return;

        const initializeOneTap = () => {
            // @ts-ignore
            if (!window.google?.accounts?.id) return;

            const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
            if (!clientId) {
                console.warn('⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID no configurado');
                return;
            }

            initializedRef.current = true;

            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: clientId,
                callback: handleCredentialResponse,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: 'signin',
                use_fedcm_for_prompt: false, // Usar modo clásico (iframe), FedCM causa errores en localhost
            });

            // Mostrar la burbuja One Tap
            // @ts-ignore
            window.google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed()) {
                    console.log('ℹ️ One Tap no se mostró:', notification.getNotDisplayedReason());
                } else if (notification.isSkippedMoment()) {
                    console.log('ℹ️ One Tap saltado:', notification.getSkippedReason());
                }
            });
        };

        // Intentar inicializar cada 200ms hasta que el script esté disponible
        const interval = setInterval(() => {
            // @ts-ignore
            if (window.google?.accounts?.id) {
                initializeOneTap();
                clearInterval(interval);
            }
        }, 200);

        // Limpiar después de 8 segundos si no se carga
        const timeout = setTimeout(() => clearInterval(interval), 8000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isAuthenticated]);

    const handleCredentialResponse = async (response: any) => {
        try {
            console.log('🔵 One Tap credential recibido');

            // Enviar credential al backend para autenticar
            const res = await fetch('/api/auth/google-one-tap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential })
            });

            const data = await res.json();

            if (data.success && data.token && data.user) {
                console.log('✅ Google One Tap: autenticación exitosa');
                // Guardar en localStorage (mismo formato que AuthContext)
                localStorage.setItem('as_user', JSON.stringify(data.user));
                localStorage.setItem('as_token', data.token);
                // Guardar cookies para el middleware
                const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
                document.cookie = `as_user=${encodeURIComponent(JSON.stringify({ id: data.user.id, email: data.user.email, role: data.user.role || 'CLIENT' }))};expires=${expires};path=/;samesite=lax`;
                document.cookie = `as_token=${encodeURIComponent(data.token)};expires=${expires};path=/;samesite=lax`;
                // Recargar para que AuthContext tome la sesión
                window.location.href = '/';
            } else {
                console.error('❌ Error en autenticación One Tap:', data.error);
            }
        } catch (error) {
            console.error('❌ Error procesando One Tap:', error);
        }
    };

    // No renderizar nada si ya está autenticado
    if (isAuthenticated) return null;

    return (
        <>
            {/* Script de Google Identity Services */}
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
            />
        </>
    );
}
