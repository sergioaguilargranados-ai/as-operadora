// Build: 18 Jun 2026
// Mapeador de destinos para convertir códigos genéricos (ej. IATA) a IDs específicos de proveedores

import { pool } from '@/lib/db';

export interface DestinoMapeado {
    query: string;
    iata: string;
    hotelbeds_code: string;
    ratehawk_id: string | null;
}

export class DestinationMapper {
    /**
     * Resuelve un término de búsqueda (ej. "CUN" o "Cancun") a los códigos de cada proveedor
     */
    static async resolve(query: string): Promise<DestinoMapeado> {
        const q = query.trim().toUpperCase();

        // Si es un número puro, asumimos que el usuario escribió directamente un ID de RateHawk (útil para pruebas)
        if (/^\d+$/.test(q)) {
            return {
                query: q,
                iata: q.substring(0, 3), // Fallback irreal
                hotelbeds_code: '', // Hotelbeds no usa números
                ratehawk_id: q
            };
        }

        // Mapeo estático temporal (hasta que tengamos el Content API completamente poblado en Fase 9)
        const staticMap: Record<string, DestinoMapeado> = {
            'CUN': { query: 'CUN', iata: 'CUN', hotelbeds_code: 'CUN', ratehawk_id: '12345' }, // Mock Ratehawk id for CUN
            'CANCUN': { query: 'CANCUN', iata: 'CUN', hotelbeds_code: 'CUN', ratehawk_id: '12345' },
            'MEX': { query: 'MEX', iata: 'MEX', hotelbeds_code: 'MEX', ratehawk_id: '12346' },
            'GDL': { query: 'GDL', iata: 'GDL', hotelbeds_code: 'GDL', ratehawk_id: '12347' },
            'PMI': { query: 'PMI', iata: 'PMI', hotelbeds_code: 'PMI', ratehawk_id: '12348' },
        };

        if (staticMap[q]) {
            return staticMap[q];
        }

        // Por defecto, asumimos que el query es un IATA code de 3 letras que Hotelbeds puede entender
        // Ratehawk fallará silenciosamente si no tiene un ID numérico, gracias a su Adapter
        return {
            query: q,
            iata: q,
            hotelbeds_code: q.substring(0, 3),
            ratehawk_id: null
        };
    }
}
