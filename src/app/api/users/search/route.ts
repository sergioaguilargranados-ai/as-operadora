// API: Buscar usuarios del sistema
// GET /api/users/search?q=email_o_nombre
// v2.313 - 11 Feb 2026

import { NextRequest, NextResponse } from 'next/server'
import { queryMany } from '@/lib/db'

/**
 * GET /api/users/search?q=texto
 * Buscar usuarios por nombre o email (para agregar a tenants)
 */
export async function GET(request: NextRequest) {
    try {
        const searchTerm = request.nextUrl.searchParams.get('q') || ''
        const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10')
        const excludeTenant = request.nextUrl.searchParams.get('exclude_tenant')

        if (searchTerm.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'Escribe al menos 2 caracteres para buscar'
            })
        }

        let excludeClause = ''
        const params: unknown[] = [`%${searchTerm}%`, `%${searchTerm}%`, limit]

        if (excludeTenant) {
            excludeClause = `AND u.id NOT IN (
        SELECT user_id FROM tenant_users 
        WHERE tenant_id = $4 AND is_active = true
      )`
            params.push(parseInt(excludeTenant))
        }

        const users = await queryMany<any>(
            `SELECT u.id, u.name, u.email, u.phone, u.role
       FROM users u
       WHERE u.is_active = true
         AND (u.email ILIKE $1 OR u.name ILIKE $2)
         ${excludeClause}
       ORDER BY u.name ASC
       LIMIT $3`,
            params
        )

        return NextResponse.json({
            success: true,
            data: users,
            total: users.length,
        })

    } catch (error) {
        console.error('Error buscando usuarios:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error al buscar usuarios'
        }, { status: 500 })
    }
}
