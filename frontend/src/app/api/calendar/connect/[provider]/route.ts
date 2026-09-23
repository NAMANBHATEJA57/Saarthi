import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL('/login', req.url));

  const { provider } = await params;

  // MVP: We'll just simulate a successful connection for now since actual OAuth requires registered Client IDs and Secrets.
  // In a real implementation, this would redirect to Google/Microsoft OAuth consent screens.
  
  // For the sake of the MVP and UI completion, we will redirect back with a mock "success" parameter 
  // that a callback route can pick up and save into `calendarConnections`.
  
  // Simulated redirect to our callback route:
  const callbackUrl = new URL(`/api/calendar/callback?provider=${provider}&status=success`, req.url);
  return NextResponse.redirect(callbackUrl);
}
