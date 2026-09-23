import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { userFoods, userFoodPortions, userFoodNutrients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { name, brand, defaultGrams, portions, nutrients } = body;

    if (!name || !portions || !nutrients) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create User Food
      const [newFood] = await tx.insert(userFoods).values({
        userId,
        kind: 'custom',
        name,
        searchFields: `${name} ${brand || ''}`.trim(),
      }).returning();

      // 2. Create Portions
      if (portions && portions.length > 0) {
        await tx.insert(userFoodPortions).values(
          portions.map((p: any, idx: number) => ({
            userFoodId: newFood.id,
            label: p.label,
            grams: p.grams?.toString(),
            milliliters: p.milliliters?.toString(),
            ordering: idx,
          }))
        );
      }

      // 3. Create Nutrients
      if (nutrients && nutrients.length > 0) {
        await tx.insert(userFoodNutrients).values(
          nutrients.map((n: any) => ({
            userFoodId: newFood.id,
            nutrientKey: n.key,
            amount: n.amount.toString(),
            unit: n.unit,
            basis: n.basis,
            status: n.status || 'known',
          }))
        );
      }

      return newFood;
    });

    return NextResponse.json({ food: result });
  } catch (error) {
    console.error('Custom Food POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
