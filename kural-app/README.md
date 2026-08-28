# திருக்குறள் · Tirukkuṟaḷ — 22 மொழிகள்

A free, offline-first web app (installable PWA) giving all **1,330 kurals** with the Central
Institute of Classical Tamil's translations into the **22 languages of the Eighth Schedule**
(30 translation streams in all, counting script variants and the three English renderings),
plain-language prose, audio recitation and commentary, tap-a-word grammar glossing from the
**இலக்கணக்குறிப்பு** layer, metre-aware recitation practice from the **யாப்பு** layer, and a
daily-kural notification.

No build step, no framework, no runtime dependency. It ships in two shapes:

| | what it is | size | audio |
|---|---|---|---|
| **Folder edition** | `index.html` + `app.js` + `styles.css` + `sw.js` + `data/` + `audio/`, served over http(s); installable as a PWA | 480 MB with all audio, 33 MB without | 133-chapter audiobook + 5 pre-rendered speech packs |
| **Single-file edition** | **`Tirukkural-22-Languages.html`** — one file, opens by double-clicking, works from `file://`, a USB stick or an email attachment | **7.9 MB** | device's own speech voices |

---

## The single-file edition

```bash
py build/make_single_file.py          # → Tirukkural-22-Languages.html
```

One HTML file with the entire book inside it: all 1,330 kurals, the 30 translation streams,
the three Tamil உரை and the English prose, the word-by-word இலக்கணக்குறிப்பு layer, the யாப்பு
scansion of every couplet, the tag concordance, the bilingual glossary, the Noto faces for all
22 scripts, and the CICT mark. **No server, no network, no install, nothing to download** —
verified by loading it and confirming the page issues *zero* network requests.

How it stays small: the 21 MB of JSON is gzipped to 4.6 MB and base64-embedded (6.2 MB), and
the browser inflates it with `DecompressionStream`. The search indices are *derived in memory*
from that payload rather than embedded, so no text is stored twice. Only the script subsets of
each font are inlined — the 36 Latin subsets are dropped, since Latin text uses `system-ui`.

Both editions run the *same* `app.js`. The only difference is one indirection point: every
data read goes through `SRC.json(url)`, which fetches in the folder edition and answers from
the embedded payload in the single file. Features that need a server (the offline-download
manager, the service worker, the bundled audio packs) detect their absence and degrade — the
audio buttons fall back to the device's own voices exactly as they do when a pack is missing.

Requires a browser with `DecompressionStream` (Chrome/Edge 80+, Firefox 113+, Safari 16.4+);
older ones get a plain explanatory message rather than a blank page.

---

## Running the folder edition

```bash
python -m http.server 8765 --directory "D:\DL file\kural-app"
```

Then open <http://localhost:8765>. A service worker must be able to register, so use
`http://localhost` or an `https://` host (not `file://`).

## What is in it

