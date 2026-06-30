# -*- coding: utf-8 -*-
"""
Merge per-அதிகாரம் AI analyses (chapters/adhigaram-*.json) with the deterministic
scaffold into master deliverables, validating tags against the controlled vocabulary.
Outputs:
  thirukkural-ilakkanam.json   - master, ordered by kural number, with full metadata
  thirukkural-ilakkanam.csv    - flat, one row per சொல்
  REPORT.md                    - coverage / confidence / tag distribution / validation
"""
import json, os, csv, io
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CH = os.path.join(HERE, "chapters")
SCAF = json.load(open(os.path.join(HERE, "scaffold", "thirukkural-scaffold.json"), encoding="utf-8-sig"))
CIDX = json.load(open(os.path.join(HERE, "scaffold", "chapters-index.json"), encoding="utf-8-sig"))
meta_by_num = {k["number"]: k for k in SCAF}
ch_meta = {c["adhigaram"]: c for c in CIDX}

ALLOWED_CATEGORY = {"பெயர்","வினை","இடை","உரி"}
ALLOWED_ILAKKANAM = {
 # பெயர்
 "பொருட்பெயர்","இடப்பெயர்","காலப்பெயர்","சினைப்பெயர்","பண்புப்பெயர்","தொழிற்பெயர்",
 "எண்ணுப்பெயர்","சுட்டுப்பெயர்","வினாப்பெயர்","சிறப்புப்பெயர்","காரணப்பெயர்","இடுகுறிப்பெயர்",
 "வினையாலணையும்பெயர்",
 # வினை
 "தெரிநிலைவினைமுற்று","குறிப்புவினைமுற்று","ஏவல்வினைமுற்று","வியங்கோள்வினைமுற்று",
 "வினையெச்சம்","பெயரெச்சம்","எதிர்மறைவினையெச்சம்","எதிர்மறைபெயரெச்சம்",
 # இடை
 "வேற்றுமைஉருபு","சாரியை","அசைநிலை","உம்மை","ஏகாரம்","ஓகாரம்","வினாஇடை","எதிர்மறைஇடை","பிரிநிலைஇடை",
 # உரி
 "உரிச்சொல்",
}
ALLOWED_TOGAI = {"வேற்றுமைத்தொகை","வினைத்தொகை","பண்புத்தொகை","உவமைத்தொகை","உம்மைத்தொகை","அன்மொழித்தொகை"}
ALLOWED_TODAR = {"இரட்டைக்கிளவி","அடுக்குத்தொடர்","இணைமொழி","அடைமொழி"}

# expected category for each ilakkanam tag (explicit — sandhi breaks suffix heuristics)
_CAT_PEYAR = {"பொருட்பெயர்","இடப்பெயர்","காலப்பெயர்","சினைப்பெயர்","பண்புப்பெயர்","தொழிற்பெயர்",
    "எண்ணுப்பெயர்","சுட்டுப்பெயர்","வினாப்பெயர்","சிறப்புப்பெயர்","காரணப்பெயர்","இடுகுறிப்பெயர்","வினையாலணையும்பெயர்"}
_CAT_VINAI = {"தெரிநிலைவினைமுற்று","குறிப்புவினைமுற்று","ஏவல்வினைமுற்று","வியங்கோள்வினைமுற்று",
    "வினையெச்சம்","பெயரெச்சம்","எதிர்மறைவினையெச்சம்","எதிர்மறைபெயரெச்சம்"}
_CAT_IDAI = {"வேற்றுமைஉருபு","சாரியை","அசைநிலை","உம்மை","ஏகாரம்","ஓகாரம்","வினாஇடை","எதிர்மறைஇடை","பிரிநிலைஇடை"}
# vocab extensions (legitimate tags the agents produced; folded into v1.1)
ALLOWED_ILAKKANAM |= {"எதிர்மறைவினைமுற்று", "உவமைஉருபு"}
_CAT_VINAI = set(_CAT_VINAI) | {"எதிர்மறைவினைமுற்று"}
_CAT_IDAI = set(_CAT_IDAI) | {"உவமைஉருபு"}
TAG_CATEGORY = {}
for t in _CAT_PEYAR: TAG_CATEGORY[t] = "பெயர்"
for t in _CAT_VINAI: TAG_CATEGORY[t] = "வினை"
for t in _CAT_IDAI:  TAG_CATEGORY[t] = "இடை"
TAG_CATEGORY["உரிச்சொல்"] = "உரி"

