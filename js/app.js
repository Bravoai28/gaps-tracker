import { STAGES, FOODS, CATEGORIES, NEVER, stageName, foodById, allowedFoods, checkFoods } from './stages.js';
import * as S from './store.js';
import { syncNow, newCode, cleanCode, validCode } from './sync.js';

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const SLOTS = [
  { id: 'breakfast', name: 'Breakfast', emoji: '🌅', tint: 'peach', hint: 'Warm stock & soup are perfect' },
  { id: 'lunch', name: 'Lunch', emoji: '🥣', tint: 'mint', hint: '' },
  { id: 'dinner', name: 'Dinner', emoji: '🍲', tint: 'lav', hint: '' },
  { id: 'snack', name: 'Snacks & drinks', emoji: '🫖', tint: 'butter', hint: 'Stock, teas, probiotic juice' },
];
const PORTIONS = ['Taste (1–2 tsp)', 'Small', 'Half', 'Normal', 'Large'];
const EATEN = ['All', 'Most', 'Some', 'A little', 'Refused'];
const FACES = ['😣', '😕', '😐', '🙂', '😄'];
const SYMPTOMS = [
  { id: 'sleep', name: 'Sleep', labels: ['Very poor', 'Poor', 'OK', 'Good', 'Great'] },
  { id: 'mood', name: 'Mood & behaviour', labels: ['Very hard', 'Hard', 'OK', 'Good', 'Great'] },
  { id: 'skin', name: 'Skin', labels: ['Bad flare', 'Flare', 'Some', 'Mild', 'Clear'] },
  { id: 'energy', name: 'Energy', labels: ['Very low', 'Low', 'OK', 'Good', 'Great'] },
];
const BRISTOL = ['Hard lumps', 'Lumpy', 'Cracked', 'Smooth & soft', 'Soft blobs', 'Mushy', 'Watery'];

const fmtDate = (iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) => new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', opts);
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return S.today(d); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.h);
  toast.h = setTimeout(() => t.classList.remove('show'), 2400);
}

