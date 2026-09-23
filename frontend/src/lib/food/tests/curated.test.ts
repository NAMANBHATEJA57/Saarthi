import { describe, it, expect } from 'vitest';
import { CuratedIndianAdapter } from '../adapters/curated';

describe('Curated Indian Adapter (Accuracy Tests)', () => {
  it('searches and finds Rajma Chawal', async () => {
    const adapter = new CuratedIndianAdapter();
    const results = await adapter.search('rajma');
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].normalizedIdentity).toBe('Rajma Chawal');
    
    const energy = results[0].nutrients.find(n => n.key === 'energy');
    const protein = results[0].nutrients.find(n => n.key === 'protein');
    
    // According to our IFCT-based engine generation:
    // 100g Rice (raw) = ~356 kcal
    // 50g Rajma (raw) = ~173 kcal
    // 30g Onion + 30g Tomato = ~20 kcal
    // 10g Sunflower Oil = ~90 kcal
    // Total should be around 630-640 kcal
    expect(energy).toBeDefined();
    expect(energy?.amount).toBeGreaterThan(600);
    expect(energy?.amount).toBeLessThan(700);

    // Protein: Rice (~8g) + Rajma (~12g) = ~20g
    expect(protein).toBeDefined();
    expect(protein?.amount).toBeGreaterThan(15);
    expect(protein?.amount).toBeLessThan(25);
  });

  it('provides detail by externalId', async () => {
    const adapter = new CuratedIndianAdapter();
    const detail = await adapter.getDetail('curated-paneer-butter-masala');
    
    expect(detail).not.toBeNull();
    expect(detail?.normalizedIdentity).toBe('Paneer Butter Masala');
  });
});
