import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { SearchService } from '@/lib/search/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await SearchService.globalSearch(session.user.id, q);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
