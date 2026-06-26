"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Bell, MessageCircle, Facebook, Instagram, User, ChevronRight } from "lucide-react"

export default function MobileGroupsPage() {
  const router = useRouter()

  const options = [
    {
      id: "whatsapp",
      title: "Invitar mediante WhatsApp",
      desc: "Comparte tu viaje con tus contactos a través de WhatsApp.",
      icon: MessageCircle
    },
    {
      id: "facebook",
      title: "Invitar mediante Facebook",
      desc: "Comparte tu viaje con tus amigos a través de Facebook.",
      icon: Facebook
    },
    {
      id: "instagram",
      title: "Invitar mediante Instagram",
      desc: "Comparte tu viaje con tus amigos a través de Instagram.",
      icon: Instagram
    },
    {
      id: "contacts",
      title: "Invitar mediante contactos",
      desc: "Selecciona contactos de tu agenda para invitarlos al grupo.",
      icon: User
    }
  ]

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-24">
      
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-[#FDFDFD] z-30">
        <button onClick={() => router.back()} className="text-black hover:text-gray-600 p-2 -ml-2">
          <ChevronLeft className="w-7 h-7" />
        </button>
        <img
          src="/logo.png"
          alt="AS Operadora"
          className="h-10 object-contain"
          onError={(e) => (e.currentTarget.src = "/logo.png")}
        />
        <button className="text-black hover:text-gray-600 p-2 -mr-2">
          <Bell className="w-6 h-6" />
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-4 pb-8">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-3">Crea tu grupo</h1>
        <p className="text-sm text-gray-600 leading-relaxed pr-4">
          Invita a tus acompañantes y gestiona tu grupo de viaje de forma fácil y rápida.
        </p>
      </div>

      {/* Invite Options */}
      <div className="px-4 space-y-4">
        {options.map((option) => (
          <div 
            key={option.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform hover:bg-gray-50"
            onClick={() => {
              // Simular acción de compartir
              alert(`Abriendo ${option.title}...`)
            }}
          >
            <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center flex-shrink-0">
              <option.icon className="w-7 h-7" strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0 py-1">
              <h3 className="font-bold text-gray-900 text-sm mb-1">{option.title}</h3>
              <p className="text-xs text-gray-500 leading-tight pr-2">
                {option.desc}
              </p>
            </div>

            <ChevronRight className="w-5 h-5 text-black flex-shrink-0" />
          </div>
        ))}
      </div>

    </div>
  )
}
