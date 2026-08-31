import * as ifct2017 from "@nodef/ifct2017";

async function main() {
  await ifct2017.loadColumns();
  
  console.log("Energy:", ifct2017.columns('energy'));
  console.log("Protein:", ifct2017.columns('protein'));
  console.log("Fat:", ifct2017.columns('fat'));
  console.log("Carb:", ifct2017.columns('carbohydrate'));
}

main().catch(console.error);
