import { NextRequest, NextResponse } from 'next/server';
import { FlightAggregator } from '@/services/aggregators/FlightAggregator';
import { VueloUnificado } from '@/types/unified-travel';

// Mapper to adapt Unified Model to the Legacy Frontend format
function mapToFrontendFlight(vuelo: VueloUnificado, adults: number) {
  const ida = vuelo.itinerarios[0];
  const numSegmentos = ida.segmentos.length;
  const primerSegmento = ida.segmentos[0];
  const ultimoSegmento = ida.segmentos[numSegmentos - 1];

  const departureDateObj = new Date(primerSegmento.fechaSalida);
  const arrivalDateObj = new Date(ultimoSegmento.fechaLlegada);

  const stops = numSegmentos - 1;

  // Extraer precio por persona asumiendo partes iguales
  const pricePerPerson = vuelo.precioTotal / (adults || 1);

  return {
    id: vuelo.id,
    airline: primerSegmento.aerolinea.nombre || primerSegmento.aerolinea.iataCode,
    logo: primerSegmento.aerolinea.logoUrl || `https://pics.avs.io/200/200/${primerSegmento.aerolinea.iataCode}.png`,
    flightNumber: primerSegmento.numeroVuelo,
    origin: primerSegmento.origen.iataCode,
    destination: ultimoSegmento.destino.iataCode,
    departureDate: departureDateObj.toISOString().split('T')[0],
    departureTime: departureDateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    arrivalTime: arrivalDateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    duration: `${Math.floor(ida.duracionMinutos / 60)}h ${ida.duracionMinutos % 60}m`,
    stops,
    stopsInfo: stops > 0 ? `${stops} escala${stops > 1 ? 's' : ''}` : 'Directo',
    price: vuelo.precioTotal,
    pricePerPerson,
    currency: vuelo.moneda,
    cabinClass: primerSegmento.claseCabina,
    seatsAvailable: 9, // Dummy if not provided
    baggage: {
      carryOn: 'Incluido',
      checked: 'Consulta detalles'
    },
    amenities: ['Comida', 'Entretenimiento'],
    provider: vuelo.proveedor,
    tarifa: 'Standard'
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const origin = searchParams.get('origin') || 'MEX';
    const destination = searchParams.get('destination') || 'CUN';
    const date = searchParams.get('date') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const adults = parseInt(searchParams.get('adults') || '1');
    const returnDate = searchParams.get('returnDate');
    const cabinClass = searchParams.get('cabinClass') || 'economy';

    const cleanOrigin = origin.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const cleanDestination = destination.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').substring(0, 3).toUpperCase();

    // Invocar al Agregador
    const aggregator = new FlightAggregator();
    
    // Vuelos de Ida
    const outboundResult = await aggregator.buscarVuelos({
      origen: cleanOrigin,
      destino: cleanDestination,
      fechaSalida: date,
      pasajeros: [{ tipo: 'adult', cantidad: adults }],
      claseCabina: cabinClass as any
    });

    const outboundFlights = outboundResult.resultados.map(v => mapToFrontendFlight(v, adults));

    // Vuelos de Regreso
    let returnFlights: any[] = [];
    if (returnDate) {
      const returnResult = await aggregator.buscarVuelos({
        origen: cleanDestination,
        destino: cleanOrigin,
        fechaSalida: returnDate,
        pasajeros: [{ tipo: 'adult', cantidad: adults }],
        claseCabina: cabinClass as any
      });
      returnFlights = returnResult.resultados.map(v => mapToFrontendFlight(v, adults));
    }

    return NextResponse.json({
      success: true,
      data: {
        outbound: outboundFlights,
        return: returnFlights
      },
      searchParams: {
        origin: cleanOrigin,
        destination: cleanDestination,
        date,
        returnDate,
        adults,
        cabinClass
      },
      count: outboundFlights.length,
      provider: outboundResult.proveedorInfo
    });

  } catch (error: any) {
    console.error('Error searching flights via Aggregator:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al buscar vuelos'
    }, { status: 500 });
  }
}
