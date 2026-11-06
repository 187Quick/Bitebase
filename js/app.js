import * as store from './store.js';
import { dailyTargets, ACTIVITIES, workoutKcal, sumFoods } from './calc.js';
import { prepareImage, analyzeFood } from './scanner.js';

const MEALS = [
  { id: 'breakfast', name: 'Frühstück' },
  { id: 'lunch', name: 'Mittagessen' },
  { id: 'dinner', name: 'Abendessen' },
  { id: 'snack', name: 'Snacks' },
];

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = n => Math.round(n).toLocaleString('de-CH');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const state = {
  date: new Date(),
  view: 'today',
  scan: null, // { base64, result }
};

const currentKey = () => store.dateKey(state.date);
const isToday = () => currentKey() === store.dateKey();

function defaultMeal() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h >= 17 && h < 22) return 'dinner';
  return 'snack';
}

function currentWeight() {
  const weights = store.getWeights();
  if (weights.length) return weights[weights.length - 1].kg;
  return store.getProfile()?.weight || 0;
}

/* ---------- Navigation ---------- */

function showView(view) {
  state.view = view;
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === view));
  window.scrollTo(0, 0);
  render();
}

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ---------- Rendering ---------- */

function render() {
  renderDate();
  if (state.view === 'today') renderToday();
  if (state.view === 'scan') renderScan();
  if (state.view === 'training') renderTraining();
  if (state.view === 'profile') renderProfile();
}

