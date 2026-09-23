import { FoodSourceAdapter, NormalizedFoodRecord } from '../types';
import ifctData from '../data/ifct.json';

export class IFCTAdapter implements FoodSourceAdapter {
  sourceId = 'ifct';

  private mapRecord(item: any): NormalizedFoodRecord {
    return {
      sourceId: this.sourceId,
      externalId: item.id,
      normalizedRecordVersion: '1.0',
      normalizedIdentity: item.name,
      provenance: { brand: 'IFCT 2017 (India)' },
      nutrients: [
        { key: 'energy', amount: item.calories, unit: 'kcal', status: 'known' },
        { key: 'protein', amount: item.protein, unit: 'g', status: 'known' },
        { key: 'total_fat', amount: item.fat, unit: 'g', status: 'known' },
        { key: 'carbohydrate', amount: item.carbohydrates, unit: 'g', status: 'known' },
      ],
      portions: [
        { label: '100g', grams: 100, ordering: 1 }
      ],
      fetchedAt: new Date()
    };
  }

  async search(query: string): Promise<NormalizedFoodRecord[]> {
    const q = query.toLowerCase();
    
    // Filter the local IFCT JSON database
    return ifctData
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 20) // Limit to top 20 matches
      .map(item => this.mapRecord(item));
  }

  async getDetail(externalId: string): Promise<NormalizedFoodRecord | null> {
    const item = ifctData.find(i => i.id === externalId);
    if (!item) return null;
    return this.mapRecord(item);
  }
}
