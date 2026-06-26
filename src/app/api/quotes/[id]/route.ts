import { NextRequest, NextResponse } from 'next/server'
import { query as dbQuery } from '@/lib/db'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 })
    }

    // Verificar primero si existe la cotización en tour_quotes (por la convención de IDs compuestos que a veces se usa)
    // Pero asumiendo que el quote.source === 'general' usa la tabla `quotes`
    // Si la cotización viene de tour_quotes, habría que adaptar, pero usaremos el borrado en ambas por seguridad.

    // Intentar borrar en quotes generales
    const deleteGeneral = await dbQuery('DELETE FROM quotes WHERE id = $1 RETURNING id', [id])
    
    if (deleteGeneral.rowCount === 0) {
      // Intentar borrar en tour_quotes
      const deleteTour = await dbQuery('DELETE FROM tour_quotes WHERE id = $1 RETURNING id', [id])
      if (deleteTour.rowCount === 0) {
        return NextResponse.json({ success: false, error: 'Cotización no encontrada' }, { status: 404 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cotización eliminada exitosamente'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
