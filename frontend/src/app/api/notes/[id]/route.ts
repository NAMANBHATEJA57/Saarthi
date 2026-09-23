import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNoteById, updateNote } from '@/lib/notes/service';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const note = await getNoteById(session.user.id, id);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Failed to get note', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const PATCH = auth(async function PATCH(req, { params }: { params: Promise<{ id: string }> } | any) {
  if (!req.auth?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const data = await req.json();

    if (data.title !== undefined && data.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }

    if (data.content && data.content.length > 20000) {
      return NextResponse.json({ error: 'Content exceeds maximum limit of 20,000 characters' }, { status: 400 });
    }

    const note = await updateNote(req.auth.user.id, id, data);
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    
    return NextResponse.json({ note });
  } catch (error) {
    console.error('Failed to update note', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    // Soft delete
    const note = await updateNote(session.user.id, id, { deletedAt: new Date() });
    if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    
    return NextResponse.json({ success: true }, { status: 204 });
  } catch (error) {
    console.error('Failed to delete note', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
