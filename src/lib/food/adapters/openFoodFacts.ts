import { FoodSourceAdapter, NormalizedFoodRecord, NormalizedNutrient, NormalizedPortion } from '../types';

export class OpenFoodFactsAdapter implements FoodSourceAdapter {
  sourceId = 'open_food_facts';
  private baseUrl = 'https://world.openfoodfacts.org/cgi/search.pl';

  async search(query: string): Promise<NormalizedFoodRecord[]> {
    const url = new URL(this.baseUrl);
    url.searchParams.append('search_terms', query);
    url.searchParams.append('search_simple', '1');
    url.searchParams.append('action', 'process');
    url.searchParams.append('json', '1');
    url.searchParams.append('page_size', '20');
    url.searchParams.append('fields', 'id,product_name,brands,nutriments,serving_quantity,serving_size');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    try {
      const response = await fetch(url.toString(), {
        headers: { 'User-Agent': 'PersonalOSFoodMVP/1.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) return [];
      const data = await response.json();
      
      return data.products.map((food: any) => this.normalize(food));
    } catch (e) {
      clearTimeout(timeout);
      console.error('OFF search error:', e);
      return [];
    }
  }

  async getDetail(externalId: string): Promise<NormalizedFoodRecord | null> {
    const url = `https://world.openfoodfacts.org/api/v2/product/${externalId}?fields=id,product_name,brands,nutriments,serving_quantity,serving_size`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PersonalOSFoodMVP/1.0' },
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) return null;
      const data = await response.json();
      if (!data.product) return null;
      return this.normalize(data.product);
    } catch (e) {
      clearTimeout(timeout);
      console.error('OFF detail error:', e);
      return null;
    }
  }

  private normalize(food: any): NormalizedFoodRecord {
    const nutrients: NormalizedNutrient[] = [];
    if (food.nutriments) {
      const addNutrient = (offKey: string, ourKey: string, defaultUnit: string) => {
        const amount = food.nutriments[`${offKey}_100g`];
        const unit = food.nutriments[`${offKey}_unit`] || defaultUnit;
        if (amount !== undefined && amount !== null) {
          nutrients.push({
            key: ourKey,
            amount: Number(amount),
            unit: unit,
            status: 'known',
          });
        }
      };

      addNutrient('energy-kcal', 'calories', 'kcal');
      addNutrient('proteins', 'protein', 'g');
      addNutrient('carbohydrates', 'carbohydrates', 'g');
      addNutrient('fat', 'fat', 'g');
      addNutrient('fiber', 'fiber', 'g');
      addNutrient('sugars', 'sugar', 'g');
      addNutrient('sodium', 'sodium', 'g');
    }

    const portions: NormalizedPortion[] = [];
    
    // Always add 100g base for OFF
    portions.push({ label: '100g', grams: 100, ordering: 0 });

    if (food.serving_quantity) {
      portions.push({
        label: food.serving_size || 'serving',
        grams: Number(food.serving_quantity),
        ordering: 1,
      });
    }

    return {
      sourceId: this.sourceId,
      externalId: String(food.id),
      normalizedRecordVersion: '1.0',
      normalizedIdentity: food.product_name || 'Unknown Product',
      provenance: { brand: food.brands },
      nutrients,
      portions,
      fetchedAt: new Date(),
    };
  }
}
