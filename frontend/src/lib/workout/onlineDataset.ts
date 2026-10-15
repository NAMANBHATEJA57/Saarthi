export interface OnlineExercise {
  id: string;
  name: string;
  category: string;
  bodyPart: string;
  target: string;
  muscle: string;
  equipment: string;
  secondaryMuscles: string[];
  type: 'strength' | 'bodyweight' | 'cardio' | 'timed';
  instructions: string;
  instructionSteps: string[];
  thumbnailUrl: string;
  mediaUrl: string;
  animationUrl: string;
  source: string;
  attribution: string;
}

const DATASET_URL = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main/data/exercises.json';
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/hasaneyldrm/exercises-dataset@main';

let cachedDataset: OnlineExercise[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in memory

const MUSCLE_ALIASES: Record<string, string[]> = {
  'deltoids': ['shoulders', 'delts', 'deltoids'],
  'quadriceps': ['upper legs', 'quads', 'quadriceps', 'thighs'],
  'hamstring': ['upper legs', 'hamstrings', 'hamstring'],
  'gluteal': ['upper legs', 'glutes', 'gluteal', 'hips'],
  'adductors': ['upper legs', 'adductors', 'groin'],
  'calves': ['lower legs', 'calves', 'gastrocnemius', 'soleus'],
  'tibialis': ['lower legs', 'tibialis', 'shins'],
  'forearm': ['lower arms', 'forearms', 'forearm', 'wrists'],
  'biceps': ['upper arms', 'biceps'],
  'triceps': ['upper arms', 'triceps'],
  'upper-back': ['back', 'upper back', 'lats', 'traps', 'rhomboids'],
  'lower-back': ['back', 'lower back', 'spine', 'erector spinae'],
  'trapezius': ['back', 'traps', 'trapezius', 'neck'],
  'abs': ['waist', 'abs', 'abdominals', 'core'],
  'obliques': ['waist', 'obliques', 'core'],
  'chest': ['chest', 'pectorals', 'pecs'],
  'serratus': ['chest', 'serratus anterior', 'waist'],
  'hip-flexors': ['waist', 'hip flexors', 'upper legs'],
};

function formatExerciseName(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : '')
    .join(' ');
}

