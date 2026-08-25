# CICT Tirukkural Palm-Leaf Ground Truth Corpus

Machine-readable ground truth for handwritten-text recognition (HTR) of palm-leaf
manuscripts of the **Tirukkural**, derived from the CICT Digital Archives corpus.

Each **specimen** is one palm-leaf folio, normally carrying ten kural couplets. The
verbatim scribal reading is aligned line-by-line with the critical-edition verse
numbers and released in two interoperable formats:

- **PAGE-XML** (PRImA `pagecontent` 2019-07-15) — segmentation + transcription,
  one file per leaf, in [`page/`](page/).
- **IIIF Presentation 3.0** manifests with line-level **Web Annotations**
  (`motivation: supplementing`), one file per specimen, in [`iiif/`](iiif/).
  Each manifest references the leaf image directly from Zenodo's IIIF Image API 3.0
  service, so it opens in Mirador / Clover / Annona with the transcription overlaid.

Current coverage: **133 specimens · 133 chapters · kurals 1–1330** — the complete
Tirukkural (adhikarams 1–133), 1,704 text lines (1,329 verse lines + 375 marginal
title/numeral cells), 78,825 characters.

## Layout

```
ground-truth/
├── README.md
├── htr-united.yml            HTR-United 2023-06-27 catalog metadata
├── index.csv                 id ↔ manuscriptId ↔ DOI ↔ image ↔ file map
├── page/<manuscriptId>.xml   PAGE-XML per leaf  (e.g. 19797_93.xml)
├── iiif/<id>/manifest.json   IIIF v3 manifest per specimen (e.g. CICT-PLM-GT-091/manifest.json)
├── grammar/                  இலக்கணக் குறிப்பு word-level grammar layer (all 1,330 kurals)
├── page-grammar/             page/ enriched with that layer + per-leaf .grammar.json sidecars
├── generate_ground_truth.py  regenerates page/ + iiif/ + index.csv from ../index.html
├── inject_grammar.py         rebuilds page-grammar/ from page/ + grammar/
├── validate_gt.py            XSD-validates PAGE-XML and checks IIIF + text round-trip
└── fetch_images.py           optional: download leaf JPEGs from Zenodo into page/
```

## Data model

- The PAGE `imageFilename` is `<manuscriptId>.jpg` (e.g. `19797_93.jpg`); the XML file
  shares that stem, so the image↔XML link is recoverable with no renaming
  (per HTR-United requirements).
- **Main text region** (`r_main`, type `paragraph`): the ten verse lines in physical
  top-to-bottom order. Each `TextLine/TextEquiv/Unicode` is the exact scribal reading
  (`body` + wrapped `endChar`, concatenated). The `comments` attribute records the
  critical-edition `kural=` number and the leaf `numeral=`.
- **Marginalia region** (`r_margin`, type `marginalia`): the left-margin chapter-title
  cells and the leaf numeral, when present.

## ⚠️ Important caveats

1. **Line coordinates are approximate.** `Coords`/`Baseline` polygons and the IIIF
   `#xywh=` targets are **band-derived full-width bounding boxes** (computed from the
   per-leaf `lineBands` × image dimensions), not hand- or model-segmented baselines.
   They are correct *bands* (every box vertically contains its line) and exact in
   text, suitable for line-strip HTR training and display. For pixel-accurate
   baselines, re-segment the images with Kraken/eScriptorium and replace the `Coords`.
2. **1,329 of the 1,330 kurals are inscribed.** The 133 leaves span every adhikaram,
   but leaf `CICT-PLM-GT-113` (20017_115, adhikaram 113) carries only nine verses —
   **kural 1127 is not present on it**, and its nine verses are inscribed out of
   sequence (see `folioSequence` in the source record; the `comments` attribute of each
   `TextLine` gives the critical-edition number, so physical order and verse order are
   both recoverable). Leaf `CICT-PLM-GT-001` likewise carries eleven bands but only ten
   inscribed lines. Do not assume ten verses per leaf, or that leaf order equals verse
   order.
3. **Editorial folio notes are not transcription.** Source lines flagged `endOfLeaf`
   (e.g. "end of leaf — no further inscribed lines on this side of the folio") are
   editorial remarks, not scribal text. They are excluded from `TextLine`/annotation
   content and preserved in the page `Metadata/Comments` as `LEAF NOTE:` instead.
4. **Manuscript date is estimated** (`time` in `htr-united.yml`): the leaves are
   undated; the 1700–1900 range is a placeholder for the typical Tamil palm-leaf era.
   Replace with the verified date if established.
5. **Hosting URL.** IIIF manifest/canvas/annotation `id`s use the base
   `https://www.digitalarchives.cict.in/ground-truth`. IIIF requires these to be the
   real dereferenceable URLs — if you publish elsewhere, edit `GT_BASE_URL` at the top
   of `generate_ground_truth.py` and regenerate.

## Source images

Images are **not** mirrored here; each leaf is published on Zenodo under CC BY 4.0
with its own DOI (see `index.csv`). To assemble a complete local HTR-United package
(images beside the XML), run:

```bash
python fetch_images.py        # downloads full-res JPEGs from Zenodo into page/
```

## Reproduce

```bash
python generate_ground_truth.py   # rebuild page/, iiif/, index.csv from ../index.html
python validate_gt.py             # XSD-validate PAGE-XML + check IIIF + text round-trip
```

`validate_gt.py` validates every PAGE file against the official PAGE 2019 XSD and
verifies that the IIIF annotation text round-trips the source transcription exactly.

## License & citation

All transcriptions and metadata: **CC BY 4.0**.
Please cite the per-leaf Zenodo DOIs (in `index.csv`) and:

> Central Institute of Classical Tamil (CICT). *CICT Tirukkural Palm-Leaf Ground
> Truth Corpus.* Curated by Kannan Krishnan; transcription research by Mohammed
> Shameem J, Hariyanka D, Dinesh Shanmugavel (SRMIST, Ramapuram). CC BY 4.0.

## Standards

- [PAGE-XML 2019-07-15](https://www.primaresearch.org/schema/PAGE/gts/pagecontent/2019-07-15/pagecontent.xsd)
- [IIIF Presentation API 3.0](https://iiif.io/api/presentation/3.0/) ·
  [W3C Web Annotation](https://www.w3.org/TR/annotation-model/)
- [HTR-United](https://htr-united.github.io/) catalog schema 2023-06-27
