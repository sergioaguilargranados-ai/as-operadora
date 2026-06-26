"use client"

import { useRouter } from "next/navigation"
import { ChevronLeft, Bookmark, MapPin, Info, Volume2, ArrowRightLeft, Mic, Copy, Volume1, Calendar as CalendarIcon } from "lucide-react"

export default function MobileItineraryDayDetail({ params }: { params: { id: string } }) {
  const router = useRouter()

  const foods = [
    { name: "Moussaka", desc: "Pastel tradicional de berenjena y carne.", img: "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=200&q=80" },
    { name: "Gyros", desc: "Carne asada servida en pan pita con verduras y salsa.", img: "https://images.unsplash.com/photo-1593504049359-715569420580?auto=format&fit=crop&w=200&q=80" },
    { name: "Souvlaki", desc: "Brochetas de carne a la parrilla, tradicionales.", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=200&q=80" },
    { name: "Baklava", desc: "Postre tradicional con miel y nueces.", img: "https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&w=200&q=80" }
  ]

  const places = [
    { name: "Oia", desc: "Pueblo famoso por sus casas blancas y atardeceres.", img: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=200&q=80" },
    { name: "Fira", desc: "La vibrante capital de Santorini.", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac542?auto=format&fit=crop&w=200&q=80" },
    { name: "Akrotiri", desc: "Antigua ciudad minoica conservada por la ceniza.", img: "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=200&q=80" },
    { name: "Playa de Kamari", desc: "Playa de arena negra con aguas cristalinas.", img: "https://images.unsplash.com/photo-1520682522774-8b68832a875a?auto=format&fit=crop&w=200&q=80" }
  ]

  const souvenirs = [
    { name: "Ojo Turco", desc: "Protección y buena suerte.", img: "https://images.unsplash.com/photo-1607521798319-74d32049e491?auto=format&fit=crop&w=200&q=80" },
    { name: "Cerámica Griega", desc: "Hecha a mano con diseños tradicionales.", img: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=200&q=80" },
    { name: "Vino Assyrtiko", desc: "Vino blanco seco único de la isla.", img: "https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&w=200&q=80" }
  ]

  const phrases = [
    { es: "Hola", local: "Yassas" },
    { es: "Gracias", local: "Efcharistó" },
    { es: "Por favor", local: "Parakaló" },
    { es: "¿Dónde está el baño?", local: "Pou íne i toualéta?" },
    { es: "¿Cuánto cuesta?", local: "Poso káni?" },
    { es: "No entiendo", local: "Den katalava" }
  ]

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-28">
      
      {/* Top Navigation */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-900 active:scale-95 p-2 -ml-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <img
          src="/logo.png"
          alt="AS Operadora"
          className="h-8 object-contain"
          onError={(e) => (e.currentTarget.src = "/logo.png")}
        />
        <button className="text-gray-900 active:scale-95 p-2 -mr-2 rounded-full hover:bg-gray-100">
          <Bookmark className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Image Section */}
      <div className="px-4 pt-4 mb-4">
        <div className="relative w-full h-[240px] rounded-3xl overflow-hidden shadow-sm">
          <img 
            src="https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=80" 
            alt="Santorini" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <p className="text-xs font-bold uppercase tracking-wider mb-1">Día 1</p>
            <h1 className="text-4xl font-serif font-bold mb-2 text-white">Santorini</h1>
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Grecia</span>
            </div>
          </div>
        </div>
      </div>

      {/* Descripción General */}
      <div className="px-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex gap-4">
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 text-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Descripción general</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Santorini es una isla volcánica en el mar Egeo, famosa por sus casas blancas con cúpulas azules, atardeceres inolvidables y vistas espectaculares.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ideal para quienes buscan paisajes únicos, buena gastronomía y cultura griega auténtica. Sus calles son estrechas y muchas zonas tienen escaleras, por lo que se recomienda usar calzado cómodo.
            </p>
          </div>
        </div>
      </div>

      {/* Gastronomía */}
      <div className="mb-8">
        <h2 className="text-lg font-serif font-bold text-gray-900 px-4 mb-4">Gastronomía recomendada</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-none">
          {foods.map((food, i) => (
            <div key={i} className="w-[140px] flex-shrink-0 flex flex-col">
              <img src={food.img} alt={food.name} className="w-full h-24 object-cover rounded-xl mb-2 shadow-sm" />
              <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">{food.name}</h4>
              <p className="text-xs text-gray-500 leading-tight">{food.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Imperdibles */}
      <div className="mb-8">
        <h2 className="text-lg font-serif font-bold text-gray-900 px-4 mb-4">Lugares imperdibles</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-none">
          {places.map((place, i) => (
            <div key={i} className="w-[120px] flex-shrink-0 flex flex-col">
              <img src={place.img} alt={place.name} className="w-full h-[120px] object-cover rounded-2xl mb-2 shadow-sm" />
              <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">{place.name}</h4>
              <p className="text-[10px] text-gray-500 leading-tight">{place.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Información Práctica */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Información práctica</h2>
        <div className="grid grid-cols-2 gap-3">
          
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center font-serif text-lg text-gray-700">€</div>
              <div>
                <p className="text-xs font-bold text-gray-900">Moneda</p>
                <p className="text-[10px] text-gray-500">Euro (€)</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-tight">Se aceptan tarjetas en la mayoría de establecimientos.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                <Volume2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Idioma</p>
                <p className="text-[10px] text-gray-500">Griego</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-tight">El inglés es ampliamente hablado en zonas turísticas.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                <span className="text-lg">☀️</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Clima</p>
                <p className="text-[10px] text-gray-500">Mediterráneo</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-tight">Veranos cálidos y secos. Inviernos suaves y agradables.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                <span className="text-sm font-bold">GMT</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Zona horaria</p>
                <p className="text-[10px] text-gray-500">GMT +2</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-tight">Misma hora que en la mayoría de países de Europa.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                <span className="text-sm font-bold">⚡</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Voltaje</p>
                <p className="text-[10px] text-gray-500">230V / 50Hz</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-tight">Enchufes tipo C y F.</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-700">
                <span className="text-sm font-bold">📞</span>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Emergencias</p>
                <p className="text-[10px] text-gray-500">112</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-tight">Número único de emergencia en Europa.</p>
          </div>

        </div>
      </div>

      {/* Consejo */}
      <div className="px-4 mb-8">
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex gap-4">
          <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-sm mb-1">Consejo para tu viaje</h3>
            <p className="text-xs text-blue-800 leading-relaxed">
              Camina mucho, disfruta sin prisa y mantente hidratado. Lleva siempre contigo agua, protector solar y tus medicamentos personales.
            </p>
          </div>
        </div>
      </div>

      {/* Frases útiles y Compras (Grid mixto) */}
      <div className="px-4 mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Frases */}
        <div>
          <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Frases útiles</h2>
          <div className="space-y-3">
            {phrases.map((phrase, i) => (
              <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <p className="font-bold text-sm text-gray-900">{phrase.es}</p>
                  <p className="text-xs text-gray-500">{phrase.local}</p>
                </div>
                <button className="p-2 text-gray-400 hover:text-black">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Compras */}
      <div className="mb-8">
        <h2 className="text-lg font-serif font-bold text-gray-900 px-4 mb-2">¿Qué comprar?</h2>
        <p className="text-sm text-gray-500 px-4 mb-4">Souvenirs icónicos de Santorini que no te puedes perder.</p>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-none">
          {souvenirs.map((item, i) => (
            <div key={i} className="w-[120px] flex-shrink-0 flex flex-col">
              <div className="relative bg-[#f6f5f3] h-[120px] rounded-2xl mb-2 flex items-center justify-center p-2">
                <img src={item.img} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                <button className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Heart className="w-3 h-3 text-gray-400" />
                </button>
              </div>
              <h4 className="font-bold text-xs text-gray-900 mb-1 leading-tight">{item.name}</h4>
              <p className="text-[10px] text-gray-500 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Traductor */}
      <div className="px-4 mb-8">
        <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Traductor en tiempo real</h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <span className="text-sm font-bold text-gray-700">Español</span>
            <ArrowRightLeft className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-700">Griego</span>
          </div>
          <div className="p-4 relative">
            <textarea 
              placeholder="Escribe aquí..." 
              className="w-full h-16 text-lg bg-transparent border-none outline-none resize-none placeholder:text-gray-300 font-serif"
            ></textarea>
            <div className="flex justify-between items-center mt-2 border-t border-gray-50 pt-2">
              <span className="text-xs text-gray-400">Traducción</span>
              <div className="flex gap-2 text-gray-400">
                <Copy className="w-4 h-4 cursor-pointer hover:text-black" />
                <Volume1 className="w-4 h-4 cursor-pointer hover:text-black" />
                <Mic className="w-5 h-5 ml-2 cursor-pointer text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white p-4 border-t border-gray-200 flex flex-col z-50">
        <button className="w-full bg-black text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg">
          <CalendarIcon className="w-5 h-5" />
          Reservar tours para este destino
        </button>
      </div>

    </div>
  )
}
