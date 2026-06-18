import { pool } from '../src/lib/db';

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS provider_metrics (
        id SERIAL PRIMARY KEY,
        search_type VARCHAR(50) NOT NULL,
        destination VARCHAR(50),
        provider_name VARCHAR(50) NOT NULL,
        results_found INTEGER NOT NULL,
        results_returned INTEGER NOT NULL,
        response_time_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tabla provider_metrics creada o ya existía.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

run();
