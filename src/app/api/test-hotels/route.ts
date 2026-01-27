
import { NextResponse } from 'next/server';
import { SearchService } from '@/services/SearchService';

export async function GET() {
    const searchService = new SearchService();

    const params = {
        city: 'Cancun',
        checkInDate: '2026-02-01',
        checkOutDate: '2026-02-05',
        adults: 2,
        rooms: 1
    };

    try {
        console.log('🧪 API TEST: Iniciando búsqueda...');
        const results = await searchService.searchHotels(params);

        return NextResponse.json({
            success: true,
            count: results.length,
            sample: results.length > 0 ? results[0] : null,
            logs: 'Revisar consola del servidor para logs detallados'
        });
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