| Feature | Source of truth |
|---|---|
| Canonical Tamil text, மு. வரதராசனார் உரை, English prose, Latin transliteration | `ground-truth/grammar/_src/tk.json` (tk120404/thirukkural, open data) |
| தமிழ் உரை — Tamil critical commentary | Prof. P. Marudanayagam (CICT, 2023, ISBN 978-81-19249-27-5) · [digitalarchives.cict.in](https://www.digitalarchives.cict.in/#ground-truth) |
| Translations in 22 scheduled languages (+ Bhojpuri, + 3 English, + Tamil critical commentary) | `D:\DL file\index.html` → `const KURAL_TEXT` — the CICT Digital Archives translation table |
| Word-by-word grammar, வேற்றுமை, தொகை, அணி, review flags, bilingual term glossary | `ground-truth/grammar/thirukkural-ilakkanam.json` + `web/glossary.json` |
| Palm-leaf witness — scribal reading, IIIF region, DOI (chapters 1–100) | `ground-truth/grammar/web/manuscript.json` → `data/manuscript.json` |
| Metrical scansion — சீர் / அசை / வாய்பாடு / தளை / ஈற்றுச்சீர் / பா, மோனை & எதுகை | `D:\Yappu-Metrical-Scanner\_src\yappu.py` (`scan_verse_best`), run at build time |
| Chapter audiobook (133 files, Tamil) | `D:\Tirukkural audio\*.mp3`, re-encoded to 48 kb/s mono |
| Per-kural recitation & commentary audio | pre-rendered with the Windows OneCore voices (Microsoft Valluvar / Heera / Kalpana) |

### Screens

- **முகப்பு / Home** — kural of the day, continue reading, corpus statistics, the three பால்.
- **நூல் / Read** — பால் › இயல் › அதிகாரம் › couplet. Chapter pages carry the audiobook player.
- **Kural detail** — couplet (every word tappable), transliteration, one card per selected
  language with its translator credit, உரை tab strip (மு. வரதராசனார் · CICT தமிழ் உரை · English), full யாப்பு scansion, and the
  word-by-word grammar grid. Tapping a word opens a sheet with பகுதி / இலக்கணக் குறிப்பு /
  இயல்புகள் / வேற்றுமை / தொடர் / gloss / confidence, glossary tooltips, review flags, and a
  link to every other kural carrying the same tag.
- **⇔ எல்லா மொழிகளிலும் / In all languages** (`#/compare/:n`) — the true parallel view: one
  kural in all 29 translations at once, Eighth-Schedule languages first, each with its
  translator credit, a ★ that adds it to your reading set, and **▶ Play all**, which reads the
  kural in every language in turn, scrolling as it goes.
- **தேடு / Search** — one box across Tamil, Latin transliteration, all 30 translation streams
  and the prose layers. It defaults to **எழுத்துக்கேற்ப / Match my script**: the query's
  Unicode block picks which indices to read, so typing Bengali reads 9 indices instead of 33
  (~0.9 MB instead of 11 MB) and typing Tamil reads 7. A one-click *search all 30 languages*
  widens it, and any language can be pinned explicitly. Latin diacritics fold, so `Pakavaṉ`
  finds `Pakavan` — but Indic combining marks (Tamil புள்ளி, viramas, every vowel sign) are
  left intact, since folding those would change the word. A bare number jumps to that kural.
- **⇔ இணை வாசிப்பு / Parallel reading** (`#/parallel/:chapter`) — the two-stream reading view
  from §7.1: Tamil in one column, any one of the 30 streams in the other, for a whole
  அதிகாரம் at a time, with a picker and a per-couplet 🔊 that reads the Tamil then the
  translation. On phones the second column drops under the first rather than being squeezed.
- **🌿 Palm-leaf witness** — every kural in chapters 1–100 (1,000 couplets, 990 with imagery)
  carries the scribal reading from the CICT palm-leaf corpus *bundled offline*, plus a IIIF
  region crop of that exact line on the leaf, its manuscript id, its DOI and a link into the
  Digital Archives. This is the bridge into Track C. The crop is fetched from Zenodo, so it
  sits behind an explicit **“show the leaf”** button (and an intersection observer when the
  card is approached) — never an automatic download, and every state is visible: loading,
  offline, archive-too-slow, failed-with-retry.
- **🧠 மனப்பாடப் பயிற்சி / Study** (`#/study`) — spaced repetition over a deck you build with
  “add to study” on any kural. SM-2 lite: prompt is the translation or the உரை, answer is the
  couplet, graded மீண்டும் / கடினம் / சரி / எளிது, intervals and ease stored per kural in
  `localStorage`. Counts as learned at an interval of 21 days.
- **🖼 Share as image** — a 1080×1080 PNG card drawn on canvas (couplet, chapter, your first
  translation, CICT mark), handed to the OS share sheet where `navigator.canShare` supports
  files and downloaded otherwise.
- **பயிற்சி / Practice** — four modes over the யாப்பு layer:
  - *கேள்* — plays the metre as beats (நேர் = one mātrā, நிரை = two), highlighting each சீர்,
    optionally speaking the word, at an adjustable tempo;
  - *தட்டு* — you tap one beat per அசை; scored against the true mātrā profile with a bar chart;
  - *ஓதிச் சரிபார்* — speech recognition (`ta-IN`) marks which words of your recitation matched;
  - *மனப்பாடம்* — progressive cloze with a "I know this" counter.
- **மேலும் / More** — bookmarks, grammar explorer (tag → concordance), offline downloads,
  settings (interface language, per-language voice, rate, text size, theme), credits.

### Offline

The service worker is **network-first for the app shell** (`.html/.js/.css/.webmanifest` and
navigations) so a deploy lands without bumping a cache version, with the precached copy as the
offline fallback; and **cache-first for `data/`, `audio/` and `assets/`**, which are immutable
per build. It answers HTTP `Range` requests out of the cache, so `<audio>` scrubbing works with
no network.

Typography is self-hosted: `build/fetch_fonts.py` pulls 43 Noto woff2 subsets (1.07 MB, OFL)
covering all 22 scripts into `assets/fonts/`, so Tamil, Bengali, Kannada, Meetei Mayek and
Nastaliq Urdu render correctly on a device that has none of those fonts installed and no
network. Nothing is fetched from a CDN at runtime.

The whole book (~32 MB of JSON, plus the fonts) is downloadable from **மேலும் › இணையமின்றி**,
as is each audio pack and the 202 MB audiobook. On first run the app quietly caches all 133
chapter files in the background.

### Installability

The manifest carries `name`/`short_name`, `id`, `scope`, `start_url`, `display: standalone`
plus `display_override`, `launch_handler`, `categories`, `lang`/`dir`, theme and background
colours, four icons (192/512, each also maskable) and four shortcuts (kural of the day,
search, study, metre practice). Verified in the browser: every installability check passes,
all four icon URLs return 200, the service worker controls the page, and the context is
secure. **More › Install** shows a real install button where the browser offers one, the
Add-to-Home-Screen instruction on iOS (which never fires `beforeinstallprompt`), and
“Installed ✓” once running standalone.

`screenshots` is deliberately absent: it wants genuine device captures, and pointing the
manifest at files that do not exist would 404. Add real 1080×1920 narrow and 1440×900 wide
captures before store submission.

### Keyboard

`←` / `→` move between kurals on the kural, compare and practice screens; `/` jumps to search;
`Space` taps the beat in practice; `Esc` closes the word sheet, which traps Tab while open and
returns focus to the word you came from.

### Daily kural

`#/daily` requests notification permission and registers a `periodicsync` (`daily-kural`) that
fires from the service worker when the app is installed. Browsers that do not support periodic
sync get the same notification the next time the app is opened after the chosen time; a
`.ics` export gives an OS-level reminder that works everywhere.

The kural of the day is `((daysSinceEpoch × 1103) mod 1330) + 1` — deterministic, so every
device shows the same kural without a server, and the sequence walks the whole book before
repeating (1103 is coprime with 1330).

---

## Rebuilding the data

```bash
py build/lint_js.py               # structural check of app.js / sw.js — gate the rest on this
py build/build_data.py            # → data/  (31.6 MB; ~2 s)
py build/make_icons.py            # → assets/icon-*.png
py build/fetch_fonts.py           # → assets/fonts/ + assets/fonts.css  (43 files, 1.07 MB)
py build/make_single_file.py      # → Tirukkural-22-Languages.html (7.9 MB)
```

`lint_js.py` exists because there is no Node here: it walks the source with a mode stack
(code ⇄ template literal ⇄ `${…}`) and catches the failure this project actually hit — an
unescaped apostrophe in a translated UI string (`your device's own voices`) silently breaking
the whole file. `make_single_file.py` runs it as a preflight and refuses to write anything if
it finds a problem.

`build_data.py` re-scans all 1,330 couplets with the reference metrical scanner. Current
result: **1,298 clean குறள் வெண்பா, 37 re-segmented, 1,326 fully scannable** — the 4 residuals
are known source-text corruptions in kurals 347, 434, 651 and 1117 (see the
Yappu-Metrical-Scanner notes); the app shows those lines as unscannable rather than guessing.

### Audio packs

```bash
py build/make_tts_pack.py ta              # Tamil couplet recitation   → audio/tts/ta/
py build/make_tts_pack.py en              # English couplet            → audio/tts/en/
py build/make_tts_pack.py hi              # Hindi couplet              → audio/tts/hi/
py build/make_tts_pack.py ta --prose      # Tamil உரை commentary       → audio/tts/ta-prose/
py build/make_tts_pack.py en --prose      # English prose commentary   → audio/tts/en-prose/
py build/build_data.py                    # refresh data/audio.json afterwards
```

Each pack is 1,330 clips at 22.05 kHz mono 32 kb/s (~25 KB per clip, ~33 MB per pack). The
packs are optional: with no pack installed the app falls back to the device's own speech
synthesis for **every** language, using the same voice-priority table as the CICT archive.

Chapter audiobook (from `D:\Tirukkural audio`):

```bash
ffmpeg -i "001 KADAVUL VAZHTHU.mp3" -ac 1 -ar 22050 -b:a 48k -map_metadata -1 audio/ch/001.mp3
```

### Adding a plain-prose retelling for a language

Drop `build/prose/<code>.json` — `{"1": "…", "2": "…"}` — and re-run `build_data.py`. It is
picked up automatically as a prose tab and search layer, and flagged in the UI as an
AI-assisted draft awaiting review if it is not one of the published prose editions.

---

## Coverage and honest limits

- **Translations**: 1,330/1,330 in every language except V. V. S. Aiyar's English
  (1,328 — kurals 886 and 995 are absent from the source edition). Many translations render
  the couplet as a single unbroken line, so their second line is empty; that is the edition,
  not a data loss.
- **Plain prose** exists natively for Tamil (three உரை) and English. For nine languages the
  CICT translation is *itself* prose (Assamese, Bengali, Sanskrit, Telugu, Manipuri in both
  scripts, Konkani-Devanagari, Bodo, Aiyar's English) and the app labels it as such. For the
  remaining verse translations no separate simple-prose retelling exists yet — the app shows
  the verse with a note and offers the Tamil/English prose alongside. The `build/prose/` hook
  above is where a commissioned retelling would land.
- **Grammar layer** is an AI-assisted, double-verified draft (133/133 chapters, 13,124 word
  tokens, mean confidence ≈ 0.72, 4,545 review flags). Every word sheet shows its confidence
  and any flag. The canonical text, metadata and tokenisation underneath are deterministic.
- **Pre-rendered audio** uses Windows OneCore voices, which exist on this machine for Tamil,
  English and Hindi only. Other languages fall back to whatever voice the user's device has.
- **Speech recognition** in *ஓதிச் சரிபார்* needs Chrome/Edge; other browsers show a notice.

Text and data: CC BY 4.0 · செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் · Central Institute of
Classical Tamil, Chennai.
