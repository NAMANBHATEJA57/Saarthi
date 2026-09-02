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
  const [yearStr, monthStr] = yearMonth.split('-');
  const reqYear = parseInt(yearStr);
  const reqMonth = parseInt(monthStr);
  const reqEndDateObj = new Date(reqYear, reqMonth, 0);
  const reqEndDate = `${yearStr}-${monthStr}-${reqEndDateObj.getDate().toString().padStart(2, '0')}`;

  const APP_START_DATE = '2026-08-01';

  // 1. Fetch Income Types to find "Salary"
  const { financeIncomeTypes } = await import('@/lib/db/schema');
  const incomeTypes = await db.select().from(financeIncomeTypes).where(eq(financeIncomeTypes.userId, userId));
  const salaryTypeId = incomeTypes.find(t => t.name.toLowerCase().includes('salary'))?.id;

  // 2. Fetch Categories
  const categories = await db.select().from(financeCategories).where(eq(financeCategories.userId, userId));
  const categoryMap = categories.reduce((acc, c) => {
    acc[c.id] = c.name;
    return acc;
  }, {} as Record<string, string>);

  // 3. Fetch all Plans and Items from start to requested month
  const allPlans = await db.select().from(financeMonthlyPlans).where(eq(financeMonthlyPlans.userId, userId));
  const validPlans = allPlans.filter(p => {
    const pVal = p.year * 12 + p.month;
    const rVal = reqYear * 12 + reqMonth;
    const sVal = 2026 * 12 + 8; // August 2026
    return pVal >= sVal && pVal <= rVal;
  });

  const plannedCategorySpending: Record<string, number> = {};
  const pastPlannedCategoryBudget: Record<string, number> = {};

  if (validPlans.length > 0) {
    for (const plan of validPlans) {
      const items = await db.select().from(financeMonthlyPlanItems).where(eq(financeMonthlyPlanItems.planId, plan.id));
      const isCurrentMonth = plan.year === reqYear && plan.month === reqMonth;
      
      for (const item of items) {
        if (item.expenseCategoryId) {
          if (isCurrentMonth) {
            plannedCategorySpending[item.expenseCategoryId] = (plannedCategorySpending[item.expenseCategoryId] || 0) + item.amount;
          } else {
            pastPlannedCategoryBudget[item.expenseCategoryId] = (pastPlannedCategoryBudget[item.expenseCategoryId] || 0) + item.amount;
          }
        }
      }
    }
  }

  // 4. Fetch all Transactions from start to requested month end
  const transactions = await db.select()
    .from(financeTransactions)
    .where(and(
      eq(financeTransactions.userId, userId),
      eq(financeTransactions.status, 'POSTED'),
      gte(financeTransactions.transactionDate, APP_START_DATE),
      lte(financeTransactions.transactionDate, reqEndDate)
    ));

  let currentIncome = 0;
  let currentExpense = 0;
  const currentCategorySpending: Record<string, number> = {};
  const pastCategorySpending: Record<string, number> = {};

  for (const t of transactions) {
    let effYear = parseInt(t.transactionDate.substring(0, 4));
    let effMonth = parseInt(t.transactionDate.substring(5, 7));
    const day = parseInt(t.transactionDate.substring(8, 10));

    // Salary Shift Logic (>= 25th moves to next month)
    if (t.type === 'INCOME' && salaryTypeId && t.incomeTypeId === salaryTypeId) {
      if (day >= 25) {
        effMonth += 1;
        if (effMonth > 12) {
          effMonth = 1;
          effYear += 1;
        }
      }
    }

    const isCurrentMonth = effYear === reqYear && effMonth === reqMonth;
    const tVal = effYear * 12 + effMonth;
    const rVal = reqYear * 12 + reqMonth;
    const isPastMonth = tVal >= (2026 * 12 + 8) && tVal < rVal;

    if (t.type === 'INCOME') {
      if (isCurrentMonth) currentIncome += t.amount;
    } else if (t.type === 'EXPENSE') {
      if (isCurrentMonth) {
        currentExpense += t.amount;
        if (t.categoryId) {
          currentCategorySpending[t.categoryId] = (currentCategorySpending[t.categoryId] || 0) + t.amount;
        }
      } else if (isPastMonth) {
        if (t.categoryId) {
          pastCategorySpending[t.categoryId] = (pastCategorySpending[t.categoryId] || 0) + t.amount;
        }
      }
    }
  }

  // 5. Calculate Rollover and Final Values
  let plannedTotal = 0;
  const namedCategorySpending: Record<string, { actual: number, planned: number, basePlanned: number, rollover: number }> = {};

  const allCatIds = new Set([
    ...Object.keys(plannedCategorySpending),
    ...Object.keys(pastPlannedCategoryBudget),
    ...Object.keys(currentCategorySpending)
  ]);

  for (const catId of allCatIds) {
    const name = categoryMap[catId] || 'Unknown';
    if (!namedCategorySpending[name]) {
      namedCategorySpending[name] = { actual: 0, planned: 0, basePlanned: 0, rollover: 0 };
    }
    
    const basePlanned = plannedCategorySpending[catId] || 0;
    const pastPlanned = pastPlannedCategoryBudget[catId] || 0;
    const pastActual = pastCategorySpending[catId] || 0;
    
    // Unspent rolls over
    const rollover = pastPlanned - pastActual; 
    const totalPlanned = basePlanned + rollover;
    
    // Only show categories that have a current plan or current spending, or a positive rollover
    if (basePlanned > 0 || rollover > 0 || (currentCategorySpending[catId] || 0) > 0) {
      namedCategorySpending[name].basePlanned = basePlanned;
      namedCategorySpending[name].rollover = rollover;
      namedCategorySpending[name].planned = totalPlanned;
      namedCategorySpending[name].actual = currentCategorySpending[catId] || 0;
      plannedTotal += totalPlanned;
    }
  }

  return {
    totalIncome: currentIncome,
    totalExpense: currentExpense,
    plannedTotal,
    leftover: currentIncome - plannedTotal,
    categorySpending: namedCategorySpending,
  };
}
