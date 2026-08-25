# -*- coding: utf-8 -*-
"""
Generate machine-readable ground truth for the CICT Tirukkural palm-leaf corpus
from the data embedded in index.html.

Outputs (into D:\\DL file\\ground-truth):
  page/<manuscriptId>.xml        PAGE-XML 2019-07-15 (text + band-derived line coords)
  iiif/<gid>.json                IIIF Presentation 3.0 manifest w/ 'supplementing' annotations
  index.csv                      gid <-> manuscriptId <-> DOI <-> image map
  htr-united.yml                 HTR-United 2023-06-27 catalog metadata
  README.md                      dataset documentation

Line coordinates are BAND-DERIVED full-width bounding boxes (from lineBands x image
dimensions) — approximate regions, exact text. Documented as such.
"""
import json, os, csv, re
from lxml import etree

_HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.normpath(os.path.join(_HERE, "..", "index.html"))  # the site source
OUT = _HERE                                                       # this ground-truth/ folder
PAGE_NS = "http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15"
XSI = "http://www.w3.org/2001/XMLSchema-instance"
SCHEMA_LOC = PAGE_NS + " http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15/pagecontent.xsd"

# *** Set this to the final hosting URL of the ground-truth/ folder. ***
GT_BASE_URL = "https://www.digitalarchives.cict.in/ground-truth"

os.makedirs(os.path.join(OUT, "page"), exist_ok=True)
os.makedirs(os.path.join(OUT, "iiif"), exist_ok=True)

# ---- load the detail specimens object from index.html ----
def load_specimens():
    lines = open(SRC, encoding="utf-8").readlines()
    det = None
    for ln in lines:
        if ln.lstrip().startswith("specimens: {") and '"CICT-PLM-GT-001"' in ln:
            det = ln; break
    assert det, "detail specimens line not found"
    s = det.find("{")
    depth = 0
    for k in range(s, len(det)):
        if det[k] == "{": depth += 1
        elif det[k] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(det[s:k+1])
    raise RuntimeError("unbalanced")

SPEC = load_specimens()

def line_text(l):
    b = (l.get("body") or "").strip()
    e = (l.get("endChar") or "").strip()
    return (b + e).strip()

def bands_for(d, n):
    lb = d.get("lineBands")
    if isinstance(lb, list) and len(lb) == n + 1:
        return lb
    # fallback: even division 0.14..0.96
    return [0.14 + (0.96 - 0.14) * i / n for i in range(n + 1)]

def inscribed(d):
    """(original index, line) for every physically inscribed line.

    Lines flagged endOfLeaf are editorial notes about the folio ("end of leaf —
    no further inscribed lines…"), not scribal text, so they are excluded from the
    transcription; the note is carried in the page Metadata/Comments instead.
    Indices are the original ones so band lookup stays aligned to the leaf."""
    return [(i, l) for i, l in enumerate(d["lines"]) if not l.get("endOfLeaf")]

def leaf_notes(d):
    return [(l.get("body") or "").strip() for l in d["lines"]
            if l.get("endOfLeaf") and (l.get("body") or "").strip()]

def rect(x0, y0, x1, y1):
    return f"{x0},{y0} {x1},{y0} {x1},{y1} {x0},{y1}"

def E(parent, tag, text=None, **attrs):
    el = etree.SubElement(parent, f"{{{PAGE_NS}}}{tag}")
    for k, v in attrs.items():
        el.set(k.replace("__", ":"), str(v))
    if text is not None:
        el.text = text
    return el

metrics = {"files": 0, "pages": 0, "regions": 0, "lines": 0, "characters": 0}
rows = []

