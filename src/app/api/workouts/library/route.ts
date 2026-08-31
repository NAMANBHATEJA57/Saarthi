import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WorkoutLibraryService } from '@/lib/workout/libraryService';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('search') || '';

  try {
    const exercises = await WorkoutLibraryService.search(query, session.user.id);
    return NextResponse.json({ exercises });
  } catch (error) {
    console.error('Failed to search exercises', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const exercise = await WorkoutLibraryService.addCustomExercise(session.user.id, data);
    return NextResponse.json({ exercise });
  } catch (error) {
    console.error('Failed to add custom exercise', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
