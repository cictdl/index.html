# -*- coding: utf-8 -*-
"""
Emit web/manuscript.json : chapter -> palm-leaf IIIF image + per-kural scribal line.
Lets ilakkanam.html pair the canonical grammatical analysis with the actual ஓலைச்சுவடி line
image (IIIF region crop from Zenodo) for the digitized kurals (chs 1-100).
Sources: ../index.csv, ../iiif/<gid>/manifest.json, ../page/<manuscriptId>.xml
"""
import json, os, csv, re
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
GT = os.path.dirname(HERE)            # ground-truth/
WEB = os.path.join(HERE, "web"); os.makedirs(WEB, exist_ok=True)
NS = "http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15"
KURAL_RE = re.compile(r"kural=(\d+)")

def service_id(manifest_path):
    m = json.load(open(manifest_path, encoding="utf-8"))
    try:
        body = m["items"][0]["items"][0]["items"][0]["body"]
        svc = body.get("service")
        if isinstance(svc, list) and svc: return svc[0].get("id"), body.get("id")
        return None, body.get("id")
    except Exception:
        return None, None

def line_bands(page_path):
    out = {}
    root = ET.parse(page_path).getroot()
    for tl in root.iter(f"{{{NS}}}TextLine"):
        mm = KURAL_RE.search(tl.get("comments") or "")
        if not mm: continue
        n = int(mm.group(1))
        coords = tl.find(f"{{{NS}}}Coords")
        ys = []
        if coords is not None:
            for pt in (coords.get("points") or "").split():
                xy = pt.split(",")
                if len(xy) == 2: ys.append(int(xy[1]))
        te = tl.find(f"{{{NS}}}TextEquiv/{{{NS}}}Unicode")
        out[n] = {"text": (te.text or "").strip() if te is not None else "",
                  "y": [min(ys), max(ys)] if ys else None}
    return out

man = {}
with open(os.path.join(GT, "index.csv"), encoding="utf-8-sig", newline="") as f:
    for row in csv.DictReader(f):
        ch = int(row["chapter"]); mid = row["manuscriptId"]
        manifest = os.path.join(GT, row["iiifManifest"])
        page = os.path.join(GT, row["pageXml"])
        svc, full = (service_id(manifest) if os.path.exists(manifest) else (None, None))
        lines = line_bands(page) if os.path.exists(page) else {}
        man[ch] = {
            "manuscriptId": mid, "service": svc, "full": full,
            "recordURL": row.get("recordURL", ""), "doi": row.get("doi", ""),
            "width": int(row.get("imageWidth") or 0), "height": int(row.get("imageHeight") or 0),
            "lines": {str(k): v for k, v in sorted(lines.items())},
        }

json.dump(man, open(os.path.join(WEB, "manuscript.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))
import os as _os
print("chapters with manuscript:", len(man),
      "| kural-lines:", sum(len(c["lines"]) for c in man.values()),
      "| size:", round(_os.path.getsize(os.path.join(WEB, "manuscript.json")) / 1024), "KB")
print("sample ch1 service:", man[1]["service"])
print("sample ch1 kural1:", man[1]["lines"].get("1"))
