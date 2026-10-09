# GAPS Tracker

A small, friendly, mobile-first web app (PWA) for keeping a daily food and symptom diary
for a child on the GAPS Introduction Diet / Full GAPS.

**Live app:** https://bravoai28.github.io/gaps-tracker/

> ⚠️ This is a diary, not medical advice. Please make diet decisions with your GAPS
> practitioner and your child's doctor or dietitian.

## Features
- **Today view:** breakfast, lunch, dinner and snacks cards, plus a check-in card, with a
  progress ring (meals + check-in logged today) and the current stage/day.
- **Meal logging:** time, date, foods picked from the current stage's list (searchable,
  grouped), free text, portion and "how much was eaten", notes. First-time foods get a
  "start small and watch" tip.
- **Stage warnings:** foods from later stages, or foods never allowed on GAPS (grains, sugar,
  potato, etc.), are flagged before saving and badged in the diary and history.
- **Symptom check-ins:** stool (Bristol type 1–7 + how many times), sleep, mood/behaviour,
  skin and energy on 5-point face scales, each with notes, plus "possible reaction" and notes.
- **History:** month calendar with markers, 14-day trend lines, lists of off-stage foods and
  possible reactions; tap any day to view/edit it.
- **Stage reference:** stages 1–6 + Full GAPS, what each adds, what to still avoid, how to
  move on; change stage (synced to both phones).
- **Export:** CSV (for your practitioner) and JSON backup / import (merge).
- **Offline-first PWA:** installable to the home screen; works without signal.
- **Two-parent sharing:** household code with end-to-end encrypted sync (see below).

## Sharing between two phones
1. On phone 1: Settings → *Create household code* → *Send invite link* (e.g. by WhatsApp/iMessage).
2. On phone 2: open the link (or type the code in Settings → *Join household*).

Data is saved on each phone first (localStorage), then gzip-compressed and encrypted with
AES-256-GCM using a key derived from the household code (PBKDF2), and stored in a free,
no-login text store ([textdb.online](https://textdb.online)), split into one record per month.
The store only ever sees ciphertext; record names are a hash of the code. Each phone merges
changes entry-by-entry (last edit wins), so both parents can log at the same time.
Sync runs on open, after each change, every ~45 s while open, and on reconnect.

Limitations: textdb.online is a free best-effort service (no SLA; it deletes records not
touched for 30 days – regular use keeps them alive, and either phone re-uploads its full copy
if they vanish). Keep the occasional JSON backup. Anyone who has the household code can read
and edit the diary, so only share it with your partner.

## Development
Plain HTML/CSS/ES modules – no build step.
```
python3 -m http.server 8765   # then open http://localhost:8765/
```
Files: `index.html`, `css/app.css`, `js/app.js` (UI), `js/stages.js` (stage data + food matcher),
`js/store.js` (local store + merge), `js/sync.js` (encrypted sync), `sw.js`, `manifest.webmanifest`.
Research notes and sources: [RESEARCH.md](RESEARCH.md).
