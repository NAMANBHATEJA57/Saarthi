import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL('/login', req.url));

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get('provider') || 'google';
  const status = searchParams.get('status');

  if (status === 'success') {
    // Mock save the connection
    await db.insert(calendarConnections).values({
      userId: session.user.id,
      provider: provider,
      accessToken: 'mock_access_token_' + Date.now(),
      email: `mockuser@${provider}.com`,
    });
  }

  return NextResponse.redirect(new URL('/settings/calendar', req.url));
}
