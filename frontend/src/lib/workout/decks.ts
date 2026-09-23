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
  },
  {
    id: 'trek-prep-beginner',
    name: 'Trek Prep (Beginner)',
    description: 'A beginner-friendly 7-day plan focused on leg strength, endurance, core stability, and mobility for trekking.',
    routines: [
      {
        name: 'Monday: Full Body & Cardio',
        description: 'Mixed upper & lower body, cardio, and stretching.',
        exercises: [
          { name: 'treadmill walking', sets: 1, reps: '10 mins' },
          { name: 'leg press', sets: 3, reps: '10-12' },
          { name: 'chest press', sets: 3, reps: '10-12' },
          { name: 'seated leg curl', sets: 3, reps: '10-12' },
          { name: 'cable lat pulldown (wide grip)', sets: 3, reps: '10-12' },
          { name: 'plank', sets: 3, reps: '30s' },
          { name: 'hamstring stretch', sets: 1, reps: '1 min' }
        ]
      },
      {
        name: 'Tuesday: Endurance & Core',
        description: 'Trek endurance combined with upper body and core mobility.',
        exercises: [
          { name: 'stairmaster', sets: 1, reps: '15 mins' },
          { name: 'walking lunge', sets: 2, reps: '20' },
          { name: 'dumbbell shoulder press', sets: 3, reps: '10' },
          { name: 'standing calf raise', sets: 3, reps: '15' },
          { name: 'dumbbell bicep curl', sets: 2, reps: '12' },
          { name: 'cat-cow stretch', sets: 2, reps: '10' },
          { name: 'quad stretch', sets: 1, reps: '1 min' }
        ]
      },
      {
        name: 'Wednesday: Active Recovery',
        description: 'Flush out lactic acid and improve joint mobility.',
        exercises: [
          { name: 'treadmill walking', sets: 1, reps: '20 mins' },
          { name: 'cat-cow stretch', sets: 2, reps: '10' },
          { name: 'child\'s pose', sets: 1, reps: '1 min' },
          { name: 'butterfly stretch', sets: 1, reps: '1 min' }
        ]
      },
      {
        name: 'Thursday: Full Body & Trek Prep',
        description: 'Mimic trekking uphill with mixed upper body support.',
        exercises: [
          { name: 'incline treadmill', sets: 1, reps: '15 mins' },
          { name: 'step-up', sets: 3, reps: '10 per leg' },
          { name: 'cable seated row', sets: 3, reps: '12' },
          { name: 'leg extension', sets: 2, reps: '12' },
          { name: 'cable triceps pushdown', sets: 2, reps: '12' },
          { name: 'plank', sets: 3, reps: '30s' },
          { name: 'glute stretch', sets: 1, reps: '1 min' }
        ]
      },
      {
        name: 'Friday: Full Body Light',
        description: 'Light touch-up on all muscles, emphasizing core stability and stretching.',
        exercises: [
          { name: 'treadmill walking', sets: 1, reps: '10 mins' },
          { name: 'chest press', sets: 2, reps: '12' },
          { name: 'leg press', sets: 2, reps: '12' },
          { name: 'cable lat pulldown (wide grip)', sets: 2, reps: '12' },
          { name: 'walking lunge', sets: 2, reps: '20' },
          { name: 'hip-flexor stretch', sets: 1, reps: '1 min' },
          { name: 'calf stretch', sets: 1, reps: '1 min' }
        ]
      },
      {
        name: 'Saturday: The Long Hike',
        description: 'Build cardiovascular stamina and mental endurance for long days.',
        exercises: [
          { name: 'incline treadmill', sets: 1, reps: '45-60 mins' },
          { name: 'standing calf raise', sets: 3, reps: '15' },
          { name: 'hamstring stretch', sets: 1, reps: '1 min' },
          { name: 'quad stretch', sets: 1, reps: '1 min' }
        ]
      }
    ]
  }
];
