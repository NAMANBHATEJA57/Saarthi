import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { meals, mealItems, mealItemNutrients } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { id } = await params;
    const body = await req.json();
    const { targetDate, targetMealType } = body;

    if (!targetDate || !targetMealType) {
      return NextResponse.json({ error: 'Missing target date or meal type' }, { status: 400 });
    }

    // Verify ownership and get original meal
    const existingMeals = await db.select().from(meals).where(and(eq(meals.id, id), eq(meals.userId, userId), isNull(meals.deletedAt)));
    if (existingMeals.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const originalItems = await db.select().from(mealItems).where(eq(mealItems.mealId, id));
    
    // We would also need to fetch original nutrients to duplicate them perfectly,
    // but in a simplified MVP, we could just copy the items and their snapshots.
    // Fetch nutrients for all items
    const originalItemIds = originalItems.map(i => i.id);
    let originalNutrients: any[] = [];
    
    if (originalItemIds.length > 0) {
        // Simple workaround for finding all nutrients
        for (const itemId of originalItemIds) {
            const nuts = await db.select().from(mealItemNutrients).where(eq(mealItemNutrients.mealItemId, itemId));
            originalNutrients = originalNutrients.concat(nuts);
        }
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create New Meal
      const [newMeal] = await tx.insert(meals).values({
        userId,
        localDate: targetDate,
        mealType: targetMealType,
      }).returning();

      // 2. Duplicate Items
      for (const item of originalItems) {
        const [newItem] = await tx.insert(mealItems).values({
          mealId: newMeal.id,
          ordering: item.ordering,
          selectedSourceRef: item.selectedSourceRef,
          selectedUserFoodId: item.selectedUserFoodId,
          displaySnapshot: item.displaySnapshot,
          selectedPortionSnapshot: item.selectedPortionSnapshot,
          quantity: item.quantity,
        }).returning();

        // 3. Duplicate Nutrients for this item
        const itemNuts = originalNutrients.filter(n => n.mealItemId === item.id);
        if (itemNuts.length > 0) {
          await tx.insert(mealItemNutrients).values(
            itemNuts.map(nut => ({
              mealItemId: newItem.id,
              nutrientKey: nut.nutrientKey,
              amount: nut.amount,
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
    console.error('Meals Duplicate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
