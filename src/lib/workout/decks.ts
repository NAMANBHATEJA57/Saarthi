export interface WorkoutDeck {
  id: string;
  name: string;
  description: string;
  routines: {
    name: string;
    description?: string;
    exercises: {
      name: string; // The exact name matching the dataset
      sets: number;
      reps: string;
    }[];
  }[];
}

export const WORKOUT_DECKS: WorkoutDeck[] = [
  {
    id: 'ppl-classic',
    name: 'Push / Pull / Legs (Classic)',
    description: 'A standard 3-day split hitting every major muscle group efficiently.',
    routines: [
      {
        name: 'Push Day',
        description: 'Chest, Shoulders, and Triceps',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: '8-10' },
          { name: 'dumbbell incline bench press', sets: 3, reps: '10-12' },
          { name: 'dumbbell shoulder press', sets: 3, reps: '10-12' },
          { name: 'dumbbell lateral raise', sets: 4, reps: '15' },
          { name: 'cable triceps pushdown (v-bar)', sets: 3, reps: '12-15' },
          { name: 'dumbbell triceps extension', sets: 3, reps: '12-15' },
        ]
      },
      {
        name: 'Pull Day',
        description: 'Back, Biceps, and Rear Delts',
        exercises: [
          { name: 'barbell deadlift', sets: 3, reps: '5-8' },
          { name: 'cable lat pulldown (wide grip)', sets: 3, reps: '10-12' },
          { name: 'barbell bent over row', sets: 3, reps: '8-10' },
          { name: 'cable seated row', sets: 3, reps: '10-12' },
          { name: 'dumbbell bicep curl', sets: 3, reps: '12' },
          { name: 'dumbbell hammer curl', sets: 3, reps: '12' },
        ]
      },
      {
        name: 'Leg Day',
        description: 'Quads, Hamstrings, and Calves',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: '8-10' },
          { name: 'leg press', sets: 3, reps: '10-12' },
          { name: 'leg extension', sets: 3, reps: '15' },
          { name: 'lying leg curl', sets: 3, reps: '12-15' },
          { name: 'standing calf raise', sets: 4, reps: '15-20' },
        ]
      }
    ]
  },
  {
    id: 'bro-split',
    name: 'Bro Split',
    description: 'A 5-day split focusing on one muscle group per day.',
    routines: [
      {
        name: 'Chest Day',
        exercises: [
          { name: 'barbell bench press', sets: 4, reps: '8-10' },
          { name: 'dumbbell incline bench press', sets: 3, reps: '10' },
          { name: 'cable crossover', sets: 3, reps: '15' },
          { name: 'dumbbell fly', sets: 3, reps: '12' }
        ]
      },
      {
        name: 'Back Day',
        exercises: [
          { name: 'wide grip pull-up', sets: 4, reps: '8-10' },
          { name: 'barbell bent over row', sets: 4, reps: '10' },
          { name: 'cable lat pulldown (wide grip)', sets: 3, reps: '12' },
          { name: 'cable seated row', sets: 3, reps: '12' }
        ]
      },
      {
        name: 'Shoulder Day',
        exercises: [
          { name: 'barbell overhead press', sets: 4, reps: '8-10' },
          { name: 'dumbbell lateral raise', sets: 4, reps: '15' },
          { name: 'dumbbell front raise', sets: 3, reps: '12' },
          { name: 'reverse machine fly', sets: 3, reps: '15' }
        ]
      },
      {
        name: 'Leg Day',
        exercises: [
          { name: 'barbell squat', sets: 4, reps: '8-10' },
          { name: 'leg press', sets: 4, reps: '10' },
          { name: 'leg extension', sets: 3, reps: '15' },
          { name: 'lying leg curl', sets: 3, reps: '15' }
        ]
      },
      {
        name: 'Arm Day',
        exercises: [
          { name: 'barbell curl', sets: 4, reps: '10' },
          { name: 'cable triceps pushdown', sets: 4, reps: '12' },
          { name: 'dumbbell hammer curl', sets: 3, reps: '12' },
          { name: 'dumbbell triceps extension', sets: 3, reps: '12' }
        ]
      }
    ]
  }
];
