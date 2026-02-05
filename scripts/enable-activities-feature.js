// Script para habilitar feature SEARCH_ACTIVITIES
const { Client } = require('pg')

const client = new Client({
    connectionString: 'postgresql://neondb_owner:npg_rsdKEkaw1ZS2@ep-bold-hill-afbis0wk-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
})

async function enableActivitiesFeature() {
    try {
        await client.connect()
        console.log('✅ Conectado a Neon')

        // Habilitar feature
        const update = await client.query(`
      UPDATE features 
      SET is_global_enabled = true, 
          web_enabled = true, 
          mobile_enabled = true,
          updated_at = NOW()
      WHERE code = 'SEARCH_ACTIVITIES'
      RETURNING code, name, is_global_enabled, web_enabled, mobile_enabled
    `)

        console.log('✅ Feature SEARCH_ACTIVITIES habilitada:', update.rows[0])

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await client.end()
    }
}

enableActivitiesFeature()
