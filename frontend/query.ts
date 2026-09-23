import { db } from './src/lib/db/index';
import { calendarConnections } from './src/lib/db/schema';

async function main() {
  const result = await db.select().from(calendarConnections);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

main();
