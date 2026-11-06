import * as store from './store.js';
import {
  dailyTargets, ACTIVITIES, EXERCISE_GROUPS, workoutKcal, strengthKcal, sumFoods,
  workoutVolume, countSets, bestSet, isBetter, computeProgress, XP_RULES,
} from './calc.js';
import { prepareImage, analyzeFood } from './scanner.js';
import { CHANGELOG, VERSION } from './version.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const fmt = n => Math.round(n).toLocaleString('de-CH');
const fmtKg = n => (+n || 0).toLocaleString('de-CH', { maximumFractionDigits: 1 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nowTime = () => new Date().toTimeString().slice(0, 5);

const state = {
  date: new Date(),
  view: 'today',
  trainingMode: 'strength',
  scan: null, // { base64, result }
};

const currentKey = () => store.dateKey(state.date);
const isToday = () => currentKey() === store.dateKey();

function currentWeight() {
  const weights = store.getWeights();
  if (weights.length) return weights[weights.length - 1].kg;
  return store.getProfile()?.weight || 0;
}

function baseTarget() {
  const profile = store.getProfile();
  return profile ? dailyTargets({ ...profile, weight: currentWeight() }) : null;
}

function progress() {
  return computeProgress({
    days: store.getAllDays(),
    weights: store.getWeights(),
    targetKcal: baseTarget()?.kcal || null,
    todayKey: store.dateKey(),
  });
}

/* ---------- Navigation & Feedback ---------- */

function showView(view) {
  state.view = view;
  $$('.view').forEach(v => { v.hidden = v.dataset.view !== view; });
  $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === view));
  window.scrollTo(0, 0);
  render();
}

const toastQueue = [];
function toast(msg, kind = '') {
  toastQueue.push({ msg, kind });
  if (toastQueue.length === 1) nextToast();
}
function nextToast() {
  const item = toastQueue[0];
  if (!item) return;
  const el = $('#toast');
  el.textContent = item.msg;
  el.className = 'toast show ' + item.kind;
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => { toastQueue.shift(); nextToast(); }, 250);
  }, item.kind ? 2600 : 1800);
}

