'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

/**
 * Utility to convert base64 VAPID key to Uint8Array for the PushManager
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
    
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager({ variant = 'switch' }: { variant?: 'switch' | 'button' }) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    // Check if push messaging is supported
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true)
        setPermission(Notification.permission)
        
        try {
          const registration = await navigator.serviceWorker.ready
          const subscription = await registration.pushManager.getSubscription()
          setIsSubscribed(!!subscription)
        } catch (error) {
          console.error('[PUSH_MANAGER] Error checking subscription:', error)
        }
      }
      setIsLoading(false)
    }
    
    checkSupport()
  }, [])

  const subscribeUser = async () => {
    setIsLoading(true)
    try {
      // 1. Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      
      if (perm !== 'granted') {
        throw new Error('Permission not granted')
      }

      // 2. Subscribe to push manager
      const registration = await navigator.serviceWorker.ready
      
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not found in env')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // 3. Send subscription to our server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          platform: 'web',
          deviceName: navigator.userAgent.substring(0, 100) // basic device info
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription on server')
      }

      setIsSubscribed(true)
    } catch (error) {
      console.error('[PUSH_MANAGER] Subscription failed:', error)
      alert('No se pudo activar las notificaciones. Asegúrate de dar los permisos en tu navegador.')
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeUser = async () => {
    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error('[PUSH_MANAGER] Unsubscription failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSubscription = async () => {
    if (isSubscribed) {
      await unsubscribeUser()
    } else {
      await subscribeUser()
    }
  }

  if (!isSupported) {
    return null // Ocultar componente silenciosamente si el dispositivo no soporta Push
  }

  if (variant === 'switch') {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-blue-50 text-[#0066FF]' : 'bg-gray-100 text-gray-500'}`}>
            {isSubscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-gray-900">Notificaciones Push</h4>
            <p className="text-xs text-gray-500">Recibe ofertas y actualizaciones en tu dispositivo</p>
          </div>
        </div>
        
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        ) : (
          <Switch 
            checked={isSubscribed}
            onCheckedChange={toggleSubscription}
            disabled={permission === 'denied'}
          />
        )}
      </div>
    )
  }

  // Variant: Button
  return (
    <Button 
      variant={isSubscribed ? "outline" : "default"}
      onClick={toggleSubscription}
      disabled={isLoading || permission === 'denied'}
      className="gap-2"
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSubscribed ? (
        <>
          <BellOff className="w-4 h-4" /> Desactivar Alertas
        </>
      ) : (
        <>
          <Bell className="w-4 h-4" /> Recibir Ofertas
        </>
      )}
    </Button>
  )
}
