import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import webpush from 'web-push';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:soporte@asoperadora.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('VAPID keys not fully configured for Web Push!');
}

export async function POST(req: NextRequest) {
  try {
    // Only ADMIN or SYSTEM should be able to trigger this
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, url = '/', icon = '/icons/icon-192x192.png', targetUserId } = body;

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url,
      icon,
      tag: 'as-operadora-push'
    });

    let query = `SELECT id, device_token FROM device_tokens WHERE is_active = true`;
    const queryParams: any[] = [];

    if (targetUserId) {
      query += ` AND user_id = $1`;
      queryParams.push(targetUserId);
    }

    const tokens = await db.query(query, queryParams);
    
    if (tokens.rows.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'No active subscribers found' });
    }

    let successCount = 0;
    let failureCount = 0;

    // Send notifications in parallel batches
    const promises = tokens.rows.map(async (row) => {
      try {
        const subscription = JSON.parse(row.device_token);
        await webpush.sendNotification(subscription, payload);
        successCount++;
      } catch (err: any) {
        failureCount++;
        // If subscription is invalid/expired (HTTP 410 or 404), mark it as inactive
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.query(`UPDATE device_tokens SET is_active = false WHERE id = $1`, [row.id]);
        } else {
          console.error(`[PUSH_ERROR] Failed to send to token ID ${row.id}:`, err);
        }
      }
    });

    await Promise.allSettled(promises);

    return NextResponse.json({ 
      success: true, 
      sent: successCount, 
      failed: failureCount,
      total: tokens.rows.length 
    });

  } catch (error: any) {
    console.error('[PUSH_SEND_ERROR]', error);
    return NextResponse.json({ error: 'Failed to dispatch push notifications' }, { status: 500 });
  }
}