// ---------------- routing ----------------
function route() {
  const h = location.hash.replace(/^#\/?/, '');
  if (h.startsWith('join=')) { handleJoin(decodeURIComponent(h.slice(5))); return; }
  const [page, arg] = h.split('/');
  const view = $('#view');
  let tab = 'today';
  if (page === 'history') { tab = 'history'; renderHistory(view, arg); }
  else if (page === 'stages') { tab = 'stages'; renderStages(view); }
  else if (page === 'settings') { tab = 'settings'; renderSettings(view); }
  else if (page === 'day' && /^\d{4}-\d{2}-\d{2}$/.test(arg || '')) renderDay(view, arg);
  else renderDay(view, S.today());
  $$('#tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  renderTop();
}
let lastHash = '';
window.addEventListener('hashchange', () => { $('#sheet-root').innerHTML = ''; document.body.style.overflow = ''; if (location.hash !== lastHash) window.scrollTo(0, 0); lastHash = location.hash; route(); });

function renderTop() {
  const st = S.getState();
  const stage = S.setting('stage');
  const child = S.setting('childName');
  const name = st.device.name;
  const syncCls = st.sync.code ? (st.sync.lastError ? 'err' : (st.sync.lastSync ? 'ok' : '')) : '';
  $('#topbar').innerHTML = `
    <div class="hello">
      <small>${name ? `Hi ${esc(name)} 👋` : 'Hello 👋'}</small>
      <h1>${child ? esc(child) + '’s day' : 'GAPS Tracker'}</h1>
    </div>
    ${st.sync.code ? `<a class="pill" href="#/settings" title="Sync status" aria-label="Sync status"><span class="sync-dot ${syncCls}"></span></a>` : ''}
    <a class="pill" href="#/stages" aria-label="Current stage">${esc(stageName(stage))}</a>`;
}

// ---------------- day view ----------------
function ringSVG(frac, size = 116, stroke = 12, color = 'var(--green)') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#EDF1EC" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, frac))}" style="transition: stroke-dashoffset .6s"/></svg>`;
}

function foodLabel(e) {
  const parts = (e.foods || []).map((x) => x.name);
  if (e.freeText) parts.push(e.freeText);
  return parts.join(', ') || '—';
}

function renderDay(view, date) {
  const isToday = date === S.today();
  const entries = S.entriesFor(date);
  const meals = entries.filter((e) => e.kind === 'meal');
  const checks = entries.filter((e) => e.kind === 'check');
  const done = { ...Object.fromEntries(SLOTS.map((s) => [s.id, meals.some((m) => m.slot === s.id)])), check: checks.length > 0 };
  const count = Object.values(done).filter(Boolean).length;
  const stage = S.setting('stage');
  const dayN = Math.max(1, daysBetween(S.setting('stageStart') || date, date) + 1);
  const warnCount = meals.reduce((n, m) => n + (m.warnings || []).filter((w) => w.level !== 'unknown').length, 0);
  const st = S.getState();

  view.innerHTML = `
    <div class="datebar">
      <button class="iconbtn" data-go="${addDays(date, -1)}" aria-label="Previous day">‹</button>
      <div class="d">${isToday ? 'Today' : esc(fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' }))}<br><small class="muted">${esc(fmtDate(date))}</small></div>
      <button class="iconbtn" data-go="${addDays(date, 1)}" aria-label="Next day" ${isToday ? 'disabled style="opacity:.35"' : ''}>›</button>
    </div>

    <section class="card progress" aria-label="Today's progress">
      <div class="ring">${ringSVG(count / 5)}<div class="lbl"><div><div class="big">${count}/5</div><div class="sm">logged</div></div></div></div>
      <div style="flex:1;min-width:0">
        <h3 style="margin-bottom:8px">${esc(stageName(stage))}${stage < 7 && isToday ? ` · day ${dayN}` : ''}</h3>
        <ul class="checks">
          ${SLOTS.map((s) => `<li class="${done[s.id] ? 'done' : ''}"><span class="tick">✓</span>${s.id === 'snack' ? 'Snacks' : s.name}</li>`).join('')}
          <li class="${done.check ? 'done' : ''}"><span class="tick">✓</span>Check-in</li>
        </ul>
      </div>
    </section>

    ${warnCount ? `<div class="alert later" role="alert"><b>⚠️ ${warnCount} food${warnCount > 1 ? 's' : ''} outside ${esc(stageName(stage))}</b>Tap the meal to review. Keep an eye out for reactions.</div>` : ''}
    ${!st.device.hideDisclaimer ? `<div class="disclaimer"><b>Gentle reminder:</b> this app is a diary, not medical advice. Please make diet decisions with your GAPS practitioner and your child’s doctor. <a href="#" id="hide-disc">Got it</a></div>` : ''}

    ${SLOTS.map((s) => {
      const list = meals.filter((m) => m.slot === s.id);
      return `<section class="card tint-${s.tint}" aria-label="${s.name}">
        <div class="card-head">
          <div class="emoji-badge" aria-hidden="true">${s.emoji}</div>
          <div class="grow"><h2>${s.name}</h2><small class="muted">${list.length ? `${list.length} logged` : esc(s.hint || 'Nothing logged yet')}</small></div>
          <button class="add-btn" data-add="${s.id}" aria-label="Add ${s.name}">+</button>
        </div>
        ${list.length ? `<div class="items">${list.map((m) => `
          <button class="item" data-edit="${m.id}">
            <div class="t">${esc(m.time || '')}${m.by ? ` · ${esc(m.by)}` : ''}</div>
            <div class="f">${esc(foodLabel(m))}</div>
            <div class="meta">${[m.portion, m.eaten && `ate ${m.eaten.toLowerCase()}`].filter(Boolean).map(esc).join(' · ')}</div>
            ${(m.warnings || []).map((w) => `<span class="badge ${w.level === 'stop' ? 'stop' : 'later'}">${w.level === 'stop' ? 'Not GAPS' : w.level === 'later' ? 'Later stage' : 'Check'}: ${esc(w.food)}</span>`).join('')}
          </button>`).join('')}</div>` : ''}
      </section>`;
    }).join('')}

    <section class="card tint-sky" aria-label="Symptoms check-in">
      <div class="card-head">
        <div class="emoji-badge" aria-hidden="true">🌿</div>
        <div class="grow"><h2>Check-in</h2><small class="muted">Stool, sleep, mood, skin & energy</small></div>
        <button class="add-btn" data-check="new" aria-label="Add check-in">+</button>
      </div>
      ${checks.length ? `<div class="items">${checks.map((c) => `
        <button class="item" data-check="${c.id}">
          <div class="t">${esc(c.time || '')}${c.by ? ` · ${esc(c.by)}` : ''}</div>
          <div class="f">${checkSummary(c)}</div>
          ${c.reaction ? `<div class="meta">Possible reaction: ${esc(c.reaction)}</div>` : ''}
          ${c.notes ? `<div class="meta">${esc(c.notes)}</div>` : ''}
        </button>`).join('')}</div>` : ''}
    </section>
  `;
  $$('[data-go]', view).forEach((b) => b.onclick = () => { if (!b.disabled) location.hash = b.dataset.go === S.today() ? '#/' : `#/day/${b.dataset.go}`; });
  $$('[data-add]', view).forEach((b) => b.onclick = () => openMealSheet({ date, slot: b.dataset.add }));
  $$('[data-edit]', view).forEach((b) => b.onclick = () => openMealSheet(S.getState().entries[b.dataset.edit]));
  $$('[data-check]', view).forEach((b) => b.onclick = () => openCheckSheet(b.dataset.check === 'new' ? { date } : S.getState().entries[b.dataset.check]));
  const hd = $('#hide-disc', view);
  if (hd) hd.onclick = (e) => { e.preventDefault(); S.setDevice({ hideDisclaimer: true }); };
}

function checkSummary(c) {
  const bits = [];
  if (c.stool?.type) bits.push(`💩 type ${c.stool.type}${c.stool.count ? ` ×${c.stool.count}` : ''}`);
  else if (c.stool?.count === 0 && c.stool?.none) bits.push('💩 none');
  SYMPTOMS.forEach((s) => { if (c[s.id]?.score) bits.push(`${s.name.split(' ')[0]} ${FACES[c[s.id].score - 1]}`); });
  return esc(bits.join(' · ') || 'Notes only');
}

// ---------------- sheets ----------------
function openSheet(html, onMount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="sheet-backdrop"></div><div class="sheet" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  $('.sheet-backdrop', root).onclick = closeSheet;
  document.body.style.overflow = 'hidden';
  onMount($('.sheet', root));
}
function closeSheet() {
  const root = $('#sheet-root');
  if (!root.innerHTML) return;
  root.innerHTML = '';
  document.body.style.overflow = '';
  const y = window.scrollY; route(); window.scrollTo(0, y);
}

function previouslyLogged() {
  const ids = new Set();
  S.live().forEach((e) => (e.foods || []).forEach((f) => f.id && ids.add(f.id)));
  return ids;
}

function openMealSheet(entry) {
  const editing = !!entry.id;
  const stage = S.setting('stage');
  const m = {
    kind: 'meal', date: entry.date || S.today(), slot: entry.slot || 'breakfast',
    time: entry.time || S.nowTime(), foods: [...(entry.foods || [])], freeText: entry.freeText || '',
    portion: entry.portion || '', eaten: entry.eaten || '', notes: entry.notes || '', ...(editing ? { id: entry.id, createdAt: entry.createdAt, by: entry.by } : {}),
  };
  const before = previouslyLogged();
  let showAll = false;
  let query = '';

  openSheet(`
    <div class="sheet-title"><h2>${editing ? 'Edit meal' : 'Log a meal'}</h2><button class="iconbtn" data-close aria-label="Close">✕</button></div>
    <div class="seg" role="tablist">${SLOTS.map((s) => `<button data-slot="${s.id}">${s.emoji}<br>${s.id === 'snack' ? 'Snack' : s.name}</button>`).join('')}</div>
    <div class="row" style="margin-top:4px">
      <div style="flex:1"><label class="lbl" for="m-time">Time</label><input type="time" id="m-time" value="${esc(m.time)}"></div>
      <div style="flex:1"><label class="lbl" for="m-date">Date</label><input type="date" id="m-date" value="${esc(m.date)}" max="${S.today()}"></div>
    </div>
    <label class="lbl" for="m-search">Foods <small class="muted">· ${esc(stageName(stage))} list</small></label>
    <input type="search" id="m-search" placeholder="Search foods…" autocomplete="off">
    <div id="m-chips"></div>
    <button class="btn ghost block" id="m-more" style="margin-top:12px;min-height:46px"></button>
    <label class="lbl" for="m-free">Anything else? <small class="muted">(free text, comma-separated)</small></label>
    <input type="text" id="m-free" value="${esc(m.freeText)}" placeholder="e.g. chicken & carrot soup, 1 tsp sauerkraut juice">
    <div id="m-warn"></div>
    <div class="lbl">Portion</div>
    <div class="chips" id="m-portion">${PORTIONS.map((p) => `<button class="chip" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    <div class="lbl">How much was eaten?</div>
    <div class="chips" id="m-eaten">${EATEN.map((p) => `<button class="chip" data-v="${esc(p)}">${esc(p)}</button>`).join('')}</div>
    <label class="lbl" for="m-notes">Notes</label>
    <textarea id="m-notes" placeholder="Anything worth remembering?">${esc(m.notes)}</textarea>
    <div class="sheet-foot row">
      ${editing ? '<button class="btn danger" id="m-del" style="flex:0 0 auto">Delete</button>' : ''}
      <button class="btn" id="m-save">${editing ? 'Save changes' : 'Save meal'}</button>
    </div>
  `, (el) => {
    $('[data-close]', el).onclick = closeSheet;
    const paintSeg = () => $$('[data-slot]', el).forEach((b) => b.classList.toggle('on', b.dataset.slot === m.slot));
    $$('[data-slot]', el).forEach((b) => b.onclick = () => { m.slot = b.dataset.slot; paintSeg(); });
    paintSeg();
    const single = (wrapSel, key) => {
      const wrap = $(wrapSel, el);
      const paint = () => $$('.chip', wrap).forEach((c) => c.classList.toggle('on', c.dataset.v === m[key]));
      $$('.chip', wrap).forEach((c) => c.onclick = () => { m[key] = m[key] === c.dataset.v ? '' : c.dataset.v; paint(); });
      paint();
    };
    single('#m-portion', 'portion');
    single('#m-eaten', 'eaten');

    const paintChips = () => {
      const list = (showAll ? FOODS : allowedFoods(stage)).filter((f) => !query || (f.name + ' ' + f.aliases.join(' ')).toLowerCase().includes(query));
      const selectedIds = new Set(m.foods.map((x) => x.id));
      // always show selected foods even when filtered out
      m.foods.forEach((x) => { const f = foodById(x.id); if (f && !list.includes(f)) list.unshift(f); });
      const byCat = CATEGORIES.map((c) => [c, list.filter((f) => f.cat === c)]).filter(([, l]) => l.length);
      $('#m-chips', el).innerHTML = byCat.length ? byCat.map(([c, l]) => `<div class="cat-title">${esc(c)}</div><div class="chips">${l.map((f) =>
        `<button class="chip ${f.stage > stage ? 'later' : ''} ${selectedIds.has(f.id) ? 'on' : ''}" data-food="${f.id}" title="${esc(f.tip)}">${esc(f.name)}${f.stage > stage ? ` <small>${STAGES[f.stage - 1].short}</small>` : ''}${!before.has(f.id) && selectedIds.has(f.id) ? ' <small>· new</small>' : ''}</button>`).join('')}</div>`).join('')
        : `<p class="empty">No matching foods. Type it in “Anything else?” below.</p>`;
      $$('[data-food]', el).forEach((b) => b.onclick = () => {
        const f = foodById(b.dataset.food);
        const i = m.foods.findIndex((x) => x.id === f.id);
        if (i >= 0) m.foods.splice(i, 1); else m.foods.push({ id: f.id, name: f.name, stage: f.stage });
        paintChips(); paintWarn();
      });
      $('#m-more', el).textContent = showAll ? `Show only ${stageName(stage)} foods` : 'Show later-stage foods too';
    };
    const paintWarn = () => {
      const w = checkFoods(m.foods, m.freeText, stage);
      const newFoods = m.foods.filter((x) => !before.has(x.id) && (foodById(x.id)?.stage || 9) <= stage);
      const groups = { stop: w.filter((x) => x.level === 'stop'), later: w.filter((x) => x.level === 'later'), unknown: w.filter((x) => x.level === 'unknown') };
      $('#m-warn', el).innerHTML =
        (groups.stop.length ? `<div class="alert stop" role="alert"><b>🚫 Not part of GAPS</b><ul>${groups.stop.map((x) => `<li>${esc(x.msg)}</li>`).join('')}</ul></div>` : '') +
        (groups.later.length ? `<div class="alert later" role="alert"><b>⚠️ Not allowed yet at ${esc(stageName(stage))}</b><ul>${groups.later.map((x) => `<li>${esc(x.msg)}</li>`).join('')}</ul></div>` : '') +
        (groups.unknown.length ? `<div class="alert unknown"><b>🤔 Not on the list</b><ul>${groups.unknown.map((x) => `<li>${esc(x.msg)}</li>`).join('')}</ul></div>` : '') +
        (newFoods.length ? `<div class="alert info"><b>🌱 First time logged: ${newFoods.map((x) => esc(x.name)).join(', ')}</b>Start with a teaspoon or two and watch stools, sleep and skin over the next few days.</div>` : '');
      return w;
    };
    $('#m-search', el).oninput = (e) => { query = e.target.value.trim().toLowerCase(); paintChips(); };
    $('#m-more', el).onclick = () => { showAll = !showAll; paintChips(); };
    $('#m-free', el).oninput = (e) => { m.freeText = e.target.value; paintWarn(); };
    paintChips(); paintWarn();

    $('#m-save', el).onclick = () => {
      m.time = $('#m-time', el).value || S.nowTime();
      m.date = $('#m-date', el).value || m.date;
      m.notes = $('#m-notes', el).value.trim();
      m.freeText = $('#m-free', el).value.trim();
      if (!m.foods.length && !m.freeText) { toast('Pick at least one food'); return; }
      const w = checkFoods(m.foods, m.freeText, stage);
      const serious = w.filter((x) => x.level !== 'unknown');
      if (serious.length && !confirm(`Heads up: ${serious.length} food${serious.length > 1 ? 's are' : ' is'} not on the ${stageName(stage)} list.\n\n${serious.map((x) => '• ' + x.msg).join('\n')}\n\nLog it anyway? (It will be flagged in the diary.)`)) return;
      S.upsert({ ...m, stage, warnings: w });
      closeSheet();
      toast(serious.length ? 'Saved – flagged for review' : 'Meal saved ✓');
      if (m.date !== S.today()) location.hash = `#/day/${m.date}`;
    };
    const del = $('#m-del', el);
    if (del) del.onclick = () => { if (confirm('Delete this meal?')) { S.remove(m.id); closeSheet(); toast('Deleted'); } };
  });
}

