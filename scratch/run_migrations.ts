import 'dotenv/config';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Running tasks table migration...');
  try {
    await db.execute(sql`
      ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'todo',
        ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
        ADD COLUMN IF NOT EXISTS due_date date,
        ADD COLUMN IF NOT EXISTS start_time timestamptz,
        ADD COLUMN IF NOT EXISTS end_time timestamptz,
        ADD COLUMN IF NOT EXISTS all_day boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS timezone text,
        ADD COLUMN IF NOT EXISTS reminder_minutes integer,
        ADD COLUMN IF NOT EXISTS recurrence_rule text,
        ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS external_provider text,
        ADD COLUMN IF NOT EXISTS external_account_id text,
        ADD COLUMN IF NOT EXISTS external_calendar_id text,
        ADD COLUMN IF NOT EXISTS external_event_id text,
        ADD COLUMN IF NOT EXISTS last_synced_at timestamptz,
        ADD COLUMN IF NOT EXISTS sync_hash text,
        ADD COLUMN IF NOT EXISTS completed_at timestamptz,
        ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
    `);
    console.log('✓ tasks columns added');

    // Back-fill status from completedAt for any legacy rows
    await db.execute(sql`
      UPDATE tasks SET status = 'completed' WHERE completed_at IS NOT NULL AND status = 'todo';
    `);
    console.log('✓ legacy status back-filled');

    // Create indexes safely
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS tasks_open_idx ON tasks(user_id, status, priority, position);
      CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(user_id, due_date);
      CREATE INDEX IF NOT EXISTS tasks_external_sync_idx ON tasks(external_provider, external_account_id, external_event_id);
      CREATE INDEX IF NOT EXISTS tasks_trash_idx ON tasks(user_id, deleted_at);
    `);
    console.log('✓ indexes created');

    // Also ensure finance_transactions new columns exist (for safety)
    await db.execute(sql`
      ALTER TABLE finance_transactions
        ADD COLUMN IF NOT EXISTS original_description text,
        ADD COLUMN IF NOT EXISTS original_amount_minor integer,
        ADD COLUMN IF NOT EXISTS provider_transaction_id text;
    `);
    console.log('✓ finance_transactions columns added');

    console.log('\n✅ Migration complete!');
  } catch (e: any) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
}

run();
