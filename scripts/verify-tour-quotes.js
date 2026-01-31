// Script para verificar tabla tour_quotes en Neon
require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
})

async function verifyTable() {
    const client = await pool.connect()

    try {
        console.log('🔍 Verificando tabla tour_quotes en Neon...\n')

        // Verificar si existe la tabla
        const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tour_quotes'
      );
    `)

        if (!checkTable.rows[0].exists) {
            console.log('❌ La tabla tour_quotes NO existe. Ejecutando migración...\n')

            const fs = require('fs')
            const path = require('path')
            const sqlPath = path.join(__dirname, '..', 'migrations', '016_create_tour_quotes_table.sql')
            const sql = fs.readFileSync(sqlPath, 'utf8')

            await client.query('BEGIN')
            await client.query(sql)
            await client.query('COMMIT')

            console.log('✅ Migración ejecutada exitosamente\n')
        } else {
            console.log('✅ La tabla tour_quotes ya existe\n')
        }

        // Verificar estructura
        const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'tour_quotes'
      ORDER BY ordinal_position
    `)

        console.log('📋 Estructura de la tabla:')
        console.log('─'.repeat(80))
        structure.rows.forEach(col => {
            console.log(`  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
        })
        console.log('─'.repeat(80))
        console.log(`\n✅ Total de columnas: ${structure.rows.length}`)

        // Verificar índices
        const indexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'tour_quotes'
    `)

        console.log('\n📊 Índices:')
        console.log('─'.repeat(80))
        indexes.rows.forEach(idx => {
            console.log(`  ${idx.indexname}`)
        })
        console.log('─'.repeat(80))
        console.log(`\n✅ Total de índices: ${indexes.rows.length}`)

        // Contar registros
        const count = await client.query('SELECT COUNT(*) FROM tour_quotes')
        console.log(`\n📊 Registros actuales: ${count.rows[0].count}`)

    } catch (error) {
        console.error('❌ Error:', error.message)
        throw error
    } finally {
        client.release()
        await pool.end()
    }
}

verifyTable()
    .then(() => {
        console.log('\n🎉 Verificación completada')
        process.exit(0)
    })
    .catch((error) => {
        console.error('\n💥 Error fatal:', error)
        process.exit(1)
    })
