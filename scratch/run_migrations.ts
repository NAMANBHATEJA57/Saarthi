import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    await db.execute(sql`
      ALTER TABLE finance_transactions 
      ADD COLUMN IF NOT EXISTS original_description text,
      ADD COLUMN IF NOT EXISTS original_amount_minor integer,
      ADD COLUMN IF NOT EXISTS provider_transaction_id text;
    `);
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
}
run();