# explicit fixes for non-canonical tokens seen in draft (unverified) chapters
TAG_FIX = {
    "பெயர்ப்பெயர்": "பொருட்பெயர்", "பெயர்": "பொருட்பெயர்",
    "பெயர்ச்சொல்/பொதுப்பெயர்": "பொருட்பெயர்", "பொதுப்பெயர்": "பொருட்பெயர்",
    "வினா": "வினாப்பெயர்", "வினைத்தொகை": "வினையாலணையும்பெயர்",
}
def norm_tag(il):
    if not isinstance(il, str): return il
    il = il.strip()
    if il in ALLOWED_ILAKKANAM: return il
    if il + "்" in ALLOWED_ILAKKANAM: return il + "்"   # restore dropped pulli
    return TAG_FIX.get(il, il)
def norm_togai(tg):
    if isinstance(tg, dict): tg = tg.get("type") or tg.get("name")
    if not isinstance(tg, str): return None
    tg = tg.strip()
    if tg in ALLOWED_TOGAI: return tg
    if tg + "்" in ALLOWED_TOGAI: return tg + "்"
    return None   # e.g. உருவகம்/உருவகத்தொகை are not தொகை — metaphor lives in `ani`
def norm_ani_name(nm):
    if not isinstance(nm, str): return nm
    return nm.strip()

# ---- load chapter analyses (prefer verified chapters/, fall back to _draft/) -
analyses = {}
vstatus = {}   # adh -> "verified" | "draft"
missing = []
DRAFT = os.path.join(CH, "_draft")
for n in range(1, 134):
    fin = os.path.join(CH, f"adhigaram-{n:03d}.json")
    drf = os.path.join(DRAFT, f"adhigaram-{n:03d}.json")
    src, st = (fin, "verified") if os.path.exists(fin) else (drf, "draft") if os.path.exists(drf) else (None, None)
    if not src:
        missing.append((n, "file missing (no verified, no draft)")); continue
    try:
        a = json.load(open(src, encoding="utf-8-sig"))
        nk = len(a.get("kurals", []))
        if nk != 10:
            missing.append((n, f"{st}: only {nk} kurals (expected 10)"))
        analyses[n] = a; vstatus[n] = st
    except Exception as e:
        # if verified file is corrupt, try the draft
        if st == "verified" and os.path.exists(drf):
            try:
                analyses[n] = json.load(open(drf, encoding="utf-8-sig")); vstatus[n] = "draft"
                missing.append((n, f"verified corrupt ({e}); used draft"))
            except Exception as e2:
                missing.append((n, f"JSON error verified+draft: {e2}"))
        else:
            missing.append((n, f"JSON error: {e}"))

# ---- build master + validate ----------------------------------------------
master_kurals = []
warnings = []
fixes = Counter()
tag_dist = Counter(); cat_dist = Counter(); togai_dist = Counter(); ani_dist = Counter()
conf_sum = 0.0; conf_n = 0; review_total = 0; word_total = 0
covered_kurals = set()

