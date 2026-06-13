import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendLandingWelcomeEmail } from '@/lib/emailHelper';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      fullName, 
      email, 
      phone, 
      company, 
      type 
    } = body;
    
    if (!fullName || !email) {
      return NextResponse.json({ success: false, error: 'El nombre y correo son requeridos' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO crm_contacts (
        full_name, 
        email, 
        phone, 
        company, 
        contact_type,
        source,
        source_detail
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [fullName, email, phone, company, 'lead', 'landing_principal', type]
    );

    // Send Welcome Email
    await sendLandingWelcomeEmail({
      name: fullName,
      email: email
    });

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('Error saving landing lead:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
