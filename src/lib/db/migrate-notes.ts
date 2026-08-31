import { config } from 'dotenv';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

config({ path: '.env' });

const main = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    
    const migrationSql = fs.readFileSync(path.join(__dirname, '../../../drizzle/0006_true_zemo.sql'), 'utf-8');
    const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s.length > 0);
    
    for (const stmt of statements) {
      console.log('Executing:', stmt.substring(0, 50) + '...');
      try {
        await client.query(stmt);
      } catch (err: any) {
        if (err.code === '42P07' || err.code === '42710' || err.code === '42704') {
          console.log('Ignoring error:', err.message);
        } else {
          throw err;
        }
      }
    }
    console.log('Migration 0006 completed successfully.');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();