for adh in range(1, 134):
    a = analyses.get(adh)
    cm = ch_meta[adh]
    if not a:
        continue
    for kr in a.get("kurals", []):
        num = kr.get("number")
        covered_kurals.add(num)
        sm = meta_by_num.get(num, {})
        # enrich with scaffold metadata + validate tags
        for sira in kr.get("sirs", []):
            tg = norm_togai(sira.get("togai"))
            sira["togai"] = tg   # normalize in place (master gets clean value)
            if tg: togai_dist[tg] += 1
            for comp in sira.get("components", []):
                word_total += 1
                il = norm_tag(comp.get("ilakkanam"))
                # தொகை mistakenly placed in the word slot → relocate to சீர் togai, flag head word
                if il in ALLOWED_TOGAI:
                    if not sira.get("togai"): sira["togai"] = il; togai_dist[il] += 1
                    kr.setdefault("reviewFlags", []).append(
                        f"{comp.get('sol')}: சீர் '{sira.get('sira')}' is {il}; head-word சொல்-வகை needs review")
                    fixes["togai_relocated"] += 1
                    comp["ilakkanam"] = None; comp["category"] = None; il = None
                comp["ilakkanam"] = il
                if il and il not in ALLOWED_ILAKKANAM:
                    warnings.append(f"k{num}: unresolved ilakkanam '{il}' ({comp.get('sol')})")
                    fixes["unresolved_tag"] += 1
                # derive category authoritatively from the (specific) validated tag
                if il in TAG_CATEGORY:
                    if comp.get("category") != TAG_CATEGORY[il]:
                        fixes["category_set"] += 1
                    comp["category"] = TAG_CATEGORY[il]
                cat = comp.get("category")
                td = comp.get("todar")
                if isinstance(td, dict): td = td.get("type") or td.get("name")
                if td and isinstance(td, str) and td.strip() not in ALLOWED_TODAR:
                    if td.strip() + "்" in ALLOWED_TODAR: td = td.strip() + "்"
                    else: warnings.append(f"k{num}: bad todar '{td}' ({comp.get('sol')})")
                comp["todar"] = td if (isinstance(td, str) and td in ALLOWED_TODAR) else (td if td else None)
                if il: tag_dist[il] += 1
                if cat: cat_dist[cat] += 1
                c = comp.get("confidence")
                if isinstance(c, (int, float)):
                    conf_sum += c; conf_n += 1
        for an in kr.get("ani", []):
            if isinstance(an, dict):
                an["name"] = norm_ani_name(an.get("name"))
                ani_dist[an.get("name", "?")] += 1
        review_total += len(kr.get("reviewFlags", []))
        master_kurals.append({
            "number": num,
            "verification": vstatus.get(adh, "draft"),
            "pal": cm["pal"], "iyal": cm["iyal"],
            "adhigaram": adh, "adhigaramName": cm["name"], "adhigaramEn": cm["nameEn"],
            "line1": kr.get("line1", sm.get("line1")), "line2": kr.get("line2", sm.get("line2")),
            "couplet": sm.get("couplet"),
            "meaningEn": sm.get("meaningEn"), "urai_mv": sm.get("urai_mv"),
            "yappu": kr.get("yappu"), "ani": kr.get("ani", []),
            "sirs": kr.get("sirs", []), "reviewFlags": kr.get("reviewFlags", []),
        })

