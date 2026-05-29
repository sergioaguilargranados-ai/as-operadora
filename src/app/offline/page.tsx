'use client'

import { WifiOff, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoBack = () => {
    window.history.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        {/* Icono animado */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="mb-8"
        >
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
            <WifiOff className="w-14 h-14 text-blue-500" />
          </div>
        </motion.div>

        {/* Texto */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Sin conexión
        </h1>
        <p className="text-gray-500 mb-2 text-lg">
          No hay conexión a internet
        </p>
        <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto">
          Verifica tu conexión WiFi o datos móviles e intenta de nuevo.
          Tus datos guardados seguirán disponibles.
        </p>

        {/* Acciones */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0066FF] to-[#0044CC] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <RefreshCw className="w-5 h-5" />
            Reintentar
          </button>

          <button
            onClick={handleGoBack}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-center gap-2 text-gray-300">
          <div className="w-8 h-8 bg-gradient-to-br from-[#0066FF] to-[#0044CC] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">AS</span>
          </div>
          <span className="text-sm font-medium text-gray-400">AS Viajando</span>
        </div>
      </motion.div>
    </div>
  )
}
