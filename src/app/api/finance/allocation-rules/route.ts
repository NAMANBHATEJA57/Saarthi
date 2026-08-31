import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeAllocationRuleSets, financeAllocationRules } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const rulesets = await db.select()
      .from(financeAllocationRuleSets)
      .where(and(
        eq(financeAllocationRuleSets.userId, userId),
        eq(financeAllocationRuleSets.status, 'ACTIVE')
      ))
      .limit(1);
      
    if (rulesets.length === 0) {
      return NextResponse.json({ ruleset: null, rules: [] });
    }
    
    const rs = rulesets[0];
    const rules = await db.select()
      .from(financeAllocationRules)
      .where(eq(financeAllocationRules.ruleSetId, rs.id))
      .orderBy(financeAllocationRules.sortOrder);

    return NextResponse.json({ ruleset: rs, rules });
  } catch (error) {
    console.error('Allocation Rules GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { rules, effectiveFrom } = body;
    // rules should be array of { label, purpose, percentageBasisPoints }

    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json({ error: 'Rules required' }, { status: 400 });
    }

    const total = rules.reduce((acc, r) => acc + (r.percentageBasisPoints || 0), 0);
    if (total !== 10000) {
      return NextResponse.json({ error: 'Percentages must sum to exactly 10000 basis points (100%)' }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Retire old active rulesets
      await tx
        .update(financeAllocationRuleSets)
        .set({ status: 'RETIRED', effectiveTo: effectiveFrom || new Date().toISOString().split('T')[0] })
        .where(and(eq(financeAllocationRuleSets.userId, userId), eq(financeAllocationRuleSets.status, 'ACTIVE')));

      // Create new active ruleset
      const [newRuleSet] = await tx.insert(financeAllocationRuleSets).values({
        userId,
        effectiveFrom: effectiveFrom || new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      }).returning();

      // Create rules
      const rulesToInsert = rules.map((r, i) => ({
        ruleSetId: newRuleSet.id,
        label: r.label,
        purpose: r.purpose,
        percentageBasisPoints: r.percentageBasisPoints,
        sortOrder: i
      }));

      const insertedRules = await tx.insert(financeAllocationRules).values(rulesToInsert).returning();

      return { ruleset: newRuleSet, rules: insertedRules };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Allocation Rules POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
