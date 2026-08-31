import fs from 'fs';
import path from 'path';

// Import local IFCT data to look up ingredients
const ifctRaw = fs.readFileSync(path.join(__dirname, '../src/lib/food/data/ifct.json'), 'utf8');
const ifctData = JSON.parse(ifctRaw);

function getIngredient(name: string) {
  const item = ifctData.find((i: any) => i.name === name);
  if (!item) throw new Error(`Ingredient not found: ${name}`);
  return item;
}

// Engine scale/calculate functions
function scaleNutrients(record: any, targetGrams: number) {
  const multiplier = targetGrams / 100; // IFCT basis is 100g
  
  let baseCals = record.calories / 4.184; // IFCT uses kJ, convert to kcal
  // Fallback to Atwater factors if energy is 0 (e.g. Oils in IFCT)
  if (baseCals === 0) {
    baseCals = (record.protein * 4) + (record.carbohydrates * 4) + (record.fat * 9);
  }

  return {
    calories: baseCals * multiplier,
    protein: record.protein * multiplier,
    fat: record.fat * multiplier,
    carbohydrates: record.carbohydrates * multiplier,
  };
}

function calculateComposite(ingredients: {name: string, weightGrams: number}[]) {
  let totalCals = 0;
  let totalProt = 0;
  let totalFat = 0;
  let totalCarbs = 0;

  for (const ing of ingredients) {
    const record = getIngredient(ing.name);
    const scaled = scaleNutrients(record, ing.weightGrams);
    totalCals += scaled.calories;
    totalProt += scaled.protein;
    totalFat += scaled.fat;
    totalCarbs += scaled.carbohydrates;
  }

  return {
    calories: Number(totalCals.toFixed(2)),
    protein: Number(totalProt.toFixed(2)),
    fat: Number(totalFat.toFixed(2)),
    carbohydrates: Number(totalCarbs.toFixed(2)),
  };
}

const dishes = [
  {
    id: 'curated-rajma-chawal',
    name: 'Rajma Chawal',
    standardServing: { label: '1 Katori Rice + 1 Katori Rajma', grams: 350 },
    ingredients: [
      { name: 'Rice, raw, milled', weightGrams: 100 }, // Raw rice weight (yields ~300g cooked)
      { name: 'Rajmah, red', weightGrams: 50 },        // Raw rajma weight
      { name: 'Onion, big', weightGrams: 30 },
      { name: 'Tomato, ripe, local', weightGrams: 30 },
      { name: 'Sunflower oil', weightGrams: 10 }
    ]
  },
  {
    id: 'curated-dal-chawal',
    name: 'Dal Chawal',
    standardServing: { label: '1 Katori Rice + 1 Katori Dal', grams: 350 },
    ingredients: [
      { name: 'Rice, raw, milled', weightGrams: 100 }, 
      { name: 'Red gram, dal', weightGrams: 50 }, // Toor dal
      { name: 'Onion, big', weightGrams: 20 },
      { name: 'Tomato, ripe, local', weightGrams: 20 },
      { name: 'Sunflower oil', weightGrams: 5 }
    ]
  },
  {
    id: 'curated-khichdi',
    name: 'Khichdi',
    standardServing: { label: '1 Bowl', grams: 300 },
    ingredients: [
      { name: 'Rice, raw, milled', weightGrams: 60 }, 
      { name: 'Green gram, dal', weightGrams: 40 }, // Moong dal
      { name: 'Sunflower oil', weightGrams: 10 }
    ]
  },
  {
    id: 'curated-poha',
    name: 'Poha',
    standardServing: { label: '1 Plate', grams: 200 },
    ingredients: [
      { name: 'Rice, flakes', weightGrams: 80 }, 
      { name: 'Onion, big', weightGrams: 30 },
      { name: 'Sunflower oil', weightGrams: 10 }
    ]
  },
  {
    id: 'curated-paneer-butter-masala',
    name: 'Paneer Butter Masala',
    standardServing: { label: '1 Katori', grams: 200 },
    ingredients: [
      { name: 'Paneer', weightGrams: 100 }, 
      { name: 'Tomato, ripe, local', weightGrams: 50 },
      { name: 'Onion, big', weightGrams: 30 },
      { name: 'Sunflower oil', weightGrams: 15 } // Approximating butter/oil fat
    ]
  }
];

const output = dishes.map(dish => {
  const macros = calculateComposite(dish.ingredients);
  return {
    sourceId: 'curated',
    externalId: dish.id,
    normalizedRecordVersion: '1.0',
    normalizedIdentity: dish.name,
    provenance: { brand: 'Indian Curated MVP' },
    nutrients: [
      { key: 'energy', amount: macros.calories, unit: 'kcal', status: 'known' },
      { key: 'protein', amount: macros.protein, unit: 'g', status: 'known' },
      { key: 'total_fat', amount: macros.fat, unit: 'g', status: 'known' },
      { key: 'carbohydrate', amount: macros.carbohydrates, unit: 'g', status: 'known' },
    ],
    portions: [
      { label: dish.standardServing.label, grams: dish.standardServing.grams, ordering: 1 }
    ],
    fetchedAt: new Date().toISOString()
  };
});

const outputPath = path.join(__dirname, '../src/lib/food/data/indian_curated.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`Successfully built curated catalog with ${output.length} items.`);
