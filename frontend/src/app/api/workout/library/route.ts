import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutExerciseLibrary } from '@/lib/db/schema';
import { eq, ilike, or, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { searchOnlineExercises } from '@/lib/workout/onlineDataset';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const muscle = searchParams.get('muscle') || '';
    const equipment = searchParams.get('equipment') || '';
    const search = searchParams.get('search') || '';

    // 1. Fetch filtered exercises from online dataset (cached in-memory)
    const onlineExercises = await searchOnlineExercises({
      query: search,
      muscle,
      equipment,
      limit: 80,
    });

    // 2. Query any custom exercises created by this user in their DB
    const customConditions = [eq(workoutExerciseLibrary.userId, session.user.id)];
    if (muscle) {
      customConditions.push(ilike(workoutExerciseLibrary.muscle, `%${muscle}%`));
    }
    if (search) {
      customConditions.push(ilike(workoutExerciseLibrary.name, `%${search}%`));
    }

    const customExercises = await db
      .select()
      .from(workoutExerciseLibrary)
      .where(and(...customConditions))
      .limit(20);

    // 3. Merge custom exercises first, then online exercises
    const combined = [...customExercises, ...onlineExercises];

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Failed to fetch exercise library:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

