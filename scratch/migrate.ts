import "dotenv/config";
import { Client } from 'pg';
import * as fs from 'fs';

async function runMigration() {
  try {
    const sqlQuery = fs.readFileSync('./drizzle/0011_young_morph_pt2.sql', 'utf8');
    
    // Split by statement-breakpoint
    const statements = sqlQuery.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`Found ${statements.length} statements to execute.`);
    
    const client = new Client({ connectionString: process.env.DATABASE_URL! });
    await client.connect();
    
    for (const stmt of statements) {
      console.log(`Executing: ${stmt.substring(0, 50)}...`);
      await client.query(stmt);
    }
    
    await client.end();
    
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

runMigration();
