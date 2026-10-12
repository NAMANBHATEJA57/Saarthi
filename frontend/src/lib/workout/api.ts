import { findOnlineExerciseByName } from './onlineDataset';

export interface ExerciseMediaDetails {
  animationUrl: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
}

export async function getExerciseMediaDetails(name: string): Promise<ExerciseMediaDetails> {
  try {
    const online = await findOnlineExerciseByName(name);
    if (online) {
      return {
        animationUrl: online.animationUrl || null,
        mediaUrl: online.mediaUrl || null,
        thumbnailUrl: online.thumbnailUrl || null,
      };
    }
  } catch (e) {
    console.warn("Online dataset lookup failed", e);
  }

  return {
    animationUrl: null,
    mediaUrl: null,
    thumbnailUrl: null,
  };
}

export async function getExerciseMedia(name: string): Promise<string | null> {
  const details = await getExerciseMediaDetails(name);
  return details.animationUrl || details.mediaUrl || null;
}
