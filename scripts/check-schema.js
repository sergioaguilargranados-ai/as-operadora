require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

async function checkSchema() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'megatravel_packages' 
      ORDER BY ordinal_position
    `)

        console.log('\n📋 ESTRUCTURA DE megatravel_packages:')
        console.log('=====================================')
        result.rows.forEach(col => {
            console.log(`${col.column_name}: ${col.data_type}`)
        })

        // Contar tours
        const count = await pool.query('SELECT COUNT(*) as total FROM megatravel_packages')
        console.log(`\n📊 Total de tours: ${count.rows[0].total}`)

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await pool.end()
    }
}

checkSchema()
