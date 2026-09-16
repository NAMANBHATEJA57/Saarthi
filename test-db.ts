import 'dotenv/config';
import { db } from './src/lib/db';
import { workoutExerciseLibrary } from './src/lib/db/schema';
import { isNotNull, or } from 'drizzle-orm';

async function main() {
  const res = await db.select().from(workoutExerciseLibrary).where(or(isNotNull(workoutExerciseLibrary.animationUrl), isNotNull(workoutExerciseLibrary.mediaUrl))).limit(5);
  console.log(res.map(r => ({ name: r.name, anim: r.animationUrl, media: r.mediaUrl })));
  process.exit(0);
}
main();
