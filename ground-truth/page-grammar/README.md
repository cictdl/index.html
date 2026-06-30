# page-grammar/ — இலக்கணக் குறிப்பு layer on the HTR ground truth

Enriched copies of `../page/*.xml` (100 leaves, kurals 1–1000) carrying the word-level
grammatical analysis, joined to each line by its kural number. Built by `../inject_grammar.py`
from `../grammar/thirukkural-ilakkanam.json`.

## What was added (and what was NOT)
- **Added:** to every `TextLine` with `comments="kural=N"`, the `custom` attribute gains an
  `ilakkanam {...}` block (PAGE's standard plugin/annotation channel — same place `readingOrder`
  lives). Attribute-only change ⇒ schema-valid, no element-ordering risk.
- **Untouched:** the scribal `<Unicode>` transcription, `Word`/`Coords`/`Baseline`, and the
  marginalia. The GT's HTR training value is fully preserved (verified: transcription is
  byte-identical to `page/`).

## The `ilakkanam {}` custom block
```
ilakkanam {kural:1; verification:verified;
           words:அகர=பொருட்பெயர்|முதல=பெயரெச்சம்|...|உலகு=இடப்பெயர்;
           togai:மலர்மிசை=வேற்றுமைத்தொகை|...; ani:எடுத்துக்காட்டுவமை;
           edugai:க/க; eetruseer:உலகு (காசு வாய்பாடு);}
```
- `words` = `சொல்=இலக்கணக்குறிப்பு` pairs separated by `|` (canonical-text analysis).
- `verification` = `verified` (independently checked) or `draft` (single AI pass).
- Full detail (morphological split, வேற்றுமை, confidence, features, reviewFlags, full யாப்பு/அணி)
  is in the sidecar **`<manuscriptId>.grammar.json`** per leaf.

## ⚠️ Canonical vs scribal
Tags are computed on the **canonical** Tirukkural text; the line image/transcription is the
**scribal** palm-leaf orthography. They are the same kural, differently spelt — the join key is
the **kural number**, not string identity. Tags are not per-glyph offsets into the scribal line.

## Status & review
29 அதிகாரம் (kurals 1–280, 291–300 region) are double-verified; the rest are AI drafts — see
`../grammar/REPORT.md`. AI-assisted; needs scholarly review (`reviewFlags` in the sidecars).

## Making it permanent
`page/` is regenerated from `index.html` by `generate_ground_truth.py`, which would overwrite
hand-edits. To bake the grammar in, fold `inject_grammar.build_custom_block()` into that generator
(emit the `ilakkanam {}` block when it writes each kural `TextLine`), or re-run `inject_grammar.py`
as a post-step after every regeneration. Re-run after completing the pending verifies + re-merge.
