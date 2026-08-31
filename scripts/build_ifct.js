const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const csvPath = path.join(__dirname, '../node_modules/@nodef/ifct2017/compositions/index.csv');
const outputPath = path.join(__dirname, '../src/lib/food/data/ifct.json');

const content = fs.readFileSync(csvPath, 'utf8');

const records = parse(content, {
  columns: true,
  skip_empty_lines: true
});

const outRecords = [];

for (const row of records) {
  const code = row.code;
  const name = row.name;
  const enerc = parseFloat(row.enerc) || 0;
  const fat = parseFloat(row.fatce) || 0;
  const cho = parseFloat(row.choavldf) || 0;
  const prot = parseFloat(row.protcnt) || 0;

  if (code && name) {
    outRecords.push({
      id: `ifct-${code}`,
      name,
      calories: enerc,
      protein: prot,
      fat: fat,
      carbohydrates: cho,
      source: 'ifct',
    });
  }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(outRecords, null, 2));

console.log(`Successfully built ifct.json with ${outRecords.length} items.`);
