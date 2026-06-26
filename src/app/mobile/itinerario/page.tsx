"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from "lucide-react"

export default function MobileItineraryRootPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login')
      return
    }

    if (!user) return

    const checkTours = async () => {
      try {
        const token = localStorage.getItem('token') || ''
        const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(user?.role || '')
        const url = isAdmin ? '/api/bookings?userId=all' : `/api/bookings?userId=${user.id}`
        
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const bookingsList = data.data || []
          
          // Buscar la primera reserva con un tour_id
          const tourBooking = bookingsList.find((b: any) => {
            try {
              const details = typeof b.special_requests === 'string' ? JSON.parse(b.special_requests) : (b.special_requests || {})
              return !!details.tour_id
            } catch(e) {
              return false
            }
          })
          
          if (tourBooking) {
            const details = typeof tourBooking.special_requests === 'string' ? JSON.parse(tourBooking.special_requests) : (tourBooking.special_requests || {})
            router.push(`/mobile/itinerario/${details.tour_id}`)
          } else {
            // Si no tiene tours, mandarlo a mis reservas
            router.push('/mis-reservas')
          }
        } else {
          router.push('/mis-reservas')
        }
      } catch (error) {
        console.error("Error checking tours:", error)
        router.push('/mis-reservas')
      }
    }

    checkTours()
  }, [user, isAuthenticated])

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-gray-500 text-sm animate-pulse">Cargando tu itinerario...</p>
      </div>
    </div>
  )
}
