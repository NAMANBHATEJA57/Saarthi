import { db } from './src/lib/db';
import { financeTransactions, financeAccounts } from './src/lib/db/schema';

async function main() {
  const txs = await db.select().from(financeTransactions);
  console.log("Transactions:");
  console.log(txs.map(t => ({ id: t.id, type: t.type, amountMinor: t.amountMinor, remark: t.remark })));
  
  const accs = await db.select().from(financeAccounts);
  console.log("Accounts:");
  console.log(accs.map(a => ({ id: a.id, name: a.name, creditLimitMinor: a.creditLimitMinor })));
  process.exit(0);
}
main();
