import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { RelationshipService } from '@/lib/relationships/service';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    if (!data.sourceType || !data.sourceId || !data.targetType || !data.targetId) {
      return NextResponse.json({ error: 'Missing relationship parameters' }, { status: 400 });
    }

    const rel = await RelationshipService.linkObjects(session.user.id, data);
    return NextResponse.json({ relationship: rel });
  } catch (error) {
    console.error('Failed to link objects', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sourceId = searchParams.get('sourceId');
  const targetId = searchParams.get('targetId');

  if (!sourceId || !targetId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    await RelationshipService.unlinkObjects(session.user.id, sourceId, targetId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unlink objects', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sourceType = searchParams.get('sourceType');
  const sourceId = searchParams.get('sourceId');

  if (!sourceType || !sourceId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const related = await RelationshipService.getRelatedObjects(session.user.id, sourceType, sourceId);
    return NextResponse.json({ related });
  } catch (error) {
    console.error('Failed to get related objects', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