/** Zeigt gewonnene XP und Level-Ups nach einer Aktion an. */
function celebrate(before, msg) {
  const after = progress();
  const gained = after.xp - before.xp;
  toast(gained > 0 ? `${msg}  +${gained} XP` : msg);
  if (after.level > before.level) toast(`LEVEL UP! Du bist jetzt Level ${after.level}`, 'epic');
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

function renderPlayer() {
  const p = progress();
  $('#lvl').textContent = p.level;
  $('#xp-label').textContent = `${fmt(p.current)} / ${fmt(p.needed)} XP`;
  $('#xp-fill').style.width = `${(p.current / p.needed) * 100}%`;
  $('#streak').textContent = `🔥 ${p.streak} ${p.streak === 1 ? 'Tag' : 'Tage'}`;
  $('#streak').classList.toggle('cold', p.streak === 0);
}

function renderToday() {
  renderPlayer();
  const day = store.getDay(currentKey());
  const eaten = sumFoods(day.foods);
  const burned = day.workouts.reduce((s, w) => s + (+w.kcal || 0), 0);
  const targets = baseTarget();

  $('#setup-hint').classList.toggle('hidden', !!targets);

  const goal = targets ? targets.kcal + burned : 0;
  const remaining = goal - eaten.kcal;
  $('#kcal-eaten').textContent = fmt(eaten.kcal);
  $('#kcal-target').textContent = targets ? fmt(goal) : '–';
  const fill = $('#kcal-fill');
  fill.style.width = goal ? `${Math.min(eaten.kcal / goal, 1) * 100}%` : '0%';
  fill.classList.toggle('over', !!targets && remaining < 0);
  $('#kcal-remaining').textContent = !targets ? '' : remaining >= 0 ? `${fmt(remaining)} kcal übrig` : `${fmt(-remaining)} kcal über dem Ziel`;
  $('#kcal-remaining').className = targets && remaining < 0 ? 'neg' : 'pos';
  $('#kcal-breakdown').textContent = targets && burned ? `Basis ${fmt(targets.kcal)} + Training ${fmt(burned)}` : '';

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

  const foods = [...day.foods].sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  $('#food-count').textContent = foods.length ? `${foods.length} ${foods.length === 1 ? 'Eintrag' : 'Einträge'}` : '';
  $('#food-list').innerHTML = foods.length
    ? foods.map(f => `<li><button class="list-item" data-food="${f.id}">
        <span class="li-main">${esc(f.name)}</span>
        <span class="li-sub">${f.time ? f.time + ' · ' : ''}P ${fmt(f.protein || 0)} · K ${fmt(f.carbs || 0)} · F ${fmt(f.fat || 0)}</span>
        <span class="li-value">${fmt(f.kcal)}</span>
      </button></li>`).join('')
    : '<li class="empty">Noch nichts eingetragen.</li>';

  $('#today-workouts').innerHTML = day.workouts.length
    ? day.workouts.map(w => `<li class="list-item static">
        <span class="li-main">${w.kind === 'strength' ? '🏋️ ' : ''}${esc(w.name)}</span>
        <span class="li-sub">${w.kind === 'strength'
          ? `${w.exercises.length} Übungen · ${countSets(w.exercises)} Sätze · ${fmt(workoutVolume(w.exercises))} kg · ${fmt(w.minutes)} Min.`
          : `${fmt(w.minutes)} Min.`}</span>
        <span class="li-value">−${fmt(w.kcal)}</span>
        <button class="icon-btn small" data-del-workout="${w.id}" aria-label="Training löschen">✕</button>
      </li>`).join('')
    : '<li class="empty">Noch kein Training. Zeit für Gains!</li>';
}

function renderScan() {
  $('#scan-no-key').classList.toggle('hidden', !!store.getApiKey());
  $('#btn-analyze').disabled = !state.scan?.base64 || !store.getApiKey();
}

/* ---------- Training ---------- */

function renderTraining() {
  $$('.seg[data-mode]').forEach(b => b.classList.toggle('active', b.dataset.mode === state.trainingMode));
  $$('[data-mode-panel]').forEach(p => { p.hidden = p.dataset.modePanel !== state.trainingMode; });

  const sel = $('#wo-type');
  if (!sel.options.length) {
    sel.innerHTML = ACTIVITIES.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    updateWorkoutEstimate();
  }
  if (!$('#ex-select').options.length) {
    $('#ex-select').innerHTML = EXERCISE_GROUPS.map(g =>
      `<optgroup label="${g.group}">${g.names.map(n => `<option>${n}</option>`).join('')}</optgroup>`
    ).join('') + '<optgroup label="Eigene"><option value="__custom">Eigene Übung …</option></optgroup>';
  }

  renderSession();
  renderRecords();

  const todays = store.getWeights().find(w => w.date === currentKey());
  $('#weight-input').placeholder = currentWeight() ? String(currentWeight()) : '';
  $('#weight-input').value = todays ? todays.kg : '';
  renderWeightChart();
  renderWeekTable();
}

/** Letztes Mal, als eine Übung gemacht wurde (vor dem aktuellen Workout). */
function lastPerformance(name) {
  const days = store.getAllDays();
  for (const key of Object.keys(days).sort().reverse()) {
    for (const w of [...days[key].workouts].reverse()) {
      if (w.kind !== 'strength') continue;
      const ex = w.exercises.find(e => e.name === name);
      if (ex && ex.sets.length) return { date: key, sets: ex.sets };
    }
  }
  return null;
}

function summarizeSets(sets) {
  const valid = sets.filter(s => +s.reps > 0);
  if (!valid.length) return '';
  const same = valid.every(s => s.reps == valid[0].reps && s.kg == valid[0].kg);
  if (same) return `${valid.length} × ${valid[0].reps}${+valid[0].kg ? ' @ ' + fmtKg(valid[0].kg) + ' kg' : ''}`;
  return valid.map(s => `${s.reps}${+s.kg ? '×' + fmtKg(s.kg) : ''}`).join(', ');
}

function renderSession() {
  const draft = store.getDraft();
  $('#strength-start').classList.toggle('hidden', !!draft);
  $('#strength-session').classList.toggle('hidden', !draft);
  if (!draft) return;

  const records = progress().records;
  $('#session-exercises').innerHTML = draft.exercises.length
    ? draft.exercises.map((ex, i) => {
      const last = lastPerformance(ex.name);
      const rec = records[ex.name];
      return `<div class="card exercise" data-ex="${i}">
        <div class="card-head">
          <h3>${esc(ex.name)}</h3>
          <button class="icon-btn small" data-remove-ex="${i}" aria-label="Übung entfernen">✕</button>
        </div>
        <div class="ex-meta">
          ${last ? `<span>Letztes Mal: <strong>${summarizeSets(last.sets)}</strong></span>` : '<span>Erstes Mal – leg los!</span>'}
          ${rec ? `<span class="gold">🏆 ${fmtKg(rec.kg)} kg × ${rec.reps}</span>` : ''}
        </div>
        <div class="sets">
          <div class="set-row head"><span>Satz</span><span>Wdh.</span><span>kg</span><span></span></div>
          ${ex.sets.map((s, j) => `<div class="set-row">
            <span class="set-no">${j + 1}</span>
            <input type="number" inputmode="numeric" min="0" max="999" value="${s.reps ?? ''}" data-set="${i}:${j}:reps" aria-label="Wiederholungen Satz ${j + 1}">
            <input type="number" inputmode="decimal" step="0.5" min="0" max="999" value="${s.kg ?? ''}" data-set="${i}:${j}:kg" aria-label="Gewicht Satz ${j + 1}">
            <button class="icon-btn small" data-remove-set="${i}:${j}" aria-label="Satz entfernen">✕</button>
          </div>`).join('')}
        </div>
        <button class="btn small ghost" data-add-set="${i}">+ Satz</button>
      </div>`;
    }).join('')
    : '<div class="card empty-card">Wähle oben eine Übung und tippe auf «+ Übung».</div>';

  // Läuft das Workout schon eine Weile, zählt die echte Zeit, sonst 45 Min. als Vorschlag.
  const elapsed = Math.round((Date.now() - draft.startedAt) / 60000);
  const minutes = draft.minutesEdited ? draft.minutes : elapsed >= 10 ? elapsed : 45;
  $('#st-minutes').value = minutes;
  $('#st-kcal').value = draft.kcalEdited ? draft.kcal : strengthKcal(minutes, currentWeight());
  updateSessionStats();
}

function updateSessionStats() {
  const draft = store.getDraft();
  if (!draft) return;
  $('#session-stats').innerHTML = `
    <div><span class="stat-label">Übungen</span><span class="stat-value">${draft.exercises.length}</span></div>
    <div><span class="stat-label">Sätze</span><span class="stat-value">${countSets(draft.exercises)}</span></div>
    <div><span class="stat-label">Volumen</span><span class="stat-value">${fmt(workoutVolume(draft.exercises))} kg</span></div>`;
}

function updateDraft(fn, rerender = true) {
  const draft = store.getDraft();
  if (!draft) return;
  fn(draft);
  store.setDraft(draft);
  if (rerender) renderSession(); else updateSessionStats();
}

function renderRecords() {
  const recs = Object.entries(progress().records).sort((a, b) => a[0].localeCompare(b[0], 'de'));
  $('#records').innerHTML = recs.length
    ? recs.map(([name, r]) => `<li class="list-item static rec">
        <span class="li-main">${esc(name)}</span>
        <span class="li-sub">${new Date(r.date + 'T12:00:00').toLocaleDateString('de-CH')}</span>
        <span class="li-value gold">${fmtKg(r.kg)} kg × ${r.reps}</span>
      </li>`).join('')
    : '<li class="empty">Noch keine Rekorde. Starte dein erstes Workout!</li>';
}

function finishWorkout() {
  const draft = store.getDraft();
  if (!draft) return;
  const exercises = draft.exercises
    .map(ex => ({ name: ex.name, sets: ex.sets.filter(s => +s.reps > 0).map(s => ({ reps: +s.reps, kg: +s.kg || 0 })) }))
    .filter(ex => ex.sets.length);
  if (!exercises.length) { toast('Trag mindestens einen Satz mit Wiederholungen ein.'); return; }

  const before = progress();
  const minutes = +$('#st-minutes').value || 45;
  store.addWorkout(currentKey(), {
    kind: 'strength',
    name: 'Krafttraining',
    minutes,
    kcal: Math.round(+$('#st-kcal').value || 0),
    exercises,
  });
  store.setDraft(null);

  const after = progress();
  celebrate(before, 'Workout gespeichert!');
  for (const ex of exercises) {
    const prev = before.records[ex.name];
    const now = after.records[ex.name];
    if (prev && isBetter(now, prev)) toast(`🏆 NEUER REKORD: ${ex.name} ${fmtKg(now.kg)} kg × ${now.reps}`, 'gold');
  }
  showView('today');
}

function renderWeekTable() {
  const target = baseTarget()?.kcal;
  const rows = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const day = store.getDay(store.dateKey(d));
    rows.push({
      label: i === 0 ? 'Heute' : d.toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'numeric' }),
      eaten: sumFoods(day.foods).kcal,
      burned: day.workouts.reduce((s, w) => s + (+w.kcal || 0), 0),
      strength: day.workouts.some(w => w.kind === 'strength'),
    });
  }
  $('#week-table').innerHTML = `<table class="table">
    <thead><tr><th>Tag</th><th>Gegessen</th><th>Training</th>${target ? '<th>Bilanz</th>' : ''}</tr></thead>
    <tbody>${rows.map(r => {
      const bal = target ? r.eaten - (target + r.burned) : 0;
      return `<tr><td>${r.label}</td><td>${r.eaten ? fmt(r.eaten) : '–'}</td><td>${r.burned ? (r.strength ? '🏋️ ' : '') + fmt(r.burned) : '–'}</td>${
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
    <p class="chart-summary"><strong>${fmtKg(last.kg)} kg</strong>
      <span class="muted">${diff === 0 ? 'unverändert' : (diff > 0 ? '+' : '−') + fmtKg(Math.abs(diff)) + ' kg'} seit ${fmtDate(t0)}</span></p>
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
    tip.innerHTML = `<strong>${fmtKg(v[best])} kg</strong><span>${fmtDate(t[best])}</span>`;
    const left = (cx / W) * rect.width;
    tip.style.left = Math.min(Math.max(left, 40), rect.width - 40) + 'px';
    tip.style.top = (cy / H) * rect.height - 8 + 'px';
  };
  const leave = () => { cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', leave);
}

