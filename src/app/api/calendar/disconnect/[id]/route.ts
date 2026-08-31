import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL('/login', req.url));

  const { id } = await context.params;

  await db.delete(calendarConnections).where(
    and(
      eq(calendarConnections.id, id),
      eq(calendarConnections.userId, session.user.id)
    )
  );

  return NextResponse.redirect(new URL('/settings/calendar', req.url));
}
