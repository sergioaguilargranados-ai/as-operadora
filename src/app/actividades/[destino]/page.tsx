"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { MapPin, Globe, ExternalLink, Clock, ArrowLeft, Star } from "lucide-react"
import { Logo } from "@/components/Logo"
import { useAuth } from "@/contexts/AuthContext"

export default function DestinoActividadesPage() {
    const router = useRouter()
    const params = useParams()
    const { user, isAuthenticated } = useAuth()
    
    // params.destino is the slug
    const destinoSlug = params.destino as string
    const decodedDestino = decodeURIComponent(destinoSlug)

    const [activities, setActivities] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                // We use our mock API
                const res = await fetch(`/api/civitatis/activities?q=${encodeURIComponent(decodedDestino)}`)
                const data = await res.json()
                if (data.success) {
                    setActivities(data.data)
                }
            } catch (error) {
                console.error('Error fetching activities:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchActivities()
    }, [decodedDestino])

    const handleOpenTour = (id: string) => {
        router.push(`/actividades/tour/${id}`)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-soft">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/actividades')}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-medium">Todos los Destinos</span>
                        </button>
                        <Link href="/">
                            <Logo className="py-2 scale-75 md:scale-100 origin-left" />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Destination */}
            <div className="bg-blue-900 text-white py-12 md:py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&fit=crop')] bg-cover bg-center opacity-20"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900 to-transparent"></div>
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 capitalize">
                        Actividades en {decodedDestino}
                    </h1>
                    <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                        Descubre y reserva los mejores tours, visitas guiadas y excursiones.
                    </p>
                </div>
            </div>

            {/* Listado */}
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {loading ? 'Buscando...' : `${activities.length} actividades encontradas`}
                    </h2>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500">Conectando con Civitatis...</p>
                    </div>
                ) : activities.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {activities.map((act, index) => (
                            <motion.div
                                key={act.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                            >
                                <Card 
                                    className="overflow-hidden h-full flex flex-col hover:shadow-xl transition-shadow cursor-pointer border-0 shadow-md group"
                                    onClick={() => handleOpenTour(act.id)}
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img 
                                            src={act.image} 
                                            alt={act.title} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        />
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-sm font-bold text-pink-600 shadow">
                                            {act.price} {act.currency}
                                        </div>
                                    </div>
                                    <div className="p-5 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                                            <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> {act.destination}</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1"/> {act.duration}</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                                            {act.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-sm text-yellow-500 mb-4 mt-auto">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-medium text-gray-700">{act.rating}</span>
                                            <span className="text-gray-400">({act.reviews})</span>
                                        </div>
                                        <Button className="w-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                                            Ver Detalles
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">No se encontraron actividades</h3>
                        <p className="text-gray-500 mb-6">No tenemos tours disponibles para "{decodedDestino}" en este momento.</p>
                        <Button onClick={() => router.push('/actividades')}>Volver a buscar</Button>
                    </div>
                )}
            </div>
        </div>
    )
}
