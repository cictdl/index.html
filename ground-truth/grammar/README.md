# திருக்குறள் இலக்கணக் குறிப்பு — Grammatical Ground-Truth Layer

A word-by-word grammatical-annotation layer over all **1330 குறள்கள் / 133 அதிகாரம் / 3 பால்**, designed to sit on top of the CICT palm-leaf HTR ground truth (`../page/*.xml`) and join to it by **kural number** (PAGE-XML `TextLine comments="kural=N"`).

## What this is

For every kural: word-level இலக்கணக் குறிப்பு (grammatical tag) + வேற்றுமை + தொகை + யாப்பு (குறள் வெண்பா: சீர் / மோனை / எதுகை / தளை) + அணி, against a **closed controlled vocabulary** (`TAGSET.md`).

## Layers (how it was built)

1. **Deterministic scaffold** (`build_scaffold.py` → `scaffold/`) — 100% reliable, no AI:
   metadata (பால்/இயல்/அதிகாரம் from `detail.json`), canonical text + multiple உரை (from `tk.json`),
   சீர் tokenization, and Tamil grapheme (எழுத்து) segmentation.
2. **AI-judgment layer** (`chapters/adhigaram-NNN.json`) — the word tags, vetrumai, yappu prosody, ani.
   Generated per-அதிகாரம் by a scholar-role agent **grounded in the canonical text + உரை**, then
   independently **verified** by a second agent. Each tag carries a `confidence`; uncertain calls go in `reviewFlags`.
3. **Merge** (`merge_grammar.py`) → `thirukkural-ilakkanam.json` (master, keyed by kural)
   + `thirukkural-ilakkanam.csv` (flat, one row per சொல்) + `REPORT.md` (coverage + confidence + flags).

## ⚠️ Status — AI-assisted draft, requires scholarly review

The grammatical judgements are **AI-generated drafts**. Classical Tamil morphology is genuinely
ambiguous and authoritative word-tagging is a research-grade task. This layer is a high-quality
starting point (this is the project's planned "Upgrade 2: AI-assisted curation"), **not** a
peer-reviewed edition. Treat `confidence < 0.7` and any `reviewFlags` entry as needing a human
Tamil-grammar expert. The canonical *text*, *metadata*, and *tokenization* (layer 1) are reliable.

## Files
| path | what |
|---|---|
| `TAGSET.md` | controlled tag vocabulary (the schema of allowed tags) |
| `scaffold/thirukkural-scaffold.json` | 1330 kurals, metadata+tokens+graphemes (deterministic) |
| `scaffold/chapters-index.json` | 133 அதிகாரம் index (pal/iyal/range) |
| `chapters/adhigaram-NNN.json` | per-chapter AI analysis (10 kurals each) |
| `thirukkural-ilakkanam.json` | merged master dataset |
| `thirukkural-ilakkanam.csv` | flat word-level table |
| `REPORT.md` | build/coverage/confidence report |
| `reference/INDEX.md` + `reference/adhigaram-NNN.md` | human-readable per-அதிகாரம் reference (couplet · யாப்பு · அணி · word-by-word table · review flags) |
| `ilakkanam.html` + `index.html` | the web archive — a static, dependency-free, bilingual (த/EN) browser/explorer; open `…/grammar/` |
| `web/` | app data: `index.json` (nav), `ch/NNN.json` (per-chapter, lazy), `search-index.json`, `stats.json` (dashboard), `manuscript.json` (IIIF + scribal lines) |
| `build_web_data.py` · `build_manuscript_data.py` | emit `web/` (app data + stats) · emit `web/manuscript.json` from `../index.csv`+`../iiif`+`../page` |
| `_src/` | input packets + source datasets (tk.json, detail.json) |

## Web archive
`ilakkanam.html` is a self-contained static app (no build, no dependencies) that reads `web/`.
Browse பால்→இயல்→அதிகாரம், open any kural (couplet with எதுகை highlighted, யாப்பு, colour-coded
word-by-word tags + confidence, உரை, review flags), explore by tag/அணி/வேற்றுமை (concordance
across all 1330), full-text search, a **stats dashboard** (totals, distributions, per-அதிகாரம்
confidence heatmap), and **palm-leaf pairing** — for the 1000 digitized kurals each detail page
shows the ஓலைச்சுவடி line image (IIIF region crop from Zenodo) + scribal reading + DOI.
Served on GitHub Pages at `…/ground-truth/grammar/`.

## Curation loop (corrections)
The grammatical layer is an AI-assisted draft (see `REPORT.md` `reviewFlags`), opened for scholarly correction:
- Every word in the web archive shows a ✎ that opens a **prefilled GitHub issue form**
  (`.github/ISSUE_TEMPLATE/grammar-correction.yml`, label `grammar-correction`) carrying the kural,
  சொல், and current tag, with fields for the proposed value + reason + contributor. The stats page
  links to all open corrections.
- **Accepting a correction (editor):** edit the relevant `chapters/adhigaram-NNN.json` (fix the tag,
  raise `confidence`, clear the matching `reviewFlags` entry), then re-run
  `py merge_grammar.py && py generate_reference.py && py build_web_data.py && py ../inject_grammar.py`,
  commit, and close the issue crediting the contributor. The flag count and per-அதிகாரம் confidence
  update automatically.

## Provenance
Canonical text & உரை: `tk120404/thirukkural` (Mu. Varadarajanar / Solomon Pappaiah / Mu. Karunanidhi உரை).
Structure: same repo `detail.json`. Tagset: தொல்காப்பியம் / நன்னூல் grammatical tradition.

## Rebuilding from scratch
The third-party source data (`_src/tk.json`, `_src/detail.json`) and intermediate drafts
(`chapters/_draft/`) are **not committed** (see `.gitignore`). To rebuild:
```sh
mkdir -p _src
curl -sL https://raw.githubusercontent.com/tk120404/thirukkural/master/thirukkural.json -o _src/tk.json
curl -sL https://raw.githubusercontent.com/tk120404/thirukkural/master/detail.json    -o _src/detail.json
py build_scaffold.py          # → scaffold/ + _src/ch-NNN.json packets
# (AI layer: chapters/adhigaram-NNN.json — produced by workflow_grammar.js / workflow_verify.js)
py merge_grammar.py           # → thirukkural-ilakkanam.json/.csv + REPORT.md
py generate_reference.py      # → reference/
py build_web_data.py          # → web/ (nav, per-chapter, search, stats)
py build_manuscript_data.py   # → web/manuscript.json (IIIF + scribal lines)
py ../inject_grammar.py       # → ../page-grammar/ (GT layer)
```
