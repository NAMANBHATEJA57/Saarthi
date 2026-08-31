import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getNotes, createNote } from '@/lib/notes/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const items = await getNotes(session.user.id);
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to get notes', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = auth(async function POST(req) {
  if (!req.auth?.user?.id) {
    console.error('Notes API Unauthorized. Auth:', req.auth);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    if (!data.title || data.title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Add size guard
    if (data.content && data.content.length > 20000) {
      return NextResponse.json({ error: 'Content exceeds maximum limit of 20,000 characters' }, { status: 400 });
    }

    const note = await createNote(req.auth.user.id, data);
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('Failed to create note', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