export async function fetchOnlineDataset(): Promise<OnlineExercise[]> {
  const now = Date.now();
  if (cachedDataset && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedDataset;
  }

  const response = await fetch(DATASET_URL, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to load online exercises dataset: ${response.statusText}`);
  }

  const rawList = await response.json();

  const dataset = rawList.map((item: any): OnlineExercise => {
    const rawEquipment = (item.equipment || '').toLowerCase();
    const isBodyweight = rawEquipment === 'body weight' || rawEquipment === 'bodyweight';
    const isCardio = (item.category || '').toLowerCase() === 'cardio';

    let type: OnlineExercise['type'] = 'strength';
    if (isBodyweight) type = 'bodyweight';
    else if (isCardio) type = 'cardio';

    const englishInstructions = item.instructions?.en || '';
    const englishSteps = item.instruction_steps?.en || [];

    return {
      id: String(item.id),
      name: formatExerciseName(item.name),
      category: item.category || '',
      bodyPart: item.body_part || '',
      target: item.target || '',
      muscle: item.target || item.body_part || '',
      equipment: item.equipment || 'body weight',
      secondaryMuscles: Array.isArray(item.secondary_muscles) ? item.secondary_muscles : [],
      type,
      instructions: englishInstructions,
      instructionSteps: englishSteps,
      thumbnailUrl: `${CDN_BASE}/${item.image}`,
      mediaUrl: `${CDN_BASE}/${item.image}`,
      animationUrl: `${CDN_BASE}/${item.gif_url}`,
      source: 'exercises-dataset',
      attribution: item.attribution || '© Gym visual — https://gymvisual.com/',
    };
  });

  cachedDataset = dataset;
  lastFetchTime = now;
  return dataset;
}

export interface SearchExercisesParams {
  query?: string;
  muscle?: string;
  equipment?: string;
  limit?: number;
}

export async function searchOnlineExercises({
  query = '',
  muscle = '',
  equipment = '',
  limit = 60,
}: SearchExercisesParams): Promise<OnlineExercise[]> {
  const dataset = await fetchOnlineDataset();

  const cleanQuery = query.trim().toLowerCase();
  const cleanMuscle = muscle.trim().toLowerCase();
  const cleanEquipment = equipment.trim().toLowerCase();

  const aliasTerms = cleanMuscle && MUSCLE_ALIASES[cleanMuscle] ? MUSCLE_ALIASES[cleanMuscle] : [cleanMuscle].filter(Boolean);

  const scoredResults = dataset
    .map((ex) => {
      let score = 0;

      // 1. Muscle filter
      if (aliasTerms.length > 0) {
        const exBody = ex.bodyPart.toLowerCase();
        const exTarget = ex.target.toLowerCase();
        const exMuscle = ex.muscle.toLowerCase();
        const exSecondaries = ex.secondaryMuscles.map(m => m.toLowerCase());

        const matchesPrimary = aliasTerms.some(term => 
          exTarget.includes(term) || exMuscle.includes(term) || exBody.includes(term)
        );
        const matchesSecondary = exSecondaries.some(s => aliasTerms.some(term => s.includes(term)));

        if (!matchesPrimary && !matchesSecondary) return null;
        score += matchesPrimary ? 25 : 5;
      }

      // 2. Equipment filter
      if (cleanEquipment) {
        const isBwFilter = cleanEquipment === 'bodyweight' || cleanEquipment === 'body weight';
        const isBwExercise = ex.equipment.toLowerCase() === 'body weight' || ex.equipment.toLowerCase() === 'bodyweight';
        if (isBwFilter) {
          if (!isBwExercise) return null;
        } else if (!ex.equipment.toLowerCase().includes(cleanEquipment)) {
          return null;
        }
      }

      // 3. Search query filter
      if (cleanQuery) {
        const exName = ex.name.toLowerCase();
        if (exName === cleanQuery) score += 50;
        else if (exName.startsWith(cleanQuery)) score += 30;
        else if (exName.includes(cleanQuery)) score += 20;
        else if (ex.target.toLowerCase().includes(cleanQuery)) score += 10;
        else if (ex.equipment.toLowerCase().includes(cleanQuery)) score += 5;
        else return null;
      }

      return { ex, score };
    })
    .filter((item): item is { ex: OnlineExercise; score: number } => item !== null);

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, limit).map(item => item.ex);
}

const STOP_WORDS = new Set(['on', 'in', 'the', 'a', 'an', 'with', 'and', 'for', 'to', 'of', 'v', 'up', 'at', 'by', 'as', 'or', 'no', 'out', 'down']);

const EXERCISE_SYNONYMS: Record<string, string> = {
  'treadmill warm-up': 'Walking On Incline Treadmill',
  'comfortable treadmill warm-up': 'Walking On Incline Treadmill',
  'comfortable treadmill walking': 'Walking On Incline Treadmill',
  'comfortable treadmill walk': 'Walking On Incline Treadmill',
  'easy treadmill walking': 'Walking On Incline Treadmill',
  'easy flat treadmill walk': 'Walking On Incline Treadmill',
  'flat treadmill walk': 'Walking On Incline Treadmill',
  'flat treadmill walking': 'Walking On Incline Treadmill',
  'chest press machine': 'Machine Inner Chest Press',
  'incline chest press machine': 'Lever Incline Chest Press',
  'pec deck machine': 'Lever Seated Fly',
  'lateral raises (light dumbbells)': 'Dumbbell Lateral Raise',
  'lateral raise': 'Dumbbell Lateral Raise',
  'triceps pushdown': 'Cable Triceps Pushdown (v-bar)',
  'cable triceps pushdown': 'Cable Triceps Pushdown (v-bar)',
  'chest-supported row machine': 'Lever Seated Row',
  'seated cable row': 'Cable Seated Row',
  'lat pulldown': 'Cable Lat Pulldown Full Range Of Motion',
  'standing dumbbell biceps curl': 'Dumbbell Biceps Curl',
  'dumbbell hammer curls': 'Dumbbell Hammer Curl',
  'dumbbell hammer curl': 'Dumbbell Hammer Curl',
  'bodyweight squat': 'Bodyweight Squatting Row',
  'supported sit-to-stand or shallow bodyweight squat': 'Bodyweight Squatting Row',
  'leg extension machine': 'Lever Leg Extension',
  'seated leg curl': 'Lever Seated Leg Curl',
  'seated leg curl (hamstrings/glute assistance)': 'Lever Seated Leg Curl',
  'supported calf raises': 'Bodyweight Standing Calf Raise',
  'supported heel raises': 'Bodyweight Standing Calf Raise',
  'reverse pec deck / rear-delt machine': 'Lever Seated Reverse Fly',
  'shoulder press machine': 'Lever Military Press',
  'light face pulls or supported cable rear-delt pull': 'Cable Rear Delt Row (stirrups)',
  'glute machine / light hip extension': 'Lever Hip Extension V. 2',
  'neck rotations': 'Neck Side Stretch',
  'shoulder rolls': 'Arm Circles (male)',
  'shoulder blade squeezes': 'Scapular Pull-up',
  'ankle circles': 'Ankle Circles',
  'seated hamstring stretch': 'Hamstring Stretch',
  'gentle seated hamstring stretch (optional)': 'Hamstring Stretch',
  'gentle chest stretch at wall': 'Dynamic Chest Stretch (male)',
  'seated leg extension (optional)': 'Lever Leg Extension',
  'seated leg extension': 'Lever Leg Extension',
  'seated leg curl (optional)': 'Lever Seated Leg Curl',
  'leg press (optional)': 'Lever Leg Press',
  'leg press': 'Lever Leg Press',
  'seated machine shoulder press (light)': 'Lever Military Press',
  'seated machine shoulder press': 'Lever Military Press',
  'dumbbell lateral raise (light)': 'Dumbbell Lateral Raise',
  'dumbbell lateral raise': 'Dumbbell Lateral Raise',
  'reverse pec deck': 'Lever Seated Reverse Fly',
  'ankle circles (optional)': 'Ankle Circles',
  'chest press machine (light)': 'Machine Inner Chest Press',
  'lat pulldown (light)': 'Cable Lat Pulldown Full Range Of Motion',
  'pec deck (light)': 'Lever Seated Fly',
  'seated cable row (light)': 'Cable Seated Row',
  'easy flat treadmill walk or comfortable cardio': 'Walking On Incline Treadmill',
  'shoulder rolls and shoulder-blade squeezes': 'Arm Circles (male)',
  'gentle leg mobility options': 'Hamstring Stretch',
};

function getTokens(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

export async function findOnlineExerciseByName(name: string): Promise<OnlineExercise | null> {
  if (!name) return null;
  const dataset = await fetchOnlineDataset();
  const cleanName = name.trim().toLowerCase();

  // 0. Curated synonym lookup
  if (EXERCISE_SYNONYMS[cleanName]) {
    const targetName = EXERCISE_SYNONYMS[cleanName].toLowerCase();
    const synonymMatch = dataset.find(ex => ex.name.toLowerCase() === targetName);
    if (synonymMatch) return synonymMatch;
  }

  // 1. Exact match
  const exact = dataset.find(ex => ex.name.toLowerCase() === cleanName);
  if (exact) return exact;

  // 2. Substring match
  const sub = dataset.find(ex => ex.name.toLowerCase().includes(cleanName) || cleanName.includes(ex.name.toLowerCase()));
  if (sub) return sub;

  // 3. Keyword / token intersection match (e.g. 'treadmill walking' -> 'Walking On Incline Treadmill')
  const tokens = getTokens(cleanName);
  if (tokens.length === 0) return null;

  let best: OnlineExercise | null = null;
  let bestScore = -1;

  for (const ex of dataset) {
    const exNameLower = ex.name.toLowerCase();
    const exTokens = getTokens(exNameLower);

    const matchCount = tokens.filter(t => exTokens.includes(t) || exTokens.some(et => et.includes(t) || t.includes(et))).length;
    const tokenScore = matchCount / tokens.length;

    if (tokenScore < 0.5) continue;

    let score = tokenScore * 10;
    if (exNameLower.includes(cleanName)) score += 15;
    if (cleanName.includes(exNameLower)) score += 10;
    score -= Math.abs(exNameLower.length - cleanName.length) * 0.1;

    if (score > bestScore) {
      bestScore = score;
      best = ex;
    }
  }

  return best;
}
