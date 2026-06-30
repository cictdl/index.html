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
| `_src/` | input packets + source datasets (tk.json, detail.json) |

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
py ../inject_grammar.py       # → ../page-grammar/ (GT layer)
```