function openCheckSheet(entry) {
  const editing = !!entry.id;
  const c = {
    kind: 'check', date: entry.date || S.today(), time: entry.time || S.nowTime(),
    stool: { type: 0, count: 1, note: '', none: false, ...(entry.stool || {}) },
    sleep: { score: 0, note: '', ...(entry.sleep || {}) }, mood: { score: 0, note: '', ...(entry.mood || {}) },
    skin: { score: 0, note: '', ...(entry.skin || {}) }, energy: { score: 0, note: '', ...(entry.energy || {}) },
    reaction: entry.reaction || '', notes: entry.notes || '',
    ...(editing ? { id: entry.id, createdAt: entry.createdAt, by: entry.by } : {}),
  };
  if (!editing) c.stool.count = 0;
  openSheet(`
    <div class="sheet-title"><h2>${editing ? 'Edit check-in' : 'How’s he doing?'}</h2><button class="iconbtn" data-close aria-label="Close">✕</button></div>
    <div class="row"><div style="flex:1"><label class="lbl" for="c-time">Time</label><input type="time" id="c-time" value="${esc(c.time)}"></div>
    <div style="flex:1"><label class="lbl" for="c-date">Date</label><input type="date" id="c-date" value="${esc(c.date)}" max="${S.today()}"></div></div>

    <div class="symptom" id="sym-stool">
      <div class="head"><h3>💩 Stool <small class="muted">(Bristol type)</small></h3><span class="val" id="stool-val"></span></div>
      <div class="scale seven">${BRISTOL.map((b, i) => `<button data-bristol="${i + 1}" aria-label="Type ${i + 1}: ${b}">${i + 1}</button>`).join('')}</div>
      <div class="row" style="align-items:center;margin-top:10px;justify-content:space-between">
        <div class="stepper"><button data-cnt="-1" aria-label="Fewer">−</button><b id="stool-cnt"></b><button data-cnt="1" aria-label="More">+</button></div>
        <button class="chip" id="stool-none">None today</button>
      </div>
      <input type="text" data-note="stool" placeholder="Note (colour, smell, undigested food…)" value="${esc(c.stool.note)}">
    </div>
    ${SYMPTOMS.map((s) => `
      <div class="symptom" data-sym="${s.id}">
        <div class="head"><h3>${s.name}</h3><span class="val"></span></div>
        <div class="scale">${FACES.map((f, i) => `<button data-score="${i + 1}" aria-label="${s.labels[i]}">${f}<span>${s.labels[i]}</span></button>`).join('')}</div>
        <input type="text" data-note="${s.id}" placeholder="Note" value="${esc(c[s.id].note)}">
      </div>`).join('')}
    <label class="lbl" for="c-react">Possible reaction to a food?</label>
    <input type="text" id="c-react" placeholder="e.g. rash after yoghurt" value="${esc(c.reaction)}">
    <label class="lbl" for="c-notes">Other notes</label>
    <textarea id="c-notes" placeholder="Meltdowns, tummy ache, bloating, eye contact, speech…">${esc(c.notes)}</textarea>
    <div class="sheet-foot row">
      ${editing ? '<button class="btn danger" id="c-del" style="flex:0 0 auto">Delete</button>' : ''}
      <button class="btn" id="c-save">${editing ? 'Save changes' : 'Save check-in'}</button>
    </div>
  `, (el) => {
    $('[data-close]', el).onclick = closeSheet;
    const paintStool = () => {
      $$('[data-bristol]', el).forEach((b) => b.classList.toggle('on', +b.dataset.bristol === c.stool.type));
      $('#stool-val', el).textContent = c.stool.none ? 'None today' : c.stool.type ? `Type ${c.stool.type} · ${BRISTOL[c.stool.type - 1]}` : '';
      $('#stool-cnt', el).textContent = `${c.stool.count} time${c.stool.count === 1 ? '' : 's'}`;
      $('#stool-none', el).classList.toggle('on', c.stool.none);
    };
    $$('[data-bristol]', el).forEach((b) => b.onclick = () => { const v = +b.dataset.bristol; c.stool.type = c.stool.type === v ? 0 : v; c.stool.none = false; if (c.stool.type && !c.stool.count) c.stool.count = 1; paintStool(); });
    $$('[data-cnt]', el).forEach((b) => b.onclick = () => { c.stool.count = Math.max(0, c.stool.count + +b.dataset.cnt); if (c.stool.count) c.stool.none = false; paintStool(); });
    $('#stool-none', el).onclick = () => { c.stool.none = !c.stool.none; if (c.stool.none) { c.stool.type = 0; c.stool.count = 0; } paintStool(); };
    paintStool();
    $$('[data-sym]', el).forEach((wrap) => {
      const id = wrap.dataset.sym, def = SYMPTOMS.find((s) => s.id === id);
      const paint = () => {
        $$('[data-score]', wrap).forEach((b) => b.classList.toggle('on', +b.dataset.score === c[id].score));
        $('.val', wrap).textContent = c[id].score ? def.labels[c[id].score - 1] : '';
      };
      $$('[data-score]', wrap).forEach((b) => b.onclick = () => { const v = +b.dataset.score; c[id].score = c[id].score === v ? 0 : v; paint(); });
      paint();
    });
    $('#c-save', el).onclick = () => {
      $$('[data-note]', el).forEach((i) => { c[i.dataset.note].note = i.value.trim(); });
      c.time = $('#c-time', el).value || S.nowTime();
      c.date = $('#c-date', el).value || c.date;
      c.reaction = $('#c-react', el).value.trim();
      c.notes = $('#c-notes', el).value.trim();
      const any = c.stool.type || c.stool.none || SYMPTOMS.some((s) => c[s.id].score || c[s.id].note) || c.reaction || c.notes || c.stool.note;
      if (!any) { toast('Tap at least one scale or add a note'); return; }
      S.upsert({ ...c, stage: S.setting('stage') });
      closeSheet();
      toast('Check-in saved ✓');
      if (c.date !== S.today()) location.hash = `#/day/${c.date}`;
    };
    const del = $('#c-del', el);
    if (del) del.onclick = () => { if (confirm('Delete this check-in?')) { S.remove(c.id); closeSheet(); toast('Deleted'); } };
  });
}