/* ---------- Profil ---------- */

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

  $('#xp-rules').innerHTML = XP_RULES.map(([what, xp]) =>
    `<li class="list-item static"><span class="li-main">${what}</span><span class="li-value xp">+${xp} XP</span></li>`).join('');

  $('#version-badge').textContent = 'v' + VERSION;
  $('#changelog').innerHTML = CHANGELOG.map((v, i) => `
    <div class="release${i === 0 ? ' current' : ''}">
      <div class="release-head">
        <span class="release-ver">v${v.version}</span>
        <span class="release-title">${esc(v.title)}</span>
        <span class="muted small">${new Date(v.date + 'T12:00:00').toLocaleDateString('de-CH')}</span>
      </div>
      <ul>${v.changes.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
    </div>`).join('');
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

function openFoodDialog(food) {
  const f = $('#food-form');
  editing = food?.id || null;
  $('#food-dialog-title').textContent = food ? 'Eintrag bearbeiten' : 'Essen hinzufügen';
  $('#btn-food-delete').classList.toggle('hidden', !food);
  f.name.value = food?.name || '';
  f.kcal.value = food?.kcal ?? '';
  f.protein.value = food?.protein ?? '';
  f.carbs.value = food?.carbs ?? '';
  f.fat.value = food?.fat ?? '';
  $('#food-dialog').showModal();
}

