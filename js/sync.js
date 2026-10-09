// Household sync: data is gzip-compressed and AES-GCM encrypted on the phone,
// then stored in a free, no-login text store (textdb.online) under keys derived
// from the household code. The store only ever sees ciphertext.
import { getState, mergeEntries, mergeSettings, commitRemote, setSync } from './store.js';

const ENDPOINT = 'https://textdb.online';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
const MAX_CHARS = 195000;

export function newCode() {
  const a = new Uint8Array(20);
  crypto.getRandomValues(a);
  const s = Array.from(a, (b) => ALPHA[b % ALPHA.length]).join('');
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}-${s.slice(15, 20)}`;
}
export const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/(.{5})(?=.)/g, '$1-');
export const validCode = (c) => cleanCode(c).replace(/-/g, '').length === 20;

const enc = new TextEncoder();
const dec = new TextDecoder();
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_');
}

let keyCache = null;
async function keys(code) {
  const c = cleanCode(code);
  if (keyCache && keyCache.code === c) return keyCache;
  const idHash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode('gaps-tracker:id:' + c)));
  const id = Array.from(idHash.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
  const base = await crypto.subtle.importKey('raw', enc.encode(c), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('gaps-tracker:salt:v1'), iterations: 150000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  keyCache = { code: c, id, key };
  return keyCache;
}

async function gzip(str) {
  if (typeof CompressionStream === 'undefined') return { z: 0, bytes: enc.encode(str) };
  const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  return { z: 1, bytes: new Uint8Array(await new Response(cs).arrayBuffer()) };
}
async function gunzip(bytes, z) {
  if (!z) return dec.decode(bytes);
  const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}

async function seal(obj, key) {
  const { z, bytes } = await gzip(JSON.stringify(obj));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes));
  return `g1.${z}.${bytesToB64(iv)}.${bytesToB64(ct)}`;
}
async function open(text, key) {
  const [v, z, iv, ct] = text.trim().split('.');
  if (v !== 'g1') throw new Error('Unknown data format');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
  return JSON.parse(await gunzip(new Uint8Array(pt), z === '1'));
}

async function getBlob(name) {
  const r = await fetch(`${ENDPOINT}/${name}?_=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`Sync server error ${r.status}`);
  return (await r.text()).trim();
}
async function putBlob(name, value) {
  if (value.length > MAX_CHARS) throw new Error('Month too large to sync – please export a backup.');
  const body = new URLSearchParams({ key: name, value });
  const r = await fetch(`${ENDPOINT}/update`, { method: 'POST', body });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status !== 1) throw new Error('Sync server refused the update' + (j.error ? `: ${j.error}` : ''));
}

const monthOf = (d) => String(d || '').slice(0, 7);
const sameEntries = (a, b) => {
  if (a.length !== b.length) return false;
  const m = new Map(a.map((e) => [e.id, e.updatedAt]));
  return b.every((e) => m.get(e.id) === e.updatedAt);
};

let running = null;
/** Two-way sync. Safe to call often; runs one at a time. */
export function syncNow() {
  if (running) return running;
  running = doSync().finally(() => { running = null; });
  return running;
}

async function doSync() {
  const st = getState();
  const code = st.sync.code;
  if (!code) return { skipped: true };
  if (!navigator.onLine) { setSync({ lastError: 'Offline – will sync when back online.' }); return { offline: true }; }
  try {
    const { id, key } = await keys(code);
    const metaName = `gapsTrk_${id}_meta`;
    // 1. meta (settings + month list)
    const metaRaw = await getBlob(metaName);
    let remoteMeta = { settings: {}, months: [] };
    if (metaRaw) remoteMeta = await open(metaRaw, key);
    let changed = mergeSettings(remoteMeta.settings);

    const localMonths = [...new Set(Object.values(getState().entries).map((e) => monthOf(e.date)).filter(Boolean))];
    const months = [...new Set([...(remoteMeta.months || []), ...localMonths])].sort();

    // 2. each month: pull, merge, push back if remote is missing anything
    await Promise.all(months.map(async (m) => {
      const name = `gapsTrk_${id}_${m.replace('-', '')}`;
      const raw = await getBlob(name);
      const remote = raw ? (await open(raw, key)).entries || [] : [];
      if (mergeEntries(remote)) changed = true;
      const mine = Object.values(getState().entries).filter((e) => monthOf(e.date) === m);
      if (!sameEntries(mine, remote)) await putBlob(name, await seal({ v: 1, month: m, entries: mine }, key));
    }));

    // 3. push meta if needed
    const s = getState();
    const newMeta = { v: 1, settings: s.settings, months };
    const metaSame = metaRaw && JSON.stringify(remoteMeta.months || []) === JSON.stringify(months)
      && Object.keys(s.settings).every((k) => remoteMeta.settings?.[k]?.at === s.settings[k].at);
    if (!metaSame) await putBlob(metaName, await seal(newMeta, key));

    if (changed) commitRemote();
    setSync({ lastSync: Date.now(), lastError: '' });
    return { ok: true, changed };
  } catch (e) {
    console.warn('sync failed', e);
    const msg = e.name === 'OperationError' ? 'Could not decrypt – is the household code exactly right?' : (e.message || String(e));
    setSync({ lastError: msg });
    return { error: msg };
  }
}

