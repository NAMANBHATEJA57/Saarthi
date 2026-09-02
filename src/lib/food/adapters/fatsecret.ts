import { FoodSourceAdapter, NormalizedFoodRecord, NormalizedNutrient, NormalizedPortion } from '../types';

export class FatSecretAdapter implements FoodSourceAdapter {
  sourceId = 'fatsecret';
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  private get clientId() {
    return process.env.FATSECRET_CLIENT_ID || '';
  }

  private get clientSecret() {
    return process.env.FATSECRET_CLIENT_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('FATSECRET_CLIENT_ID or FATSECRET_CLIENT_SECRET is not set');
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'basic');

    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store'
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('FatSecret Token Error:', err);
      throw new Error('Failed to get FatSecret access token');
    }

    const data = await res.json();
    this.accessToken = data.access_token;
    // Expires in seconds. We subtract 60s for a safety buffer.
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;

    return this.accessToken!;
  }

  async search(query: string): Promise<NormalizedFoodRecord[]> {
    try {
      const token = await this.getAccessToken();
      const url = new URL('https://platform.fatsecret.com/rest/server.api');
      url.searchParams.append('method', 'foods.search');
      url.searchParams.append('search_expression', query);
      url.searchParams.append('format', 'json');
      url.searchParams.append('max_results', '15'); // Limit results for performance

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`FatSecret API Error: ${res.statusText}`);

      const data = await res.json();
      
      // FatSecret returns { foods: { food: [...] } } or { foods: { food: {...} } } if only 1 result
      if (!data.foods || !data.foods.food) return [];

      const foodsArray = Array.isArray(data.foods.food) ? data.foods.food : [data.foods.food];

      return foodsArray.map((f: any) => ({
        sourceId: this.sourceId,
        externalId: String(f.food_id),
        normalizedRecordVersion: '1',
        normalizedIdentity: `${f.brand_name ? f.brand_name + ' ' : ''}${f.food_name}`,
        provenance: f,
        nutrients: [], // FatSecret search doesn't return full nutrients reliably, needs getDetail
        portions: [],
        fetchedAt: new Date()
      }));
    } catch (error) {
      console.error('FatSecret Search Error:', error);
      return [];
    }
  }

  async getDetail(externalId: string): Promise<NormalizedFoodRecord | null> {
    try {
      const token = await this.getAccessToken();
      const url = new URL('https://platform.fatsecret.com/rest/server.api');
      url.searchParams.append('method', 'food.get.v2');
      url.searchParams.append('food_id', externalId);
      url.searchParams.append('format', 'json');

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`FatSecret API Error: ${res.statusText}`);

      const data = await res.json();
      if (!data.food) return null;

      const f = data.food;
      
      // Servings can be an array or a single object
      if (!f.servings || !f.servings.serving) return null;
      const servings = Array.isArray(f.servings.serving) ? f.servings.serving : [f.servings.serving];
      
      // We'll pick the standard serving (e.g. 100g if available, or the first one)
      const serving = servings.find((s: any) => s.metric_serving_amount === "100.000") || servings[0];
      
      const nutrients: NormalizedNutrient[] = [
        { key: 'energy', amount: parseFloat(serving.calories || '0'), unit: 'kcal', status: serving.calories ? 'known' : 'missing' },
        { key: 'protein', amount: parseFloat(serving.protein || '0'), unit: 'g', status: serving.protein ? 'known' : 'missing' },
        { key: 'carbohydrates', amount: parseFloat(serving.carbohydrate || '0'), unit: 'g', status: serving.carbohydrate ? 'known' : 'missing' },
        { key: 'fat', amount: parseFloat(serving.fat || '0'), unit: 'g', status: serving.fat ? 'known' : 'missing' }
      ];
      
      // Optionally add more nutrients (sugar, sodium, fiber) if present
      if (serving.sugar) nutrients.push({ key: 'sugar', amount: parseFloat(serving.sugar), unit: 'g', status: 'known' });
      if (serving.fiber) nutrients.push({ key: 'fiber', amount: parseFloat(serving.fiber), unit: 'g', status: 'known' });
      if (serving.sodium) nutrients.push({ key: 'sodium', amount: parseFloat(serving.sodium), unit: 'mg', status: 'known' });

      // Build portions
      const portions: NormalizedPortion[] = servings.map((s: any, idx: number) => ({
        label: s.measurement_description || s.serving_description,
        grams: s.metric_serving_amount ? parseFloat(s.metric_serving_amount) : undefined,
        ordering: idx
      }));

      // Add a default 100g portion if not present
      if (!portions.find(p => p.grams === 100)) {
        portions.push({ label: '100g', grams: 100, ordering: 99 });
      }

      return {
        sourceId: this.sourceId,
        externalId: String(f.food_id),
        normalizedRecordVersion: '1',
        normalizedIdentity: `${f.brand_name ? f.brand_name + ' ' : ''}${f.food_name}`,
        provenance: f,
        nutrients,
        portions,
        fetchedAt: new Date()
      };
    } catch (error) {
      console.error('FatSecret GetDetail Error:', error);
      return null;
    }
  }
}
