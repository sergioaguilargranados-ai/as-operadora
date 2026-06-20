// Build: 03 Jun 2026 - 16:30 CST - v2.342

import { DuffelAdapter } from '../providers/duffel/DuffelAdapter';
import { AmadeusFlightProvider } from '../providers/amadeus/AmadeusFlightProvider';
import { IProveedorVuelo, ParametrosBusquedaVuelo, RespuestaBusqueda } from '@/types/providers';
import { VueloUnificado } from '@/types/unified-travel';
import { query } from '@/lib/db';

export class FlightAggregator {
  private proveedores: IProveedorVuelo[] = [];

  constructor() {
    // Inicializar y registrar los proveedores disponibles
    this.proveedores.push(new DuffelAdapter());
    this.proveedores.push(new AmadeusFlightProvider());
  }

  /**
   * Ejecuta la búsqueda de vuelos en todos los proveedores registrados de manera paralela.
   * Luego fusiona y ordena los resultados.
   */
  async buscarVuelos(params: ParametrosBusquedaVuelo): Promise<RespuestaBusqueda<VueloUnificado>> {
    const inicio = Date.now();

    try {
      const FeatureService = (await import('@/services/FeatureService')).default;

      // 1. Validar qué proveedores están activos según la BD
      const proveedoresActivos = [];
      for (const prov of this.proveedores) {
        // Asume feature_code = 'API_AMADEUS' o 'API_DUFFEL'
        const featureCode = `API_${prov.nombreProveedor.toUpperCase()}`;
        const isEnabled = await FeatureService.isFeatureEnabled(featureCode, 'USER');
        
        // Default to true in case the feature flag doesn't exist yet, 
        // to not break backwards compatibility until they are fully set up
        if (isEnabled !== false) { 
          proveedoresActivos.push(prov);
        }
      }

      if (proveedoresActivos.length === 0) {
         return {
           exito: false,
           resultados: [],
           proveedorInfo: 'agregador',
           errores: ['No hay proveedores de vuelos activos.'],
           tiempoRespuestaMs: Date.now() - inicio
         };
      }

      // 2. Lanzar peticiones en paralelo a todos los proveedores activos
      const promesas = proveedoresActivos.map(proveedor => proveedor.buscarVuelos(params));
      const respuestas = await Promise.allSettled(promesas);

      let todosLosVuelos: VueloUnificado[] = [];
      const errores: string[] = [];
      const proveedoresExitosos: string[] = [];
      const metricasPromesas: Promise<any>[] = [];

      // 3. Recolectar resultados y loguear metricas
      respuestas.forEach((resultado, index) => {
        const nombreProveedor = proveedoresActivos[index].nombreProveedor;

        if (resultado.status === 'fulfilled' && resultado.value.exito) {
          const cantidadLeidos = resultado.value.resultados.length;
          todosLosVuelos = todosLosVuelos.concat(resultado.value.resultados);
          proveedoresExitosos.push(nombreProveedor);
          if (resultado.value.errores) errores.push(...resultado.value.errores);

          // Log metrics en BD
          metricasPromesas.push(query(`
            INSERT INTO provider_metrics (provider_name, service_type, response_time_ms, results_count, success)
            VALUES ($1, $2, $3, $4, true)
          `, [
            nombreProveedor,
            'vuelos',
            Date.now() - inicio,
            cantidadLeidos
          ]).catch(e => console.error('[Metrics] Error:', e)));

        } else {
          // Si falló a nivel de promesa o la API retornó exito=false
          const msg = resultado.status === 'rejected' ? String(resultado.reason) : (resultado.value.errores?.join(', ') || 'Error desconocido');
          errores.push(`[${nombreProveedor}] ${msg}`);
          
          metricasPromesas.push(query(`
            INSERT INTO provider_metrics (provider_name, service_type, response_time_ms, results_count, success, error_message)
            VALUES ($1, $2, $3, $4, false, $5)
          `, [
            nombreProveedor,
            'vuelos',
            Date.now() - inicio,
            0,
            msg.substring(0, 500)
          ]).catch(e => console.error('[Metrics] Error:', e)));
        }
      });

      // Esperar a que se inserten las métricas antes de retornar
      await Promise.allSettled(metricasPromesas);

      // 4. Ordenar resultados por precio (de menor a mayor)
      todosLosVuelos.sort((a, b) => a.precioTotal - b.precioTotal);

      return {
        exito: todosLosVuelos.length > 0 || errores.length === 0,
        resultados: todosLosVuelos,
        proveedorInfo: proveedoresExitosos.join(', '),
        errores: errores.length > 0 ? errores : undefined,
        tiempoRespuestaMs: Date.now() - inicio
      };

    } catch (error: any) {
      console.error('[FlightAggregator] Error inesperado:', error);
      return {
        exito: false,
        resultados: [],
        proveedorInfo: 'agregador',
        errores: [error.message || 'Error general en el agregador'],
        tiempoRespuestaMs: Date.now() - inicio
      };
    }
  }
}
