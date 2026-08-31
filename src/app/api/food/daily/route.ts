import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { meals, mealItems, mealItemNutrients } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 });
  }

  try {
    // Fetch all meals for this date
    const dailyMeals = await db.select().from(meals).where(
      and(
        eq(meals.userId, session.user.id),
        eq(meals.localDate, date)
      )
    );

    const mealIds = dailyMeals.map(m => m.id);
    
    let items: any[] = [];
    let nutrients: any[] = [];

    if (mealIds.length > 0) {
      items = await db.select().from(mealItems).where(
        inArray(mealItems.mealId, mealIds)
      ); 

      const itemIds = items.map(i => i.id);
      if (itemIds.length > 0) {
        nutrients = await db.select().from(mealItemNutrients).where(inArray(mealItemNutrients.mealItemId, itemIds));
      }
    }

    return NextResponse.json({ meals: dailyMeals, items, nutrients });
  } catch (error: any) {
    console.error('Food daily fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
