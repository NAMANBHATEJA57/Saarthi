export interface ExternalExercise {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

const BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main';

export async function fetchExercisesAPI(): Promise<ExternalExercise[]> {
  try {
    const res = await fetch(`${BASE_URL}/dist/exercises.json`, {
      next: { revalidate: 86400 } // cache for 24 hours
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch exercises API: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching exercise API", error);
    return [];
  }
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function getExerciseMedia(name: string): Promise<string | null> {
  const normalizedTarget = normalizeName(name);

  // TIER 1: ExerciseDB (RapidAPI)
  if (process.env.EXERCISEDB_API_KEY) {
    try {
      const exDbUrl = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`;
      const res = await fetch(exDbUrl, {
        headers: {
          'X-RapidAPI-Key': process.env.EXERCISEDB_API_KEY,
          'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].gifUrl) {
          return data[0].gifUrl;
        }
      }
    } catch (e) {
      console.warn("ExerciseDB fetch failed, falling back...", e);
    }
  }

  // TIER 2: Wger API (Attempt basic search)
  try {
    const wgerUrl = `https://wger.de/api/v2/exercise/?name=${encodeURIComponent(name)}&language=2`;
    const res = await fetch(wgerUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.results && data.results.length > 0) {
        const exerciseId = data.results[0].id;
        // Fetch image for this exercise
        const imgRes = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise=${exerciseId}`);
        if (imgRes.ok) {
          const imgData = await imgRes.json();
          if (imgData.results && imgData.results.length > 0) {
            return imgData.results[0].image;
          }
        }
      }
    }
  } catch (e) {
    console.warn("Wger fetch failed, falling back...", e);
  }

  // TIER 3: Free-Exercise-DB (GitHub JSON)
  try {
    const exercises = await fetchExercisesAPI();
    
    // Try exact match first
    let match = exercises.find(ex => normalizeName(ex.name) === normalizedTarget);
    
    // If not found, try partial match
    if (!match) {
      match = exercises.find(ex => normalizeName(ex.name).includes(normalizedTarget) || normalizedTarget.includes(normalizeName(ex.name)));
    }

    if (match && match.images && match.images.length > 0) {
      return `${BASE_URL}/exercises/${match.images[0]}`;
    }
  } catch (e) {
    console.warn("Free-Exercise-DB fetch failed", e);
  }

  return null;
}
