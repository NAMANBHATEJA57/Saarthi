import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { meals, mealItems, mealItemNutrients, foodSourceRecords, foodNutrients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { localDate, mealType, sourceRecordId, quantity, selectedPortion, displaySnapshot } = body;

    if (!localDate || !mealType || !sourceRecordId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if meal exists for this date and type
    let mealId: string;
    const existingMeals = await db.select().from(meals).where(
      and(
        eq(meals.userId, session.user.id),
        eq(meals.localDate, localDate),
        eq(meals.mealType, mealType)
      )
    ).limit(1);

    if (existingMeals.length > 0) {
      mealId = existingMeals[0].id;
    } else {
      const insertedMeal = await db.insert(meals).values({
        userId: session.user.id,
        localDate,
        mealType,
      }).returning({ id: meals.id });
      mealId = insertedMeal[0].id;
    }

    // Fetch the source record nutrients to scale them
    const nutrients = await db.select().from(foodNutrients).where(eq(foodNutrients.recordId, sourceRecordId));

    // Calculate scaling factor
    // Default basis is 100g. If selectedPortion has grams, we use that.
    let referenceGrams = 100;
    if (selectedPortion && selectedPortion.grams) {
      referenceGrams = Number(selectedPortion.grams);
    }
    
    // quantity is the number of portions
    const totalGrams = referenceGrams * quantity;
    const multiplier = totalGrams / 100;

    // Insert Meal Item
    const insertedItem = await db.insert(mealItems).values({
      mealId,
      selectedSourceRef: sourceRecordId,
      displaySnapshot: displaySnapshot || { name: 'Unknown Food' },
      selectedPortionSnapshot: selectedPortion || { label: '100g', grams: 100 },
      quantity: quantity.toString(),
    }).returning({ id: mealItems.id });

    const mealItemId = insertedItem[0].id;

    // Insert scaled nutrients
    if (nutrients.length > 0) {
      await db.insert(mealItemNutrients).values(
        nutrients.map(n => ({
          mealItemId,
          nutrientKey: n.nutrientKey,
          amount: (Number(n.amount) * multiplier).toString(),
          unit: n.unit,
          status: n.status || 'known',
        }))
      );
    }

    return NextResponse.json({ success: true, mealItemId });
  } catch (error: any) {
    console.error('Food log error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
