import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const code = 'mock_data';
    const name = 'Mock Data (Datos de Prueba)';
    const desc = 'Habilita o deshabilita los datos de prueba (mocks) cuando un proveedor falla o no tiene credenciales válidas.';
    const cat = 'sistema';
    
    await db.query(`
      INSERT INTO features (code, name, description, category, is_global_enabled, web_enabled, mobile_enabled, sort_order)
      VALUES ($1, $2, $3, $4, true, true, true, 100)
      ON CONFLICT (code) DO UPDATE SET 
        name = $2, description = $3, category = $4
    `, [code, name, desc, cat]);
    
    return NextResponse.json({ success: true, message: 'Feature mock_data created/updated successfully!' });
  } catch (error: any) {
    console.error('Error init features:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
