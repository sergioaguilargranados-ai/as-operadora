import { config } from 'dotenv';
config({ path: '.env.local' });
import { AmadeusFlightProvider } from './src/services/providers/amadeus/AmadeusFlightProvider';

async function test() {
  const provider = new AmadeusFlightProvider();
  console.log('Testing Amadeus with API KEY:', !!process.env.AMADEUS_API_KEY);
  const result = await provider.buscarVuelos({
    origenIata: 'MEX',
    destinoIata: 'CUN',
    fechaSalida: '2026-07-15',
    pasajeros: { adultos: 1, ninos: 0, bebes: 0 }
  });
  console.log(JSON.stringify(result, null, 2));
}

test().catch(console.error);
