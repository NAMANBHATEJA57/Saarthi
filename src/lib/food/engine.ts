import { NormalizedFoodRecord, NormalizedNutrient } from './types';

export interface RecipeIngredient {
  record: NormalizedFoodRecord;
  weightGrams: number;
}

/**
 * Deterministically scales a food record's nutrients to a specific weight.
 */
export function scaleNutrients(record: NormalizedFoodRecord, targetGrams: number): NormalizedNutrient[] {
  // We assume all IFCT/USDA items have a known 100g basis in this MVP.
  // In a robust system, we would dynamically look up the portion that equals 100g
  // or use the basis property. For our curated dataset, basis is 100g.
  const basisGrams = 100;
  const multiplier = targetGrams / basisGrams;

  return record.nutrients.map(n => ({
    key: n.key,
    amount: Number((n.amount * multiplier).toFixed(2)),
    unit: n.unit,
    status: n.status
  }));
}

/**
 * Deterministically aggregates multiple scaled ingredients into a final composite nutrient profile.
 */
export function calculateCompositeNutrition(ingredients: RecipeIngredient[]): NormalizedNutrient[] {
  const totals = new Map<string, { amount: number, unit: string }>();

  for (const { record, weightGrams } of ingredients) {
    const scaled = scaleNutrients(record, weightGrams);
    for (const n of scaled) {
      const existing = totals.get(n.key) || { amount: 0, unit: n.unit };
      totals.set(n.key, { amount: existing.amount + n.amount, unit: n.unit });
    }
  }

  return Array.from(totals.entries()).map(([key, data]) => ({
    key,
    amount: Number(data.amount.toFixed(2)),
    unit: data.unit,
    status: 'known'
  }));
}
