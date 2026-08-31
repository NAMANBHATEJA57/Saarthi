import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOpenTasks, getCompletedTasks, createTask } from '@/lib/tasks/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  try {
    if (type === 'completed') {
      const tasks = await getCompletedTasks(session.user.id);
      return NextResponse.json({ tasks });
    } else {
      const tasks = await getOpenTasks(session.user.id);
      return NextResponse.json({ tasks });
    }
  } catch (error) {
    console.error('Failed to get tasks', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    if (!data.title || data.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const task = await createTask(session.user.id, data);
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to create task', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
