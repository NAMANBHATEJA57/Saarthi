import 'dotenv/config';
import { db } from '../src/lib/db';
import { workoutExerciseLibrary } from '../src/lib/db/schema';
import { isNull, eq } from 'drizzle-orm';

const DATASET_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

async function seed() {
  console.log('Fetching exercise dataset from yuhonas/free-exercise-db...');
  const res = await fetch(DATASET_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch dataset: ${res.status} ${res.statusText}`);
  }
  
  const exercises = await res.json();
  console.log(`Fetched ${exercises.length} exercises. Processing...`);

  // Clear existing public exercises to avoid duplicates on re-run
  console.log('Clearing existing system exercises...');
  await db.delete(workoutExerciseLibrary).where(isNull(workoutExerciseLibrary.userId));

  // Map to our schema
  const mapped = exercises.map((ex: any) => {
    // Map category to type (strength, cardio, bodyweight, timed)
    let type = 'strength';
    if (ex.category === 'cardio') type = 'cardio';
    else if (ex.category === 'stretching' || ex.category === 'plyometrics') type = 'bodyweight';

    return {
      name: ex.name,
      type: type,
      muscle: (ex.primaryMuscles && ex.primaryMuscles.length > 0) ? ex.primaryMuscles.join(', ') : null,
      equipment: ex.equipment || 'none',
      instructions: (ex.instructions && ex.instructions.length > 0) ? ex.instructions.join('\n') : null,
      source: 'yuhonas/free-exercise-db'
    };
  });

  console.log('Inserting into database...');
  
  // Insert in chunks to avoid hitting statement parameter limits
  const chunkSize = 100;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    await db.insert(workoutExerciseLibrary).values(chunk);
    console.log(`Inserted ${i + chunk.length} / ${mapped.length}`);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
