import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutExerciseLibrary } from '@/lib/db/schema';
import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const muscle = searchParams.get('muscle');
    const search = searchParams.get('search');

    const conditions = [];

    // Only allow public/system exercises (userId IS NULL) or the user's own exercises
    conditions.push(or(
      eq(workoutExerciseLibrary.userId, session.user.id),
      sql`user_id IS NULL`
    ));

    if (muscle) {
      conditions.push(eq(workoutExerciseLibrary.muscle, muscle));
    }
    
    if (search) {
      conditions.push(ilike(workoutExerciseLibrary.name, `%${search}%`));
    }
    
    const exercises = await db
      .select()
      .from(workoutExerciseLibrary)
      .where(and(...conditions))
      .orderBy(workoutExerciseLibrary.name)
      .limit(100); // Limit to prevent massive payloads if no filter is applied

    return NextResponse.json(exercises);
  } catch (error) {
    console.error('Failed to fetch exercise library:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
