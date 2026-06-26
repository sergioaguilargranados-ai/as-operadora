"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Trophy, MapPin, Footprints, Medal, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MobileRewardsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  
  // Step simulation state
  const [steps, setSteps] = useState(1000)
  const goal = 10000
  
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSimulateSteps = () => {
    setSteps(prev => Math.min(prev + 1000, goal))
  }

  const progress = Math.min((steps / goal) * 100, 100)
  const circumference = 2 * Math.PI * 60

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-600 px-4 py-4 flex items-center justify-between sticky top-0 z-20 text-white shadow-md">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/mobile")} className="-ml-2 text-white hover:bg-white/20">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">AS Rewards</h1>
        </div>
      </div>

      {/* Main Challenge Area */}
      <div className="bg-green-600 px-4 pt-6 pb-12 rounded-b-[40px] text-white flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-1">Reto Diario</h2>
        <p className="text-green-100 text-sm mb-6 text-center">
          Camina 10,000 pasos hoy para desbloquear beneficios exclusivos
        </p>

        {/* Circular Progress */}
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="60"
              className="stroke-current text-green-800/40"
              strokeWidth="12"
              fill="transparent"
            />
            <circle
              cx="96"
              cy="96"
              r="60"
              className="stroke-current text-white transition-all duration-1000 ease-out"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <Footprints className="w-8 h-8 text-white mb-1" />
            <span className="text-3xl font-extrabold">{steps.toLocaleString()}</span>
            <span className="text-xs text-green-100 uppercase tracking-widest font-semibold mt-1">Pasos</span>
          </div>
        </div>

        <Button 
          onClick={handleSimulateSteps} 
          disabled={steps >= goal}
          className="bg-white text-green-700 hover:bg-green-50 font-bold rounded-full px-8 shadow-lg"
        >
          {steps >= goal ? "¡Meta Alcanzada!" : "Simular Pasos (+1,000)"}
        </Button>
      </div>

      {/* Recommended Places */}
      <div className="px-4 mt-[-20px] relative z-10">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Dónde caminar hoy</h3>
            <span className="text-xs font-bold text-[#0066FF] uppercase tracking-wider">Cerca de ti</span>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1574347713437-080c98e217d1?auto=format&fit=crop&w=300&q=80" alt="Parque" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-sm">Parque La Mexicana</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">Ideal para sumar pasos. Circuito de 2km rodeado de naturaleza.</p>
                <div className="flex items-center gap-1 mt-2 text-[#0066FF]">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-bold">A 1.2 km de tu ubicación</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-xl flex-shrink-0 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1549474776-6644ee7890bc?auto=format&fit=crop&w=300&q=80" alt="Centro Historico" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-sm">Paseo de la Reforma</h4>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">Disfruta de monumentos históricos mientras caminas.</p>
                <div className="flex items-center gap-1 mt-2 text-[#0066FF]">
                  <MapPin className="w-3 h-3" />
                  <span className="text-[10px] font-bold">A 3.5 km de tu ubicación</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" className="w-full mt-4 text-[#0066FF] font-bold text-sm bg-blue-50 hover:bg-blue-100 rounded-xl" onClick={() => router.push('/mobile/mapa')}>
            Ver mapa de actividades <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Badges Section */}
      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Tus Insignias</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-yellow-200 shadow-sm opacity-100">
            <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-[10px] font-bold text-center text-gray-900 leading-tight">Primeros<br/>Pasos</p>
          </div>
          
          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-gray-100 shadow-sm opacity-50 grayscale">
            <Medal className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-[10px] font-bold text-center text-gray-900 leading-tight">Caminante<br/>Frecuente</p>
          </div>

          <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center border border-gray-100 shadow-sm opacity-50 grayscale">
            <Footprints className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-[10px] font-bold text-center text-gray-900 leading-tight">Maratón<br/>Semanal</p>
          </div>
        </div>
      </div>
    </div>
  )
}
