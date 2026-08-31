import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: '.env' });

const main = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Creating pg_trgm extension...');
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
    console.log('Successfully created pg_trgm extension.');
  } catch (error) {
    console.error('Error creating pg_trgm:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

main();
