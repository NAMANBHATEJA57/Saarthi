import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WorkoutService } from '@/lib/workouts/service';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const { localDate, routineId } = await req.json();
    if (!localDate) return new NextResponse('Missing localDate', { status: 400 });

    const workoutSession = await WorkoutService.startSession(session.user.id, localDate, routineId);
    return NextResponse.json(workoutSession);
  } catch (error) {
    console.error('Start Session API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
