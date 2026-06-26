"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Bell, Calendar as CalendarIcon, ChevronDown, ChevronRight, MapPin } from "lucide-react"

export default function MobileItineraryPage() {
  const router = useRouter()

  const days = [
    {
      id: 1,
      day: "DÍA 1",
      title: "Santorini",
      location: "Santorini, Grecia",
      desc: "Llegada, traslado al hotel y tiempo libre para disfrutar del destino.",
      img: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 2,
      day: "DÍA 2",
      title: "Atenas",
      location: "Atenas, Grecia",
      desc: "City tour por la Acrópolis y los principales puntos históricos.",
      img: "https://images.unsplash.com/photo-1555993539-1732bfce9ef3?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 3,
      day: "DÍA 3",
      title: "Mykonos",
      location: "Mykonos, Grecia",
      desc: "Día libre para recorrer la isla, playas y callejuelas encantadoras.",
      img: "https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 4,
      day: "DÍA 4",
      title: "Creta",
      location: "Creta, Grecia",
      desc: "Explora la historia, cultura y gastronomía de la isla.",
      img: "https://images.unsplash.com/photo-1520682522774-8b68832a875a?auto=format&fit=crop&w=400&q=80"
    },
    {
      id: 5,
      day: "DÍA 5",
      title: "Delfos",
      location: "Delfos, Grecia",
      desc: "Visita al sitio arqueológico y paisajes impresionantes.",
      img: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=400&q=80"
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
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.src = "/logo.png"
          }}
        />
        <button className="text-black hover:text-gray-600 p-2 -mr-2">
          <Bell className="w-6 h-6" />
        </button>
      </div>

      {/* Title */}
      <div className="px-6 pt-4 pb-6">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Itinerario</h1>
        <p className="text-sm text-gray-500">
          Consulta el detalle de tu viaje día por día.
        </p>
      </div>

      {/* Trip Selector */}
      <div className="px-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className="font-serif font-bold text-gray-900 text-lg">Viaje a Grecia</h2>
            <p className="text-xs text-gray-500">12 - 19 de junio, 2025</p>
          </div>
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Days List */}
      <div className="px-4 space-y-4">
        {days.map((day) => (
          <div 
            key={day.id}
            onClick={() => router.push(`/mobile/itinerario/${day.id}`)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-4">
              <img src={day.img} alt={day.title} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="text-[10px] font-bold text-gray-900 uppercase tracking-wider">{day.day}</p>
                  <ChevronRight className="w-5 h-5 text-black" />
                </div>
                <h3 className="font-serif font-bold text-gray-900 text-xl leading-tight mb-1">{day.title}</h3>
                <div className="flex items-center gap-1 text-gray-500 mb-2">
                  <MapPin className="w-3 h-3" />
                  <span className="text-xs">{day.location}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-end justify-between gap-4">
              <p className="text-xs text-gray-600 leading-relaxed flex-1">
                {day.desc}
              </p>
              <button 
                onClick={(e) => { e.stopPropagation(); alert('Redirigiendo a tours...'); }}
                className="bg-black text-white text-xs font-bold px-4 py-2 rounded-lg flex-shrink-0"
              >
                Reservar tours
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
