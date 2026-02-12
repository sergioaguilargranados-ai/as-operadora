// API: Gestión de usuarios por tenant
// GET /api/tenants/[id]/users — Listar usuarios del tenant
// POST /api/tenants/[id]/users — Agregar usuario al tenant
// DELETE /api/tenants/[id]/users — Quitar usuario del tenant
// v2.313 - 11 Feb 2026

import { NextRequest, NextResponse } from 'next/server'
import TenantService from '@/services/TenantService'
import { queryOne, queryMany } from '@/lib/db'

interface RouteParams {
    params: Promise<{ id: string }>
}

/**
 * GET /api/tenants/[id]/users
 * Listar usuarios del tenant con info del usuario (nombre, email)
 */
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const tenantId = parseInt(id, 10)
        if (isNaN(tenantId)) {
            return NextResponse.json({ success: false, error: 'ID de tenant inválido' }, { status: 400 })
        }

        const role = request.nextUrl.searchParams.get('role') || undefined

        // Obtener usuarios con JOIN a tabla users para más info
        let roleFilter = ''
        const queryParams: unknown[] = [tenantId]

        if (role) {
            roleFilter = 'AND tu.role = $2'
            queryParams.push(role)
        }

        const users = await queryMany<any>(
            `SELECT 
        tu.id as tenant_user_id,
        tu.user_id,
        tu.role,
        tu.department,
        tu.cost_center,
        tu.is_active as tenant_active,
        tu.created_at as joined_at,
        u.name,
        u.email,
        u.phone,
        u.role as user_role,
        u.is_active as user_active
       FROM tenant_users tu
       JOIN users u ON u.id = tu.user_id
       WHERE tu.tenant_id = $1 AND tu.is_active = true ${roleFilter}
       ORDER BY tu.created_at DESC`,
            queryParams
        )

        return NextResponse.json({
            success: true,
            data: users,
            total: users.length,
        })

    } catch (error) {
        console.error('Error listando usuarios del tenant:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error al listar usuarios'
        }, { status: 500 })
    }
}

/**
 * POST /api/tenants/[id]/users
 * Agregar un usuario existente al tenant
 * Body: { email: string, role: string, department?: string, cost_center?: string }
 */
export async function POST(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const tenantId = parseInt(id, 10)
        if (isNaN(tenantId)) {
            return NextResponse.json({ success: false, error: 'ID de tenant inválido' }, { status: 400 })
        }

        const body = await request.json()
        const { email, user_id, role, department, cost_center } = body

        if (!role) {
            return NextResponse.json({ success: false, error: 'El rol es requerido' }, { status: 400 })
        }

        // Buscar usuario por email o ID
        let userId: number | null = user_id || null

        if (!userId && email) {
            const user = await queryOne<{ id: number }>(
                `SELECT id FROM users WHERE email = $1`,
                [email]
            )
            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: `No se encontró usuario con email: ${email}`
                }, { status: 404 })
            }
            userId = user.id
        }

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'Se requiere email o user_id'
            }, { status: 400 })
        }

        // Verificar si ya está en el tenant
        const existing = await queryOne<any>(
            `SELECT id, is_active FROM tenant_users WHERE user_id = $1 AND tenant_id = $2`,
            [userId, tenantId]
        )

        if (existing) {
            if (existing.is_active) {
                return NextResponse.json({
                    success: false,
                    error: 'Este usuario ya pertenece al tenant'
                }, { status: 409 })
            }
            // Reactivar si estaba desactivado
            await queryOne(
                `UPDATE tenant_users SET is_active = true, role = $1, department = $2, cost_center = $3 
         WHERE user_id = $4 AND tenant_id = $5`,
                [role, department || null, cost_center || null, userId, tenantId]
            )
            return NextResponse.json({
                success: true,
                message: 'Usuario reactivado en el tenant',
            })
        }

        // Agregar al tenant
        const tenantUser = await TenantService.addUserToTenant(
            userId,
            tenantId,
            role,
            { department, cost_center }
        )

        return NextResponse.json({
            success: true,
            data: tenantUser,
            message: 'Usuario agregado exitosamente al tenant',
        }, { status: 201 })

    } catch (error) {
        console.error('Error agregando usuario al tenant:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error al agregar usuario'
        }, { status: 500 })
    }
}

/**
 * DELETE /api/tenants/[id]/users
 * Quitar usuario del tenant (soft delete)
 * Body: { user_id: number }
 */
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const { id } = await params
        const tenantId = parseInt(id, 10)
        if (isNaN(tenantId)) {
            return NextResponse.json({ success: false, error: 'ID de tenant inválido' }, { status: 400 })
        }

        const body = await request.json()
        const { user_id } = body

        if (!user_id) {
            return NextResponse.json({ success: false, error: 'user_id es requerido' }, { status: 400 })
        }

        const removed = await TenantService.removeUserFromTenant(user_id, tenantId)

        if (!removed) {
            return NextResponse.json({
                success: false,
                error: 'Usuario no encontrado en este tenant'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'Usuario removido del tenant',
        })

    } catch (error) {
        console.error('Error removiendo usuario del tenant:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error al remover usuario'
        }, { status: 500 })
    }
}