def build_page(gid, d):
    W = int(d["image"]["width"]); H = int(d["image"]["height"])
    msid = d["manuscriptId"]
    bands = bands_for(d, len(d["lines"]))
    lns = inscribed(d)
    issued = d.get("issued") or d.get("publicationDate") or "2026-06-23"
    dt = issued + "T00:00:00"

    root = etree.Element(f"{{{PAGE_NS}}}PcGts", nsmap={None: PAGE_NS, "xsi": XSI})
    root.set(f"{{{XSI}}}schemaLocation", SCHEMA_LOC)

    md = E(root, "Metadata")
    E(md, "Creator", "Central Institute of Classical Tamil (CICT)")
    E(md, "Created", dt)
    E(md, "LastChange", dt)
    ch = d["chapter"]
    kr = d["kuralRange"]
    comment = (f"{gid} | Tirukkural Adhikaram {ch['number']} "
               f"({ch.get('titleTamil','')} / {ch.get('title','')}) | "
               f"kurals {kr['from']}-{kr['to']} | section {ch.get('section','')} "
               f"/ subsection {ch.get('subsection','')} | DOI {d.get('doi','')} | "
               f"record {d.get('permalink','')} | manuscriptId {msid} | "
               f"NOTE: line Coords are band-derived full-width bounding boxes (approximate); "
               f"transcription text is exact ground truth.")
    for note in leaf_notes(d):
        comment += f" | LEAF NOTE: {note}"
    E(md, "Comments", comment)

    page = E(root, "Page", imageFilename=f"{msid}.jpg", imageWidth=W, imageHeight=H)

    margins = [(i, l) for i, l in lns if (l.get("leftMargin") or "").strip()]
    has_margin = len(margins) > 0

    # reading order
    ro = E(page, "ReadingOrder")
    og = E(ro, "OrderedGroup", id="g0")
    E(og, "RegionRefIndexed", index="0", regionRef="r_main")
    if has_margin:
        E(og, "RegionRefIndexed", index="1", regionRef="r_margin")

    # main text region (full width)
    y_top = max(0, int(round(bands[lns[0][0]] * H)))
    y_bot = min(H, int(round(bands[lns[-1][0] + 1] * H)))
    reg = E(page, "TextRegion", id="r_main", type="paragraph", custom="readingOrder {index:0;}")
    E(reg, "Coords", points=rect(0, y_top, W, y_bot))
    region_texts = []
    for order, (i, l) in enumerate(lns):
        y0 = max(0, int(round(bands[i] * H)))
        y1 = min(H, int(round(bands[i + 1] * H)))
        if y1 <= y0:
            y1 = min(H, y0 + 1)
        yb = min(H, int(round(bands[i] * H + 0.82 * (bands[i + 1] - bands[i]) * H)))
        t = line_text(l)
        region_texts.append(t)
        k = l.get("kural")
        comm = f"kural={k}" if k is not None else "kural=none"
        comm += f"; numeral={l.get('numeral','')}"
        tl = E(reg, "TextLine", id=f"r_main_l{i+1}",
               custom=f"readingOrder {{index:{order};}}", comments=comm)
        E(tl, "Coords", points=rect(0, y0, W, y1))
        E(tl, "Baseline", points=f"0,{yb} {W},{yb}")
        te = E(tl, "TextEquiv")
        E(te, "Unicode", t)
        metrics["lines"] += 1
        metrics["characters"] += len(t)
    rte = E(reg, "TextEquiv")
    E(rte, "Unicode", "\n".join(region_texts))
    metrics["regions"] += 1

    # marginalia region (left strip) — title cells + leaf numeral
    if has_margin:
        mx = int(round(0.14 * W))
        mreg = E(page, "TextRegion", id="r_margin", type="marginalia",
                 custom="readingOrder {index:1;}")
        E(mreg, "Coords", points=rect(0, y_top, mx, y_bot))
        mtexts = []
        for i, l in margins:
            y0 = max(0, int(round(bands[i] * H)))
            y1 = min(H, int(round(bands[i + 1] * H)))
            if y1 <= y0: y1 = min(H, y0 + 1)
            yb = min(H, int(round(bands[i] * H + 0.82 * (bands[i + 1] - bands[i]) * H)))
            t = (l.get("leftMargin") or "").strip()
            mtexts.append(t)
            tl = E(mreg, "TextLine", id=f"r_margin_l{i+1}",
                   custom=f"readingOrder {{index:{i};}}", comments=f"marginal cell @ {l.get('id','')}")
            E(tl, "Coords", points=rect(0, y0, mx, y1))
            E(tl, "Baseline", points=f"0,{yb} {mx},{yb}")
            te = E(tl, "TextEquiv")
            E(te, "Unicode", t)
            metrics["lines"] += 1
            metrics["characters"] += len(t)
        mrte = E(mreg, "TextEquiv")
        E(mrte, "Unicode", "\n".join(mtexts))
        metrics["regions"] += 1

    tree = etree.ElementTree(root)
    path = os.path.join(OUT, "page", f"{msid}.xml")
    tree.write(path, xml_declaration=True, encoding="UTF-8", pretty_print=True)
    metrics["files"] += 1
    metrics["pages"] += 1
    return W, H