function renderDate() {
  const label = $('#date-label');
  if (isToday()) label.textContent = 'Heute';
  else {
    const y = new Date(); y.setDate(y.getDate() - 1);
    label.textContent = currentKey() === store.dateKey(y)
      ? 'Gestern'
      : state.date.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  $('#next-day').disabled = isToday();
}

function renderToday() {
  const profile = store.getProfile();
  const day = store.getDay(currentKey());
  const eaten = sumFoods(day.foods);
  const burned = day.workouts.reduce((s, w) => s + (+w.kcal || 0), 0);
  const targets = profile ? dailyTargets({ ...profile, weight: currentWeight() }) : null;

  $('#setup-hint').classList.toggle('hidden', !!profile);

  const goal = targets ? targets.kcal + burned : 0;
  const remaining = goal - eaten.kcal;
  $('#stat-target').textContent = targets ? fmt(targets.kcal) : '–';
  $('#stat-eaten').textContent = fmt(eaten.kcal);
  $('#stat-burned').textContent = burned ? '+' + fmt(burned) : '0';
  $('#remaining-kcal').textContent = targets ? fmt(Math.abs(remaining)) : fmt(eaten.kcal);
  $('#remaining-caption').textContent = !targets ? 'kcal gegessen' : remaining >= 0 ? 'kcal übrig' : 'kcal zu viel';

  const ring = $('#ring-fill');
  const circ = 2 * Math.PI * 52;
  const pct = goal ? Math.min(eaten.kcal / goal, 1) : 0;
  ring.style.strokeDasharray = `${circ}`;
  ring.style.strokeDashoffset = `${circ * (1 - pct)}`;
  ring.classList.toggle('over', targets && remaining < 0);

  const macros = [
    { key: 'protein', name: 'Protein', cls: 'm-protein' },
    { key: 'carbs', name: 'Kohlenhydrate', cls: 'm-carbs' },
    { key: 'fat', name: 'Fett', cls: 'm-fat' },
  ];
  $('#macros').innerHTML = macros.map(m => {
    const val = eaten[m.key];
    const tgt = targets?.[m.key];
    const p = tgt ? Math.min(val / tgt, 1) * 100 : 0;
    return `<div class="macro">
      <div class="macro-head"><span>${m.name}</span><span class="muted">${fmt(val)}${tgt ? ' / ' + fmt(tgt) : ''} g</span></div>
      <div class="bar"><div class="bar-fill ${m.cls}" style="width:${p}%"></div></div>
    </div>`;
  }).join('');

  $('#meals').innerHTML = MEALS.map(meal => {
    const foods = day.foods.filter(f => f.meal === meal.id);
    const total = sumFoods(foods).kcal;
    return `<div class="card">
      <div class="card-head">
        <h2>${meal.name}</h2>
        <span class="muted">${fmt(total)} kcal</span>
      </div>
      <ul class="list">
        ${foods.map(f => `<li><button class="list-item" data-food="${f.id}">
          <span class="li-main">${esc(f.name)}</span>
          <span class="li-sub">P ${fmt(f.protein || 0)} · K ${fmt(f.carbs || 0)} · F ${fmt(f.fat || 0)}</span>
          <span class="li-value">${fmt(f.kcal)}</span>
        </button></li>`).join('')}
      </ul>
      <button class="btn small ghost" data-add-meal="${meal.id}">+ Hinzufügen</button>
    </div>`;
  }).join('');

  $('#today-workouts').innerHTML = day.workouts.length
    ? day.workouts.map(w => `<li class="list-item static">
        <span class="li-main">${esc(w.name)}</span>
        <span class="li-sub">${fmt(w.minutes)} Min.</span>
        <span class="li-value">−${fmt(w.kcal)}</span>
        <button class="icon-btn small" data-del-workout="${w.id}" aria-label="Training löschen">✕</button>
      </li>`).join('')
    : '<li class="empty">Noch kein Training erfasst.</li>';
}

function renderScan() {
  $('#scan-no-key').classList.toggle('hidden', !!store.getApiKey());
  $('#btn-analyze').disabled = !state.scan?.base64 || !store.getApiKey();
}

function renderTraining() {
  const sel = $('#wo-type');
  if (!sel.options.length) {
    sel.innerHTML = ACTIVITIES.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    updateWorkoutEstimate();
  }
  const latest = store.getWeights().find(w => w.date === currentKey());
  $('#weight-input').placeholder = currentWeight() ? String(currentWeight()) : '';
  if (latest) $('#weight-input').value = latest.kg;
  renderWeightChart();
  renderWeekTable();
}

function renderWeekTable() {
  const profile = store.getProfile();
  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = store.dateKey(d);
    const day = store.getDay(key);
    rows.push({
      label: i === 0 ? 'Heute' : d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric' }),
      eaten: sumFoods(day.foods).kcal,
      burned: day.workouts.reduce((s, w) => s + (+w.kcal || 0), 0),
    });
  }
  const target = profile ? dailyTargets({ ...profile, weight: currentWeight() }).kcal : null;
  $('#week-table').innerHTML = `<table class="table">
    <thead><tr><th>Tag</th><th>Gegessen</th><th>Training</th>${target ? '<th>Bilanz</th>' : ''}</tr></thead>
    <tbody>${rows.map(r => {
      const bal = target ? r.eaten - (target + r.burned) : 0;
      return `<tr><td>${r.label}</td><td>${fmt(r.eaten)}</td><td>${r.burned ? fmt(r.burned) : '–'}</td>${
        target ? `<td class="${r.eaten ? (bal > 0 ? 'neg' : 'pos') : 'muted'}">${r.eaten ? (bal > 0 ? '+' : '') + fmt(bal) : '–'}</td>` : ''}</tr>`;
    }).join('')}</tbody></table>`;
}

