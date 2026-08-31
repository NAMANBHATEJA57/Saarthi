import 'dotenv/config';
import { db } from './index';
import { workoutExerciseLibrary } from './schema';

const exercises = [
  { name: 'Bench Press', type: 'strength', muscle: 'Chest', equipment: 'Barbell' },
  { name: 'Incline Bench Press', type: 'strength', muscle: 'Chest', equipment: 'Barbell' },
  { name: 'Dumbbell Bench Press', type: 'strength', muscle: 'Chest', equipment: 'Dumbbell' },
  { name: 'Squat', type: 'strength', muscle: 'Legs', equipment: 'Barbell' },
  { name: 'Deadlift', type: 'strength', muscle: 'Back', equipment: 'Barbell' },
  { name: 'Shoulder Press', type: 'strength', muscle: 'Shoulders', equipment: 'Barbell' },
  { name: 'Pull Up', type: 'bodyweight', muscle: 'Back', equipment: 'Bodyweight' },
  { name: 'Push Up', type: 'bodyweight', muscle: 'Chest', equipment: 'Bodyweight' },
];

async function seed() {
  console.log('Seeding exercises...');
  try {
    for (const ex of exercises) {
      await db.insert(workoutExerciseLibrary).values({
        name: ex.name,
        type: ex.type,
        muscle: ex.muscle,
        equipment: ex.equipment,
        source: 'internal',
      }); // no onConflictDoNothing in standard drizzle inserts without explicit conflict target
    }
    console.log('Exercises seeded successfully.');
  } catch (error) {
    console.error('Failed to seed exercises:', error);
  }
}

seed().then(() => process.exit(0));
