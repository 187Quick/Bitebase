// Berechnungen: Grundumsatz, Tagesbedarf, Makro-Ziele, Training.

/** Grundumsatz nach Mifflin-St Jeor (kcal/Tag). */
export function bmr({ sex, age, height, weight }) {
  const base = 10 * weight + 6.25 * height - 5 * age;
  return sex === 'f' ? base - 161 : base + 5;
}

/** Tagesbedarf inkl. Alltagsaktivität und Ziel. */
export function dailyTargets(profile) {
  const basal = bmr(profile);
  const tdee = basal * profile.activity;
  // Nicht unter den Grundumsatz fallen, damit das Ziel gesund bleibt.
  const kcal = Math.round(Math.max(tdee + profile.goal, basal));
  const protein = Math.round(profile.weight * (profile.goal < 0 ? 2.0 : 1.8));
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { bmr: Math.round(basal), tdee: Math.round(tdee), kcal, protein, carbs, fat };
}

// MET-Werte (Compendium of Physical Activities, gerundet).
export const ACTIVITIES = [
  { id: 'walk', name: 'Gehen / Spazieren', met: 3.5 },
  { id: 'hike', name: 'Wandern', met: 6.0 },
  { id: 'jog', name: 'Joggen (gemütlich)', met: 7.0 },
  { id: 'run', name: 'Laufen (zügig)', met: 9.8 },
  { id: 'bike', name: 'Velofahren', met: 7.5 },
  { id: 'swim', name: 'Schwimmen', met: 6.0 },
  { id: 'strength', name: 'Krafttraining', met: 5.0 },
  { id: 'hiit', name: 'HIIT / Zirkeltraining', met: 8.0 },
  { id: 'yoga', name: 'Yoga / Pilates', met: 2.8 },
  { id: 'football', name: 'Fussball', met: 7.0 },
  { id: 'tennis', name: 'Tennis / Padel', met: 7.3 },
  { id: 'ski', name: 'Skifahren / Snowboard', met: 6.0 },
  { id: 'other', name: 'Andere (kcal selbst eingeben)', met: 0 },
];

export function workoutKcal(activityId, minutes, weightKg) {
  const a = ACTIVITIES.find(x => x.id === activityId);
  if (!a || !a.met || !weightKg) return 0;
  return Math.round(a.met * weightKg * (minutes / 60));
}

export function sumFoods(foods) {
  return foods.reduce((acc, f) => ({
    kcal: acc.kcal + (+f.kcal || 0),
    protein: acc.protein + (+f.protein || 0),
    carbs: acc.carbs + (+f.carbs || 0),
    fat: acc.fat + (+f.fat || 0),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
}