// ---------------- history ----------------
function renderHistory(view, ym) {
  const now = S.today();
  ym = /^\d{4}-\d{2}$/.test(ym || '') ? ym : now.slice(0, 7);
  const [y, mo] = ym.split('-').map(Number);
  const first = new Date(y, mo - 1, 1);
  const days = new Date(y, mo, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Monday first
  const prev = S.today(new Date(y, mo - 2, 1)).slice(0, 7);
  const next = S.today(new Date(y, mo, 1)).slice(0, 7);
  const live = S.live();
  const byDate = {};
  live.forEach((e) => { (byDate[e.date] ||= []).push(e); });

  let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<div class="dow">${d}</div>`).join('');
  for (let i = 0; i < lead; i++) cells += '<a class="out" aria-hidden="true"></a>';
  for (let d = 1; d <= days; d++) {
    const iso = `${ym}-${String(d).padStart(2, '0')}`;
    const es = byDate[iso] || [];
    const meals = es.filter((e) => e.kind === 'meal');
    const warn = meals.some((m) => (m.warnings || []).some((w) => w.level !== 'unknown'));
    const chk = es.some((e) => e.kind === 'check');
    cells += `<a href="${iso === now ? '#/' : '#/day/' + iso}" class="${es.length ? 'has' : ''} ${iso === now ? 'today' : ''}" aria-label="${fmtDate(iso)}: ${meals.length} meals${warn ? ', warning' : ''}">${d}
      <span class="dots">${meals.length ? '<i class="dot-meal"></i>' : ''}${chk ? '<i class="dot-check"></i>' : ''}${warn ? '<i class="dot-warn"></i>' : ''}</span></a>`;
  }

  // trends: last 14 days
  const last = Array.from({ length: 14 }, (_, i) => addDays(now, i - 13));
  const avg = (date, id) => {
    const cs = (byDate[date] || []).filter((e) => e.kind === 'check' && e[id]?.score);
    return cs.length ? cs.reduce((n, c) => n + c[id].score, 0) / cs.length : null;
  };
  const stoolAvg = (date) => {
    const cs = (byDate[date] || []).filter((e) => e.kind === 'check' && e.stool?.type);
    return cs.length ? cs.reduce((n, c) => n + c.stool.type, 0) / cs.length : null;
  };
  const spark = (vals, max, color) => {
    const pts = vals.map((v, i) => v == null ? null : [i * (300 / 13), 52 - ((v - 1) / (max - 1)) * 46]);
    const segs = []; let cur = [];
    pts.forEach((p) => { if (p) cur.push(p); else if (cur.length) { segs.push(cur); cur = []; } });
    if (cur.length) segs.push(cur);
    return `<svg class="spark" viewBox="-4 0 308 58" preserveAspectRatio="none" aria-hidden="true">
      ${segs.map((s) => `<polyline fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${s.map((p) => p.join(',')).join(' ')}"/>`).join('')}
      ${pts.filter(Boolean).map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="${color}"/>`).join('')}</svg>`;
  };
  const lastVal = (vals) => { const v = [...vals].reverse().find((x) => x != null); return v == null ? '–' : v.toFixed(1).replace('.0', ''); };
  const trends = [
    ['Stool type', last.map(stoolAvg), 7, '#8B6B4A'],
    ...SYMPTOMS.map((s, i) => [s.name.split(' ')[0], last.map((d) => avg(d, s.id)), 5, ['#4AA3D9', '#8E7CE0', '#E86F8E', '#F2A65A'][i]]),
  ];
  const warnList = live.filter((e) => e.kind === 'meal' && (e.warnings || []).some((w) => w.level !== 'unknown')).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 8);
  const reactions = live.filter((e) => e.kind === 'check' && e.reaction).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 8);

  view.innerHTML = `
    <div class="datebar">
      <a class="iconbtn" href="#/history/${prev}" aria-label="Previous month" style="text-decoration:none;color:inherit">‹</a>
      <div class="d">${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
      <a class="iconbtn" href="#/history/${next}" aria-label="Next month" style="text-decoration:none;color:inherit">›</a>
    </div>
    <section class="card"><div class="cal">${cells}</div>
      <div class="legend"><span><i class="dot-meal"></i>Meals</span><span><i class="dot-check"></i>Check-in</span><span><i class="dot-warn"></i>Off-stage food</span></div>
    </section>
    <section class="card">
      <h2 style="margin-bottom:10px">Last 14 days</h2>
      ${trends.map(([n, vals, max, col]) => `<div class="trend-row"><span>${n}</span>${spark(vals, max, col)}<b style="text-align:right">${lastVal(vals)}</b></div>`).join('')}
      <small class="muted">Stool: Bristol type (3–4 is typical). Others: 1 = hard day, 5 = great.</small>
    </section>
    ${warnList.length ? `<section class="card tint-rose"><h2>Off-stage foods</h2><div class="items">${warnList.map((m) => `<a class="item" style="text-decoration:none;color:inherit" href="#/day/${m.date}"><div class="t">${esc(fmtDate(m.date, { day: 'numeric', month: 'short' }))} · ${esc(m.time)}</div><div class="f">${esc(foodLabel(m))}</div>${m.warnings.filter((w) => w.level !== 'unknown').map((w) => `<span class="badge ${w.level}">${esc(w.food)}</span>`).join('')}</a>`).join('')}</div></section>` : ''}
    ${reactions.length ? `<section class="card tint-butter"><h2>Possible reactions</h2><div class="items">${reactions.map((c) => `<a class="item" style="text-decoration:none;color:inherit" href="#/day/${c.date}"><div class="t">${esc(fmtDate(c.date, { day: 'numeric', month: 'short' }))} · ${esc(c.time)}</div><div class="f">${esc(c.reaction)}</div></a>`).join('')}</div></section>` : ''}
    <section class="card">
      <h2>Export</h2>
      <p class="muted">A spreadsheet of every meal and check-in – handy for your practitioner.</p>
      <div class="row" style="margin-top:12px"><button class="btn" id="export-csv">⬇️ Export CSV</button></div>
    </section>`;
  $('#export-csv', view).onclick = exportCSV;
}

