# -*- coding: utf-8 -*-
"""
Inject the இலக்கணக் குறிப்பு layer onto the Tirukkural HTR ground truth.

For every TextLine carrying comments="kural=N", append a parseable
  ilakkanam {kural:N; verification:..; words:sol=tag|..; togai:..; ani:..; edugai:..; eetruseer:..;}
block to that line's `custom` attribute (PAGE's standard plugin/annotation channel).
The scribal <Unicode> transcription and Word/Coords layers are LEFT UNTOUCHED, so the
HTR value of the GT is preserved; the grammar is canonical-text analysis joined by kural number.

Originals in page/ are not modified — enriched copies go to page-grammar/, plus a full
machine-readable sidecar page-grammar/<manuscriptId>.grammar.json per leaf.
"""
import json, os, re, glob
import xml.etree.ElementTree as ET

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, "page")
OUT = os.path.join(HERE, "page-grammar"); os.makedirs(OUT, exist_ok=True)
NS = "http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15"
XSI = "http://www.w3.org/2001/XMLSchema-instance"
ET.register_namespace("", NS)
ET.register_namespace("xsi", XSI)

grammar = json.load(open(os.path.join(HERE, "grammar", "thirukkural-ilakkanam.json"), encoding="utf-8"))["kurals"]
by_num = {k["number"]: k for k in grammar}

def safe(s):
    # strip chars that would break the custom mini-syntax
    return re.sub(r"[{}|=;]", "", str(s or "")).strip()

def build_custom_block(rec):
    pairs = []
    for sira in rec.get("sirs", []):
        for c in sira.get("components", []):
            il = c.get("ilakkanam")
            if il: pairs.append(f"{safe(c.get('sol'))}={safe(il)}")
    words = "|".join(pairs)
    togai = "|".join(f"{safe(s.get('sira'))}={safe(s.get('togai'))}"
                     for s in rec.get("sirs", []) if s.get("togai"))
    ani = ",".join(safe(a.get("name")) for a in rec.get("ani", []) if isinstance(a, dict) and a.get("name"))
    y = rec.get("yappu") or {}
    ed = (y.get("edugai") or {}).get("letter") if isinstance(y.get("edugai"), dict) else None
    parts = [f"kural:{rec['number']};", f"verification:{rec.get('verification','draft')};",
             f"words:{words};"]
    if togai: parts.append(f"togai:{togai};")
    if ani: parts.append(f"ani:{ani};")
    if ed: parts.append(f"edugai:{safe(ed)};")
    if y.get("eetruseer"): parts.append(f"eetruseer:{safe(y.get('eetruseer'))};")
    return "ilakkanam {" + "".join(parts) + "}"

KURAL_RE = re.compile(r"kural=(\d+)")
leaves = 0; lines_tagged = 0; kurals_seen = set(); missing = []

for fp in sorted(glob.glob(os.path.join(PAGE, "*.xml"))):
    name = os.path.basename(fp)
    mid = name[:-4]
    tree = ET.parse(fp)
    root = tree.getroot()
    sidecar = []
    for tl in root.iter(f"{{{NS}}}TextLine"):
        com = tl.get("comments") or ""
        m = KURAL_RE.search(com)
        if not m:
            continue
        n = int(m.group(1))
        rec = by_num.get(n)
        if not rec:
            missing.append(n); continue
        cust = tl.get("custom") or ""
        block = build_custom_block(rec)
        tl.set("custom", (cust + " " + block).strip() if cust else block)
        lines_tagged += 1; kurals_seen.add(n)
        sidecar.append(rec)
    tree.write(os.path.join(OUT, name), encoding="utf-8", xml_declaration=True)
    json.dump({"manuscriptId": mid, "source": f"page/{name}",
               "schema": "thirukkural-ilakkanam v1.0", "kurals": sidecar},
              open(os.path.join(OUT, f"{mid}.grammar.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    leaves += 1

# validate every output parses
bad = []
for fp in glob.glob(os.path.join(OUT, "*.xml")):
    try: ET.parse(fp)
    except Exception as e: bad.append((os.path.basename(fp), str(e)))

print(f"leaves processed: {leaves}")
print(f"kural-lines tagged: {lines_tagged} | distinct kurals: {len(kurals_seen)}")
print(f"kurals in lines but missing grammar: {sorted(set(missing))}")
print(f"output XML re-parse failures: {bad if bad else 'none — all valid'}")
