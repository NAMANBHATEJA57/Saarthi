import { db } from "@/lib/db";
import { 
  financeCategories, 
  financeTransactions, 
  financeAccounts,
  financeMonthlyPlans,
  financeMonthlyPlanItems,
  financeSavingsGoals
} from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

const DEFAULT_CATEGORIES = [
  { name: "Food" },
  { name: "Transport" },
  { name: "Shopping" },
  { name: "Subscriptions" },
  { name: "Bills" },
  { name: "Health" },
  { name: "Entertainment" },
  { name: "Travel" },
  { name: "Other" },
];

export async function ensureDefaultCategories(userId: string) {
  const existing = await db.select().from(financeCategories).where(eq(financeCategories.userId, userId));
  
  if (existing.length === 0) {
    const values = DEFAULT_CATEGORIES.map((c, i) => ({
      userId,
      name: c.name,
      sortOrder: i,
    }));
    await db.insert(financeCategories).values(values);
  }
}

export async function getAccountBalances(userId: string) {
  const accounts = await db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId));
  const allTx = await db.select().from(financeTransactions)
    .where(and(eq(financeTransactions.userId, userId), eq(financeTransactions.status, 'POSTED')));

  const balances: Record<string, number> = {};
  
  // Initialize balances with opening amounts
  accounts.forEach(acc => {
    if (acc.type === 'CREDIT_CARD') {
      balances[acc.id] = acc.openingOutstanding || 0;
    } else {
      balances[acc.id] = acc.openingBalance || 0;
    }
  });

  for (const tx of allTx) {
    // Bank Account Balance: + Income + Transfer IN - Transfer OUT - Expense - CC Payment
    // Credit Card Outstanding: + Expense - CC Payment
    
    if (tx.type === 'INCOME') {
      if (tx.accountId && balances[tx.accountId] !== undefined) {
        balances[tx.accountId] += tx.amount;
      }
    } else if (tx.type === 'EXPENSE') {
      if (tx.accountId && balances[tx.accountId] !== undefined) {
        const isCreditCard = accounts.find(a => a.id === tx.accountId)?.type === 'CREDIT_CARD';
        if (isCreditCard) {
          balances[tx.accountId] += tx.amount; // Outstanding liability increases
        } else {
          balances[tx.accountId] -= tx.amount; // Bank balance decreases
        }
      }
    } else if (tx.type === 'CREDIT_CARD_PAYMENT') {
      if (tx.accountId && balances[tx.accountId] !== undefined) {
        balances[tx.accountId] -= tx.amount; // From Bank Account
      }
      if (tx.destinationAccountId && balances[tx.destinationAccountId] !== undefined) {
        balances[tx.destinationAccountId] -= tx.amount; // To Credit Card (reduces liability)
      }
    } else if (tx.type === 'TRANSFER') {
      if (tx.accountId && balances[tx.accountId] !== undefined) {
        balances[tx.accountId] -= tx.amount;
      }
      if (tx.destinationAccountId && balances[tx.destinationAccountId] !== undefined) {
        balances[tx.destinationAccountId] += tx.amount;
      }
    }
  }

  return accounts.map(acc => ({
    ...acc,
    balance: balances[acc.id] || 0,
    availableCredit: acc.type === 'CREDIT_CARD' && acc.creditLimit ? (acc.creditLimit - (balances[acc.id] || 0)) : null
  }));
}

export async function getMonthlySummary(userId: string, yearMonth: string) {
  // yearMonth is 'YYYY-MM'
  const startDate = `${yearMonth}-01`;
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const endDateObj = new Date(year, month, 0);
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

  for (const t of transactions) {
    if (t.type === 'INCOME') {
      totalIncome += t.amount;
    } else if (t.type === 'EXPENSE') {
      totalExpense += t.amount;
      if (t.categoryId) {
        if (!categorySpending[t.categoryId]) categorySpending[t.categoryId] = 0;
        categorySpending[t.categoryId] += t.amount;
      }
    }
  }

  // Get Monthly Plan
  let plannedTotal = 0;
  const plannedCategorySpending: Record<string, number> = {};
  
  const plan = await db.select().from(financeMonthlyPlans).where(
    and(eq(financeMonthlyPlans.userId, userId), eq(financeMonthlyPlans.month, month), eq(financeMonthlyPlans.year, year))
  ).limit(1);

  if (plan.length > 0) {
    const planItems = await db.select().from(financeMonthlyPlanItems).where(eq(financeMonthlyPlanItems.planId, plan[0].id));
    for (const item of planItems) {
      plannedTotal += item.amount;
      if (item.expenseCategoryId) {
        plannedCategorySpending[item.expenseCategoryId] = item.amount;
      }
    }
  }

  const categories = await db.select().from(financeCategories).where(eq(financeCategories.userId, userId));
  const categoryMap = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  const namedCategorySpending: Record<string, { actual: number, planned: number }> = {};
  
  // Initialize with all planned categories
  for (const [catId, plannedAmount] of Object.entries(plannedCategorySpending)) {
    const name = categoryMap[catId] || 'Unknown';
    if (!namedCategorySpending[name]) namedCategorySpending[name] = { actual: 0, planned: 0 };
    namedCategorySpending[name].planned = plannedAmount;
  }
  
  // Add actual spending
  for (const [catId, amount] of Object.entries(categorySpending)) {
    const name = categoryMap[catId] || 'Unknown';
    if (!namedCategorySpending[name]) namedCategorySpending[name] = { actual: 0, planned: 0 };
    namedCategorySpending[name].actual = amount as number;
  }

  return {
    totalIncome,
    totalExpense,
    plannedTotal,
    leftover: totalIncome - plannedTotal,
    categorySpending: namedCategorySpending,
  };
}
