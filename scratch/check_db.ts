import "dotenv/config";
import { db } from "../src/lib/db";
import { sql } from "drizzle-orm";

async function checkData() {
  try {
    const rulesets = await db.execute(sql`SELECT count(*) FROM finance_allocation_rule_sets`);
    const rules = await db.execute(sql`SELECT count(*) FROM finance_allocation_rules`);
    const snapshots = await db.execute(sql`SELECT count(*) FROM finance_allocation_snapshots`);
    const recurring = await db.execute(sql`SELECT count(*) FROM finance_recurring_rules`);

    console.log("finance_allocation_rule_sets count:", rulesets.rows[0].count);
    console.log("finance_allocation_rules count:", rules.rows[0].count);
    console.log("finance_allocation_snapshots count:", snapshots.rows[0].count);
    console.log("finance_recurring_rules count:", recurring.rows[0].count);

    // Also check accounts and transactions
    const accounts = await db.execute(sql`SELECT count(*) FROM finance_accounts`);
    const transactions = await db.execute(sql`SELECT count(*) FROM finance_transactions`);
    
    console.log("finance_accounts count:", accounts.rows[0].count);
    console.log("finance_transactions count:", transactions.rows[0].count);

  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

checkData();
