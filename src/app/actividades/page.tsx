"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Search, MapPin, Globe, ExternalLink, Star, Users, Clock, HelpCircle, Bell, ArrowLeft } from "lucide-react"
import { Logo } from "@/components/Logo"
import { UserMenu } from "@/components/UserMenu"
import { useAuth } from "@/contexts/AuthContext"

export default function ActividadesPage() {
    const router = useRouter()
    const { user, isAuthenticated } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [destinations, setDestinations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showUserMenu, setShowUserMenu] = useState(false)

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const res = await fetch('/api/civitatis/destinations')
                const data = await res.json()
                if (data.success) {
                    setDestinations(data.data)
                }
            } catch (error) {
                console.error('Error fetching destinations:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchDestinations()
    }, [])

    const handleSearch = () => {
        if (searchQuery.trim()) {
            router.push(`/actividades/${encodeURIComponent(searchQuery.trim().toLowerCase())}`)
        }
    }

    const handleOpenDestination = (slug: string) => {
        router.push(`/actividades/${slug}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            {/* Header traslúcido (estilo AS Operadora) */}
            <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-soft">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4 md:gap-8">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-medium">Volver</span>
                        </button>
                        <Link href="/">
                            <Logo className="py-2" />
                        </Link>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6 text-sm">
                        <span className="hidden md:flex items-center gap-2 text-gray-600">
                            <Globe className="w-4 h-4" /> AS Operadora | Catálogo de Actividades
                        </span>
                        
                        {/* Avatar */}
                        {isAuthenticated ? (
                            <div className="relative">
                                <button 
                                    className="flex items-center gap-2 focus:outline-none"
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                >
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 text-white flex items-center justify-center font-bold shadow-md">
                                        {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                    </div>
                                    <span className="font-medium text-gray-700 hidden sm:block">
                                        {user?.first_name || 'Usuario'}
                                    </span>
                                </button>
                                {showUserMenu && (
                                    <div className="absolute right-0 top-full mt-2 w-48">
                                        <UserMenu />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link href="/login">
                                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
                                    Iniciar Sesión
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-28 overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 -z-10"></div>
                <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <Badge variant="outline" className="mb-6 bg-pink-50 text-pink-600 border-pink-200 px-4 py-1.5 text-sm rounded-full">
                            ✨ Nueva Experiencia Integrada
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                            Encuentra las mejores <br className="hidden md:block"/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-600">
                                actividades y tours
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Reserva directamente las mejores experiencias, excursiones y visitas guiadas para complementar tus paquetes de viaje.
                        </p>
                    </motion.div>

                    {/* Buscador */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="bg-white p-3 md:p-4 rounded-2xl shadow-xl border border-gray-100 flex flex-col md:flex-row gap-3 max-w-3xl mx-auto"
                    >
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <Input 
                                type="text"
                                placeholder="¿A dónde vas a viajar? (Ej. Roma, París...)"
                                className="pl-12 h-14 bg-gray-50/50 border-transparent focus:bg-white rounded-xl text-base"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button 
                            onClick={handleSearch}
                            className="h-14 px-8 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-semibold text-lg shadow-md hover:shadow-lg transition-all"
                        >
                            Buscar Tours
                        </Button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-12 flex flex-wrap justify-center gap-8 text-sm font-medium text-gray-500"
                    >
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <Globe className="w-4 h-4 text-pink-500" /> +3,000 Destinos
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <Star className="w-4 h-4 text-yellow-400" /> Calidad Garantizada
                        </div>
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                            <Users className="w-4 h-4 text-blue-500" /> Tours en Español
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Destinos Principales */}
            <section className="py-20 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Destinos Principales</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Explora las mejores actividades y tours en estos destinos populares
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {loading ? (
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 py-12 flex justify-center">
                                <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : destinations.length > 0 ? (
                            destinations.map((dest, index) => (
                                <motion.div
                                    key={dest.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <div
                                        onClick={() => handleOpenDestination(dest.slug)}
                                        className="group relative h-[250px] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                                    >
                                        <div className="absolute inset-0">
                                            <img
                                                src={dest.image}
                                                alt={dest.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm">
                                            {dest.activities} actividades
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                                            <h3 className="text-2xl font-bold mb-1 group-hover:text-pink-400 transition-colors">{dest.name}</h3>
                                            <p className="text-gray-300 text-sm mb-3 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {dest.country}
                                            </p>
                                            
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-gray-200 line-clamp-1">{dest.description}</p>
                                                <div className="w-8 h-8 rounded-full bg-pink-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                    <ExternalLink className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center py-12 text-gray-500">
                                No se encontraron destinos.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer Minimalista */}
            <footer className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-3">
                            <Globe className="w-6 h-6 text-pink-600" />
                            <span className="font-bold text-gray-900 text-xl tracking-tight">Actividades AS Operadora</span>
                        </div>
                        <p className="text-gray-500 text-sm text-center md:text-left">
                            Impulsado por el catálogo de Civitatis. © {new Date().getFullYear()} AS Operadora.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
