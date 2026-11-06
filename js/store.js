// Speichert alle Daten lokal im Browser (localStorage) auf diesem Gerät.
const DATA_KEY = 'bitebase:data:v1';
const API_KEY_KEY = 'bitebase:apiKey';

function emptyData() {
  return { version: 1, profile: null, days: {}, weights: [] };
}

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

let data = load();

function load() {
  const raw = safeGet(DATA_KEY);
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw);
    return { ...emptyData(), ...parsed };
  } catch {
    return emptyData();
  }
}

function save() {
  return safeSet(DATA_KEY, JSON.stringify(data));
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Datum als 'YYYY-MM-DD' in lokaler Zeit. */
export function dateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getProfile() { return data.profile; }
export function setProfile(profile) { data.profile = profile; save(); }

export function getDay(key) {
  return data.days[key] || { foods: [], workouts: [] };
}

function mutateDay(key, fn) {
  const day = data.days[key] || { foods: [], workouts: [] };
  fn(day);
  if (day.foods.length || day.workouts.length) data.days[key] = day;
  else delete data.days[key];
  save();
}

export function addFood(key, food) { mutateDay(key, d => d.foods.push({ id: uid(), ...food })); }
export function updateFood(key, id, food) {
  mutateDay(key, d => { const i = d.foods.findIndex(f => f.id === id); if (i >= 0) d.foods[i] = { ...d.foods[i], ...food }; });
}
export function removeFood(key, id) { mutateDay(key, d => { d.foods = d.foods.filter(f => f.id !== id); }); }

export function addWorkout(key, workout) { mutateDay(key, d => d.workouts.push({ id: uid(), ...workout })); }
export function removeWorkout(key, id) { mutateDay(key, d => { d.workouts = d.workouts.filter(w => w.id !== id); }); }

export function getWeights() { return [...data.weights].sort((a, b) => a.date.localeCompare(b.date)); }
export function setWeight(key, kg) {
  data.weights = data.weights.filter(w => w.date !== key);
  data.weights.push({ date: key, kg });
  save();
}

export function getApiKey() { return safeGet(API_KEY_KEY) || ''; }
export function setApiKey(key) {
  try {
    if (key) localStorage.setItem(API_KEY_KEY, key);
    else localStorage.removeItem(API_KEY_KEY);
    return true;
  } catch { return false; }
}

/** Export ohne API-Schlüssel. */
export function exportJson() {
  return JSON.stringify({ app: 'bitebase', exportedAt: new Date().toISOString(), ...data }, null, 2);
}

export function importJson(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || typeof parsed.days !== 'object' || !Array.isArray(parsed.weights)) {
    throw new Error('Keine gültige Bitebase-Sicherung.');
  }
  data = { version: 1, profile: parsed.profile ?? null, days: parsed.days, weights: parsed.weights };
  save();
}
