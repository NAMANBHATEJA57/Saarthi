import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { meals, mealItems, mealItemNutrients } from '@/lib/db/schema';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  const conditions = [eq(meals.userId, session.user!.id), isNull(meals.deletedAt)];
  
  if (date) {
    conditions.push(eq(meals.localDate, date));
  }

  try {
    const data = await db.select().from(meals).where(and(...conditions)).orderBy(desc(meals.localDate));
    return NextResponse.json({ meals: data });
  } catch (error) {
    console.error('Meals GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { localDate, mealType, items } = body;

    if (!localDate || !mealType || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Wrap in a transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create Meal
      const [newMeal] = await tx.insert(meals).values({
        userId,
        localDate,
        mealType,
      }).returning();

      // 2. Create Items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        const [newItem] = await tx.insert(mealItems).values({
          mealId: newMeal.id,
          ordering: i,
          selectedSourceRef: item.selectedSourceRef || null,
          selectedUserFoodId: item.selectedUserFoodId || null,
          displaySnapshot: item.displaySnapshot,
          selectedPortionSnapshot: item.selectedPortionSnapshot,
          quantity: item.quantity.toString(),
        }).returning();

        // 3. Create Item Nutrients
        if (item.calculatedNutrients && item.calculatedNutrients.length > 0) {
          await tx.insert(mealItemNutrients).values(
            item.calculatedNutrients.map((nut: any) => ({
              mealItemId: newItem.id,
              nutrientKey: nut.key,
              amount: nut.amount.toString(),
              unit: nut.unit,
              status: nut.status,
            }))
          );
        }
      }

      return newMeal;
    });

    return NextResponse.json({ meal: result });
  } catch (error) {
    console.error('Meals POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
