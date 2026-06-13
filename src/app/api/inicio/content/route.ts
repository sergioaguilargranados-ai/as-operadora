import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query('SELECT * FROM expo_landing_content LIMIT 1');
    if (result.rows.length === 0) {
      return NextResponse.json({ success: true, data: null });
    }
    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { hero_title, hero_subtitle, hero_video_url, sections_json } = body;
    
    // Check if exists
    const check = await query('SELECT id FROM expo_landing_content LIMIT 1');
    
    if (check.rows.length === 0) {
      await query(
        `INSERT INTO expo_landing_content (hero_title, hero_subtitle, hero_video_url, sections_json) 
         VALUES ($1, $2, $3, $4)`,
        [hero_title, hero_subtitle, hero_video_url, JSON.stringify(sections_json)]
      );
    } else {
      await query(
        `UPDATE expo_landing_content 
         SET hero_title = $1, hero_subtitle = $2, hero_video_url = $3, sections_json = $4
         WHERE id = $5`,
        [hero_title, hero_subtitle, hero_video_url, JSON.stringify(sections_json), check.rows[0].id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