master_kurals.sort(key=lambda x: x["number"])
master = {
    "title": "Thirukkural இலக்கணக் குறிப்பு — word-level grammatical ground-truth",
    "schemaVersion": "1.0",
    "method": "AI-assisted draft (analyze+verify), grounded in canonical text+உரை; requires scholarly review",
    "counts": {"kurals": len(master_kurals), "chaptersCovered": len(analyses), "wordTokens": word_total,
               "chaptersVerified": sum(1 for v in vstatus.values() if v=="verified"),
               "chaptersDraftOnly": sum(1 for v in vstatus.values() if v=="draft")},
    "tagset": "TAGSET.md",
    "kurals": master_kurals,
}
json.dump(master, open(os.path.join(HERE, "thirukkural-ilakkanam.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)

# ---- CSV (one row per சொல்) -------------------------------------------------
with io.open(os.path.join(HERE, "thirukkural-ilakkanam.csv"), "w", encoding="utf-8-sig", newline="") as f:
    w = csv.writer(f)
    w.writerow(["kural","verification","pal","iyal","adhigaram","adhigaramName","adi","siraPos","sira","togai",
                "sol","split","category","ilakkanam","vetrumai","todar","gloss","confidence"])
    for k in master_kurals:
        for sira in k["sirs"]:
            tg = sira.get("togai")
            tg_s = tg.get("type") or tg.get("name") if isinstance(tg, dict) else (tg or "")
            for comp in sira.get("components", []):
                vt = comp.get("vetrumai")
                vt_s = "" if not isinstance(vt, dict) else f"{vt.get('number','')}:{vt.get('urupu','')}:{vt.get('name','')}"
                td = comp.get("todar")
                td_s = td.get("type") or td.get("name") if isinstance(td, dict) else (td or "")
                w.writerow([k["number"], k["verification"], k["pal"], k["iyal"], k["adhigaram"], k["adhigaramName"],
                            sira.get("adi"), sira.get("pos"), sira.get("sira"), tg_s,
                            comp.get("sol"), comp.get("split"), comp.get("category"), comp.get("ilakkanam"),
                            vt_s, td_s, comp.get("gloss"), comp.get("confidence")])

# ---- REPORT ---------------------------------------------------------------
all_nums = set(range(1, 1331))
not_covered = sorted(all_nums - covered_kurals)
avg_conf = (conf_sum / conf_n) if conf_n else 0
lines = []
lines.append("# Thirukkural இலக்கணக் குறிப்பு — Build Report\n")
nver = sum(1 for v in vstatus.values() if v=="verified")
ndrf = sum(1 for v in vstatus.values() if v=="draft")
ver_list = sorted(a for a,v in vstatus.items() if v=="verified")
drf_list = sorted(a for a,v in vstatus.items() if v=="draft")
lines.append(f"- Chapters analysed: **{len(analyses)} / 133**")
lines.append(f"  - double-verified (analyze+verify): **{nver}** → அதிகாரம் {ver_list}")
lines.append(f"  - draft-only (analyze pass; verify pending — spend limit): **{ndrf}**")
lines.append(f"- Kurals covered: **{len(covered_kurals)} / 1330**")
lines.append(f"- Word tokens tagged: **{word_total}**")
lines.append(f"- Mean confidence: **{avg_conf:.3f}** (n={conf_n})")
lines.append(f"- Total reviewFlags: **{review_total}**")
lines.append(f"\n> Draft-only அதிகாரம் still pending the independent verify pass: {drf_list}")
if missing:
    lines.append(f"\n## Missing / unreadable chapters ({len(missing)})")
    for n, why in missing: lines.append(f"- அதிகாரம் {n}: {why}")
if not_covered:
    lines.append(f"\n## Kurals NOT covered ({len(not_covered)})")
    lines.append(", ".join(map(str, not_covered[:60])) + (" …" if len(not_covered) > 60 else ""))
lines.append(f"\n## Deterministic normalization auto-fixes: {dict(fixes)}")
lines.append(f"\n## Residual validation warnings (after normalization): {len(warnings)}")
for wm in warnings[:80]: lines.append(f"- {wm}")
if len(warnings) > 80: lines.append(f"- … and {len(warnings)-80} more")
lines.append("\n## category distribution")
for t, c in cat_dist.most_common(): lines.append(f"- {t}: {c}")
lines.append("\n## ilakkanam tag distribution")
for t, c in tag_dist.most_common(): lines.append(f"- {t}: {c}")
lines.append("\n## தொகை distribution")
for t, c in togai_dist.most_common(): lines.append(f"- {t}: {c}")
lines.append("\n## அணி distribution")
for t, c in ani_dist.most_common(): lines.append(f"- {t}: {c}")
open(os.path.join(HERE, "REPORT.md"), "w", encoding="utf-8").write("\n".join(lines))

print("merged kurals:", len(master_kurals), "| chapters:", len(analyses),
      "| words:", word_total, "| avg_conf:", round(avg_conf,3),
      "| warnings:", len(warnings), "| reviewFlags:", review_total)
print("not covered:", len(not_covered))
