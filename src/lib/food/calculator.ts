import { NormalizedNutrient, NormalizedPortion } from './types';

export interface CalculatedNutrient {
  key: string;
  amount: number;
  unit: string;
  status: 'known' | 'missing' | 'imputed';
}

export class NutritionCalculator {
  /**
   * Scale base nutrients based on the selected portion and quantity.
   * 
   * @param baseNutrients The nutrients for the base reference (e.g. per 100g or per 1 serving)
   * @param baseGrams The gram weight of the base reference (e.g. 100 for 100g, or the serving weight)
   * @param selectedPortion The portion the user selected
   * @param quantity The multiplier the user entered
   */
  static calculate(
    baseNutrients: NormalizedNutrient[], 
    baseGrams: number, 
    selectedPortion: NormalizedPortion, 
    quantity: number
  ): CalculatedNutrient[] {
    const calculated: CalculatedNutrient[] = [];

    // If the food has no gram weight for the base or the selected portion, we can only scale
    // if the selected portion is exactly the base portion (i.e. 'serving' -> 'serving').
    // In our simplified model, the adapters normalize everything to a 100g basis where possible, 
    // or provide the gram equivalent.

    const targetGrams = (selectedPortion.grams || baseGrams) * quantity;
    const scaleFactor = baseGrams > 0 ? (targetGrams / baseGrams) : quantity;

    for (const nut of baseNutrients) {
      if (nut.status === 'missing') {
        calculated.push({ ...nut, amount: 0 }); // Missing remains missing
        continue;
      }

      // We use Decimal-like precision for JS numbers where possible, rounding to 2 decimal places.
      const scaledAmount = Math.round((nut.amount * scaleFactor) * 100) / 100;
      
      calculated.push({
        key: nut.key,
        amount: scaledAmount,
        unit: nut.unit,
        status: nut.status,
      });
    }

    return calculated;
  }

  static sumNutrients(items: CalculatedNutrient[][]): CalculatedNutrient[] {
    const sums = new Map<string, CalculatedNutrient>();

    for (const item of items) {
      for (const nut of item) {
        if (!sums.has(nut.key)) {
          sums.set(nut.key, { ...nut, amount: 0 });
        }
        
        const current = sums.get(nut.key)!;
        if (nut.status !== 'missing' && current.status !== 'missing') {
          current.amount += nut.amount;
        } else {
          // If any item is missing this nutrient, the sum is considered missing/incomplete
          current.status = 'missing';
        }
      }
    }

    return Array.from(sums.values()).map(n => ({
      ...n,
      amount: Math.round(n.amount * 100) / 100
    }));
  }
}