/* ---------- Events ---------- */

function bind() {
  $$('.tabbar button').forEach(b => b.addEventListener('click', () => showView(b.dataset.tab)));
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-goto]');
    if (go) showView(go.dataset.goto);

    const foodBtn = e.target.closest('[data-food]');
    if (foodBtn) {
      const food = store.getDay(currentKey()).foods.find(f => f.id === foodBtn.dataset.food);
      if (food) openFoodDialog(food);
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

  // Essen
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
      kcal: Math.round(+f.kcal.value || 0),
      protein: +f.protein.value || 0,
      carbs: +f.carbs.value || 0,
      fat: +f.fat.value || 0,
    };
    if (editing) {
      store.updateFood(currentKey(), editing, food);
      toast('Gespeichert');
    } else {
      const before = progress();
      store.addFood(currentKey(), { ...food, time: nowTime() });
      celebrate(before, 'Hinzugefügt');
    }
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

  // Training: Modus
  $$('.seg[data-mode]').forEach(b => b.addEventListener('click', () => { state.trainingMode = b.dataset.mode; renderTraining(); }));

  // Krafttraining
  $('#btn-start-workout').addEventListener('click', () => {
    store.setDraft({ startedAt: Date.now(), exercises: [] });
    renderSession();
  });
  $('#ex-select').addEventListener('change', () => {
    const custom = $('#ex-select').value === '__custom';
    $('#ex-custom').classList.toggle('hidden', !custom);
    if (custom) $('#ex-custom').focus();
  });
  $('#btn-add-ex').addEventListener('click', () => {
    let name = $('#ex-select').value;
    if (name === '__custom') {
      name = $('#ex-custom').value.trim();
      if (!name) { $('#ex-custom').focus(); return; }
      $('#ex-custom').value = '';
    }
    const last = lastPerformance(name);
    const sets = last ? last.sets.map(s => ({ reps: s.reps, kg: s.kg })) : [{ reps: '', kg: '' }];
    updateDraft(d => d.exercises.push({ name, sets }));
    const cards = $$('#session-exercises .exercise');
    cards[cards.length - 1]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#session-exercises').addEventListener('input', e => {
    const ref = e.target.dataset.set;
    if (!ref) return;
    const [i, j, field] = ref.split(':');
    updateDraft(d => { d.exercises[i].sets[j][field] = e.target.value === '' ? '' : +e.target.value; }, false);
  });
  $('#session-exercises').addEventListener('click', e => {
    const addSet = e.target.closest('[data-add-set]');
    if (addSet) {
      updateDraft(d => {
        const sets = d.exercises[addSet.dataset.addSet].sets;
        const last = sets[sets.length - 1];
        sets.push(last ? { ...last } : { reps: '', kg: '' });
      });
    }
    const rmSet = e.target.closest('[data-remove-set]');
    if (rmSet) {
      const [i, j] = rmSet.dataset.removeSet.split(':').map(Number);
      updateDraft(d => d.exercises[i].sets.splice(j, 1));
    }
    const rmEx = e.target.closest('[data-remove-ex]');
    if (rmEx && confirm('Übung entfernen?')) {
      updateDraft(d => d.exercises.splice(+rmEx.dataset.removeEx, 1));
    }
  });
  $('#st-minutes').addEventListener('input', () => {
    updateDraft(d => {
      d.minutes = +$('#st-minutes').value || 0;
      d.minutesEdited = true;
      if (!d.kcalEdited) $('#st-kcal').value = strengthKcal(d.minutes, currentWeight());
    }, false);
  });
  $('#st-kcal').addEventListener('input', () => {
    updateDraft(d => { d.kcal = +$('#st-kcal').value || 0; d.kcalEdited = true; }, false);
  });
  $('#btn-finish-workout').addEventListener('click', finishWorkout);
  $('#btn-discard-workout').addEventListener('click', () => {
    if (confirm('Workout verwerfen? Die Einträge gehen verloren.')) { store.setDraft(null); renderSession(); }
  });

  // Cardio
  $('#wo-type').addEventListener('change', updateWorkoutEstimate);
  $('#wo-minutes').addEventListener('input', updateWorkoutEstimate);
  $('#workout-form').addEventListener('submit', e => {
    e.preventDefault();
    const a = ACTIVITIES.find(x => x.id === $('#wo-type').value);
    const before = progress();
    store.addWorkout(currentKey(), {
      kind: 'cardio',
      type: a.id,
      name: a.id === 'other' ? 'Training' : a.name,
      minutes: +$('#wo-minutes').value,
      kcal: Math.round(+$('#wo-kcal').value || 0),
    });
    celebrate(before, 'Training gespeichert!');
    showView('today');
  });

  // Gewicht
  $('#weight-form').addEventListener('submit', e => {
    e.preventDefault();
    const kg = Math.round(+$('#weight-input').value * 10) / 10;
    if (!kg) return;
    const before = progress();
    store.setWeight(currentKey(), kg);
    celebrate(before, 'Gewicht eingetragen');
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
      ? 'Geschätzt aus Aktivität, Dauer und deinem Gewicht. Du kannst den Wert überschreiben.'
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
  const before = progress();
  const time = nowTime();
  items.forEach(it => store.addFood(currentKey(), { ...it, time, source: 'scan' }));
  state.scan = null;
  $('#photo-input').value = '';
  $('#photo-preview').hidden = true;
  $('#photo-placeholder').hidden = false;
  $('#scan-hint').value = '';
  $('#scan-result').classList.add('hidden');
  celebrate(before, `${items.length} ${items.length === 1 ? 'Eintrag' : 'Einträge'} hinzugefügt`);
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