function renderWeightChart() {
  const el = $('#weight-chart');
  const pts = store.getWeights().slice(-60);
  if (pts.length < 2) {
    el.innerHTML = `<p class="muted small">${pts.length ? 'Ab dem zweiten Eintrag siehst du hier deinen Verlauf.' : 'Trage dein Gewicht ein, um den Verlauf zu sehen.'}</p>`;
    return;
  }
  const W = 340, H = 180, pad = { l: 36, r: 12, t: 14, b: 24 };
  const t = pts.map(p => new Date(p.date + 'T12:00:00').getTime());
  const v = pts.map(p => p.kg);
  let lo = Math.min(...v), hi = Math.max(...v);
  const span = Math.max(hi - lo, 1);
  lo = Math.floor(lo - span * 0.2); hi = Math.ceil(hi + span * 0.2);
  const t0 = t[0], t1 = t[t.length - 1];
  const x = ms => pad.l + ((ms - t0) / (t1 - t0 || 1)) * (W - pad.l - pad.r);
  const y = kg => pad.t + (1 - (kg - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const ticks = [lo, (lo + hi) / 2, hi];
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${x(t[i]).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const fmtDate = ms => new Date(ms).toLocaleDateString('de-CH', { day: 'numeric', month: 'numeric' });
  const last = pts[pts.length - 1];
  const diff = last.kg - pts[0].kg;

  el.innerHTML = `
    <p class="chart-summary"><strong>${last.kg.toLocaleString('de-CH')} kg</strong>
      <span class="muted">${diff === 0 ? 'unverändert' : (diff > 0 ? '+' : '−') + Math.abs(diff).toLocaleString('de-CH', { maximumFractionDigits: 1 }) + ' kg'} seit ${fmtDate(t0)}</span></p>
    <svg viewBox="0 0 ${W} ${H}" class="line-chart" role="img" aria-label="Gewichtsverlauf von ${fmtDate(t0)} bis ${fmtDate(t1)}">
      ${ticks.map(k => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${y(k)}" y2="${y(k)}"/>
        <text class="axis" x="${pad.l - 6}" y="${y(k) + 4}" text-anchor="end">${Math.round(k)}</text>`).join('')}
      <text class="axis" x="${pad.l}" y="${H - 6}">${fmtDate(t0)}</text>
      <text class="axis" x="${W - pad.r}" y="${H - 6}" text-anchor="end">${fmtDate(t1)}</text>
      <path class="series" d="${d}"/>
      <line class="crosshair" id="wc-cross" y1="${pad.t}" y2="${H - pad.b}" visibility="hidden"/>
      ${pts.map((p, i) => `<circle class="dot" cx="${x(t[i])}" cy="${y(p.kg)}" r="${i === pts.length - 1 ? 4 : 2.5}"/>`).join('')}
      <circle class="dot-active" id="wc-dot" r="5" visibility="hidden"/>
      <rect class="hit" x="${pad.l}" y="0" width="${W - pad.l - pad.r}" height="${H}"/>
    </svg>
    <div class="tooltip" id="wc-tip" hidden></div>`;

  const svg = $('svg', el), cross = $('#wc-cross'), dot = $('#wc-dot'), tip = $('#wc-tip');
  const move = ev => {
    const rect = svg.getBoundingClientRect();
    const px = ((ev.clientX - rect.left) / rect.width) * W;
    let best = 0;
    t.forEach((ms, i) => { if (Math.abs(x(ms) - px) < Math.abs(x(t[best]) - px)) best = i; });
    const cx = x(t[best]), cy = y(v[best]);
    cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('visibility', 'visible');
    tip.hidden = false;
    tip.innerHTML = `<strong>${v[best].toLocaleString('de-CH')} kg</strong><span>${fmtDate(t[best])}</span>`;
    const left = (cx / W) * rect.width;
    tip.style.left = Math.min(Math.max(left, 40), rect.width - 40) + 'px';
    tip.style.top = (cy / H) * rect.height - 8 + 'px';
  };
  const leave = () => { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', leave);
}

function renderProfile() {
  const p = store.getProfile();
  const form = $('#profile-form');
  if (p && !form.dataset.filled) {
    form.sex.value = p.sex;
    form.age.value = p.age;
    form.height.value = p.height;
    form.weight.value = currentWeight() || p.weight;
    form.activity.value = String(p.activity);
    form.goal.value = String(p.goal);
  }
  form.dataset.filled = '1';
  updateCalcPreview();
  const key = store.getApiKey();
  $('#api-key').value = '';
  $('#api-key').placeholder = key ? 'Gespeichert: ' + key.slice(0, 10) + '…' : 'sk-ant-…';
}

function readProfileForm() {
  const f = $('#profile-form');
  const p = {
    sex: f.sex.value,
    age: +f.age.value,
    height: +f.height.value,
    weight: +f.weight.value,
    activity: +f.activity.value,
    goal: +f.goal.value,
  };
  return p.age && p.height && p.weight ? p : null;
}

function updateCalcPreview() {
  const p = readProfileForm();
  const el = $('#calc-result');
  if (!p) { el.innerHTML = '<p class="muted small">Fülle Alter, Grösse und Gewicht aus.</p>'; return; }
  const r = dailyTargets(p);
  el.innerHTML = `
    <div class="calc-grid">
      <div><span class="stat-label">Grundumsatz</span><span class="stat-value">${fmt(r.bmr)}</span></div>
      <div><span class="stat-label">Gesamtumsatz</span><span class="stat-value">${fmt(r.tdee)}</span></div>
      <div class="highlight"><span class="stat-label">Dein Tagesziel</span><span class="stat-value">${fmt(r.kcal)} kcal</span></div>
    </div>
    <p class="muted small">Makros: ${r.protein} g Protein · ${r.carbs} g Kohlenhydrate · ${r.fat} g Fett</p>`;
}

/* ---------- Essen-Dialog ---------- */

let editing = null;

function openFoodDialog({ meal, food } = {}) {
  const dlg = $('#food-dialog');
  const f = $('#food-form');
  f.meal.innerHTML = MEALS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  editing = food?.id || null;
  $('#food-dialog-title').textContent = food ? 'Eintrag bearbeiten' : 'Essen hinzufügen';
  $('#btn-food-delete').classList.toggle('hidden', !food);
  f.name.value = food?.name || '';
  f.meal.value = food?.meal || meal || defaultMeal();
  f.kcal.value = food?.kcal ?? '';
  f.protein.value = food?.protein ?? '';
  f.carbs.value = food?.carbs ?? '';
  f.fat.value = food?.fat ?? '';
  dlg.showModal();
}

/* ---------- Events ---------- */

function bind() {
  $$('.tabbar button').forEach(b => b.addEventListener('click', () => showView(b.dataset.tab)));
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (go) showView(go.dataset.goto);

    const addMeal = e.target.closest('[data-add-meal]');
    if (addMeal) openFoodDialog({ meal: addMeal.dataset.addMeal });

    const foodBtn = e.target.closest('[data-food]');
    if (foodBtn) {
      const food = store.getDay(currentKey()).foods.find(f => f.id === foodBtn.dataset.food);
      if (food) openFoodDialog({ food });
    }

    const delWo = e.target.closest('[data-del-workout]');
    if (delWo && confirm('Training löschen?')) {
      store.removeWorkout(currentKey(), delWo.dataset.delWorkout);
      render();
    }
  });

  $('#prev-day').addEventListener('click', () => { state.date.setDate(state.date.getDate() - 1); render(); });
  $('#next-day').addEventListener('click', () => { if (!isToday()) { state.date.setDate(state.date.getDate() + 1); render(); } });
  $('#date-label').addEventListener('click', () => { state.date = new Date(); render(); });

  $('#btn-add-food').addEventListener('click', () => openFoodDialog());
  $('#btn-food-cancel').addEventListener('click', () => $('#food-dialog').close());
  $('#btn-food-delete').addEventListener('click', () => {
    if (editing && confirm('Eintrag löschen?')) {
      store.removeFood(currentKey(), editing);
      $('#food-dialog').close();
      render();
    }
  });
  $('#food-form').addEventListener('submit', e => {
    const f = e.target;
    const food = {
      name: f.name.value.trim(),
      meal: f.meal.value,
      kcal: Math.round(+f.kcal.value || 0),
      protein: +f.protein.value || 0,
      carbs: +f.carbs.value || 0,
      fat: +f.fat.value || 0,
    };
    if (editing) store.updateFood(currentKey(), editing, food);
    else store.addFood(currentKey(), food);
    toast(editing ? 'Gespeichert' : 'Hinzugefügt');
    render();
  });

  // Profil / Rechner
  $('#profile-form').addEventListener('input', updateCalcPreview);
  $('#profile-form').addEventListener('submit', e => {
    e.preventDefault();
    const p = readProfileForm();
    if (!p) return;
    store.setProfile(p);
    if (!store.getWeights().length) store.setWeight(store.dateKey(), p.weight);
    toast('Profil gespeichert');
    showView('today');
  });

  // API-Schlüssel
  $('#key-form').addEventListener('submit', e => {
    e.preventDefault();
    const key = $('#api-key').value.trim();
    const status = $('#key-status');
    if (!key) { status.textContent = 'Bitte einen Schlüssel eingeben.'; return; }
    if (!key.startsWith('sk-ant-')) { status.textContent = 'Das sieht nicht wie ein Claude-API-Schlüssel aus (beginnt mit «sk-ant-»).'; return; }
    status.textContent = store.setApiKey(key) ? 'Schlüssel gespeichert.' : 'Speichern nicht möglich (privater Modus?).';
    renderProfile();
  });
  $('#btn-key-clear').addEventListener('click', () => {
    store.setApiKey('');
    $('#key-status').textContent = 'Schlüssel entfernt.';
    renderProfile();
  });

  // Training
  $('#wo-type').addEventListener('change', updateWorkoutEstimate);
  $('#wo-minutes').addEventListener('input', updateWorkoutEstimate);
  $('#workout-form').addEventListener('submit', e => {
    e.preventDefault();
    const a = ACTIVITIES.find(x => x.id === $('#wo-type').value);
    store.addWorkout(currentKey(), {
      type: a.id,
      name: a.id === 'other' ? 'Training' : a.name,
      minutes: +$('#wo-minutes').value,
      kcal: Math.round(+$('#wo-kcal').value || 0),
    });
    toast('Training gespeichert');
    showView('today');
  });
  $('#weight-form').addEventListener('submit', e => {
    e.preventDefault();
    const kg = Math.round(+$('#weight-input').value * 10) / 10;
    if (!kg) return;
    store.setWeight(currentKey(), kg);
    toast('Gewicht eingetragen');
    render();
  });

  // Scanner
  $('#photo-input').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    $('#scan-status').textContent = '';
    $('#scan-result').classList.add('hidden');
    try {
      const img = await prepareImage(file);
      state.scan = { base64: img.base64, result: null };
      $('#photo-preview').src = img.dataUrl;
      $('#photo-preview').hidden = false;
      $('#photo-placeholder').hidden = true;
    } catch {
      $('#scan-status').textContent = 'Das Foto konnte nicht geladen werden.';
    }
    renderScan();
  });
  $('#btn-analyze').addEventListener('click', runAnalysis);
  $('#scan-items').addEventListener('input', updateScanTotal);
  $('#scan-items').addEventListener('click', e => {
    const del = e.target.closest('[data-remove-item]');
    if (del) { del.closest('.scan-item').remove(); updateScanTotal(); }
  });
  $('#btn-scan-save').addEventListener('click', saveScan);

  // Sicherung
  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([store.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitebase-sicherung-${store.dateKey()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('#backup-status').textContent = 'Sicherung erstellt.';
  });
  $('#import-input').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('Die aktuellen Daten werden durch die Sicherung ersetzt. Fortfahren?')) { e.target.value = ''; return; }
    try {
      store.importJson(await file.text());
      $('#backup-status').textContent = 'Sicherung importiert.';
      $('#profile-form').dataset.filled = '';
      render();
    } catch (err) {
      $('#backup-status').textContent = err.message || 'Import fehlgeschlagen.';
    }
    e.target.value = '';
  });
}

function updateWorkoutEstimate() {
  const type = $('#wo-type').value;
  const minutes = +$('#wo-minutes').value || 0;
  const est = workoutKcal(type, minutes, currentWeight());
  $('#wo-kcal').value = type === 'other' ? '' : est || '';
  $('#wo-hint').textContent = type === 'other'
    ? 'Gib die verbrannten kcal selbst ein, z. B. von deiner Uhr.'
    : currentWeight()
      ? 'Geschätzt aus Aktivität, Dauer und deinem Gewicht. Du kannst den Wert überschreiben, z. B. mit dem Wert deiner Uhr.'
      : 'Lege im Profil dein Gewicht fest, dann wird der Wert geschätzt.';
}

/* ---------- Scanner-Ablauf ---------- */

async function runAnalysis() {
  const btn = $('#btn-analyze');
  const status = $('#scan-status');
  btn.disabled = true;
  status.textContent = 'Analysiere Foto … (dauert ca. 10–30 Sekunden)';
  $('#scan-result').classList.add('hidden');
  try {
    const result = await analyzeFood({
      apiKey: store.getApiKey(),
      base64: state.scan.base64,
      hint: $('#scan-hint').value.trim(),
    });
    if (!result.is_food || !result.items.length) {
      status.textContent = 'Auf dem Foto wurde kein Essen erkannt. Versuche es mit einem anderen Foto.';
      return;
    }
    state.scan.result = result;
    status.textContent = '';
    showScanResult(result);
  } catch (err) {
    status.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
}

function showScanResult(result) {
  const conf = $('#scan-confidence');
  conf.textContent = 'Sicherheit: ' + result.confidence;
  conf.dataset.level = result.confidence;
  $('#scan-note').textContent = result.note || '';
  $('#scan-items').innerHTML = result.items.map((it, i) => `
    <div class="scan-item" data-i="${i}">
      <div class="scan-item-head">
        <input type="text" class="si-name" value="${esc(it.name)}" aria-label="Name">
        <button class="icon-btn small" data-remove-item aria-label="Entfernen">✕</button>
      </div>
      <div class="muted small">${esc(it.portion)}</div>
      <div class="row tight">
        <label class="field"><span>kcal</span><input type="number" class="si-kcal" inputmode="numeric" value="${Math.round(it.kcal)}"></label>
        <label class="field"><span>P (g)</span><input type="number" class="si-protein" inputmode="decimal" value="${Math.round(it.protein_g)}"></label>
        <label class="field"><span>K (g)</span><input type="number" class="si-carbs" inputmode="decimal" value="${Math.round(it.carbs_g)}"></label>
        <label class="field"><span>F (g)</span><input type="number" class="si-fat" inputmode="decimal" value="${Math.round(it.fat_g)}"></label>
      </div>
    </div>`).join('');
  $('#scan-meal').innerHTML = MEALS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  $('#scan-meal').value = defaultMeal();
  updateScanTotal();
  $('#scan-result').classList.remove('hidden');
  $('#scan-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function readScanItems() {
  return $$('#scan-items .scan-item').map(el => ({
    name: $('.si-name', el).value.trim() || 'Essen',
    kcal: Math.round(+$('.si-kcal', el).value || 0),
    protein: +$('.si-protein', el).value || 0,
    carbs: +$('.si-carbs', el).value || 0,
    fat: +$('.si-fat', el).value || 0,
  }));
}

function updateScanTotal() {
  const t = sumFoods(readScanItems());
  $('#scan-total').innerHTML = `<span>Total</span><strong>${fmt(t.kcal)} kcal</strong><span class="muted small">P ${fmt(t.protein)} · K ${fmt(t.carbs)} · F ${fmt(t.fat)}</span>`;
}

function saveScan() {
  const items = readScanItems();
  if (!items.length) return;
  const meal = $('#scan-meal').value;
  items.forEach(it => store.addFood(currentKey(), { ...it, meal, source: 'scan' }));
  state.scan = null;
  $('#photo-input').value = '';
  $('#photo-preview').hidden = true;
  $('#photo-placeholder').hidden = false;
  $('#scan-hint').value = '';
  $('#scan-result').classList.add('hidden');
  toast(`${items.length} Einträge hinzugefügt`);
  showView('today');
}

/* ---------- Start ---------- */

bind();
render();

// Wenn die App über Mitternacht offen bleibt oder zurückkehrt: auf "heute" springen.
let lastToday = store.dateKey();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && store.dateKey() !== lastToday) {
    lastToday = store.dateKey();
    state.date = new Date();
    render();
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
