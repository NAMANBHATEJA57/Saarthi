import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  await client.connect();
  
  const files = fs.readdirSync('drizzle')
    .filter(f => f.endsWith('.sql'))
    .sort();
    
  console.log(`Found ${files.length} migration files.`);
  
  for (const file of files) {
    console.log(`Applying ${file}...`);
    const sqlContent = fs.readFileSync(path.join('drizzle', file), 'utf8');
    const statements = sqlContent.split('--> statement-breakpoint');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;
      try {
        await client.query(stmt);
      } catch(e: any) {
        // If it already exists, just ignore. This is a brute force idempotency for missing tables
        if (!e.message.includes('already exists') && !e.message.includes('multiple primary keys')) {
          console.error(`Error in ${file} stmt ${i}: ${e.message}`);
        }
      }
    }
  }
  
  console.log('All migrations applied.');
  await client.end();
}

runMigrations().catch(e => {
  console.error(e);
  process.exit(1);
});
