import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(request: Request) {
    try {
        // Habilitar todos los features globalmente
        const featuresResult = await pool.query(`
            UPDATE features 
            SET is_global_enabled = true, 
                web_enabled = true, 
                mobile_enabled = true
            RETURNING code;
        `);

        // Habilitar todos los accesos por rol
        const rolesResult = await pool.query(`
            UPDATE feature_role_access 
            SET web_enabled = true, 
                mobile_enabled = true
        `);

        return NextResponse.json({
            success: true,
            message: 'Todas las banderas de funcionalidades han sido activadas en la base de datos.',
            features_updated: featuresResult.rowCount,
            roles_updated: rolesResult.rowCount,
            codes: featuresResult.rows.map(r => r.code)
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
