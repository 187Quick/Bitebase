// Berechnungen: Grundumsatz, Tagesbedarf, Makro-Ziele, Training, XP/Level.

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

/* ---------- Krafttraining ---------- */

export const EXERCISE_GROUPS = [
  { group: 'Brust', names: ['Bankdrücken', 'Schrägbankdrücken', 'Kurzhantel-Bankdrücken', 'Butterfly', 'Dips', 'Liegestütze'] },
  { group: 'Rücken', names: ['Kreuzheben', 'Klimmzüge', 'Langhantelrudern', 'Latziehen', 'Kabelrudern', 'Kurzhantelrudern'] },
  { group: 'Beine', names: ['Kniebeugen', 'Beinpresse', 'Ausfallschritte', 'Rumänisches Kreuzheben', 'Beinstrecker', 'Beinbeuger', 'Hip Thrust', 'Wadenheben'] },
  { group: 'Schultern', names: ['Schulterdrücken', 'Kurzhantel-Schulterdrücken', 'Seitheben', 'Face Pulls', 'Reverse Butterfly'] },
  { group: 'Arme', names: ['Bizeps-Curls', 'Hammer-Curls', 'Trizepsdrücken (Kabel)', 'French Press', 'Enge Liegestütze'] },
  { group: 'Core', names: ['Plank (Sekunden)', 'Crunches', 'Beinheben', 'Russian Twists'] },
];

/** kcal für Krafttraining: MET 5 (mittlere Intensität). */
export function strengthKcal(minutes, weightKg) {
  if (!weightKg) return 0;
  return Math.round(5.0 * weightKg * (minutes / 60));
}

/** Gesamtvolumen eines Workouts (Wdh. × kg). */
export function workoutVolume(exercises = []) {
  return exercises.reduce((s, ex) => s + ex.sets.reduce((a, set) => a + (+set.reps || 0) * (+set.kg || 0), 0), 0);
}

export function countSets(exercises = []) {
  return exercises.reduce((s, ex) => s + ex.sets.filter(x => +x.reps > 0).length, 0);
}

/** Bester Satz: höchstes Gewicht, bei gleichem Gewicht mehr Wiederholungen. */
export function bestSet(sets) {
  let best = null;
  for (const s of sets) {
    const reps = +s.reps || 0, kg = +s.kg || 0;
    if (!reps) continue;
    if (!best || kg > best.kg || (kg === best.kg && reps > best.reps)) best = { reps, kg };
  }
  return best;
}

export function isBetter(a, b) {
  if (!b) return !!a;
  if (!a) return false;
  return a.kg > b.kg || (a.kg === b.kg && a.reps > b.reps);
}

// Cardio & andere Aktivitäten (MET-Werte, Compendium of Physical Activities, gerundet).
export const ACTIVITIES = [
  { id: 'walk', name: 'Gehen / Spazieren', met: 3.5 },
  { id: 'hike', name: 'Wandern', met: 6.0 },
  { id: 'jog', name: 'Joggen (gemütlich)', met: 7.0 },
  { id: 'run', name: 'Laufen (zügig)', met: 9.8 },
  { id: 'bike', name: 'Velofahren', met: 7.5 },
  { id: 'swim', name: 'Schwimmen', met: 6.0 },
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

/* ---------- Gamification ---------- */

export const XP_RULES = [
  ['Essen eingetragen (pro Tag)', 20],
  ['Kalorienziel getroffen (±10 %)', 40],
  ['Cardio-Training', 30],
  ['Krafttraining', '50 + 5 pro Satz'],
  ['Neuer Rekord', 25],
  ['Gewicht eingetragen', 10],
];

/** XP für Level n → n+1: 100 · n */
export function levelFromXp(xp) {
  let level = 1, need = 100, rest = xp;
  while (rest >= need) { rest -= need; level++; need = 100 * level; }
  return { level, current: rest, needed: need };
}

/**
 * Berechnet XP, Level, Streak und Rekorde aus allen Daten.
 * days: { 'YYYY-MM-DD': { foods, workouts } }, targetKcal: Zahl oder null.
 */
export function computeProgress({ days, weights, targetKcal, todayKey }) {
  let xp = 0;
  const records = {}; // Übung → { reps, kg, date }
  const keys = Object.keys(days).sort();

  for (const key of keys) {
    const day = days[key];
    const foods = day.foods || [];
    const workouts = day.workouts || [];
    if (foods.length) xp += 20;

    if (targetKcal && key < todayKey && foods.length) {
      const burned = workouts.reduce((s, w) => s + (+w.kcal || 0), 0);
      const goal = targetKcal + burned;
      const eaten = sumFoods(foods).kcal;
      if (Math.abs(eaten - goal) <= goal * 0.1) xp += 40;
    }

    for (const w of workouts) {
      if (w.kind === 'strength') {
        xp += 50 + Math.min(countSets(w.exercises) * 5, 100);
        for (const ex of w.exercises || []) {
          const best = bestSet(ex.sets);
          if (!best) continue;
          const prev = records[ex.name];
          if (isBetter(best, prev)) {
            if (prev) xp += 25;
            records[ex.name] = { ...best, date: key };
          }
        }
      } else {
        xp += 30;
      }
    }
  }
  xp += (weights?.length || 0) * 10;

  // Streak: aufeinanderfolgende Tage mit Einträgen (heute zählt, muss aber noch nicht erfasst sein).
  let streak = 0;
  const d = new Date(todayKey + 'T12:00:00');
  const has = k => days[k] && ((days[k].foods || []).length || (days[k].workouts || []).length);
  const keyOf = dt => dt.toISOString().slice(0, 10);
  if (!has(keyOf(d))) d.setDate(d.getDate() - 1);
  while (has(keyOf(d))) { streak++; d.setDate(d.getDate() - 1); }

  return { xp, ...levelFromXp(xp), streak, records };
}
