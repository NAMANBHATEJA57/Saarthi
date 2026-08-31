import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { calendarConnections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const connections = await db.select().from(calendarConnections).where(eq(calendarConnections.userId, session.user.id));
    return NextResponse.json({ accounts: connections });
  } catch (error) {
    console.error('Failed to get calendar accounts', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
