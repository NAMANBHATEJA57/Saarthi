import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WorkoutService } from '@/lib/workouts/service';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const { sessionId, action, setPayload } = body;

    if (!sessionId) return new NextResponse('Missing sessionId', { status: 400 });

    if (action === 'finish') {
      const finishedSession = await WorkoutService.finishSession(sessionId);
      return NextResponse.json(finishedSession);
    } else if (action === 'logSet' && setPayload) {
      const set = await WorkoutService.logSet({
        sessionId,
        exerciseLibraryId: setPayload.exerciseLibraryId,
        routineExerciseId: setPayload.routineExerciseId,
        setNumber: setPayload.setNumber,
        weight: setPayload.weight,
        reps: setPayload.reps,
        durationSeconds: setPayload.durationSeconds,
      });
      return NextResponse.json(set);
    } else {
      return new NextResponse('Invalid action or missing payload', { status: 400 });
    }
  } catch (error) {
    console.error('Workout action API error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
