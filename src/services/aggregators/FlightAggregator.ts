// Build: 03 Jun 2026 - 16:30 CST - v2.342

import { DuffelAdapter } from '../providers/duffel/DuffelAdapter';
import { IProveedorVuelo, ParametrosBusquedaVuelo, RespuestaBusqueda } from '@/types/providers';
import { VueloUnificado } from '@/types/unified-travel';
import { query } from '@/lib/db';

export class FlightAggregator {
  private proveedores: IProveedorVuelo[] = [];

  constructor() {
    // Inicializar y registrar los proveedores disponibles
    this.proveedores.push(new DuffelAdapter());
    // En el futuro: this.proveedores.push(new AmadeusAdapter());
  }

  /**
   * Ejecuta la búsqueda de vuelos en todos los proveedores registrados de manera paralela.
   * Luego fusiona y ordena los resultados.
   */
  async buscarVuelos(params: ParametrosBusquedaVuelo): Promise<RespuestaBusqueda<VueloUnificado>> {
    const inicio = Date.now();

    try {
      // 1. Lanzar peticiones en paralelo a todos los proveedores
      const promesas = this.proveedores.map(proveedor => proveedor.buscarVuelos(params));
      const respuestas = await Promise.allSettled(promesas);

      let todosLosVuelos: VueloUnificado[] = [];
      const errores: string[] = [];
      const proveedoresExitosos: string[] = [];

      // 2. Recolectar resultados y loguear metricas
      respuestas.forEach((resultado, index) => {
        const nombreProveedor = this.proveedores[index].nombreProveedor;

        if (resultado.status === 'fulfilled' && resultado.value.exito) {
          const cantidadLeidos = resultado.value.resultados.length;
          todosLosVuelos = todosLosVuelos.concat(resultado.value.resultados);
          proveedoresExitosos.push(nombreProveedor);
          if (resultado.value.errores) errores.push(...resultado.value.errores);

          // Log metrics en BD de forma asíncrona sin bloquear la respuesta
          query(`
            INSERT INTO provider_metrics (search_type, destination, provider_name, results_found, results_returned, response_time_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            'flight',
            params.destinos[0]?.codigo || 'UNKNOWN',
            nombreProveedor,
            cantidadLeidos, // results_found
            cantidadLeidos, // results_returned (se asume igual por ahora)
            Date.now() - inicio
          ]).catch(e => console.error('[Metrics] Error:', e));

        } else {
          // Si falló a nivel de promesa o la API retornó exito=false
          const msg = resultado.status === 'rejected' ? resultado.reason : (resultado.value.errores?.join(', ') || 'Error desconocido');
          errores.push(`[${nombreProveedor}] ${msg}`);
          
          query(`
            INSERT INTO provider_metrics (search_type, destination, provider_name, results_found, results_returned, response_time_ms)
            VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            'flight',
            params.destinos[0]?.codigo || 'UNKNOWN',
            nombreProveedor,
            0,
            0,
            Date.now() - inicio
          ]).catch(e => console.error('[Metrics] Error:', e));
        }
      });

      // 3. Ordenar resultados por precio (de menor a mayor)
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
