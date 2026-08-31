import { db } from "@/lib/db";
import { 
  financeCategories, 
  financeTransactions, 
  financeAllocationRuleSets, 
  financeAllocationRules, 
  financeAllocationSnapshots 
} from "@/lib/db/schema";
import { eq, and, isNull, desc, gte, lte } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Food", kind: "EXPENSE" },
  { name: "Transport", kind: "EXPENSE" },
  { name: "Shopping", kind: "EXPENSE" },
  { name: "Subscriptions", kind: "EXPENSE" },
  { name: "Bills", kind: "EXPENSE" },
  { name: "Health", kind: "EXPENSE" },
  { name: "Entertainment", kind: "EXPENSE" },
  { name: "Travel", kind: "EXPENSE" },
  { name: "Other", kind: "BOTH", isSystemOther: true },
];

export async function ensureDefaultCategories(userId: string) {
  const existing = await db.select().from(financeCategories).where(eq(financeCategories.userId, userId));
  
  if (existing.length === 0) {
    const values = DEFAULT_CATEGORIES.map((c, i) => ({
      userId,
      name: c.name,
      kind: c.kind,
      isSystemOther: c.isSystemOther || false,
      sortOrder: i,
    }));
    await db.insert(financeCategories).values(values);
  }
}

export async function getActiveRuleSet(userId: string, dateStr: string) {
  // Finds the active rule set covering the given date (YYYY-MM-DD)
  // For MVP we just use the first ACTIVE rule set if date boundaries are simple,
  // but let's query for one where status = ACTIVE.
  
  const rulesets = await db.select()
    .from(financeAllocationRuleSets)
    .where(and(
      eq(financeAllocationRuleSets.userId, userId),
      eq(financeAllocationRuleSets.status, 'ACTIVE')
    ))
    .limit(1);
    
  if (rulesets.length === 0) return null;
  const rs = rulesets[0];
  
  const rules = await db.select()
    .from(financeAllocationRules)
    .where(eq(financeAllocationRules.ruleSetId, rs.id))
    .orderBy(financeAllocationRules.sortOrder);
    
  return { ruleSet: rs, rules };
}

export async function createAllocationSnapshots(tx: any, userId: string, incomeTransactionId: string, amountMinor: number, transactionDate: string) {
  const activeConfig = await getActiveRuleSet(userId, transactionDate);
  if (!activeConfig || activeConfig.rules.length === 0) return;

  const { ruleSet, rules } = activeConfig;
  
  let remainingAmount = amountMinor;
  const snapshots = [];

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    // amount = Income * (basis points / 10000)
    let ruleAmount = Math.floor((amountMinor * rule.percentageBasisPoints) / 10000);
    
    // Distribute remainder to the last rule
    if (i === rules.length - 1) {
      ruleAmount = remainingAmount;
    } else {
      remainingAmount -= ruleAmount;
    }

    snapshots.push({
      userId,
      incomeTransactionId,
      ruleId: rule.id,
      ruleSetId: ruleSet.id,
      label: rule.label,
      purpose: rule.purpose,
      percentageBasisPoints: rule.percentageBasisPoints,
      amountMinor: ruleAmount,
    });
  }

  if (snapshots.length > 0) {
    await tx.insert(financeAllocationSnapshots).values(snapshots);
  }
}

export async function getMonthlySummary(userId: string, yearMonth: string) {
  // yearMonth is 'YYYY-MM'
  const startDate = `${yearMonth}-01`;
  
  // To get end of month, we can parse it
  const [yearStr, monthStr] = yearMonth.split('-');
  const endDateObj = new Date(parseInt(yearStr), parseInt(monthStr), 0);
  const endDate = `${yearStr}-${monthStr}-${endDateObj.getDate().toString().padStart(2, '0')}`;

  const transactions = await db.select()
    .from(financeTransactions)
    .where(and(
      eq(financeTransactions.userId, userId),
      eq(financeTransactions.status, 'POSTED'),
      gte(financeTransactions.transactionDate, startDate),
      lte(financeTransactions.transactionDate, endDate)
    ));

  let totalIncome = 0;
  let totalExpense = 0;
  const categorySpending: Record<string, number> = {};

  const incomeTxIds = [];

  for (const t of transactions) {
    if (t.type === 'INCOME') {
      totalIncome += t.amountMinor;
      incomeTxIds.push(t.id);
    } else if (t.type === 'EXPENSE') {
      totalExpense += t.amountMinor;
      if (!categorySpending[t.categoryId]) categorySpending[t.categoryId] = 0;
      categorySpending[t.categoryId] += t.amountMinor;
    }
  }

  // Get snapshots for the income in this month
  let plannedSavings = 0;
  let plannedEmergency = 0;
  let plannedSpendingAllocation = 0;

  if (incomeTxIds.length > 0) {
    // We cannot use IN clause with empty array in drizzle easily, so only if length > 0
    const snapshots = await db.select()
      .from(financeAllocationSnapshots)
      .where(eq(financeAllocationSnapshots.userId, userId)); // Filter in memory for MVP speed / simplicity
      
    for (const s of snapshots) {
      if (incomeTxIds.includes(s.incomeTransactionId)) {
        if (s.purpose === 'SAVINGS') plannedSavings += s.amountMinor;
        else if (s.purpose === 'EMERGENCY_FUND') plannedEmergency += s.amountMinor;
        else if (s.purpose === 'SPENDING') plannedSpendingAllocation += s.amountMinor;
      }
    }
  }

  const leftover = totalIncome - totalExpense - plannedSavings - plannedEmergency;

  const categories = await db.select().from(financeCategories).where(eq(financeCategories.userId, userId));
  const categoryMap = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  const namedCategorySpending: Record<string, number> = {};
  for (const [catId, amount] of Object.entries(categorySpending)) {
    const name = categoryMap[catId] || 'Unknown';
    if (!namedCategorySpending[name]) namedCategorySpending[name] = 0;
    namedCategorySpending[name] += amount as number;
  }

  return {
    totalIncome,
    totalExpense,
    plannedSavings,
    plannedEmergency,
    plannedSpendingAllocation,
    leftover,
    categorySpending: namedCategorySpending,
  };
}

// Global aggregates for Savings & Emergency (All time)
export async function getAccumulatedBalances(userId: string) {
  const snapshots = await db.select()
    .from(financeAllocationSnapshots)
    .where(eq(financeAllocationSnapshots.userId, userId));
    
  let savings = 0;
  let emergency = 0;
  
  for (const s of snapshots) {
    // Check if the underlying income transaction is still POSTED
    // A JOIN would be better here for performance, doing it simple for MVP logic outline
    if (s.purpose === 'SAVINGS') savings += s.amountMinor;
    if (s.purpose === 'EMERGENCY_FUND') emergency += s.amountMinor;
  }
  
  // Real check with JOIN:
  const validSnapshots = await db.select({
    purpose: financeAllocationSnapshots.purpose,
    amountMinor: financeAllocationSnapshots.amountMinor
  })
  .from(financeAllocationSnapshots)
  .innerJoin(financeTransactions, eq(financeAllocationSnapshots.incomeTransactionId, financeTransactions.id))
  .where(and(
    eq(financeAllocationSnapshots.userId, userId),
    eq(financeTransactions.status, 'POSTED')
  ));
  
  savings = 0;
  emergency = 0;
  for (const vs of validSnapshots) {
    if (vs.purpose === 'SAVINGS') savings += vs.amountMinor;
    if (vs.purpose === 'EMERGENCY_FUND') emergency += vs.amountMinor;
  }

  return { savings, emergency };
}
