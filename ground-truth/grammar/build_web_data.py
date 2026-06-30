# -*- coding: utf-8 -*-
"""
Emit lean, app-ready data for ilakkanam.html from the merged master.
  web/index.json          - chapters index (nav) : pal/iyal/adhigaram/range/verification
  web/ch/NNN.json         - enriched 10-kural packets (couplet, yappu, ani, sirs, urai, flags)
  web/search-index.json   - {words:[[k,sol,il,cat]], facets:{ilakkanam/category/togai/ani/vetrumai -> {val:[kurals]}}}
"""
import json, os
from collections import OrderedDict, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, "web"); os.makedirs(os.path.join(WEB, "ch"), exist_ok=True)
M = json.load(open(os.path.join(HERE, "thirukkural-ilakkanam.json"), encoding="utf-8"))["kurals"]

# group by adhigaram
chaps = OrderedDict()
for k in M:
    chaps.setdefault(k["adhigaram"], []).append(k)

# nav index (one row per adhigaram)
index = []
for adh, ks in chaps.items():
    ks.sort(key=lambda x: x["number"])
    c0 = ks[0]
    index.append({
        "adhigaram": adh, "name": c0["adhigaramName"], "nameEn": c0.get("adhigaramEn", ""),
        "pal": c0["pal"], "iyal": c0["iyal"],
        "start": ks[0]["number"], "end": ks[-1]["number"],
        "verification": c0.get("verification", "draft"),
    })
    json.dump({"adhigaram": adh, "name": c0["adhigaramName"], "nameEn": c0.get("adhigaramEn", ""),
               "pal": c0["pal"], "iyal": c0["iyal"], "kurals": ks},
              open(os.path.join(WEB, "ch", f"{adh:03d}.json"), "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
json.dump(index, open(os.path.join(WEB, "index.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))

# search index
words = []
facets = {f: defaultdict(set) for f in ("ilakkanam", "category", "togai", "ani", "vetrumai")}
for k in M:
    n = k["number"]
    for s in k.get("sirs", []):
        tg = s.get("togai")
        if isinstance(tg, str) and tg: facets["togai"][tg].add(n)
        for c in s.get("components", []):
            il = c.get("ilakkanam"); cat = c.get("category"); sol = c.get("sol", "")
            words.append([n, sol, il or "", cat or ""])
            if il: facets["ilakkanam"][il].add(n)
            if cat: facets["category"][cat].add(n)
            vt = c.get("vetrumai")
            if isinstance(vt, dict) and vt.get("name"): facets["vetrumai"][vt["name"]].add(n)
    for a in k.get("ani", []):
        if isinstance(a, dict) and a.get("name"): facets["ani"][a["name"]].add(n)

facets_out = {f: {val: sorted(ks) for val, ks in sorted(d.items(), key=lambda x: -len(x[1]))}
              for f, d in facets.items()}
json.dump({"words": words, "facets": facets_out},
          open(os.path.join(WEB, "search-index.json"), "w", encoding="utf-8"),
          ensure_ascii=False, separators=(",", ":"))

import os as _os
sz = lambda p: _os.path.getsize(p)
print("chapters:", len(index), "| word tokens indexed:", len(words))
print("index.json:", sz(os.path.join(WEB,"index.json")), "B | search-index.json:",
      round(sz(os.path.join(WEB,"search-index.json"))/1024), "KB | sample ch:",
      sz(os.path.join(WEB,"ch","040.json")), "B")
print("facet tag counts:", {f: len(facets_out[f]) for f in facets_out})
