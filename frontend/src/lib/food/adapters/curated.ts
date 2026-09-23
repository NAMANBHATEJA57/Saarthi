import { FoodSourceAdapter, NormalizedFoodRecord } from '../types';
import curatedData from '../data/indian_curated.json';

export class CuratedIndianAdapter implements FoodSourceAdapter {
  sourceId = 'curated';

  async search(query: string): Promise<NormalizedFoodRecord[]> {
    const q = query.toLowerCase();
    
    // Filter the local curated JSON database
    return curatedData
      .filter(item => item.normalizedIdentity.toLowerCase().includes(q))
      .slice(0, 20) // Limit to top matches
      .map(item => ({
        ...item,
        fetchedAt: new Date(item.fetchedAt)
      }) as NormalizedFoodRecord);
  }

  async getDetail(externalId: string): Promise<NormalizedFoodRecord | null> {
    const item = curatedData.find(i => i.externalId === externalId);
    if (!item) return null;
    return {
      ...item,
      fetchedAt: new Date(item.fetchedAt)
    } as NormalizedFoodRecord;
  }
}