def build_iiif(gid, d, W, H):
    ch = d["chapter"]; kr = d["kuralRange"]
    msid = d["manuscriptId"]
    img_service = (d.get("iiifImage") or "").replace("/info.json", "")
    img_full = img_service + "/full/max/0/default.jpg"
    base = f"{GT_BASE_URL}/iiif/{gid}"
    canvas = f"{base}/canvas"
    bands = bands_for(d, len(d["lines"]))
    lns = inscribed(d)

    def annos():
        out = []
        for i, l in lns:
            y0 = max(0, int(round(bands[i] * H)))
            y1 = min(H, int(round(bands[i + 1] * H)))
            if y1 <= y0: y1 = min(H, y0 + 1)
            t = line_text(l)
            out.append({
                "id": f"{base}/anno/line-{i+1}", "type": "Annotation",
                "motivation": "supplementing",
                "body": {"type": "TextualBody", "language": "ta",
                         "format": "text/plain", "value": t},
                "target": f"{canvas}#xywh=0,{y0},{W},{y1-y0}"})
        # marginalia
        mx = int(round(0.14 * W))
        for i, l in lns:
            mt = (l.get("leftMargin") or "").strip()
            if not mt: continue
            y0 = max(0, int(round(bands[i] * H)))
            y1 = min(H, int(round(bands[i + 1] * H)))
            if y1 <= y0: y1 = min(H, y0 + 1)
            out.append({
                "id": f"{base}/anno/margin-{i+1}", "type": "Annotation",
                "motivation": "supplementing",
                "body": {"type": "TextualBody", "language": "ta",
                         "format": "text/plain", "value": mt},
                "target": f"{canvas}#xywh=0,{y0},{mx},{y1-y0}"})
        return out

    manifest = {
        "@context": "http://iiif.io/api/presentation/3/context.json",
        "id": f"{base}/manifest.json", "type": "Manifest",
        "label": {"en": [f"{gid} · Tirukkural Adhikaram {ch['number']} ({ch.get('title','')})"],
                  "ta": [f"திருக்குறள் அதிகாரம் {ch['number']} ({ch.get('titleTamil','')})"]},
        "metadata": [
            {"label": {"en": ["Specimen ID"]}, "value": {"none": [gid]}},
            {"label": {"en": ["Chapter"]}, "value": {"en": [f"{ch['number']} · {ch.get('title','')}"],
                                                      "ta": [ch.get('titleTamil','')]}},
            {"label": {"en": ["Kural range"]}, "value": {"none": [f"{kr['from']}–{kr['to']}"]}},
            {"label": {"en": ["Section / sub-section"]},
             "value": {"ta": [f"{ch.get('section','')} / {ch.get('subsection','')}"]}},
            {"label": {"en": ["Manuscript ID"]}, "value": {"none": [msid]}},
            {"label": {"en": ["Material"]}, "value": {"en": [d.get("material", "Palm leaf")]}},
            {"label": {"en": ["DOI"]}, "value": {"none": [d.get("doi", "")]}},
        ],
        "rights": "http://creativecommons.org/licenses/by/4.0/",
        "requiredStatement": {"label": {"en": ["Attribution"]},
            "value": {"en": [f"Central Institute of Classical Tamil (CICT). {gid}. "
                             f"DOI: {d.get('doi','')}. Licensed CC BY 4.0."]}},
        "provider": [{"id": "https://www.cict.in/", "type": "Agent",
                      "label": {"en": ["Central Institute of Classical Tamil (CICT)"]}}],
        "homepage": [{"id": d.get("permalink", ""), "type": "Text",
                      "label": {"en": ["Zenodo record"]}, "format": "text/html"}],
        "seeAlso": [
            {"id": f"{GT_BASE_URL}/page/{msid}.xml", "type": "Dataset",
             "label": {"en": ["PAGE-XML ground truth"]}, "format": "application/xml",
             "profile": "http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15/pagecontent.xsd"},
            {"id": f"https://doi.org/{d.get('doi','')}",
             "type": "Dataset", "label": {"en": ["Zenodo DOI"]}},
        ],
        "items": [{
            "id": canvas, "type": "Canvas", "height": H, "width": W,
            "label": {"none": [msid]},
            "items": [{
                "id": f"{canvas}/page", "type": "AnnotationPage",
                "items": [{
                    "id": f"{canvas}/painting", "type": "Annotation", "motivation": "painting",
                    "body": {"id": img_full, "type": "Image", "format": "image/jpeg",
                             "height": H, "width": W,
                             "service": [{"id": img_service, "type": "ImageService3",
                                          "profile": "level2"}]},
                    "target": canvas}]}],
            "annotations": [{
                "id": f"{canvas}/annotations", "type": "AnnotationPage",
                "items": annos()}],
        }],
    }
    d_dir = os.path.join(OUT, "iiif", gid)
    os.makedirs(d_dir, exist_ok=True)
    path = os.path.join(d_dir, "manifest.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

# ---- run ----
for gid in sorted(SPEC.keys()):
    d = SPEC[gid]
    W, H = build_page(gid, d)
    build_iiif(gid, d, W, H)
    ch = d["chapter"]; kr = d["kuralRange"]
    rows.append([gid, ch["number"], ch.get("titleTamil",""), ch.get("title",""),
                 kr["from"], kr["to"], len(inscribed(d)), d["manuscriptId"],
                 d.get("doi",""), d.get("permalink",""), W, H,
                 f"page/{d['manuscriptId']}.xml", f"iiif/{gid}/manifest.json"])

with open(os.path.join(OUT, "index.csv"), "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["id","chapter","chapterTitleTamil","chapterTitleEn","kuralFrom","kuralTo",
                "lines","manuscriptId","doi","recordURL","imageWidth","imageHeight",
                "pageXml","iiifManifest"])
    w.writerows(rows)

print("Specimens:", len(rows))
print("Metrics:", metrics)
with open(os.path.join(OUT, "_metrics.json"), "w", encoding="utf-8") as f:
    json.dump(metrics, f)
