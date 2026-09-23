import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const existing = await db.select().from(calendarConnections).where(
      and(
        eq(calendarConnections.userId, session.user.id),
        eq(calendarConnections.provider, 'google')
      )
    ).limit(1);

    if (existing.length > 0) {
      if (existing[0].accessToken) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${existing[0].accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }).catch(e => console.error('Failed to revoke on Google side:', e));
      }
      
      await db.delete(calendarConnections).where(eq(calendarConnections.id, existing[0].id));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Calendar disconnect error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
