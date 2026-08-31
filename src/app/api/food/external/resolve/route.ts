import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { foodService } from '@/lib/food/service';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sourceId, externalId } = body;

    if (!sourceId || !externalId) {
      return NextResponse.json({ error: 'Missing sourceId or externalId' }, { status: 400 });
    }

    const recordId = await foodService.resolveAndPersist(sourceId, externalId);
    if (!recordId) {
      return NextResponse.json({ error: 'Failed to resolve food record' }, { status: 404 });
    }

    return NextResponse.json({ recordId });
  } catch (error) {
    console.error('External Resolve API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