// ---------------- CSV / backup ----------------
const csvCell = (v) => { const s = String(v ?? ''); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export function buildCSV() {
  const cols = ['date', 'time', 'type', 'stage', 'meal', 'foods', 'other_foods', 'portion', 'eaten', 'warnings', 'stool_type', 'stool_desc', 'stool_count', 'stool_note', 'sleep', 'sleep_note', 'mood_behaviour', 'mood_note', 'skin', 'skin_note', 'energy', 'energy_note', 'possible_reaction', 'notes', 'logged_by'];
  const rows = S.live().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map((e) => {
    const r = { date: e.date, time: e.time, type: e.kind === 'meal' ? 'meal' : 'check-in', stage: stageName(e.stage || 1), notes: e.notes, logged_by: e.by };
    if (e.kind === 'meal') Object.assign(r, { meal: e.slot, foods: (e.foods || []).map((f) => f.name).join('; '), other_foods: e.freeText, portion: e.portion, eaten: e.eaten, warnings: (e.warnings || []).map((w) => w.msg).join(' | ') });
    else Object.assign(r, {
      stool_type: e.stool?.type || (e.stool?.none ? 'none' : ''), stool_desc: e.stool?.type ? BRISTOL[e.stool.type - 1] : '', stool_count: e.stool?.type || e.stool?.none ? e.stool.count : '', stool_note: e.stool?.note,
      sleep: e.sleep?.score || '', sleep_note: e.sleep?.note, mood_behaviour: e.mood?.score || '', mood_note: e.mood?.note, skin: e.skin?.score || '', skin_note: e.skin?.note, energy: e.energy?.score || '', energy_note: e.energy?.note, possible_reaction: e.reaction,
    });
    return cols.map((c) => csvCell(r[c])).join(',');
  });
  return '\uFEFF' + [cols.join(','), ...rows].join('\r\n');
}
async function shareOrDownload(name, text, type) {
  const blob = new Blob([text], { type });
  const file = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportCSV() {
  if (!S.live().length) { toast('Nothing logged yet'); return; }
  shareOrDownload(`gaps-diary-${S.today()}.csv`, buildCSV(), 'text/csv');
  toast('CSV exported');
}

// ---------------- stages ----------------
function renderStages(view) {
  const cur = S.setting('stage');
  view.innerHTML = `
    <section class="card tint-mint">
      <small class="muted">Current stage</small>
      <h1 style="margin:2px 0 6px">${esc(stageName(cur))}</h1>
      <p>${esc(STAGES[cur - 1].summary)}</p>
      <p class="muted" style="font-size:14px">Since ${esc(fmtDate(S.setting('stageStart'), { day: 'numeric', month: 'long' }))}. Only change stage on your practitioner’s advice.</p>
      <div class="row" style="margin-top:12px">
        <button class="btn ghost" id="st-down" ${cur <= 1 ? 'disabled' : ''}>← Back</button>
        <button class="btn" id="st-up" ${cur >= 7 ? 'disabled' : ''}>Move on →</button>
      </div>
    </section>
    <div class="disclaimer"><b>Not medical advice.</b> These lists are a short paraphrased summary to help you log meals; they don’t replace the GAPS book or your practitioner. Children differ – some foods may come in earlier or later.</div>
    <section class="card">
      <h2>Moving through the stages</h2>
      <ul style="padding-left:20px;margin:8px 0 0">
        <li>Bring in <b>one new food at a time</b>, starting with a teaspoon or so, and build up over a few days.</li>
        <li>Watch <b>stools</b> most of all – plus sleep, skin, mood and energy. Reactions can be delayed by a day or two.</li>
        <li>If diarrhoea, pain or other symptoms come back, <b>pause that food</b> and try again in about a week.</li>
        <li>For foods you suspect (e.g. dairy, eggs), the GAPS <b>sensitivity test</b> is a drop of the food on the inside of the wrist at bedtime; a red patch in the morning means wait a few weeks.</li>
        <li>Move on when the current stage is well tolerated and stools are settling – there’s no fixed timetable.</li>
        <li>Keep stock and soup going every day, even after the Introduction Diet.</li>
      </ul>
    </section>
    ${STAGES.map((s) => {
      const foods = FOODS.filter((f) => f.stage === s.n);
      return `<details class="card stage-card" style="--c:${s.color}" ${s.n === cur ? 'open' : ''}>
        <summary><span class="stage-num">${esc(s.short)}</span><div style="flex:1"><h2>${esc(s.name)}</h2></div>${s.n === cur ? '<span class="current-tag">Now</span>' : ''}<span aria-hidden="true">▾</span></summary>
        <p style="margin-top:10px">${esc(s.summary)}</p>
        <div class="cat-title">${s.n === 1 ? 'Foods' : 'Adds'}</div>
        <div class="food-list">${foods.map((f) => `<span title="${esc(f.tip)}">${esc(f.name)}</span>`).join('')}</div>
        <div class="cat-title">Still avoid</div><p>${esc(s.avoid)}</p>
        <div class="cat-title">Moving on</div><p>${esc(s.howToMove)}</p>
      </details>`;
    }).join('')}
    <section class="card tint-rose">
      <h2>Never on GAPS</h2>
      ${NEVER.map((g) => `<p><b>${esc(g.label)}:</b> ${esc(g.words.slice(0, 10).join(', '))}…</p>`).join('')}
    </section>
    <p class="muted" style="font-size:13px;text-align:center">Sources are listed in <a href="https://github.com/Bravoai28/gaps-tracker/blob/main/RESEARCH.md" target="_blank" rel="noopener">RESEARCH.md</a>.</p>`;
  const change = (d) => {
    const n = cur + d;
    if (!confirm(`Change current stage to ${stageName(n)}?\n\nNew meals will be checked against the ${stageName(n)} list. Both phones will update after sync.`)) return;
    S.setSetting('stage', n);
    S.setSetting('stageStart', S.today());
    toast(`Now on ${stageName(n)}`);
  };
  $('#st-up', view).onclick = () => change(1);
  $('#st-down', view).onclick = () => change(-1);
}

// ---------------- settings & sharing ----------------
function inviteLink(code) {
  return `${location.origin}${location.pathname}#join=${encodeURIComponent(code)}`;
}
function renderSettings(view) {
  const st = S.getState();
  const code = st.sync.code;
  view.innerHTML = `
    <section class="card">
      <h2>About you</h2>
      <label class="lbl" for="s-name">Your name <small class="muted">(shown on what you log)</small></label>
      <input type="text" id="s-name" value="${esc(st.device.name)}" placeholder="e.g. Khomi">
      <label class="lbl" for="s-child">Child’s first name or nickname <small class="muted">(optional)</small></label>
      <input type="text" id="s-child" value="${esc(S.setting('childName'))}" placeholder="optional">
      <label class="lbl" for="s-start">Started current stage on</label>
      <input type="date" id="s-start" value="${esc(S.setting('stageStart'))}">
    </section>

    <section class="card tint-sky" id="sharing">
      <h2>Share with your partner</h2>
      ${code ? `
        <p>This phone is synced with your household. Anyone with this code can see and add to the diary – only share it with your partner.</p>
        <div class="code" id="s-code">${esc(code)}</div>
        <p class="muted" style="font-size:14px">${st.sync.lastError ? `⚠️ ${esc(st.sync.lastError)}` : st.sync.lastSync ? `✓ Last synced ${new Date(st.sync.lastSync).toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}` : 'Not synced yet'}</p>
        <div class="row"><button class="btn" id="s-invite">📨 Send invite link</button><button class="btn soft" id="s-sync">🔄 Sync now</button></div>
        <button class="btn ghost block" id="s-leave" style="margin-top:10px">Stop syncing on this phone</button>
      ` : `
        <p>Both of you can log from your own phones. One of you creates a household code, then sends the invite link to the other.</p>
        <button class="btn block" id="s-create">✨ Create household code</button>
        <label class="lbl" for="s-join">Already have a code?</label>
        <input type="text" id="s-join" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocapitalize="characters" autocomplete="off">
        <button class="btn soft block" id="s-joinbtn" style="margin-top:10px">Join household</button>
      `}
      <details style="margin-top:12px"><summary style="cursor:pointer;font-weight:800">How does sharing work?</summary>
        <p style="font-size:14px">Everything is saved on each phone first, so the app works offline. When online, the diary is encrypted on the phone with your household code (AES-256) and stored on a free public text store (textdb.online). Only phones with the code can read it – the server sees scrambled text. Each phone merges changes, so you can both log at the same time.</p>
        <p style="font-size:14px">The free store is a best-effort service. Because both phones keep a full copy, the diary isn’t lost if it hiccups – but do export a backup now and then.</p>
      </details>
    </section>

    <section class="card">
      <h2>Backup</h2>
      <p class="muted">Save everything to a file, or merge a file from the other phone (works even without sync).</p>
      <div class="row" style="margin-top:10px"><button class="btn soft" id="s-backup">💾 Save backup</button><button class="btn ghost" id="s-import">📂 Import</button></div>
      <input type="file" id="s-file" accept=".json,application/json" hidden>
      <button class="btn ghost block" id="s-csv" style="margin-top:10px">⬇️ Export CSV</button>
    </section>

    <section class="card tint-butter">
      <h2>Add to home screen</h2>
      <p><b>iPhone (Safari):</b> tap Share <span aria-hidden="true">⬆️</span> → “Add to Home Screen”.</p>
      <p><b>Android (Chrome):</b> tap ⋮ → “Install app” / “Add to Home screen”.</p>
      ${installPrompt ? '<button class="btn block" id="s-install">📲 Install now</button>' : ''}
    </section>

    <div class="disclaimer"><b>Please note:</b> GAPS Tracker is a diary to help you notice patterns. It is not medical advice and doesn’t diagnose or treat anything. Please make decisions about your child’s diet with your GAPS practitioner and your child’s doctor or dietitian, especially for a growing child on a restricted diet.</div>

    <section class="card">
      <h2>This phone</h2>
      <p class="muted">${S.live().length} entries stored on this phone.</p>
      <button class="btn danger block" id="s-wipe">Erase data on this phone</button>
    </section>
    <p class="muted" style="text-align:center;font-size:13px">GAPS Tracker · v1 · <a href="https://github.com/Bravoai28/gaps-tracker" target="_blank" rel="noopener">source</a></p>`;

  $('#s-name', view).onchange = (e) => { S.setDevice({ name: e.target.value.trim() }); toast('Saved'); };
  $('#s-child', view).onchange = (e) => { S.setSetting('childName', e.target.value.trim()); toast('Saved'); };
  $('#s-start', view).onchange = (e) => { if (e.target.value) { S.setSetting('stageStart', e.target.value); toast('Saved'); } };
  const on = (id, fn) => { const el = $(id, view); if (el) el.onclick = fn; };
  on('#s-create', async () => {
    S.setSync({ code: newCode(), lastSync: 0, lastError: '' });
    route();
    toast('Household created – syncing…');
    await syncNow();
  });
  on('#s-joinbtn', () => joinWith($('#s-join', view).value));
  on('#s-invite', async () => {
    const link = inviteLink(code);
    const text = `Join our GAPS Tracker household: ${link}\n(or enter code ${code} in Settings)`;
    if (navigator.share) { try { await navigator.share({ title: 'GAPS Tracker', text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
    try { await navigator.clipboard.writeText(text); toast('Invite link copied'); } catch { prompt('Copy this invite link:', link); }
  });
  on('#s-sync', async () => { toast('Syncing…'); const r = await syncNow(); toast(r.error ? 'Sync failed: ' + r.error : 'Synced ✓'); });
  on('#s-leave', () => { if (confirm('Stop syncing on this phone? Your data stays on this phone. You can re-join with the code.')) { S.setSync({ code: '', lastSync: 0, lastError: '' }); } });
  on('#s-backup', () => shareOrDownload(`gaps-backup-${S.today()}.json`, JSON.stringify({ app: 'gaps-tracker', v: 1, exportedAt: new Date().toISOString(), entries: S.getState().entries, settings: S.getState().settings }, null, 1), 'application/json'));
  on('#s-import', () => $('#s-file', view).click());
  $('#s-file', view).onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'gaps-tracker') throw new Error('Not a GAPS Tracker backup');
      S.replaceAll(data);
      toast('Backup merged ✓');
    } catch (err) { alert('Could not import: ' + err.message); }
  };
  on('#s-csv', exportCSV);
  on('#s-install', async () => { installPrompt.prompt(); installPrompt = null; });
  on('#s-wipe', () => {
    if (confirm('Erase all diary data on THIS phone? (Synced data on the other phone is not affected.)') && confirm('Are you sure? This cannot be undone.')) {
      localStorage.clear(); location.hash = '#/'; location.reload();
    }
  });
}

async function joinWith(raw) {
  if (!validCode(raw)) { toast('That code doesn’t look right (20 letters/numbers)'); return; }
  S.setSync({ code: cleanCode(raw), lastSync: 0, lastError: '' });
  toast('Joining household…');
  const r = await syncNow();
  toast(r.error ? 'Joined, but sync failed: ' + r.error : 'Joined & synced ✓');
  location.hash = '#/settings';
  route();
}
function handleJoin(code) {
  history.replaceState(null, '', location.pathname + '#/settings');
  const cur = S.getState().sync.code;
  if (cur && cleanCode(cur) === cleanCode(code)) { toast('Already in this household'); route(); return; }
  if (confirm(`Join this GAPS Tracker household?\n\n${cleanCode(code)}\n\nYour diary on this phone will be merged with it.`)) joinWith(code);
  else route();
}

// ---------------- boot ----------------
let installPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });

let syncTimer;
const scheduleSync = (ms = 1500) => { clearTimeout(syncTimer); syncTimer = setTimeout(() => { if (S.getState().sync.code) syncNow(); }, ms); };
S.onChange((local) => {
  // re-render unless a sheet is open (avoid wiping user input)
  if (!$('#sheet-root').innerHTML) {
    const y = window.scrollY; route(); window.scrollTo(0, y);
  } else renderTop();
  if (local) scheduleSync();
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(200); });
window.addEventListener('online', () => scheduleSync(200));
setInterval(() => { if (document.visibilityState === 'visible') scheduleSync(0); }, 45000);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW failed', e));
}
lastHash = location.hash;
route();
scheduleSync(300);
window.__gaps = { S, buildCSV, syncNow };
