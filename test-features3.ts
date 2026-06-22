import 'dotenv/config';
import { db } from './src/lib/db';

async function main() {
  const res = await db.query('SELECT code, name FROM features');
  console.log(res.rows);
  process.exit(0);
}

main().catch(console.error);
