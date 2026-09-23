import { FoodSourceAdapter, NormalizedFoodRecord, NormalizedNutrient, NormalizedPortion } from '../types';

export class USDAAdapter implements FoodSourceAdapter {
  sourceId = 'usda';
  private apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
  private baseUrl = 'https://api.nal.usda.gov/fdc/v1';

  async search(query: string): Promise<NormalizedFoodRecord[]> {
    const url = new URL(`${this.baseUrl}/foods/search`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('query', query);
    url.searchParams.append('pageSize', '20');

    try {
      const response = await fetch(url.toString());
      if (!response.ok) return [];
      const data = await response.json();
      
      return data.foods.map((food: any) => this.normalize(food));
    } catch (e) {
      console.error('USDA search error:', e);
      return [];
    }
  }

  async getDetail(externalId: string): Promise<NormalizedFoodRecord | null> {
    const url = new URL(`${this.baseUrl}/food/${externalId}`);
    url.searchParams.append('api_key', this.apiKey);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) return null;
      const data = await response.json();
      return this.normalize(data);
    } catch (e) {
      console.error('USDA detail error:', e);
      return null;
    }
  }

  private normalize(food: any): NormalizedFoodRecord {
    // Basic mapping of USDA nutrients
    const nutrients: NormalizedNutrient[] = (food.foodNutrients || []).map((fn: any) => {
      return {
        key: fn.nutrientName?.toLowerCase() || 'unknown',
        amount: fn.value || fn.amount || 0,
        unit: fn.unitName || fn.nutrient?.unitName || 'g',
        status: 'known',
      } as NormalizedNutrient;
    });

    const portions: NormalizedPortion[] = [];
    if (food.foodMeasures && food.foodMeasures.length > 0) {
      food.foodMeasures.forEach((measure: any, idx: number) => {
        portions.push({
          label: measure.disseminationText || 'serving',
          grams: measure.gramWeight,
          ordering: idx,
        });
      });
    } else {
      // default 100g basis
      portions.push({ label: '100g', grams: 100, ordering: 0 });
    }

    return {
      sourceId: this.sourceId,
      externalId: String(food.fdcId),
      normalizedRecordVersion: '1.0',
      normalizedIdentity: food.description,
      provenance: { brand: food.brandOwner },
      nutrients,
      portions,
      fetchedAt: new Date(),
    };
  }
}
