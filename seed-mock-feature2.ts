import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

import { db } from './src/lib/db';

async function main() {
  const code = 'mock_data';
  const name = 'Mock Data (Datos de Prueba)';
  const desc = 'Habilita o deshabilita los datos de prueba (mocks) cuando un proveedor falla o no tiene credenciales válidas.';
  const cat = 'Development';
  
  await db.query(`
    INSERT INTO features (code, name, description, category, is_global_enabled, web_enabled, mobile_enabled, sort_order)
    VALUES ($1, $2, $3, $4, true, true, true, 100)
    ON CONFLICT (code) DO UPDATE SET 
      name = $2, description = $3, category = $4
  `, [code, name, desc, cat]);
  
  console.log('Feature mock_data created/updated successfully!');
  process.exit(0);
}

main().catch(console.error);
