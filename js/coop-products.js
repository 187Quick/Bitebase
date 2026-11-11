// Passende Coop-Produkte zu den Rezept-Zutaten, recherchiert auf coop.ch (Stand: November 2026).
// Sortiment, Packungsgrössen und Verfügbarkeit können sich ändern; der Link führt zur Produktseite.
// Aufbau: Zutat (Name aus js/foods.js) → [Produktname, Packung, Link, optionaler Hinweis]
const P = 'https://www.coop.ch/';

const PRODUCTS = {
  'Haferflocken': ['Bio 365 Haferflöckli fein', '500 g', P + 'de/lebensmittel/vorraete/mueesli-cerealien/mueesli/getreideflocken/bio-365-haferfloeckli-fein/p/7381358'],
  'Magermilch': ['Milchdrink UHT 1.5 % IP-Suisse', '1 l', P + 'en/food/dairy-products-eggs/milk/uht-milk/semi-skimmed-milk-uht-15-ip-suisse/p/6850517', 'Magermilch gibt es online nur im 6er-Pack, der Milchdrink passt genauso.'],
  'Milchdrink (teilentrahmt)': ['Milchdrink UHT 1.5 % IP-Suisse', '1 l', P + 'en/food/dairy-products-eggs/milk/uht-milk/semi-skimmed-milk-uht-15-ip-suisse/p/6850517'],
  'Whey-Proteinpulver': ['High Protein Whey Vanille', '750 g', P + 'en/food/specific-diets/sports-nutrition-proteins/powder/high-protein-vanilla-whey/p/7241006'],
  'Skyr nature': ['Naturaplan Bio Skyr Nature', '400 g', P + 'en/food/dairy-products-eggs/yogurt/natural-yogurt/naturaplan-bio-skyr-nature/p/7396446'],
  'Magerquark': ['Naturaplan Bio Demeter Magerquark', '250 g', P + 'en/food/dairy-products-eggs/quark/natural-quark/naturaplan-bio-demeter-magerquark/p/7460515'],
  'Hüttenkäse': ['Hirz Hüttenkäse Nature', '200 g', P + 'de/lebensmittel/milchprodukte-eier/abgepackter-kaese/frischkaese-mozzarella/huettenkaese/hirz-huettenkaese-nature/p/3081176'],
  'Naturjoghurt mager': ['Hirz Jogurt Nature 0 % Fett', '2 × 180 g', P + 'en/food/dairy-products-eggs/yogurt/natural-yogurt/hirz-natural-yogurt-0-fat/p/5743203'],
  'Ei': ['Naturafarm Freilandeier 53 g+', '6 Stück', P + 'en/food/dairy-products-eggs/eggs/raw-eggs/naturafarm-free-range-eggs-53g-6-pieces/p/3080069'],
  'Butter': ['Butter pasteurisiert', '250 g', P + 'en/food/dairy-products-eggs/butter-margarine/cooking-butter-cooking-fat/pasteurized-butter/p/3642453'],
  'Halbrahm': ['Halbrahm UHT 25 % Fett', '250 ml', P + 'en/food/dairy-products-eggs/cream/full-fat-cream-half-fat-cream/uht-light-cream-25-fat/p/3080178'],
  'Feta': ['Hotos Griechischer Feta', '200 g', P + 'en/food/dairy-products-eggs/packaged-cheese/sheep-goat-feta-cheese/feta-halloumi/hotos-greek-feta-cheese/p/3080711'],
  'Gruyère': ['Le Gruyère mild AOP', 'ca. 250 g', P + 'de/lebensmittel/milchprodukte-eier/chaes-huesli/le-gruyere-mild-aop/p/3080221'],
  'Parmesan': ['Naturaplan Bio Parmigiano Reggiano', 'ca. 200 g', P + 'en/food/dairy-products-eggs/packaged-cheese/hard-semi-hard-cheese/sbrinz-parmesan-gruyere/naturaplan-organic-parmigiano-reggiano-ca/p/6083712'],

  'Pouletbrust (roh)': ['Naturafarm Pouletbrust', '2 Stück, ca. 250 g', P + 'de/lebensmittel/fleisch-fisch/abgepacktes-frischfleisch/gefluegel/naturafarm-pouletbrust-2-stueck-ca/p/3066950'],
  'Trutenbrust (roh)': ['Prix Garantie Truten-Minutenschnitzel', 'ca. 400 g', P + 'en/food/meat-fish/packaged-fresh-meat/poultry/prix-garantie-truten-minschnitzca/p/6976853'],
  'Rindshackfleisch mager (roh)': ['Prix Garantie Rindshackfleisch low Fett', 'ca. 600 g', P + 'de/lebensmittel/fleisch-fisch/abgepacktes-frischfleisch/hackfleisch/prix-garantie-rindshackfleisch-low-fett-ca/p/7369961'],
  'Hinterschinken': ['Naturaplan Bio Hinterschinken', '80 g', P + 'en/food/meat-fish/cold-cuts-sausage-products/ham-cold-cuts/ham/naturaplan-bio-hinterschinken-80g/p/7298962'],
  'Bündnerfleisch': ['Prix Garantie Bündnerfleisch', 'ca. 100 g', P + 'en/food/meat-fish/cold-cuts-sausage-products/dried-meat-salami/grisons-meat/prix-garantie-buendnerfleisch-ca/p/6846227'],
  'Lachs (roh)': ['ASC Lachsfilet ohne Haut', 'ca. 200 g', P + 'en/food/meat-fish/seafood-market/asc-skinless-salmon-fillet/p/6875414'],
  'Thon in Wasser (abgetropft)': ['Thon rosé nature MSC', 'Dose 155 g', P + 'en/food/pantry/canned-conserved/fish/tuna-without-oil/tuna-pink-natural/p/3950233'],
  'Tofu nature': ['Karma Bio Tofu Nature', '2 × 260 g', P + 'de/tofu/karma-tofu-nature/p/5779877'],

  'Reis (roh)': ['Prix Garantie Langkornreis parboiled', '1 kg', P + 'en/food/pantry/staples/rice/long-grain-vitamin/prix-garantie-parboiled-long-grain-rice/p/6554390'],
  'Teigwaren (roh)': ['Naturaplan Bio Penne Rigate', '500 g', P + 'de/lebensmittel/vorraete/grundnahrungsmittel/teigwaren/penne-roehren/naturaplan-bio-penne-rigate/p/4841665'],
  'Rote Linsen (roh)': ['Naturaplan Bio Rote Linsen', '500 g', P + 'en/food/pantry/staples/grains-corn-semolina/lentils-beans-grains/naturaplan-organic-red-lentils/p/3356410'],
  'Tortilla-Wrap': ['Old El Paso Flour Tortillas', '6 Stück, 350 g', P + 'en/food/bread-baked-goods/durable-breads/flatbread-tortillas/old-el-paso-flour-6-wrap-tortillas/p/3474354'],
  'Vollkornbrot': ['Naturaplan Bio Vollkorn-Sandwichbrot', '2 × 250 g', P + 'en/food/bread-baked-goods/durable-breads/toasting-bread-buns/naturaplan-organic-whole-wheat-sandwich-bread-2x250g/p/5783052'],
  'Ruchbrot': ['Ruchbrot', '500 g', P + 'en/food/bread-baked-goods/bakery/brown-bread/p/3041726'],
  'Knäckebrot': ['Wasa Knäckebrot Vollkorn', '260 g', P + 'en/food/bread-baked-goods/crackers-crispbreads/crispbreads-crisprolls/wasa-whole-grain-crispbread/p/5689599'],

  'Kidneybohnen (Dose)': ['Prix Garantie Kidneybohnen rot', 'Dose 255 g abgetropft', P + 'en/food/pantry/canned-conserved/vegetables/beans-pulses/prix-garantie-canned-red-kidney-beans/p/6624899'],
  'Mais (Dose)': ['Zuckermais', 'Dose 285 g', P + 'en/food/pantry/canned-conserved/vegetables/mixed-vegetables/sweet-corn/p/3020205'],
  'Gehackte Tomaten (Dose)': ['Gehackte Tomaten', 'Dose 400 g', P + 'en/food/pantry/canned-conserved/vegetables/tomatoes/crushed-tomatoes/p/3020198'],
  'Kokosmilch': ['Thai Kitchen Kokosmilch', '250 ml', P + 'en/food/dairy-products-eggs/milk/coconut-milk/thai-kitchen-coconut-milk/p/3021253'],
  'Sojasauce': ['Kikkoman Sojasauce', '150 ml', P + 'en/food/pantry/stocks-spices/liquid-seasoning-pastes/kikkoman-soya-sauce/p/5741964'],
  'Olivenöl': ['Olivenöl extra vergine', '500 ml', P + 'en/food/pantry/vinegars-oils/oil/olive-oil/olivenoel-extra-vergine/p/7430053'],
  'Rapsöl': ['Prix Garantie Rapsöl', '1 l', P + 'en/food/pantry/vinegars-oils/oil/prix-garantie-rapeseed-oil/p/6638809'],
  'Honig': ['Naturaplan Bio Blütenhonig flüssig', '500 g', P + 'en/food/pantry/spreads/honey/naturaplan-organic-liquid-blossom-honey/p/5753861'],
  'Erdnussbutter': ['Karma Bio Peanut Butter Crunchy', '250 g', P + 'en/food/pantry/spreads/other-sweet-spreads/karma-organic-peanut-butter-crunchy/p/6615670'],
  'Mandeln': ['Naturaplan Bio Mandeln ganz', '200 g', P + 'en/food/pantry/baking-ingredients/classic-baking-ingredients/nuts/naturaplan-bio-mandeln-ganz/p/6377154'],

  'Champignons': ['Naturaplan Bio Champignons weiss', '250 g', P + 'de/lebensmittel/fruechte-gemuese/pilze/naturaplan-bio-champignons-weiss/p/7321646'],
  'Spinat': ['Blattspinat nature tiefgekühlt', '3 × 600 g', P + 'de/lebensmittel/tiefgekuehlt/fruechte-gemuese/gemuese-kartoffelprodukte/sortenreine-gemuese/blattspinat-nature-tiefgekuehlt-3x600g/p/6560681', 'Oder frischer Blattspinat aus der Gemüseabteilung.'],
  'Heidelbeeren': ['Heidelbeeren', '500 g', P + 'de/lebensmittel/fruechte-gemuese/fruechte/beeren/heidelbeeren/p/3090122'],
  'Himbeeren': ['Naturaplan Bio Himbeeren tiefgekühlt', '300 g', P + 'en/food/frozen/fruits-vegetables/fruit-berries/beeren/naturaplan-organic-frozen-raspberries/p/4404075', 'Oder frische Himbeeren aus der Früchteabteilung.'],
};

// Frischwaren ohne feste Packung.
const FRESH = new Set(['Banane', 'Tomaten', 'Erdbeeren', 'Brokkoli', 'Kartoffeln (gekocht)', 'Peperoni', 'Zwiebel', 'Zucchetti', 'Blattsalat', 'Gurke']);

/** Coop-Produkt zu einer Zutat: { name, pack, url, note } | { fresh: true } | null */
export function coopProduct(foodName) {
  const p = PRODUCTS[foodName];
  if (p) return { name: p[0], pack: p[1], url: p[2], note: p[3] || '' };
  if (FRESH.has(foodName)) return { fresh: true };
  return null;
}
