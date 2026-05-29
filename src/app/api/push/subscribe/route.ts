import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    
    const body = await req.json();
    const { subscription, platform = 'web', deviceName = 'PWA Browser' } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Convert subscription object to string to store it as the token
    const tokenString = JSON.stringify(subscription);

    // Upsert into device_tokens
    // If the token already exists, update its last_used_at and user_id
    if (userId) {
      await db.query(`
        INSERT INTO device_tokens (user_id, device_token, platform, device_name, is_active, last_used_at)
        VALUES ($1, $2, $3, $4, true, NOW())
        ON CONFLICT (user_id, device_token) 
        DO UPDATE SET is_active = true, last_used_at = NOW(), device_name = $4
      `, [userId, tokenString, platform, deviceName]);
    } else {
      // For anonymous users, we might not have a UNIQUE constraint without user_id, 
      // but let's just insert it if it doesn't exist for any user
      const existing = await db.query(`SELECT id FROM device_tokens WHERE device_token = $1`, [tokenString]);
      if (existing.rows.length === 0) {
         await db.query(`
           INSERT INTO device_tokens (device_token, platform, device_name, is_active, last_used_at)
           VALUES ($1, $2, $3, true, NOW())
         `, [tokenString, platform, deviceName]);
      } else {
         await db.query(`
           UPDATE device_tokens SET is_active = true, last_used_at = NOW() WHERE device_token = $1
         `, [tokenString]);
      }
    }

    return NextResponse.json({ success: true, message: 'Subscription saved' });
  } catch (error: any) {
    console.error('[PUSH_SUBSCRIBE_ERROR]', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
