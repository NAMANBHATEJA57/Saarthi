export interface WorkoutDeckExercise {
  name: string; // The exact name matching the dataset
  sets: number | string;
  reps: string;
  rest?: string;
  instructions?: string;
  isOptional?: boolean;
}

export interface WorkoutDeck {
  id: string;
  name: string;
  description: string;
  routines: {
    name: string;
    description?: string;
    exercises: WorkoutDeckExercise[];
  }[];
}

export const WORKOUT_DECKS: WorkoutDeck[] = [
  {
    id: 'beginner-gym-8week',
    name: '8-Week Beginner Gym Plan',
    description: 'A gentle 6-day beginner split (Chest/Tri, Quads/Hams, Back/Bi, Shoulders/Mobility, Light Upper, Cardio/Mobility) designed for steady strength and gradual fat loss with clinical safety precautions.',
    routines: [
      {
        name: 'Monday: Chest + triceps',
        description: 'Chest press variations + triceps • Warm-up: 5–7 min easy walk before; 5 min cooldown walk after.',
        exercises: [
          { name: 'chest press machine', sets: 2, reps: '10–12', rest: '90 sec', instructions: 'Back supported; comfortable range. Exhale while pressing.' },
          { name: 'incline chest press machine', sets: 2, reps: '10–12', rest: '90 sec', instructions: 'Use a light, controlled load; do not hold your breath.' },
          { name: 'pec deck machine', sets: 2, reps: '10–12', rest: '60 sec', instructions: 'Stop short of a painful or forced stretch.' },
          { name: 'cable triceps pushdown', sets: 2, reps: '10–12', rest: '60–90 sec', instructions: 'Keep torso steady; breathe continuously.' },
        ]
      },
      {
        name: 'Tuesday: Quads + hamstrings',
        description: 'Gentle, clinician-cleared lower-body machines • Skip if unsure or any groin symptoms occur.',
        exercises: [
          { name: 'seated leg extension (optional)', sets: '1–2', reps: '10–12', rest: '60–90 sec', instructions: 'Gentle option only if clinician-cleared and symptom-free. Not rehab. Use easy load and comfortable range.', isOptional: true },
          { name: 'seated leg curl (optional)', sets: '1–2', reps: '10–12', rest: '60–90 sec', instructions: 'Gentle option only if clinician-cleared and symptom-free. Not rehab. Skip if unsure.', isOptional: true },
          { name: 'leg press (optional)', sets: '1–2', reps: '10', rest: '90 sec', instructions: 'Only if clinician-cleared and symptom-free. Very light, comfortable range; no straining or breath-holding. Skip if unsure.', isOptional: true },
        ]
      },
      {
        name: 'Wednesday: Back + biceps',
        description: 'Upper back rows, pulldown, and curls • Warm-up: 5–7 min easy walk before; 5–10 min walk after.',
        exercises: [
          { name: 'lat pulldown', sets: 2, reps: '10–12', rest: '60–90 sec', instructions: 'Pull toward upper chest; keep torso steady and avoid swinging.' },
          { name: 'seated cable row', sets: 2, reps: '10–12', rest: '60–90 sec', instructions: 'Pull toward lower ribs; keep back neutral and avoid jerking.' },
          { name: 'chest-supported row machine', sets: 2, reps: '10–12', rest: '60–90 sec', instructions: 'Keep chest against pad; pull with control.' },
          { name: 'standing dumbbell biceps curl', sets: 2, reps: '10–12', rest: '60 sec', instructions: 'Dumbbells; no biceps curl machine substitution. Keep elbows relaxed by sides.' },
          { name: 'dumbbell hammer curl', sets: 2, reps: '10–12', rest: '60 sec', instructions: 'Use light dumbbells and avoid swinging.' },
        ]
      },
      {
        name: 'Thursday: Shoulders + gentle leg mobility',
        description: 'Light overhead pressing, delts, and seated mobility • Warm-up: 5–7 min walk before; 5 min walk after.',
        exercises: [
          { name: 'seated machine shoulder press (light)', sets: 2, reps: '10–12', rest: '90 sec', instructions: 'Use back support and a comfortable range; exhale while pressing.' },
          { name: 'dumbbell lateral raise (light)', sets: 2, reps: '10–12', rest: '60 sec', instructions: 'Raise only to a comfortable height; no swinging.' },
          { name: 'reverse pec deck', sets: 2, reps: '10–12', rest: '60 sec', instructions: 'Use a light load and smooth motion.' },
          { name: 'gentle seated hamstring stretch (optional)', sets: 1, reps: '15–20 sec each side', rest: 'As needed', instructions: 'Only if clinician-cleared and symptom-free. No bouncing or forced range; skip with any groin pulling.', isOptional: true },
          { name: 'ankle circles (optional)', sets: 1, reps: '8–10 each direction per ankle', rest: 'As needed', instructions: 'Gentle mobility option only if comfortable and cleared. This is not a corrective routine.', isOptional: true },
        ]
      },
      {
        name: 'Friday: Light chest + back',
        description: 'Light upper-body volume touch-up • Warm-up: 5–7 min walk before; 5 min walk after.',
        exercises: [
          { name: 'chest press machine (light)', sets: 2, reps: '12', rest: '60–90 sec', instructions: 'Easy load; finish well short of failure.' },
          { name: 'lat pulldown (light)', sets: 2, reps: '12', rest: '60–90 sec', instructions: 'Controlled repetitions; no torso swinging.' },
          { name: 'pec deck (light)', sets: 2, reps: '12', rest: '60 sec', instructions: 'Comfortable range and steady breathing.' },
          { name: 'seated cable row (light)', sets: 2, reps: '12', rest: '60–90 sec', instructions: 'Stay upright; avoid jerking.' },
        ]
      },
      {
        name: 'Saturday: Cardio + mobility',
        description: 'Easy conversational cardio & relaxed mobility • Finish with 5 min easy cooldown.',
        exercises: [
          { name: 'easy flat treadmill walk or comfortable cardio', sets: 1, reps: '15–20 min', rest: '—', instructions: 'Easy conversational pace. Choose a pain-free option; stop if symptoms appear.' },
          { name: 'shoulder rolls and shoulder-blade squeezes', sets: 1, reps: '10 each; squeezes 2 × 10', rest: 'As needed', instructions: 'Relaxed, comfortable motion.' },
          { name: 'gentle leg mobility options', sets: 1, reps: 'Optional; clinician-directed', rest: 'As needed', instructions: 'Use only movements your clinician has cleared. Do not use this as a left-leg correction routine.', isOptional: true },
        ]
      }
    ]
  },
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
