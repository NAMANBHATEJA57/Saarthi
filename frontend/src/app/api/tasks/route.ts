import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getOpenTasks, getCompletedTasks, createTask, updateTask } from '@/lib/tasks/service';
import { pushEventToGoogleCalendar } from '@/lib/calendar/service';

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

    let task = await createTask(session.user.id, data);

    if (data.externalAccountId) {
      try {
        const { eventId, provider } = await pushEventToGoogleCalendar(data.externalAccountId, data);
        task = await updateTask(session.user.id, task.id, {
          externalEventId: eventId,
          externalProvider: provider,
          externalAccountId: data.externalAccountId,
        });
      } catch (calendarErr) {
        console.error('Failed to push task to calendar', calendarErr);
        // We still created the local task, so we don't throw a 500 here, 
        // just log the error and return the local task.
      }
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to create task', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
