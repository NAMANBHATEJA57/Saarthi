import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/today?error=NoCode', req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${new URL(req.url).origin}/api/calendar/callback`;

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code');
    }

    const data = await response.json();
    
    // Check if connection exists
    const existing = await db.select().from(calendarConnections).where(
      and(
        eq(calendarConnections.userId, session.user.id),
        eq(calendarConnections.provider, 'google')
      )
    );

    if (existing.length > 0) {
      await db.update(calendarConnections).set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || existing[0].refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
        updatedAt: new Date(),
      }).where(eq(calendarConnections.id, existing[0].id));
    } else {
      await db.insert(calendarConnections).values({
        userId: session.user.id,
        provider: 'google',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      });
    }

    return NextResponse.redirect(new URL('/today', req.url));
  } catch (error) {
    console.error('Calendar connect error:', error);
    return NextResponse.redirect(new URL('/today?error=CalendarConnectFailed', req.url));
  }
}
