/**
 * API ENDPOINT - CRON JOBS
 * Ejecuta los cron jobs de recordatorios de correo
 * 
 * Este endpoint debe ser llamado periódicamente por:
 * - Vercel Cron (vercel.json)
 * - Cron job del sistema
 * - Servicio externo como cron-job.org
 * 
 * Seguridad: Requiere un token secreto para evitar ejecuciones no autorizadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { runAllEmailCronJobs } from '@/cron/email-reminders';

export async function GET(request: NextRequest) {
    try {
        // Verificar token de autorización
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'change-me-in-production';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({
                success: false,
                error: 'No autorizado'
            }, { status: 401 });
        }

        // Ejecutar cron jobs
        console.log('🚀 Ejecutando cron jobs desde API...');
        const results = await runAllEmailCronJobs();

        return NextResponse.json({
            success: true,
            message: 'Cron jobs ejecutados exitosamente',
            results,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error ejecutando cron jobs:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 });
    }
}

// También permitir POST para mayor flexibilidad
export async function POST(request: NextRequest) {
    return GET(request);
}
