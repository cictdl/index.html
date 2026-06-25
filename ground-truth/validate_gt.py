# -*- coding: utf-8 -*-
import json, os, glob, urllib.request
from lxml import etree

_HERE = os.path.dirname(os.path.abspath(__file__))
OUT = _HERE
SRC = os.path.normpath(os.path.join(_HERE, "..", "index.html"))
PAGE_NS = "http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15"

# ---- fetch + load XSD ----
xsd_local = os.path.join(OUT, "_pagecontent-2019.xsd")
if not os.path.exists(xsd_local):
    urls = ["https://www.primaresearch.org/schema/PAGE/gts/pagecontent/2019-07-15/pagecontent.xsd",
            "http://schema.primaresearch.org/PAGE/gts/pagecontent/2019-07-15/pagecontent.xsd"]
    data = None
    for u in urls:
        try:
            data = urllib.request.urlopen(u, timeout=60).read(); break
        except Exception as e:
            print("xsd fetch fail", u, e)
    open(xsd_local, "wb").write(data)
schema = etree.XMLSchema(etree.parse(xsd_local))
print("XSD loaded.")

# ---- validate PAGE files ----
bad = 0; nfiles = 0
for p in sorted(glob.glob(os.path.join(OUT, "page", "*.xml"))):
    nfiles += 1
    doc = etree.parse(p)
    if not schema.validate(doc):
        bad += 1
        print("INVALID", os.path.basename(p), schema.error_log[0])
        if bad > 5: break
print(f"PAGE-XML: {nfiles} files, {nfiles-bad} valid, {bad} invalid")

# ---- load source specimens for round-trip ----
det = [l for l in open(SRC, encoding="utf-8") if l.lstrip().startswith("specimens: {") and '"CICT-PLM-GT-001"' in l][0]
s = det.find("{"); depth=0
for k in range(s,len(det)):
    if det[k]=="{": depth+=1
    elif det[k]=="}":
        depth-=1
        if depth==0: SPEC=json.loads(det[s:k+1]); break

def linetext(l): return ((l.get("body") or "").strip()+(l.get("endChar") or "").strip()).strip()

# ---- validate IIIF + round-trip ----
jbad=0; njson=0; rt_fail=0; coord_fail=0
for jp in sorted(glob.glob(os.path.join(OUT, "iiif", "*", "manifest.json"))):
    njson += 1
    gid = os.path.basename(os.path.dirname(jp))
    m = json.load(open(jp, encoding="utf-8"))
    try:
        assert m["@context"].endswith("presentation/3/context.json")
        assert m["type"] == "Manifest"
        cv = m["items"][0]; assert cv["type"]=="Canvas"
        W,Hh = cv["width"], cv["height"]
        paint = cv["items"][0]["items"][0]; assert paint["motivation"]=="painting"
        assert paint["body"]["service"][0]["type"]=="ImageService3"
        annos = cv["annotations"][0]["items"]
        assert all(a["motivation"]=="supplementing" for a in annos)
        # round-trip line annotations vs source
        src_lines = [linetext(l) for l in SPEC[gid]["lines"]]
        anno_lines = [a["body"]["value"] for a in annos if "/anno/line-" in a["id"]]
        if anno_lines != src_lines:
            rt_fail += 1; print("RT MISMATCH", gid)
        # coord bounds
        for a in annos:
            frag = a["target"].split("#xywh=")[1]
            x,y,w,h = map(int, frag.split(","))
            if x<0 or y<0 or x+w>W or y+h>Hh:
                coord_fail += 1; print("COORD OOB", gid, frag, W, Hh); break
    except Exception as e:
        jbad += 1; print("JSON STRUCT FAIL", gid, e)
print(f"IIIF: {njson} manifests, {njson-jbad} structurally OK, {jbad} bad")
print(f"Round-trip line-text mismatches: {rt_fail}")
print(f"Coordinate out-of-bounds specimens: {coord_fail}")

# ---- cross-check PAGE main-region text round-trip on a sample ----
sample = ["CICT-PLM-GT-091","CICT-PLM-GT-100","CICT-PLM-GT-001","CICT-PLM-GT-050"]
for gid in sample:
    msid = SPEC[gid]["manuscriptId"]
    doc = etree.parse(os.path.join(OUT,"page",f"{msid}.xml"))
    ns={"p":PAGE_NS}
    main = doc.find(".//p:TextRegion[@id='r_main']", ns)
    uni = [u.text or "" for u in main.findall("p:TextLine/p:TextEquiv/p:Unicode", ns)]
    src = [linetext(l) for l in SPEC[gid]["lines"]]
    print(f"PAGE round-trip {gid}: {'OK' if uni==src else 'MISMATCH'} ({len(uni)} lines)")
print("DONE")
