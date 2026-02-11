"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/PageHeader'
import {
    Wallet, DollarSign, TrendingUp, Link2, Users, Briefcase,
    Loader2, Copy, ExternalLink, MousePointerClick, UserCheck,
    Clock, CheckCircle, ArrowRight, Eye, Share2, QrCode
} from 'lucide-react'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { motion } from 'framer-motion'
import { useToast } from '@/hooks/use-toast'

// ═══════════════════════════════════════
// Tipos
// ═══════════════════════════════════════

interface AgentDashboard {
    agent_id: number
    user_id: number
    agency_id: number
    referral_code: string
    agent_name: string
    agent_email: string
    agency_name: string
    // Clics
    total_clicks: number
    clicks_today: number
    clicks_this_week: number
    clicks_this_month: number
    // Conversiones
    total_conversions: number
    total_registrations: number
    total_bookings_referred: number
    conversion_rate: string
    // Comisiones
    commission_pending: number
    commission_available: number
    commission_paid: number
    commission_total: number
    // Clientes
    total_clients: number
    // Extra
    wallet: {
        pending: number
        available: number
        paid: number
        total: number
        currency: string
    }
    income_projection: Array<{
        month: string
        bookings: number
        projected_income: number
    }>
}

// ═══════════════════════════════════════
// Wrapper con Suspense
// ═══════════════════════════════════════

export default function AgentDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <AgentDashboardContent />
        </Suspense>
    )
}

function AgentDashboardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isAuthenticated } = useAuth()
    const { toast } = useToast()

    const [data, setData] = useState<AgentDashboard | null>(null)
    const [loading, setLoading] = useState(true)

    // TODO: Obtener del contexto de autenticación
    const agentId = searchParams.get('agent_id') || '1'

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login')
            return
        }
        fetchData()
    }, [isAuthenticated, agentId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/agent/dashboard?agent_id=${agentId}`)
            const json = await res.json()

            if (json.success) {
                setData(json.data)
            }
        } catch (error) {
            console.error('Error fetching agent dashboard:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency', currency: 'MXN',
            minimumFractionDigits: 0, maximumFractionDigits: 0
        }).format(amount)
    }

    const copyReferralLink = () => {
        if (!data?.referral_code) return
        const url = `https://mmta.app.asoperadora.com/?r=${data.referral_code}`
        navigator.clipboard.writeText(url)
        toast({ title: '📋 Link copiado', description: url })
    }

    const shareReferralLink = async () => {
        if (!data?.referral_code) return
        const url = `https://mmta.app.asoperadora.com/?r=${data.referral_code}`

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Viaja con ${data.agency_name}`,
                    text: '¡Reserva tus próximas vacaciones con nosotros!',
                    url
                })
            } catch { }
        } else {
            copyReferralLink()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="p-8 text-center max-w-md">
                    <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h2 className="text-xl font-bold mb-2">Agente no encontrado</h2>
                    <p className="text-muted-foreground mb-4">No se encontró información para este agente</p>
                    <Button onClick={() => router.push('/dashboard/agency')}>Volver al Dashboard</Button>
                </Card>
            </div>
        )
    }

    // Calcular barra de progreso del wallet
    const walletTotal = data.wallet.pending + data.wallet.available + data.wallet.paid
    const walletPendingPct = walletTotal > 0 ? (data.wallet.pending / walletTotal) * 100 : 0
    const walletAvailablePct = walletTotal > 0 ? (data.wallet.available / walletTotal) * 100 : 0
    const walletPaidPct = walletTotal > 0 ? (data.wallet.paid / walletTotal) * 100 : 0

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
            <PageHeader showBackButton={true} backButtonHref="/dashboard/agency">
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Mi Panel de Agente
                    </h1>
                    <p className="text-sm text-muted-foreground">{data.agent_name} · {data.agency_name}</p>
                </div>
            </PageHeader>

            <main className="container mx-auto px-4 py-6 max-w-7xl">

                {/* ═══ MI MONEDERO — Hero ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-6 mb-6 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden relative">
                        {/* Background decoration */}
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute left-20 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-blue-200 text-sm">Mi Monedero</p>
                                        <h2 className="text-3xl font-bold">{formatCurrency(data.wallet.total)}</h2>
                                    </div>
                                </div>
                                <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                                    {data.wallet.currency}
                                </Badge>
                            </div>

                            {/* Wallet Progress Bar */}
                            <div className="mb-4">
                                <div className="flex h-3 rounded-full overflow-hidden bg-white/10">
                                    {walletPaidPct > 0 && (
                                        <div className="bg-green-400 transition-all" style={{ width: `${walletPaidPct}%` }} />
                                    )}
                                    {walletAvailablePct > 0 && (
                                        <div className="bg-yellow-400 transition-all" style={{ width: `${walletAvailablePct}%` }} />
                                    )}
                                    {walletPendingPct > 0 && (
                                        <div className="bg-white/30 transition-all" style={{ width: `${walletPendingPct}%` }} />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3.5 h-3.5 text-blue-200" />
                                        <span className="text-xs text-blue-200">Pendiente</span>
                                    </div>
                                    <p className="text-lg font-bold">{formatCurrency(data.wallet.pending)}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle className="w-3.5 h-3.5 text-yellow-300" />
                                        <span className="text-xs text-blue-200">Disponible</span>
                                    </div>
                                    <p className="text-lg font-bold text-yellow-300">{formatCurrency(data.wallet.available)}</p>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign className="w-3.5 h-3.5 text-green-300" />
                                        <span className="text-xs text-blue-200">Cobrada</span>
                                    </div>
                                    <p className="text-lg font-bold text-green-300">{formatCurrency(data.wallet.paid)}</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* ═══ LIGA DE REFERIDO ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="p-5 mb-6 border-dashed border-2 border-blue-200 bg-blue-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Link2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Tu Liga de Referido</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                        <code className="bg-blue-100 px-2 py-0.5 rounded text-blue-800 text-xs font-mono">
                                            {data.referral_code || 'Sin código'}
                                        </code>
                                        <span className="text-xs">→ mmta.app.asoperadora.com/?r={data.referral_code}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={copyReferralLink}>
                                    <Copy className="w-4 h-4 mr-1" /> Copiar
                                </Button>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={shareReferralLink}>
                                    <Share2 className="w-4 h-4 mr-1" /> Compartir
                                </Button>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* ═══ STATS GRID ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <MousePointerClick className="w-4 h-4 text-purple-500" />
                                <span className="text-xs text-muted-foreground">Clics hoy</span>
                            </div>
                            <h3 className="text-2xl font-bold">{data.clicks_today}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.clicks_this_month} este mes · {data.total_clicks} total
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <UserCheck className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-muted-foreground">Conversiones</span>
                            </div>
                            <h3 className="text-2xl font-bold">{data.total_conversions}</h3>
                            <p className="text-xs mt-1">
                                <span className="text-green-600 font-medium">{data.conversion_rate}%</span>
                                <span className="text-muted-foreground"> tasa de conversión</span>
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span className="text-xs text-muted-foreground">Mis Clientes</span>
                            </div>
                            <h3 className="text-2xl font-bold">{data.total_clients}</h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                {data.total_registrations} registros · {data.total_bookings_referred} reservas
                            </p>
                        </Card>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                        <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                                <Briefcase className="w-4 h-4 text-orange-500" />
                                <span className="text-xs text-muted-foreground">Reservas Referidas</span>
                            </div>
                            <h3 className="text-2xl font-bold">{data.total_bookings_referred}</h3>
                            <p className="text-xs text-muted-foreground mt-1">de {data.total_clients} clientes</p>
                        </Card>
                    </motion.div>
                </div>

                {/* ═══ GRÁFICO DE PROYECCIÓN ═══ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                Proyección de Ingresos
                            </h3>
                            {(data.income_projection || []).length > 0 ? (
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={data.income_projection}>
                                        <defs>
                                            <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tickFormatter={(v) => {
                                            const d = new Date(v)
                                            return d.toLocaleDateString('es-MX', { month: 'short' })
                                        }} />
                                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                                        <Area
                                            type="monotone"
                                            dataKey="projected_income"
                                            stroke="#0066FF"
                                            strokeWidth={2}
                                            fill="url(#incomeGradient)"
                                            name="Ingreso proyectado"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p>Las proyecciones aparecerán cuando</p>
                                        <p className="text-sm">tengas reservas futuras confirmadas</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    {/* Funnel de conversión */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                        <Card className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Eye className="w-5 h-5" />
                                Embudo de Conversión
                            </h3>
                            <div className="space-y-4">
                                {/* Clics */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm flex items-center gap-2">
                                            <MousePointerClick className="w-4 h-4 text-purple-500" />
                                            Clics
                                        </span>
                                        <span className="font-bold">{data.total_clicks}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-4">
                                        <div className="bg-purple-500 h-4 rounded-full transition-all" style={{ width: '100%' }} />
                                    </div>
                                </div>

                                {/* Registros */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-blue-500" />
                                            Registros
                                        </span>
                                        <span className="font-bold">{data.total_registrations}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-4">
                                        <div
                                            className="bg-blue-500 h-4 rounded-full transition-all"
                                            style={{ width: `${data.total_clicks > 0 ? (data.total_registrations / data.total_clicks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Reservas */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 text-green-500" />
                                            Reservas
                                        </span>
                                        <span className="font-bold">{data.total_bookings_referred}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-4">
                                        <div
                                            className="bg-green-500 h-4 rounded-full transition-all"
                                            style={{ width: `${data.total_clicks > 0 ? (data.total_bookings_referred / data.total_clicks) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Tasa de conversión */}
                                <div className="pt-3 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Tasa de conversión global</span>
                                        <Badge variant="secondary" className="text-lg font-bold">
                                            {data.conversion_rate}%
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* ═══ TIPS / CTA ═══ */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <span className="text-lg">💡</span>
                            Tips para aumentar tus ventas
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-sm mb-1">Comparte tu liga</h4>
                                <p className="text-xs text-muted-foreground">
                                    Comparte tu liga personalizada en WhatsApp, Facebook e Instagram para llegar a más clientes potenciales.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-sm mb-1">Seguimiento</h4>
                                <p className="text-xs text-muted-foreground">
                                    Da seguimiento a tus prospectos. Un mensaje de recordatorio puede convertir un interesado en una venta.
                                </p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <h4 className="font-medium text-sm mb-1">Temporadas altas</h4>
                                <p className="text-xs text-muted-foreground">
                                    Aprovecha las temporadas vacacionales para promover ofertas y tours grupales.
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </main>
        </div>
    )
}
