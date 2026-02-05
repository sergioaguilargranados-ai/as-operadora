/**
 * GOOGLE ONE TAP
 * Componente que muestra la burbuja flotante de Google One Tap
 * Esta es la funcionalidad que viste en Civitatis
 */

'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Script from 'next/script';

export default function GoogleOneTap() {
    const { data: session, status } = useSession();

    useEffect(() => {
        // Solo mostrar si no está autenticado
        if (status === 'authenticated') return;

        // Esperar a que el script de Google esté cargado
        const initializeOneTap = () => {
            // @ts-ignore
            if (!window.google) return;

            // @ts-ignore
            window.google.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                callback: handleCredentialResponse,
                auto_select: false, // No auto-seleccionar
                cancel_on_tap_outside: true, // Cerrar al hacer click fuera
                context: 'signin', // Contexto: signin, signup, use
            });

            // Mostrar la burbuja One Tap
            // @ts-ignore
            window.google.accounts.id.prompt((notification: any) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('One Tap no se mostró:', notification.getNotDisplayedReason());
                }
            });
        };

        // Intentar inicializar cada 100ms hasta que esté disponible
        const interval = setInterval(() => {
            // @ts-ignore
            if (window.google) {
                initializeOneTap();
                clearInterval(interval);
            }
        }, 100);

        // Limpiar después de 5 segundos
        setTimeout(() => clearInterval(interval), 5000);

        return () => clearInterval(interval);
    }, [status]);

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

            if (data.success) {
                console.log('✅ Autenticación exitosa');
                // Recargar para actualizar sesión
                window.location.href = '/dashboard';
            } else {
                console.error('❌ Error en autenticación:', data.error);
            }
        } catch (error) {
            console.error('❌ Error procesando One Tap:', error);
        }
    };

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
