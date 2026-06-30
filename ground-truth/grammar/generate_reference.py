# -*- coding: utf-8 -*-
"""
Human-readable per-அதிகாரம் reference docs from thirukkural-ilakkanam.json.
Writes reference/adhigaram-NNN.md (133) + reference/INDEX.md (grouped பால்→இயல்→அதிகாரம்).
Deterministic; no AI.
"""
import json, os
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "reference"); os.makedirs(REF, exist_ok=True)
M = json.load(open(os.path.join(HERE, "thirukkural-ilakkanam.json"), encoding="utf-8"))["kurals"]

def clip(s, n=140):
    s = (s or "").strip().replace("\n", " ")
    return s if len(s) <= n else s[:n].rstrip() + "…"

def vt_str(vt):
    if not isinstance(vt, dict): return ""
    u = vt.get("urupu"); n = vt.get("number"); nm = vt.get("name")
    if not u and not nm: return ""
    return f"{u or '—'} ({n}, {nm})" if nm else f"{u or '—'} ({n})"

def yappu_line(y):
    if not isinstance(y, dict): return ""
    parts = [y.get("paa", "குறள் வெண்பா")]
    sc = y.get("sirCount")
    if sc: parts.append(f"சீர் {sc}")
    mon = y.get("monai")
    if isinstance(mon, list):
        keys = [f"அடி{m.get('adi')} '{m.get('key')}'" for m in mon if isinstance(m, dict) and m.get("present") and m.get("key")]
        if keys: parts.append("மோனை " + ", ".join(keys))
    ed = y.get("edugai")
    if isinstance(ed, dict) and ed.get("present") and ed.get("letter"):
        parts.append(f"எதுகை '{ed.get('letter')}'")
    if y.get("eetruseer"): parts.append(f"ஈற்றுச்சீர் {y.get('eetruseer')}")
    return " · ".join(str(p) for p in parts)

# group by adhigaram
chapters = OrderedDict()
for k in M:
    chapters.setdefault(k["adhigaram"], []).append(k)

badge = {"verified": "✅ சரிபார்க்கப்பட்டது", "draft": "📝 வரைவு (சரிபார்ப்பு நிலுவையில்)"}

for adh, kurals in chapters.items():
    kurals.sort(key=lambda x: x["number"])
    c0 = kurals[0]
    ver = c0.get("verification", "draft")
    L = []
    L.append(f"# அதிகாரம் {adh} — {c0['adhigaramName']} ({c0.get('adhigaramEn','')})")
    L.append("")
    L.append(f"**பால்:** {c0['pal']} · **இயல்:** {c0['iyal']} · **குறள்:** {kurals[0]['number']}–{kurals[-1]['number']} · **நிலை:** {badge.get(ver, ver)}")
    L.append("")
    L.append("> ⚠️ AI-உதவியுடன் உருவாக்கப்பட்ட வரைவு; இறுதி ground-truth-க்கு இலக்கண அறிஞர் சரிபார்ப்பு தேவை.")
    for k in kurals:
        L.append("\n---\n")
        L.append(f"## குறள் {k['number']}")
        L.append(f"> {k.get('line1','')}  \n> {k.get('line2','')}")
        L.append("")
        L.append(f"*யாப்பு:* {yappu_line(k.get('yappu'))}")
        ani = [a.get("name") for a in k.get("ani", []) if isinstance(a, dict) and a.get("name")]
        if ani: L.append(f"*அணி:* {', '.join(ani)}")
        if k.get("urai_mv"): L.append(f"*பொருள்:* {clip(k.get('urai_mv'))}")
        L.append("")
        L.append("| சீர் | தொகை | சொல் | பிரிப்பு | இலக்கணக் குறிப்பு | வகை | வேற்றுமை | நம் |")
        L.append("|---|---|---|---|---|---|---|---|")
        for s in k.get("sirs", []):
            comps = s.get("components", []) or [{}]
            for i, comp in enumerate(comps):
                sira_cell = s.get("sira", "") if i == 0 else ""
                togai_cell = (s.get("togai") or "") if i == 0 else ""
                conf = comp.get("confidence")
                conf_s = f"{conf:.2f}" if isinstance(conf, (int, float)) else ""
                L.append(f"| {sira_cell} | {togai_cell} | {comp.get('sol','')} | {comp.get('split','') or ''} | "
                         f"{comp.get('ilakkanam','') or ''} | {comp.get('category','') or ''} | "
                         f"{vt_str(comp.get('vetrumai'))} | {conf_s} |")
        flags = k.get("reviewFlags", [])
        if flags:
            L.append("")
            L.append("**⚑ பார்வைக்கு:**")
            for fl in flags: L.append(f"- {fl}")
    open(os.path.join(REF, f"adhigaram-{adh:03d}.md"), "w", encoding="utf-8").write("\n".join(L) + "\n")

# INDEX grouped பால் → இயல் → அதிகாரம்
idx = ["# திருக்குறள் இலக்கணக் குறிப்பு — அதிகார அட்டவணை\n",
       f"133 அதிகாரம் · 1330 குறள். ஒவ்வொரு அதிகாரத்திற்கும் தனி reference கோப்பு (`adhigaram-NNN.md`).\n",
       "✅ = சரிபார்க்கப்பட்டது · 📝 = வரைவு\n"]
cur_pal = cur_iyal = None
for adh, kurals in chapters.items():
    c0 = kurals[0]
    if c0["pal"] != cur_pal:
        cur_pal = c0["pal"]; cur_iyal = None
        idx.append(f"\n## {cur_pal}\n")
    if c0["iyal"] != cur_iyal:
        cur_iyal = c0["iyal"]
        idx.append(f"\n### {cur_iyal}\n")
    mark = "✅" if c0.get("verification") == "verified" else "📝"
    idx.append(f"- {mark} [{adh}. {c0['adhigaramName']}](adhigaram-{adh:03d}.md) "
               f"(குறள் {kurals[0]['number']}–{kurals[-1]['number']})")
open(os.path.join(REF, "INDEX.md"), "w", encoding="utf-8").write("\n".join(idx) + "\n")

print("wrote", len(chapters), "chapter files +", "INDEX.md into reference/")
