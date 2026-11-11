// Proteinreiche Rezepte mit Zutaten, die es bei Coop und Migros gibt.
// Eigene Rezepte von Bitebase. Die Nährwerte werden aus den Zutaten (js/foods.js) berechnet.
// Zutaten: [Name in der Lebensmittel-Datenbank, Menge in g/ml für ALLE Portionen, Anzeige-Text]
import { findFood, nutrition } from './foods.js';

export const RECIPE_CATS = ['Frühstück', 'Hauptgericht', 'Snack'];

export const RECIPES = [
  /* ---------- Frühstück ---------- */
  {
    id: 'protein-porridge', name: 'Protein-Porridge mit Banane', icon: '🥣', cat: 'Frühstück', time: 10, portions: 1, vegi: true,
    ingredients: [
      ['Haferflocken', 50, '50 g Haferflocken'],
      ['Magermilch', 200, '2 dl Magermilch'],
      ['Whey-Proteinpulver', 30, '30 g Proteinpulver (Vanille)'],
      ['Banane', 120, '1 Banane'],
      ['Heidelbeeren', 60, '1 Handvoll Heidelbeeren'],
    ],
    extras: ['1 Prise Zimt'],
    steps: [
      'Haferflocken mit der Milch aufkochen und 3 Minuten köcheln lassen.',
      'Vom Herd nehmen, kurz abkühlen lassen und das Proteinpulver einrühren.',
      'Banane in Scheiben schneiden und mit den Heidelbeeren und Zimt darauf verteilen.',
    ],
  },
  {
    id: 'skyr-bowl', name: 'Skyr-Bowl mit Beeren und Mandeln', icon: '🍓', cat: 'Frühstück', time: 5, portions: 1, vegi: true,
    ingredients: [
      ['Skyr nature', 300, '300 g Skyr nature'],
      ['Himbeeren', 100, '100 g Himbeeren'],
      ['Haferflocken', 30, '3 EL Haferflocken'],
      ['Mandeln', 15, '15 g Mandeln'],
      ['Honig', 10, '1 TL Honig'],
    ],
    steps: [
      'Skyr in eine Schale geben.',
      'Himbeeren, Haferflocken und grob gehackte Mandeln darauf verteilen.',
      'Mit Honig beträufeln.',
    ],
  },
  {
    id: 'ruehrei-huettenkaese', name: 'Rührei mit Hüttenkäse auf Vollkornbrot', icon: '🍳', cat: 'Frühstück', time: 10, portions: 1, vegi: true,
    ingredients: [
      ['Ei', 165, '3 Eier'],
      ['Hüttenkäse', 100, '100 g Hüttenkäse'],
      ['Vollkornbrot', 100, '2 Scheiben Vollkornbrot'],
      ['Tomaten', 120, '1 Tomate'],
      ['Butter', 5, '1 TL Butter'],
    ],
    extras: ['Salz, Pfeffer, Schnittlauch'],
    steps: [
      'Eier verquirlen, salzen und pfeffern.',
      'Butter in der Pfanne schmelzen, Eier bei mittlerer Hitze stocken lassen und dabei rühren.',
      'Kurz vor Schluss den Hüttenkäse unterheben.',
      'Auf dem Brot anrichten, mit Tomatenscheiben und Schnittlauch servieren.',
    ],
  },
  {
    id: 'overnight-oats', name: 'Overnight Oats mit Magerquark', icon: '🫙', cat: 'Frühstück', time: 5, portions: 1, vegi: true,
    ingredients: [
      ['Haferflocken', 50, '50 g Haferflocken'],
      ['Magerquark', 150, '150 g Magerquark'],
      ['Milchdrink (teilentrahmt)', 100, '1 dl Milch'],
      ['Chiasamen', 10, '1 EL Chiasamen'],
      ['Erdbeeren', 100, '100 g Erdbeeren'],
    ],
    steps: [
      'Haferflocken, Quark, Milch und Chiasamen in einem Glas verrühren.',
      'Über Nacht (mindestens 4 Stunden) in den Kühlschrank stellen.',
      'Am Morgen die Erdbeeren klein schneiden und darübergeben.',
    ],
  },
  {
    id: 'protein-pancakes', name: 'Protein-Pancakes', icon: '🥞', cat: 'Frühstück', time: 15, portions: 1, vegi: true,
    ingredients: [
      ['Ei', 110, '2 Eier'],
      ['Banane', 120, '1 reife Banane'],
      ['Haferflocken', 40, '40 g Haferflocken'],
      ['Magerquark', 100, '100 g Magerquark'],
      ['Whey-Proteinpulver', 20, '20 g Proteinpulver'],
      ['Heidelbeeren', 50, '50 g Heidelbeeren'],
      ['Rapsöl', 5, '1 TL Rapsöl'],
    ],
    steps: [
      'Banane zerdrücken und mit Eiern, Haferflocken, Proteinpulver und der Hälfte des Quarks zu einem Teig mixen.',
      'Wenig Öl in einer beschichteten Pfanne erhitzen und kleine Pancakes auf beiden Seiten goldbraun backen.',
      'Mit dem restlichen Quark und den Heidelbeeren servieren.',
    ],
  },

  /* ---------- Hauptgerichte ---------- */
  {
    id: 'poulet-reis-bowl', name: 'Poulet-Reis-Bowl mit Brokkoli', icon: '🍗', cat: 'Hauptgericht', time: 25, portions: 1,
    ingredients: [
      ['Pouletbrust (roh)', 180, '180 g Pouletbrust'],
      ['Reis (roh)', 70, '70 g Reis'],
      ['Brokkoli', 200, '200 g Brokkoli'],
      ['Olivenöl', 5, '1 TL Olivenöl'],
      ['Sojasauce', 15, '1½ EL Sojasauce'],
    ],
    extras: ['Salz, Pfeffer, Paprikapulver'],
    steps: [
      'Reis nach Packungsangabe kochen.',
      'Brokkoli in Röschen teilen und 5 Minuten dämpfen oder im Salzwasser garen.',
      'Poulet in Streifen schneiden, würzen und im Öl 6–8 Minuten rundum braten.',
      'Alles in einer Schale anrichten und mit Sojasauce beträufeln.',
    ],
  },
  {
    id: 'lachs-kartoffeln', name: 'Lachs mit Ofenkartoffeln und Spinat', icon: '🐟', cat: 'Hauptgericht', time: 35, portions: 1,
    ingredients: [
      ['Lachs (roh)', 150, '1 Lachsfilet (150 g)'],
      ['Kartoffeln (gekocht)', 250, '250 g Kartoffeln'],
      ['Spinat', 150, '150 g Blattspinat'],
      ['Olivenöl', 10, '1 EL Olivenöl'],
    ],
    extras: ['Salz, Pfeffer, Zitrone, Knoblauch'],
    steps: [
      'Ofen auf 200 °C vorheizen. Kartoffeln in Schnitze schneiden, mit der Hälfte des Öls und Salz mischen und 25 Minuten backen.',
      'Lachs würzen und die letzten 12 Minuten zu den Kartoffeln aufs Blech legen.',
      'Spinat mit Knoblauch im restlichen Öl kurz zusammenfallen lassen.',
      'Mit einem Spritzer Zitrone servieren.',
    ],
  },
  {
    id: 'chili-con-carne', name: 'Chili con Carne', icon: '🌶️', cat: 'Hauptgericht', time: 35, portions: 2,
    ingredients: [
      ['Rindshackfleisch mager (roh)', 250, '250 g mageres Rindshackfleisch'],
      ['Kidneybohnen (Dose)', 260, '1 Dose Kidneybohnen'],
      ['Mais (Dose)', 140, '1 kleine Dose Mais'],
      ['Gehackte Tomaten (Dose)', 400, '1 Dose gehackte Tomaten'],
      ['Peperoni', 150, '1 Peperoni'],
      ['Zwiebel', 80, '1 Zwiebel'],
      ['Olivenöl', 10, '1 EL Olivenöl'],
    ],
    extras: ['Salz, Chili, Kreuzkümmel, Paprikapulver'],
    steps: [
      'Zwiebel und Peperoni würfeln und im Öl andünsten.',
      'Hackfleisch dazugeben und krümelig anbraten, kräftig würzen.',
      'Tomaten, abgespülte Bohnen und Mais beigeben und 20 Minuten köcheln lassen.',
      'Abschmecken. Passt gut zu Reis oder Brot (nicht eingerechnet).',
    ],
  },
  {
    id: 'thon-pasta', name: 'Thon-Pasta mit Tomaten', icon: '🍝', cat: 'Hauptgericht', time: 20, portions: 1,
    ingredients: [
      ['Teigwaren (roh)', 90, '90 g Teigwaren'],
      ['Thon in Wasser (abgetropft)', 100, '1 kleine Dose Thon in Wasser'],
      ['Gehackte Tomaten (Dose)', 200, '½ Dose gehackte Tomaten'],
      ['Zwiebel', 40, '½ Zwiebel'],
      ['Olivenöl', 5, '1 TL Olivenöl'],
      ['Parmesan', 10, '1 EL Parmesan'],
    ],
    extras: ['Salz, Pfeffer, Oregano, Knoblauch'],
    steps: [
      'Teigwaren im Salzwasser al dente kochen.',
      'Zwiebel und Knoblauch im Öl andünsten, Tomaten dazugeben und 8 Minuten köcheln lassen.',
      'Thon abtropfen und unter die Sauce mischen, würzen.',
      'Mit den Teigwaren mischen und mit Parmesan bestreuen.',
    ],
  },
  {
    id: 'linsen-dal', name: 'Rotes Linsen-Dal mit Reis', icon: '🍛', cat: 'Hauptgericht', time: 30, portions: 2, vegi: true, vegan: true,
    ingredients: [
      ['Rote Linsen (roh)', 160, '160 g rote Linsen'],
      ['Gehackte Tomaten (Dose)', 400, '1 Dose gehackte Tomaten'],
      ['Kokosmilch', 100, '1 dl Kokosmilch'],
      ['Spinat', 100, '100 g Blattspinat'],
      ['Zwiebel', 80, '1 Zwiebel'],
      ['Reis (roh)', 120, '120 g Reis'],
    ],
    extras: ['Salz, Curry, Kurkuma, Ingwer, Knoblauch'],
    steps: [
      'Reis nach Packungsangabe kochen.',
      'Zwiebel, Knoblauch und Ingwer hacken und mit den Gewürzen andünsten.',
      'Linsen, Tomaten, Kokosmilch und 3 dl Wasser beigeben und 15 Minuten köcheln lassen.',
      'Spinat unterrühren, abschmecken und mit dem Reis servieren.',
    ],
  },
  {
    id: 'tofu-pfanne', name: 'Tofu-Gemüse-Pfanne mit Reis', icon: '🥦', cat: 'Hauptgericht', time: 25, portions: 1, vegi: true, vegan: true,
    ingredients: [
      ['Tofu nature', 200, '200 g Tofu nature'],
      ['Peperoni', 150, '1 Peperoni'],
      ['Zucchetti', 150, '½ Zucchetti'],
      ['Brokkoli', 100, '100 g Brokkoli'],
      ['Reis (roh)', 70, '70 g Reis'],
      ['Sojasauce', 20, '2 EL Sojasauce'],
      ['Rapsöl', 10, '1 EL Rapsöl'],
    ],
    extras: ['Ingwer, Knoblauch, Chili'],
    steps: [
      'Reis kochen. Tofu trocken tupfen und würfeln.',
      'Tofu im Öl rundum knusprig braten und herausnehmen.',
      'Gemüse klein schneiden und in derselben Pfanne 5–6 Minuten bissfest braten.',
      'Tofu zurückgeben, mit Sojasauce, Ingwer und Knoblauch abschmecken und mit Reis servieren.',
    ],
  },
  {
    id: 'poulet-wrap', name: 'Poulet-Wraps mit Hüttenkäse', icon: '🌯', cat: 'Hauptgericht', time: 15, portions: 1,
    ingredients: [
      ['Tortilla-Wrap', 120, '2 Tortilla-Wraps'],
      ['Pouletbrust (roh)', 150, '150 g Pouletbrust'],
      ['Hüttenkäse', 100, '100 g Hüttenkäse'],
      ['Blattsalat', 50, '1 Handvoll Salat'],
      ['Tomaten', 120, '1 Tomate'],
      ['Gurke', 50, 'ein Stück Gurke'],
      ['Olivenöl', 5, '1 TL Olivenöl'],
    ],
    extras: ['Salz, Pfeffer, Paprikapulver'],
    steps: [
      'Poulet in Streifen schneiden, würzen und im Öl 6–8 Minuten braten.',
      'Wraps kurz in der Pfanne erwärmen.',
      'Mit Hüttenkäse bestreichen, Salat, Tomate, Gurke und Poulet darauf verteilen und einrollen.',
    ],
  },
  {
    id: 'gschwellti-quark', name: 'Gschwellti mit Kräuterquark und Ei', icon: '🥔', cat: 'Hauptgericht', time: 30, portions: 1, vegi: true,
    ingredients: [
      ['Kartoffeln (gekocht)', 300, '300 g kleine Kartoffeln'],
      ['Magerquark', 200, '200 g Magerquark'],
      ['Ei', 110, '2 Eier'],
      ['Gurke', 100, '¼ Gurke'],
    ],
    extras: ['Salz, Pfeffer, Schnittlauch, Petersilie'],
    steps: [
      'Kartoffeln in der Schale 20–25 Minuten weich kochen.',
      'Eier 8 Minuten hart kochen.',
      'Quark mit gehackten Kräutern, Salz und Pfeffer verrühren.',
      'Kartoffeln mit Quark, Ei und Gurkenscheiben servieren.',
    ],
  },
  {
    id: 'truten-geschnetzeltes', name: 'Trutengeschnetzeltes mit Champignons und Teigwaren', icon: '🍄', cat: 'Hauptgericht', time: 25, portions: 1,
    ingredients: [
      ['Trutenbrust (roh)', 180, '180 g Trutenbrust'],
      ['Champignons', 150, '150 g Champignons'],
      ['Halbrahm', 50, '½ dl Halbrahm'],
      ['Teigwaren (roh)', 80, '80 g Teigwaren'],
      ['Zwiebel', 40, '½ Zwiebel'],
      ['Rapsöl', 5, '1 TL Rapsöl'],
    ],
    extras: ['Salz, Pfeffer, Paprikapulver, wenig Bouillon'],
    steps: [
      'Teigwaren im Salzwasser kochen.',
      'Trutenfleisch in Streifen schneiden, im Öl kurz scharf anbraten und herausnehmen.',
      'Zwiebel und Champignons in derselben Pfanne braten, mit wenig Bouillon und Rahm ablöschen.',
      'Fleisch zurückgeben, kurz erwärmen, abschmecken und mit den Teigwaren servieren.',
    ],
  },
  {
    id: 'griechischer-salat-poulet', name: 'Griechischer Salat mit Poulet und Feta', icon: '🥗', cat: 'Hauptgericht', time: 20, portions: 1,
    ingredients: [
      ['Pouletbrust (roh)', 150, '150 g Pouletbrust'],
      ['Feta', 50, '50 g Feta'],
      ['Gurke', 150, '½ Gurke'],
      ['Tomaten', 150, '2 kleine Tomaten'],
      ['Peperoni', 75, '½ Peperoni'],
      ['Olivenöl', 10, '1 EL Olivenöl'],
      ['Ruchbrot', 50, '1 Scheibe Ruchbrot'],
    ],
    extras: ['Salz, Pfeffer, Oregano, Essig oder Zitrone'],
    steps: [
      'Poulet würzen und in wenig Öl 6–8 Minuten braten, dann in Scheiben schneiden.',
      'Gurke, Tomaten und Peperoni würfeln.',
      'Mit Öl, Essig, Oregano, Salz und Pfeffer mischen.',
      'Feta darüberbröckeln, Poulet darauflegen und mit Brot servieren.',
    ],
  },
  {
    id: 'omelette-schinken', name: 'Omelette mit Schinken und Käse', icon: '🧀', cat: 'Hauptgericht', time: 10, portions: 1,
    ingredients: [
      ['Ei', 165, '3 Eier'],
      ['Hinterschinken', 60, '2 Scheiben Schinken'],
      ['Gruyère', 30, '30 g Gruyère'],
      ['Blattsalat', 50, '1 Handvoll Salat'],
      ['Vollkornbrot', 50, '1 Scheibe Vollkornbrot'],
      ['Butter', 5, '1 TL Butter'],
    ],
    extras: ['Salz, Pfeffer'],
    steps: [
      'Eier verquirlen und würzen.',
      'Butter in der Pfanne schmelzen, Eier hineingeben und bei mittlerer Hitze stocken lassen.',
      'Schinken und geriebenen Käse auf eine Hälfte legen, zuklappen und 1 Minute fertig braten.',
      'Mit Salat und Brot servieren.',
    ],
  },

  /* ---------- Snacks ---------- */
  {
    id: 'quark-beeren', name: 'Magerquark mit Beeren und Baumnüssen', icon: '🫐', cat: 'Snack', time: 3, portions: 1, vegi: true,
    ingredients: [
      ['Magerquark', 250, '1 Becher Magerquark (250 g)'],
      ['Heidelbeeren', 100, '100 g Heidelbeeren'],
      ['Baumnüsse', 15, '15 g Baumnüsse'],
      ['Honig', 10, '1 TL Honig'],
    ],
    steps: [
      'Quark glatt rühren (bei Bedarf mit einem Schluck Wasser oder Milch).',
      'Beeren und gehackte Nüsse darübergeben und mit Honig süssen.',
    ],
  },
  {
    id: 'protein-shake', name: 'Protein-Shake mit Banane und Erdnussbutter', icon: '🥤', cat: 'Snack', time: 3, portions: 1, vegi: true,
    ingredients: [
      ['Whey-Proteinpulver', 30, '30 g Proteinpulver'],
      ['Milchdrink (teilentrahmt)', 300, '3 dl Milch'],
      ['Banane', 120, '1 Banane'],
      ['Erdnussbutter', 15, '1 EL Erdnussbutter'],
    ],
    steps: [
      'Alle Zutaten in den Mixer geben.',
      '30 Sekunden mixen, bis der Shake cremig ist.',
    ],
  },
  {
    id: 'huettenkaese-knaecke', name: 'Hüttenkäse auf Knäckebrot', icon: '🍅', cat: 'Snack', time: 3, portions: 1, vegi: true,
    ingredients: [
      ['Hüttenkäse', 200, '1 Becher Hüttenkäse (200 g)'],
      ['Knäckebrot', 30, '3 Scheiben Knäckebrot'],
      ['Tomaten', 120, '1 Tomate'],
    ],
    extras: ['Salz, Pfeffer, Schnittlauch'],
    steps: [
      'Hüttenkäse auf dem Knäckebrot verteilen.',
      'Mit Tomatenscheiben belegen und würzen.',
    ],
  },
  {
    id: 'thon-ei-salat', name: 'Thon-Ei-Salat', icon: '🥚', cat: 'Snack', time: 12, portions: 1,
    ingredients: [
      ['Thon in Wasser (abgetropft)', 100, '1 kleine Dose Thon in Wasser'],
      ['Ei', 110, '2 Eier'],
      ['Mais (Dose)', 70, '½ kleine Dose Mais'],
      ['Gurke', 100, '¼ Gurke'],
      ['Naturjoghurt mager', 50, '2 EL Naturjoghurt'],
    ],
    extras: ['Salz, Pfeffer, Senf, Zitrone'],
    steps: [
      'Eier 8 Minuten hart kochen, abschrecken und würfeln.',
      'Gurke würfeln und mit Thon, Mais und Ei mischen.',
      'Joghurt mit Senf, Zitrone, Salz und Pfeffer verrühren und untermischen.',
    ],
  },
  {
    id: 'buendnerfleisch-rollen', name: 'Bündnerfleisch-Röllchen mit Hüttenkäse', icon: '🥩', cat: 'Snack', time: 5, portions: 1,
    ingredients: [
      ['Bündnerfleisch', 50, '50 g Bündnerfleisch'],
      ['Hüttenkäse', 100, '100 g Hüttenkäse'],
      ['Gurke', 100, '¼ Gurke'],
    ],
    extras: ['Pfeffer, Schnittlauch'],
    steps: [
      'Je einen Löffel Hüttenkäse auf eine Scheibe Bündnerfleisch geben und einrollen.',
      'Mit Gurkenstiften, Pfeffer und Schnittlauch servieren.',
    ],
  },
];

/** Nährwerte pro Portion, berechnet aus den Zutaten. */
export function recipeNutrition(recipe) {
  const total = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  for (const [name, amount] of recipe.ingredients) {
    const food = findFood(name);
    if (!food) continue;
    const n = nutrition(food, amount);
    total.kcal += n.kcal; total.protein += n.protein; total.carbs += n.carbs; total.fat += n.fat;
  }
  const p = recipe.portions;
  return {
    kcal: Math.round(total.kcal / p),
    protein: Math.round(total.protein / p),
    carbs: Math.round(total.carbs / p),
    fat: Math.round(total.fat / p),
  };
}
