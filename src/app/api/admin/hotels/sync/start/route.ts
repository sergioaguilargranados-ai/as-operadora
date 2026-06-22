import { NextResponse } from 'next/server';
import { verifyToken } from '@/services/AuthService';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(decoded.role)) {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    // Consultamos cuántos hoteles reales faltan de imagen
    const countRes = await db.query(`SELECT COUNT(*) as total FROM hotels WHERE image_url IS NULL`);
    const totalHotels = parseInt(countRes.rows[0].total) || 0;
    
    const batchSize = 50;
    // Si no hay hoteles por actualizar, devolvemos 0 lotes. Minimo 1 si hay algo.
    const totalBatches = totalHotels === 0 ? 0 : Math.ceil(totalHotels / batchSize);

    return NextResponse.json({ 
      success: true, 
      total: totalHotels, 
      batchSize,
      totalBatches,
      message: 'Descubrimiento completado.'
    });
  } catch (error) {
    console.error('Error starting hotel sync:', error);
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 });
  }
}
