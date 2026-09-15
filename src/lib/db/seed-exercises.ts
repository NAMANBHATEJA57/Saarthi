import 'dotenv/config';
import { db } from './index';
import { workoutExerciseLibrary } from './schema';

const exercises = [
  { 
    name: 'Bench Press', 
    type: 'strength', 
    muscle: 'Chest', 
    equipment: 'Barbell',
    animationUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // sample video
    mediaUrl: 'https://placehold.co/400x300.png?text=Bench+Press+Image',
    thumbnailUrl: 'https://placehold.co/100x100.png?text=Thumb'
  },
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
        animationUrl: (ex as any).animationUrl || null,
        mediaUrl: (ex as any).mediaUrl || null,
        thumbnailUrl: (ex as any).thumbnailUrl || null,
        source: 'internal',
      }); // no onConflictDoNothing in standard drizzle inserts without explicit conflict target
    }
    console.log('Exercises seeded successfully.');
  } catch (error) {
    console.error('Failed to seed exercises:', error);
  }
}

seed().then(() => process.exit(0));
