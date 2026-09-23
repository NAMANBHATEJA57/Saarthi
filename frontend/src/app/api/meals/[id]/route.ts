import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { meals, mealItems, mealItemNutrients } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Verify ownership
    const existing = await db.select().from(meals).where(and(eq(meals.id, id), eq(meals.userId, session.user.id), isNull(meals.deletedAt)));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete
    await db.update(meals).set({ deletedAt: new Date() }).where(eq(meals.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Meals DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { localDate, mealType, items } = body;

    // Verify ownership
    const existing = await db.select().from(meals).where(and(eq(meals.id, id), eq(meals.userId, session.user.id), isNull(meals.deletedAt)));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // In a real app with meal revisions, we'd create a revision and soft-delete/insert items.
    // For MVP, we will physically delete the items and recreate them, but update the meal.
    const result = await db.transaction(async (tx) => {
      await tx.update(meals).set({
        localDate,
        mealType,
      }).where(eq(meals.id, id));

      // Delete old items (which cascades to nutrients)
      await tx.delete(mealItems).where(eq(mealItems.mealId, id));

      // Create new Items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        const [newItem] = await tx.insert(mealItems).values({
          mealId: id,
          ordering: i,
          selectedSourceRef: item.selectedSourceRef || null,
          selectedUserFoodId: item.selectedUserFoodId || null,
          displaySnapshot: item.displaySnapshot,
          selectedPortionSnapshot: item.selectedPortionSnapshot,
          quantity: item.quantity.toString(),
        }).returning();

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

      return await tx.select().from(meals).where(eq(meals.id, id));
    });

    return NextResponse.json({ meal: result[0] });
  } catch (error) {
    console.error('Meals PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
