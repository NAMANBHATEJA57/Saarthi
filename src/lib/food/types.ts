export interface NormalizedNutrient {
  key: string;
  amount: number;
  unit: string;
  basis?: string;
  status: 'known' | 'missing' | 'imputed';
}

export interface NormalizedPortion {
  label: string;
  grams?: number;
  milliliters?: number;
  ordering: number;
}

export interface NormalizedFoodRecord {
  sourceId: string;
  externalId: string;
  normalizedRecordVersion: string;
  normalizedIdentity: string;
  provenance?: any;
  nutrients: NormalizedNutrient[];
  portions: NormalizedPortion[];
  fetchedAt: Date;
}

export interface SearchResult {
  sourceId: string;
  externalId: string;
  identity: string;
  reliabilityScore: number;
  freshnessScore: number;
  completenessScore: number;
  matchScore: number; // Will be calculated by ranking service
}

export interface FoodSourceAdapter {
  sourceId: string;
  search(query: string): Promise<NormalizedFoodRecord[]>;
  getDetail(externalId: string): Promise<NormalizedFoodRecord | null>;
}
