import { describe, it, expect } from 'vitest';
import { calculateCompositeNutrition, scaleNutrients, RecipeIngredient } from '../engine';
import { NormalizedFoodRecord } from '../types';

describe('Nutrition Engine', () => {
  it('deterministically scales nutrients', () => {
    const mockRice: NormalizedFoodRecord = {
      sourceId: 'test',
      externalId: '1',
      normalizedIdentity: 'Raw Rice',
      normalizedRecordVersion: '1',
      fetchedAt: new Date(),
      portions: [],
      nutrients: [
        { key: 'energy', amount: 350, unit: 'kcal', status: 'known' },
        { key: 'protein', amount: 8, unit: 'g', status: 'known' }
      ]
    };

    // 150g = 1.5x multiplier
    const scaled = scaleNutrients(mockRice, 150);
    expect(scaled.find(n => n.key === 'energy')?.amount).toBe(525);
    expect(scaled.find(n => n.key === 'protein')?.amount).toBe(12);
  });

  it('aggregates composite dishes correctly', () => {
    const mockRice: NormalizedFoodRecord = {
      sourceId: 'test',
      externalId: '1',
      normalizedIdentity: 'Raw Rice',
      normalizedRecordVersion: '1',
      fetchedAt: new Date(),
      portions: [],
      nutrients: [
        { key: 'energy', amount: 350, unit: 'kcal', status: 'known' }
      ]
    };

    const mockDal: NormalizedFoodRecord = {
      sourceId: 'test',
      externalId: '2',
      normalizedIdentity: 'Raw Dal',
      normalizedRecordVersion: '1',
      fetchedAt: new Date(),
      portions: [],
      nutrients: [
        { key: 'energy', amount: 300, unit: 'kcal', status: 'known' }
      ]
    };

    // 100g Rice + 50g Dal = 350 + 150 = 500 kcal
    const composite = calculateCompositeNutrition([
      { record: mockRice, weightGrams: 100 },
      { record: mockDal, weightGrams: 50 }
    ]);

    expect(composite.find(n => n.key === 'energy')?.amount).toBe(500);
  });
});
