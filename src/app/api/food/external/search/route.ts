import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { foodService } from '@/lib/food/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q');
  const source = searchParams.get('source') || 'open_food_facts';

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await foodService.searchExternal(query, source);
    return NextResponse.json({ results });
  } catch (error) {
    console.error('External Search API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
