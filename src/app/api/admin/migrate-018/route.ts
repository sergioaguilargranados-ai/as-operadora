import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
    try {
        await query('ALTER TABLE tour_quotes ADD COLUMN IF NOT EXISTS included_items TEXT')
        await query('CREATE SEQUENCE IF NOT EXISTS tour_quote_folio_seq START 1 INCREMENT 1')
        return NextResponse.json({ success: true, message: 'Migración 018 ejecutada' })
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
