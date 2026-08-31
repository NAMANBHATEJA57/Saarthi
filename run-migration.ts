import 'dotenv/config';
import fs from 'fs';
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  await client.connect();
  
  try {
    console.log('Dropping stale workout_sets table...');
    await client.query('DROP TABLE IF EXISTS "workout_sets" CASCADE;');
  } catch(e: any) {
    console.log(e.message);
  }

  const sql = fs.readFileSync('drizzle/0007_slippery_cammi.sql', 'utf8');
  const statements = sql.split('--> statement-breakpoint');
  console.log(`Running ${statements.length} migration statements...`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (!stmt) continue;
    try {
      await client.query(stmt);
      console.log(`Statement ${i} completed successfully.`);
    } catch(e: any) {
      console.log(`Statement ${i} error (maybe already applied): `, e.message);
    }
  }
  
  console.log('Migration completed.');
  await client.end();
}

runMigration().catch((e: any) => {
  console.error(e);
  process.exit(1);
});
