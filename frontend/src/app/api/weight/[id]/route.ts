import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { WeightService } from '@/lib/weight/service';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;

  try {
    const entry = await WeightService.deleteEntry(session.user.id, resolvedParams.id);
    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete weight entry', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
