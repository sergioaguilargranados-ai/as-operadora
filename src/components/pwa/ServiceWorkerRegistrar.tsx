'use client'

import { useEffect } from 'react'

/**
 * Componente que registra el Service Worker para la PWA.
 * Se monta una vez en el layout raíz.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Registrar el SW después de que la página cargue completamente
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado:', registration.scope)

            // Verificar actualizaciones periódicamente (cada hora)
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000)
          })
          .catch((error) => {
            console.error('[PWA] Error al registrar Service Worker:', error)
          })
      })
    }
  }, [])

  return null
}
