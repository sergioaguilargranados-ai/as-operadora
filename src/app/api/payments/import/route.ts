import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bookings, tenantId } = body

    if (!Array.isArray(bookings) || bookings.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay datos para importar' }, { status: 400 })
    }

    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID es requerido' }, { status: 400 })
    }

    const tenant = parseInt(tenantId)

    // Simulate import processing
    const results = []
    
    for (const record of bookings) {
      // 1. Check or Create User by email (mock logic)
      let userId = 1 // default user
      if (record.user_email) {
        const userRes = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', [record.user_email])
        if ((userRes as any).rows?.length > 0) {
          userId = (userRes as any).rows[0].id
        } else {
          // In a real app we'd insert the user, but for now we'll just insert a dummy user
          const insertUser = await query(
            'INSERT INTO users (tenant_id, name, email, role, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [tenant, record.user_name || 'Imported User', record.user_email, 'client', 'active']
          )
          userId = (insertUser as any).rows[0].id
        }
      }

      // 2. Insert into bookings if not exists
      let bookingId = record.booking_id
      if (!bookingId) {
        // Create mock booking
        const bType = record.megatravel_id ? 'tour' : 'general'
        const insertBooking = await query(
          'INSERT INTO bookings (tenant_id, user_id, booking_type, status, total_amount, metadata) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
          [tenant, userId, bType, 'confirmed', parseFloat(record.amount) || 0, JSON.stringify({ megatravel_id: record.megatravel_id })]
        )
        bookingId = (insertBooking as any).rows[0].id
      }

      // 3. Insert into payment_transactions
      const insertPayment = await query(
        `INSERT INTO payment_transactions 
        (tenant_id, user_id, booking_id, amount, currency, status, payment_method, transaction_id, created_at, paid_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9) RETURNING id`,
        [
          tenant,
          userId,
          bookingId,
          parseFloat(record.amount) || 0,
          record.currency || 'MXN',
          record.status || 'completed',
          record.payment_method || 'transfer',
          `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          record.status === 'completed' ? new Date() : null
        ]
      )

      results.push({ bookingId, paymentId: (insertPayment as any).rows[0].id })
    }

    return NextResponse.json({
      success: true,
      message: `Se importaron ${results.length} reservas exitosamente`,
      data: results
    })

  } catch (error: any) {
    console.error('Error importing bookings:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
