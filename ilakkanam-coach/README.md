# இலக்கணம் · Ilakkanam Coach

Adaptive Tamil grammar drill PWA built on CICT's word-by-word இலக்கணக் குறிப்பு
annotation of the Tirukkural (1,330 kurals · 13,124 tagged words · all 133
அதிகாரம் double-verified). No framework, no build step, fully offline after
first visit.

**Audience:** school students (Classes 6–12), college students, teachers,
competitive-exam candidates. Bilingual: Tamil UI with an English explanatory
mode (EN toggle).

## Run

```
python -m http.server 8767 --directory "D:\DL file\ilakkanam-coach"
```

(or the `ilakkanam-coach` entry in `D:\DL file\.claude\launch.json`).

## Curriculum (9 topics, 20,877 drill items)

| Topic | Class | Items |
|---|---|---|
| சொல் வகைகள் (word classes) | 6–7 | 8,892 |
| பெயர்ச்சொல் வகைகள் | 7–9 | 3,638 |
| வினைமுற்று வகைகள் | 8–10 | 879 |
| எச்சங்கள் | 8–10 | 1,683 |
| வினையாலணையும் பெயர் · தொழிற்பெயர் | 9–11 | 1,421 |
| வேற்றுமை | 8–12 | 2,279 |
| இடைச்சொல் வகைகள் | 9–12 | 1,220 |
| தொகைகள் | 10–12 | 831 |
| உரிச்சொல் · தொடர் | 10–12 | 34 |

## How it adapts

- Per-tag Leitner boxes 0–5 (`localStorage`, key `ic.progress.v1`). Correct →
  box +1, wrong → box −1. Session items are weighted toward weak boxes.
- Question modes escalate with mastery: MCQ (4 options, distractors drawn from
  the topic's confusable tag set) → **find-in-verse** at box ≥ 3 ("tap the
  வினையெச்சம் in the couplet"). Find mode is only offered when *every* word of
  that tag in the kural is confidently tagged (`conf ≥ 0.7`), so it is always
  fair.
- Every answer shows: verdict, சொல் பிரிப்பு, gloss, the bilingual glossary
  entry for the tag, and the மு.வ. உரை for context.
- Drill items are restricted to annotation confidence ≥ 0.7.

## Data pipeline

`build/build_data.py` reads
`D:\DL file\ground-truth\grammar\thirukkural-ilakkanam.json` +
`web/glossary.json` and emits `data/`:

- `meta.json` — topics, glossary (72 bilingual terms), tag counts
- `kurals.json` (3.2 MB) — per-kural couplet, அதிகாரம், மு.வ. உரை, EN meaning,
  flattened word records `[sol, cat, tag, gloss, split, conf, feat, vet]`,
  சீர்-level தொகை list
- `topics/<id>.json` — drill item indices `[[kural, wordIndex], …]`

Re-run after the grammar layer is revised: `py build\build_data.py`.
Other canon volumes (`D:\<work>\ilakkanam\*.json`) can be added once the tag
taxonomy is normalised across volumes — the strategy report's critical path.

## Offline & progress

- `sw.js`: shell is network-first with cached fallback (stale-shell lesson from
  kural-app); `data/`/`assets/` are cache-first. After registration the app
  precaches all 11 data files in the background (`navigator.serviceWorker.ready`
  first — precache fetches must be SW-controlled).
- Progress lives on-device; 📊 page has backup-to-file / restore-from-file.
  A future sync endpoint can consume the same JSON.

## Verified

Home, all three question builders (fine-tag MCQ, வேற்றுமை, தொகை), find-in-verse
at high mastery, wrong-answer path, 10-question session → result screen, stats,
EN mode, mobile layout, and a genuine offline reload+drill with the server
stopped.
