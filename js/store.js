// Local-first data store (localStorage) with last-write-wins merge for sync.
const KEY = 'gapsTracker.v1';

const blank = () => ({
  entries: {},            // id -> entry (meal | check), with updatedAt + deleted tombstones
  settings: {             // each field: {v, at}
    stage: { v: 1, at: 0 },
    stageStart: { v: today(), at: 0 },
    childName: { v: '', at: 0 },
  },
  device: { name: '', id: rid() },
  sync: { code: '', lastSync: 0, lastError: '' },
});

export function rid() {
  const a = new Uint8Array(10);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16);
}
export function today(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function nowTime(d = new Date()) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const s = JSON.parse(raw);
    const b = blank();
    return { ...b, ...s, settings: { ...b.settings, ...(s.settings || {}) }, device: { ...b.device, ...(s.device || {}) }, sync: { ...b.sync, ...(s.sync || {}) } };
  } catch (e) {
    console.error('load failed', e);
    return blank();
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(local = true) { save(); listeners.forEach((fn) => fn(local)); }

export const getState = () => state;
export const setting = (k) => state.settings[k]?.v;
export function setSetting(k, v) {
  state.settings[k] = { v, at: Date.now() };
  emit();
}
export function setDevice(patch) { Object.assign(state.device, patch); emit(); }
export function setSync(patch) { Object.assign(state.sync, patch); save(); listeners.forEach((fn) => fn(false)); }

export function upsert(entry) {
  const now = Date.now();
  const e = { ...entry, id: entry.id || rid(), updatedAt: now, createdAt: entry.createdAt || now, by: entry.by || state.device.name || '' };
  state.entries[e.id] = e;
  emit();
  return e;
}
export function remove(id) {
  const e = state.entries[id];
  if (!e) return;
  state.entries[id] = { id, kind: e.kind, date: e.date, deleted: true, updatedAt: Date.now() };
  emit();
}
export const live = () => Object.values(state.entries).filter((e) => !e.deleted);
export const entriesFor = (date) => live().filter((e) => e.date === date).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
export const allDates = () => [...new Set(live().map((e) => e.date))].sort();

/** Merge entries from remote into local (LWW per entry). Returns true if local changed. */
export function mergeEntries(remoteEntries) {
  let changed = false;
  for (const r of remoteEntries || []) {
    const l = state.entries[r.id];
    if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) { state.entries[r.id] = r; changed = true; }
  }
  return changed;
}
export function mergeSettings(remote) {
  let changed = false;
  for (const [k, val] of Object.entries(remote || {})) {
    const l = state.settings[k];
    if (!l || (val.at || 0) > (l.at || 0)) { state.settings[k] = val; changed = true; }
  }
  return changed;
}
export function commitRemote() { emit(false); }

export function replaceAll(data) {
  // used by "import backup": merge rather than overwrite
  const a = mergeEntries(Object.values(data.entries || {}));
  const b = mergeSettings(data.settings || {});
  emit();
  return a || b;
}
