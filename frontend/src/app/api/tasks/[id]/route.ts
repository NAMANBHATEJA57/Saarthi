import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { updateTask } from '@/lib/tasks/service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const data = await req.json();
    
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date().toISOString();
    } else if (data.status === 'todo' || data.status === 'in_progress') {
      data.completedAt = null;
    }

    const task = await updateTask(session.user.id, id, data);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    
    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to update task', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    // Soft delete
    const task = await updateTask(session.user.id, id, { deletedAt: new Date() } as any);
    if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete task', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
