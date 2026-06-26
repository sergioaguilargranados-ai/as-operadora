"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useWhiteLabel } from "@/contexts/WhiteLabelContext"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { 
  User, Calendar, CreditCard, Users, ShoppingBag, 
  Map, HelpCircle, ChevronRight, Bell, Menu, Loader2 
} from "lucide-react"

export default function MobileHomePage() {
  const { user } = useAuth()
  const { logoUrl, companyName } = useWhiteLabel()
  const router = useRouter()
  
  const [mobileContent, setMobileContent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (user?.tenant_id) {
      loadMobileContent(user.tenant_id)
    } else {
      loadMobileContent(1)
    }
  }, [user])

  const loadMobileContent = async (tenantId: number) => {
    try {
      const res = await fetch(`/api/mobile/content?tenant_id=${tenantId}`)
      const data = await res.json()
      if (data.success) {
        setMobileContent(data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    {
      id: "profile",
      title: "Perfil",
      desc: "Consulta el detalle de tu viaje, vuelos, hospedaje y actividades.",
      icon: User,
      route: "/portal/perfil"
    },
    {
      id: "itinerary",
      title: "Itinerario",
      desc: "Revisa tus itinerarios, vuelos y detalles de tu viaje.",
      icon: Calendar,
      route: "/portal/itinerary"
    },
    {
      id: "payments",
      title: "Pagos",
      desc: "Revisa tus pagos, saldos y métodos de pago.",
      icon: CreditCard,
      route: "/portal/payment"
    },
    {
      id: "group",
      title: "Crea tu grupo",
      desc: "Invita amigos, acumula beneficios y gana descuentos.",
      icon: Users,
      route: "/portal/viajes-grupales"
    },
    {
      id: "store",
      title: "Tienda",
      desc: "Descubre productos y servicios para tu viaje.",
      icon: ShoppingBag,
      route: "/mobile/tienda"
    }
  ]

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066FF]" />
      </div>
    )
  }

  const welcomePhrase = mobileContent?.welcome_phrase || "¿Listo para tu próxima experiencia?"
  const bannerUrl = mobileContent?.home_banner_url || "/banner-home.jpg"

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-8">
      {/* Premium Header */}
      <div 
        className="relative text-white px-6 pt-12 pb-16 flex flex-col justify-end min-h-[250px] bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.3)), url(${bannerUrl})` }}
      >
        {/* Navigation Elements */}
        <div className="absolute top-8 left-6 right-6 flex items-center justify-between">
          <Menu className="w-6 h-6 text-white cursor-pointer" />
          <img
            src={mobileContent?.logo_url || logoUrl || "/logo.png"}
            alt={companyName || "AS Operadora"}
            className="h-9 object-contain brightness-0 invert"
          />
          <Bell className="w-6 h-6 text-white cursor-pointer" />
        </div>

        {/* Personalized Welcome */}
        <div className="mt-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Hola, {user?.name || "Viajero"} ✈️
          </h1>
          <p className="text-gray-200 text-sm mt-1.5 font-medium">
            {welcomePhrase}
          </p>
        </div>
      </div>

      {/* Main Action Menu (Rounded Overlay) */}
      <div className="bg-white rounded-t-3xl -mt-6 p-6 flex-1 space-y-4 shadow-inner relative z-10">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              onClick={() => router.push(item.route)}
              className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 active:bg-gray-100 transition-all cursor-pointer shadow-sm"
            >
              <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          )
        })}

        {/* Lower Double Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {/* Help Button */}
          <div
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 active:bg-gray-100 cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">¿Ayuda?</h4>
              <p className="text-[10px] text-gray-400">Soporte 24/7</p>
            </div>
          </div>

          {/* Map Button */}
          <div
            onClick={() => router.push("/mobile/mapa")}
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 active:bg-gray-100 cursor-pointer shadow-sm"
          >
            <div className="w-10 h-10 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-gray-900">Mapa</h4>
              <p className="text-[10px] text-gray-400">Ver destinos</p>
            </div>
          </div>
        </div>

        {/* Catálogos Section (Configurable via admin) */}
        <div className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">
              {mobileContent?.sections_json?.catalogs?.title || "Nuestros Catálogos"}
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">
              {mobileContent?.sections_json?.catalogs?.subtitle || "Explora las mejores opciones"}
            </span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {/* Vuelos Card */}
            <div 
              onClick={() => router.push('/mobile/tienda')}
              className="flex-shrink-0 w-32 h-44 rounded-2xl relative overflow-hidden bg-cover bg-center cursor-pointer shadow-sm active:scale-95 transition-all bg-gray-200"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url(${mobileContent?.sections_json?.catalogs?.vuelos_img || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&fit=crop'})` }}
            >
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-extrabold text-xs">Vuelos</p>
                <p className="text-[9px] text-gray-300">Las mejores tarifas</p>
              </div>
            </div>

            {/* Hoteles Card */}
            <div 
              onClick={() => router.push('/mobile/tienda')}
              className="flex-shrink-0 w-32 h-44 rounded-2xl relative overflow-hidden bg-cover bg-center cursor-pointer shadow-sm active:scale-95 transition-all bg-gray-200"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url(${mobileContent?.sections_json?.catalogs?.hoteles_img || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&fit=crop'})` }}
            >
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-extrabold text-xs">Hoteles</p>
                <p className="text-[9px] text-gray-300">Habitaciones premium</p>
              </div>
            </div>

            {/* Paquetes Card */}
            <div 
              onClick={() => router.push('/mobile/tienda')}
              className="flex-shrink-0 w-32 h-44 rounded-2xl relative overflow-hidden bg-cover bg-center cursor-pointer shadow-sm active:scale-95 transition-all bg-gray-200"
              style={{ backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.85)), url(${mobileContent?.sections_json?.catalogs?.paquetes_img || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&fit=crop'})` }}
            >
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-extrabold text-xs">Paquetes</p>
                <p className="text-[9px] text-gray-300">Todo incluido</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Modal Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Centro de Ayuda Móvil</h3>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-gray-400 hover:text-gray-600 font-semibold"
              >
                Cerrar
              </button>
            </div>
            
            <p className="text-sm text-gray-600">Estamos listos para apoyarte en cualquier momento de tu trayecto.</p>

            <div className="space-y-3 pt-2">
              <a 
                href={`tel:${mobileContent?.help_phone || "+527208156804"}`} 
                className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Llamar a Soporte</p>
                  <p className="font-bold text-sm text-gray-900">{mobileContent?.help_phone || "+52 720 815 6804"}</p>
                </div>
              </a>

              <a 
                href={`mailto:${mobileContent?.help_email || "support@asoperadora.com"}`}
                className="flex items-center gap-3 p-3 border rounded-xl hover:bg-gray-50 cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-50 text-[#0066FF] rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Enviar un Correo</p>
                  <p className="font-bold text-sm text-gray-900">{mobileContent?.help_email || "support@asoperadora.com"}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
