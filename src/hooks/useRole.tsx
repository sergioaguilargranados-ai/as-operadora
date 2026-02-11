"use client"

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'

// ═══════════════════════════════════════
// Tipos de roles
// ═══════════════════════════════════════

export type UserRole = 'SUPER_ADMIN' | 'AGENCY_ADMIN' | 'AGENT' | 'CLIENT' | 'VIEWER'

export interface AgentInfo {
    agentId: number
    tenantId: number
    agencyName: string
    role: UserRole
    referralCode: string | null
    commissionSplit: number
    isActive: boolean
}

export interface RoleContext {
    role: UserRole
    agentInfo: AgentInfo | null
    isSuperAdmin: boolean
    isAgencyAdmin: boolean
    isAgent: boolean
    isClient: boolean
    canAccessAgencyDashboard: boolean
    canAccessAgentDashboard: boolean
    canAccessAdminPanel: boolean
    canDisburseCommissions: boolean
    canCreateAgents: boolean
    canExportData: boolean
    loading: boolean
}

// ═══════════════════════════════════════
// Hook
// ═══════════════════════════════════════

export function useRole(): RoleContext {
    const { user, isAuthenticated } = useAuth()
    const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchAgentInfo = useCallback(async () => {
        if (!isAuthenticated || !user?.id) {
            setLoading(false)
            return
        }

        try {
            const res = await fetch(`/api/auth/me`)
            const data = await res.json()
            if (data.success && data.agentInfo) {
                setAgentInfo(data.agentInfo)
            }
        } catch (error) {
            console.error('Error fetching role info:', error)
        } finally {
            setLoading(false)
        }
    }, [isAuthenticated, user?.id])

    useEffect(() => {
        fetchAgentInfo()
    }, [fetchAgentInfo])

    // Determinar rol base
    const role: UserRole = agentInfo?.role || (user?.role as UserRole) || 'CLIENT'

    // Super admins: user_id = 1 o roles específicos
    const isSuperAdmin = role === 'SUPER_ADMIN' || user?.id === '1'
    const isAgencyAdmin = role === 'AGENCY_ADMIN' || isSuperAdmin
    const isAgent = role === 'AGENT' || isAgencyAdmin
    const isClient = true // Todos pueden ser clientes

    return {
        role,
        agentInfo,
        isSuperAdmin,
        isAgencyAdmin,
        isAgent,
        isClient,
        canAccessAgencyDashboard: isAgencyAdmin,
        canAccessAgentDashboard: isAgent,
        canAccessAdminPanel: isSuperAdmin,
        canDisburseCommissions: isAgencyAdmin,
        canCreateAgents: isAgencyAdmin,
        canExportData: isAgencyAdmin,
        loading
    }
}

// ═══════════════════════════════════════
// Componente wrapper de protección
// ═══════════════════════════════════════

interface RoleGuardProps {
    requiredRole: UserRole | UserRole[]
    children: React.ReactNode
    fallback?: React.ReactNode
}

export function RoleGuard({ requiredRole, children, fallback }: RoleGuardProps) {
    const { role, isSuperAdmin, loading } = useRole()

    if (loading) return null

    // Super admin siempre tiene acceso
    if (isSuperAdmin) return <>{children}</>

    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    const hasAccess = roles.includes(role)

    if (!hasAccess) {
        return fallback ? <>{fallback}</> : null
    }

    return <>{children}</>
}
