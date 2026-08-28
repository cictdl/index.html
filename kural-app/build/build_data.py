# -*- coding: utf-8 -*-
"""build_data.py — assemble the offline data bundle for the multilingual Kural app.

Sources (all already on this machine):
  • D:/DL file/ground-truth/grammar/thirukkural-ilakkanam.json   — word-level இலக்கணக்குறிப்பு (1330 kurals)
  • D:/DL file/ground-truth/grammar/scaffold/chapters-index.json  — பால்/இயல்/அதிகாரம் structure
  • D:/DL file/ground-truth/grammar/_src/tk.json                  — canonical text, 3 Tamil உரை, English prose, transliteration
  • D:/DL file/ground-truth/grammar/web/glossary.json             — bilingual glossary of grammar terms
  • D:/DL file/index.html  (const KURAL_TEXT = {...})            — CICT translations in the 22 scheduled languages (+ variants)
  • D:/Yappu-Metrical-Scanner/_src/yappu.py                       — reference metrical scanner (யாப்பு layer, computed live)
  • build/prose/<lang>.json  (optional)                           — simple-prose retellings per language {"1": "...", ...}

Output → ../data/
  meta.json            languages, structure, counts, credits
  glossary.json        grammar-term glossary (ta/en)
  manuscript.json      palm-leaf witness per kural — scribal reading (offline) + IIIF region + DOI
  tags.json            tag → kural-number concordance (ilakkanam / vetrumai / togai / ani)
  ch/NNN.json          per-அதிகாரம்: text, transliteration, all translations, prose, யாப்பு scansion
  gr/NNN.json          per-அதிகாரம்: word-level grammar (tap-a-word glossing), அணி, review flags
  search/<lang>.json   compact [n, l1, l2] arrays for cross-language search
  audio.json           which bundled audio files exist (chapter audiobook + TTS packs)

Run:  py build/build_data.py
"""
import json, re, sys, os, time, hashlib
from pathlib import Path
from collections import defaultdict

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
DL = ROOT.parent
GRAM = DL / "ground-truth" / "grammar"
SCANNER = Path("D:/Yappu-Metrical-Scanner/_src")
OUT = ROOT / "data"
PROSE_DIR = ROOT / "build" / "prose"

sys.path.insert(0, str(SCANNER))
import yappu  # noqa: E402

# --------------------------------------------------------------------------- languages
# The 22 languages of the Eighth Schedule (+ script variants as separate entries), plus
# English (3 translations), Bhojpuri and the Tamil critical commentary. `group` ties script
# variants to their language; `kind` says whether the translation is verse or prose.
LANGS = [
 # code   name                         native           short  script        dir    group  kind     translator / edition
 ("ta",  "Tamil (மூலம்)",               "தமிழ்",          "த",   "Tamil",      "ltr", "ta",  "verse", "Canonical published text (CICT)"),
 ("tac", "Tamil (Commentary)",         "தமிழ் உரை",      "உரை", "Tamil",      "ltr", "ta",  "prose", "Tamil critical commentary: Prof. P. Marudanayagam (CICT, 2023, ISBN 978-81-19249-27-5) · CICT Digital Archives"),
 ("en",  "English",                    "English",        "EN",  "Latin",      "ltr", "en",  "verse", "Yogi Shuddhananda Bharati (CICT, 2024, ISBN 978-81-19249-91-6)"),
 ("ena", "English (V. V. S. Aiyar)",   "English",        "AI",  "Latin",      "ltr", "en",  "prose", "V. V. S. Aiyar (CICT, 2nd ed. 2026; K886 & K995 absent in source)"),
 ("enm", "English (Manikkodi)",        "English",        "MK",  "Latin",      "ltr", "en",  "verse", "Manikkodi Srinivasan (CICT, 2026, ISBN 978-93-49646-50-6)"),
 ("as",  "Assamese",                   "অসমীয়া",          "অস",  "Bengali",    "ltr", "as",  "prose", "B. Vijayakumar (CICT, 2023, ISBN 978-81-19249-32-9)"),
 ("bn",  "Bengali",                    "বাংলা",           "বা",  "Bengali",    "ltr", "bn",  "prose", "Dr. B. Natarajan (CICT, 2026, ISBN 978-93-49646-71-1)"),
 ("brx", "Bodo",                       "बड़ो",            "बड़",  "Devanagari", "ltr", "brx", "prose", "Rupali Swargiary & B. Vijayakumar (CICT, 2023, ISBN 978-81-19249-41-1)"),
 ("doi", "Dogri",                      "डोगरी",           "डो",  "Devanagari", "ltr", "doi", "verse", "Vineet Budki (CICT, 2023, ISBN 978-81-19249-37-4)"),
 ("gu",  "Gujarati",                   "ગુજરાતી",          "ગુ",  "Gujarati",   "ltr", "gu",  "verse", "Dr. P. C. Kokila (CICT, 2nd ed.)"),
 ("hi",  "Hindi",                      "हिन्दी",           "हि",  "Devanagari", "ltr", "hi",  "verse", "M. Govindarajan (CICT, 3rd ed. 2025, Publication No. 79, ISBN 978-93-81744-70-3)"),
 ("kn",  "Kannada",                    "ಕನ್ನಡ",           "ಕ",   "Kannada",    "ltr", "kn",  "verse", "S. Srinivasan (CICT, 2022, ISBN 978-93-81744-05-5)"),
 ("ks",  "Kashmiri (Devanagari)",      "कॉशुर",           "कॉ",  "Devanagari", "ltr", "ks",  "verse", "Beena Budki (CICT, 2023, ISBN 978-81-19249-31-2)"),
 ("ksn", "Kashmiri (Nastaliq)",        "کٲشُر",           "ک",   "Arabic",     "rtl", "ks",  "verse", "Dr. Beena Budki & Dr. Zargar Adil Ahmad (CICT, 2026, ISBN 978-93-49646-45-2)"),
 ("kok", "Konkani (Kannada script)",   "ಕೊಂಕಣಿ",          "ಕೊಂ", "Kannada",    "ltr", "kok", "verse", "Shwetha Pai (CICT, 2026, ISBN 978-81-969995-3-7)"),
 ("gom", "Konkani (Devanagari)",       "कोंकणी",           "कों", "Devanagari", "ltr", "kok", "prose", "Saurabh Varik (CICT, 2026)"),
 ("mai", "Maithili",                   "मैथिली",           "मै",  "Devanagari", "ltr", "mai", "verse", "Ramchandra Roy (CICT, 2023, ISBN 978-81-19249-35-0)"),
 ("ml",  "Malayalam",                  "മലയാളം",          "മ",   "Malayalam",  "ltr", "ml",  "verse", "Dr. N. Manoharan (CICT, 2022, ISBN 978-93-81744-67-3)"),
 ("mni", "Manipuri (Bengali script)",  "মৈতৈলোন্",         "মৈ",  "Bengali",    "ltr", "mni", "prose", "Soibam Rebika Devi (CICT, 2025, ISBN 978-81-90800-08-2)"),
 ("mei", "Manipuri (Meitei Mayek)",    "ꯃꯩꯇꯩꯂꯣꯟ",          "ꯃꯩ",  "Meetei Mayek","ltr", "mni", "prose", "Soibam Rebika Devi (CICT, 2025, ISBN 978-81-90800-08-2)"),
 ("mr",  "Marathi",                    "मराठी",           "म",   "Devanagari", "ltr", "mr",  "verse", "Dr. N. Lalitha (CICT, 2012, ISBN 978-93-81744-69-7)"),
 ("ne",  "Nepali",                     "नेपाली",           "ने",  "Devanagari", "ltr", "ne",  "verse", "Sunita Dahal (CICT, 2022, Publication No. 69)"),
 ("or",  "Odia",                       "ଓଡ଼ିଆ",            "ଓ",   "Odia",       "ltr", "or",  "verse", "Prof. Dr. Giribala Mohanty (CICT, 2022, ISBN 978-93-81744-68-0)"),
 ("pa",  "Punjabi",                    "ਪੰਜਾਬੀ",           "ਪੰ",  "Gurmukhi",   "ltr", "pa",  "verse", "Tarlochan Singh Bedi (CICT, 2012, ISBN 978-93-81744-02-4)"),
 ("sa",  "Sanskrit",                   "संस्कृतम्",         "सं",  "Devanagari", "ltr", "sa",  "prose", "S. Rajagopalan (CICT, 2022, ISBN 978-93-81744-84-0)"),
 ("sat", "Santali (Devanagari)",       "ᱥᱟᱱᱛᱟᱲᱤ",          "ᱥᱟ",  "Devanagari", "ltr", "sat", "verse", "Meenakshi G. Murmu (CICT, 2026, ISBN 978-81-969995-5-1) — Devanagari transcription"),
 ("sd",  "Sindhi (Devanagari)",        "सिन्धी",           "सि",  "Devanagari", "ltr", "sd",  "verse", "Dr. Kishore Vaswani (CICT, 2026, ISBN 978-93-49646-39-1)"),
 ("te",  "Telugu",                     "తెలుగు",           "తె",  "Telugu",     "ltr", "te",  "prose", "CICT Telugu translation (2014 edition)"),
 ("ur",  "Urdu",                       "اُردُو",           "اُ",   "Arabic",     "rtl", "ur",  "verse", "Dr. Amanulla M. B. (CICT, 2022, ISBN 978-93-81744-66-6) — rhyming couplets"),
 ("bho", "Bhojpuri",                   "भोजपुरी",          "भो",  "Devanagari", "ltr", "bho", "verse", "Harish Chandra Mishra (CICT, 2023, ISBN 978-81-19249-22-0) — not in the Eighth Schedule"),
]
# 22 Eighth-Schedule language groups (for the "22 languages" claim and the picker grouping)
SCHEDULED = ["as","bn","brx","doi","gu","hi","kn","ks","kok","mai","ml","mni","mr","ne","or","pa","sa","sat","sd","ta","te","ur"]

VOICE_PRIORITY = {
 "ta":["ta-IN","ta-LK","ta"], "tac":["ta-IN","ta-LK","ta"],
 "en":["en-IN","en-GB","en-US","en"], "ena":["en-IN","en-GB","en-US","en"], "enm":["en-IN","en-GB","en-US","en"],
 "sa":["sa-IN","sa","hi-IN"], "hi":["hi-IN","hi"], "gu":["gu-IN","gu"], "or":["or-IN","or","ory"],
 "kn":["kn-IN","kn"], "mr":["mr-IN","mr"], "te":["te-IN","te"], "bn":["bn-IN","bn-BD","bn"],
 "ne":["ne-NP","ne-IN","ne"], "ks":["ks-IN","ks-Deva","ks","hi-IN"], "doi":["doi-IN","doi","hi-IN"],
 "bho":["bho-IN","bho","hi-IN"], "pa":["pa-IN","pa-Guru","pa"], "mni":["mni-IN","mni","bn-IN"],
 "kok":["kok-IN","kok","kn-IN"], "mei":["mni-Mtei","mni-IN","mni"], "as":["as-IN","as","bn-IN"],
 "brx":["brx-IN","brx","hi-IN"], "ur":["ur-IN","ur-PK","ur","hi-IN"], "sat":["sat-IN","sat","hi-IN"],
 "gom":["kok-IN","kok","mr-IN","hi-IN"], "mai":["mai-IN","mai","hi-IN"], "sd":["sd-IN","sd-PK","sd","hi-IN"],
 "ml":["ml-IN","ml"], "ksn":["ur-IN","ur-PK","ar-SA","hi-IN"],
}
RATE = {"ta":0.85,"tac":0.85,"en":0.88,"ena":0.85,"enm":0.88,"sa":0.85,"hi":0.9,"gu":0.88,"or":0.88,"kn":0.88,
        "mr":0.88,"te":0.85,"bn":0.85,"ne":0.88,"ks":0.88,"ksn":0.8,"doi":0.88,"bho":0.88,"pa":0.9,"mni":0.85,
        "kok":0.85,"mei":0.85,"as":0.85,"brx":0.85,"ur":0.8,"sat":0.85,"gom":0.85,"mai":0.85,"sd":0.85,"ml":0.9}

# --------------------------------------------------------------------------- helpers
def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)

def dump(p, obj):
    p.parent.mkdir(parents=True, exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))

def extract_kural_text(html_path):
    """Pull `const KURAL_TEXT = {...}` out of the archive page (one language per line)."""
    s = html_path.read_text(encoding="utf-8")
    i = s.index("const KURAL_TEXT = {")
    j = s.index("\n};", i)
    out = {}
    for line in s[i:j].split("\n")[1:]:
        m = re.match(r"\s*([a-z_]+):\s*(\[.*\]),?\s*$", line)
        if m:
            out[m.group(1)] = json.loads(m.group(2))  # later duplicate keys win, as in JS
    return out

def ser_verse(v):
    def ser_line(ln):
        return {
            "t": ln.text,
            "err": ln.error,
            "adi": ln.adi if ln.ok else None,
            "matra": ln.matra if ln.ok else None,
            "thalai": ln.thalais,
            "seers": [{
                "w": s.word, "name": s.name, "cls": s.cls,
                "asai": [{"k": "N" if a.kind == yappu.NER else "I",
                          "u": [[u.cls, u.text] for u in a.units]} for a in s.asais],
            } for s in ln.seers],
        }
    return {
        "lines": [ser_line(ln) for ln in v.lines],
        "paa": v.paa, "conf": round(v.paa_confidence, 2), "evidence": v.paa_evidence,
        "eetru": v.eetru, "reseg": v.resegmented,
        "monai": v.monai, "etukai": v.etukai, "iyaipu": v.iyaipu,
        "lineEtukai": v.line_etukai, "boundary": v.boundary_thalai,
    }

def ser_words(rec):
    words = []
    for s in rec.get("sirs", []):
        words.append({
            "w": s["sira"], "adi": s["adi"], "pos": s["pos"], "togai": s.get("togai"),
            "c": [{
                "s": c.get("sol"), "split": c.get("split"), "cat": c.get("category"),
                "ilk": c.get("ilakkanam"), "feat": c.get("features") or {},
                "vet": c.get("vetrumai"), "todar": c.get("todar"),
                "gloss": c.get("gloss"), "conf": c.get("confidence"),
            } for c in s.get("components", [])],
        })
    return words

# --------------------------------------------------------------------------- main
def main():
    t0 = time.time()
    master = load(GRAM / "thirukkural-ilakkanam.json")
    gram = {k["number"]: k for k in master["kurals"]}
    chapters = load(GRAM / "scaffold" / "chapters-index.json")
    tk = {k["Number"]: k for k in load(GRAM / "_src" / "tk.json")["kural"]}
    glossary = load(GRAM / "web" / "glossary.json")
    # Palm-leaf witnesses — the bridge into the Digital Archives (chapters 1–100).
    ms_src = load(GRAM / "web" / "manuscript.json")
    ms = {}
    for chs, rec in ms_src.items():
        svc = (rec.get("service") or "").strip()
        for kn, ln in (rec.get("lines") or {}).items():
            y = ln.get("y") or [0, 0]
            h = max(1, int(y[1]) - int(y[0]))
            entry = {
                "ms": rec.get("manuscriptId"), "doi": rec.get("doi"),
                "record": rec.get("recordURL"), "scribal": ln.get("text", ""),
            }
            # IIIF region crop of just this line; omitted when the leaf has no IIIF service
            if svc:
                entry["crop"] = f"{svc}/0,{int(y[0])},{int(rec.get('width') or 0)},{h}/1200,/0/default.jpg"
                entry["full"] = rec.get("full")
            ms[str(int(kn))] = entry
    print(f"palm-leaf witnesses: {len(ms)} kurals ({sum(1 for v in ms.values() if v.get('crop'))} with IIIF crops)")
    texts = extract_kural_text(DL / "index.html")
    assert len(gram) == 1330 and len(chapters) == 133 and len(tk) == 1330

    # translations keyed by number
    tr = {}
    for code, *_ in LANGS:
        arr = texts.get(code, [])
        tr[code] = {e["n"]: (e.get("l1", "").strip(), e.get("l2", "").strip()) for e in arr if e.get("l1", "").strip()}

    # optional prose retellings
    prose_extra = {}
    if PROSE_DIR.exists():
        for p in sorted(PROSE_DIR.glob("*.json")):
            code = p.stem
            d = load(p)
            prose_extra[code] = {int(k): v for k, v in d.items() if isinstance(v, str) and v.strip()}

    # scan every kural
    yap = {}
    stats = defaultdict(int)
    for n in range(1, 1331):
        g = gram[n]
        v = yappu.scan_verse_best([g["line1"], g["line2"]])
        yap[n] = ser_verse(v)
        stats["reseg"] += v.resegmented
        stats["kural_venpa"] += ("குறள் வெண்பா" in v.paa)
        stats["clean"] += all(ln.ok for ln in v.lines)
    print(f"scanned 1330: குறள் வெண்பா={stats['kural_venpa']} resegmented={stats['reseg']} clean={stats['clean']}")
    from collections import Counter
    print("paa:", Counter(v["paa"] for v in yap.values()).most_common(6))

    # structure: pals → iyals → chapters
    pals = []
    for ch in chapters:
        p = next((x for x in pals if x["num"] == ch["palNum"]), None)
        if not p:
            p = {"num": ch["palNum"], "name": ch["pal"], "nameEn": ch["palEn"], "iyals": []}
            pals.append(p)
        iy = next((x for x in p["iyals"] if x["num"] == ch["iyalNum"]), None)
        if not iy:
            iy = {"num": ch["iyalNum"], "name": ch["iyal"], "nameEn": ch["iyalEn"], "chapters": []}
            p["iyals"].append(iy)
        iy["chapters"].append(ch["adhigaram"])

    # tag concordance
    tags = {"ilakkanam": defaultdict(set), "category": defaultdict(set), "vetrumai": defaultdict(set),
            "togai": defaultdict(set), "ani": defaultdict(set), "todar": defaultdict(set)}

    # per-chapter files
    OUT.mkdir(exist_ok=True)
    for ch in chapters:
        cn = ch["adhigaram"]
        core = {k: ch[k] for k in ("adhigaram", "name", "nameEn", "transliteration", "start", "end",
                                    "pal", "palEn", "palNum", "iyal", "iyalEn", "iyalNum")}
        core["kurals"] = []
        grf = {"adhigaram": cn, "kurals": {}}
        for n in range(ch["start"], ch["end"] + 1):
            g, t = gram[n], tk[n]
            # உரை streams offered as "plain words": Mu. Varadarajanar's Tamil paraphrase,
            # CICT's own Tamil critical commentary (Prof. P. Marudanayagam), and English prose.
            prose = {"ta_mv": t.get("mv", ""), "en": t.get("explanation", "")}
            tac = tr.get("tac", {}).get(n)
            if tac:
                prose["tac"] = " ".join(x for x in tac if x).strip()
            for code, d in prose_extra.items():
                if n in d:
                    prose[code] = d[n]
            core["kurals"].append({
                "n": n, "l1": g["line1"], "l2": g["line2"],
                "tl": [t.get("transliteration1", ""), t.get("transliteration2", "")],
                "tr": {code: list(tr[code][n]) for code, *_ in LANGS if code != "ta" and n in tr[code]},
                "prose": prose,
                "yappu": yap[n],
            })
            grf["kurals"][str(n)] = {
                "words": ser_words(g), "ani": g.get("ani", []), "flags": g.get("reviewFlags", []),
                "verification": g.get("verification"),
            }
            for s in g.get("sirs", []):
                if s.get("togai"): tags["togai"][s["togai"]].add(n)
                for c in s.get("components", []):
                    if c.get("ilakkanam"): tags["ilakkanam"][c["ilakkanam"]].add(n)
                    if c.get("category"): tags["category"][c["category"]].add(n)
                    v = c.get("vetrumai")
                    if isinstance(v, dict) and v.get("number"):
                        tags["vetrumai"][f"{v['number']} · {v.get('name') or ''}".strip(" ·")].add(n)
                    elif isinstance(v, str) and v:
                        tags["vetrumai"][v].add(n)
                    if c.get("todar"): tags["todar"][c["todar"]].add(n)
            for a in g.get("ani", []):
                if a.get("name"): tags["ani"][a["name"]].add(n)
        dump(OUT / "ch" / f"{cn:03d}.json", core)
        dump(OUT / "gr" / f"{cn:03d}.json", grf)

    dump(OUT / "tags.json", {k: {t: sorted(v) for t, v in sorted(d.items(), key=lambda kv: -len(kv[1]))}
                             for k, d in tags.items()})
    dump(OUT / "glossary.json", glossary)
    dump(OUT / "manuscript.json", ms)

    # search indices (compact)
    for code, *_ in LANGS:
        if code == "ta":
            arr = [[n, gram[n]["line1"], gram[n]["line2"]] for n in range(1, 1331)]
        else:
            arr = [[n, a, b] for n, (a, b) in sorted(tr[code].items())]
        dump(OUT / "search" / f"{code}.json", arr)
    dump(OUT / "search" / "translit.json", [[n, tk[n].get("transliteration1", ""), tk[n].get("transliteration2", "")] for n in range(1, 1331)])
    dump(OUT / "search" / "prose-ta.json", [[n, tk[n].get("mv", ""), ""] for n in range(1, 1331)])
    dump(OUT / "search" / "prose-en.json", [[n, tk[n].get("explanation", ""), ""] for n in range(1, 1331)])
    for code, d in prose_extra.items():
        dump(OUT / "search" / f"prose-{code}.json", [[n, v, ""] for n, v in sorted(d.items())])

    # audio availability
    audio = {"chapters": sorted(int(p.stem) for p in (ROOT / "audio" / "ch").glob("*.mp3")) if (ROOT / "audio" / "ch").exists() else [],
             "tts": {}}
    for d in sorted((ROOT / "audio" / "tts").glob("*")) if (ROOT / "audio" / "tts").exists() else []:
        if d.is_dir():
            audio["tts"][d.name] = len(list(d.glob("*.mp3")))
    dump(OUT / "audio.json", audio)

    # meta
    SOURCE_URL = {"tac": "https://www.digitalarchives.cict.in/#ground-truth"}
    langs = {}
    for code, name, native, short, script, direction, group, kind, credit in LANGS:
        cov = 1330 if code == "ta" else len(tr[code])
        langs[code] = {"name": name, "native": native, "short": short, "script": script, "dir": direction,
                       "group": group, "kind": kind, "credit": credit, "coverage": cov,
                       "scheduled": group in SCHEDULED, "voices": VOICE_PRIORITY.get(code, []),
                       "rate": RATE.get(code, 0.9), "url": SOURCE_URL.get(code, ""),
                       "prose": code in ("ta", "en") or code in prose_extra}
    meta = {
        "title": "திருக்குறள் · Tirukkuṟaḷ — 22 மொழிகள்",
        "built": time.strftime("%Y-%m-%d"),
        "version": hashlib.sha1(json.dumps(langs, sort_keys=True).encode()).hexdigest()[:8],
        "counts": {"kurals": 1330, "chapters": 133, "languages": len(langs),
                   "scheduled": len({v["group"] for v in langs.values() if v["scheduled"]}),
                   "wordTokens": master["counts"]["wordTokens"],
                   "proseLangs": sorted(c for c, v in langs.items() if v["prose"])},
        "languages": langs,
        "langOrder": [c for c, *_ in LANGS],
        "pals": pals,
        "chapters": [{k: ch[k] for k in ("adhigaram", "name", "nameEn", "transliteration", "start", "end", "palNum", "iyalNum")} for ch in chapters],
        "credits": {
            "text": "Canonical Tirukkuṟaḷ text, மு. வரதராசனார் உரை and English prose via tk120404/thirukkural (open data)",
        "commentary": "தமிழ் உரை — Tamil critical commentary by Prof. P. Marudanayagam (CICT, 2023, ISBN 978-81-19249-27-5); CICT Digital Archives — https://www.digitalarchives.cict.in/#ground-truth",
            "grammar": "இலக்கணக்குறிப்பு layer — CICT Digital Archives ground-truth/grammar (AI-assisted, 133 அதிகாரம் double-verified, open to scholarly correction)",
            "metre": "யாப்பு layer — CICT reference metrical scanner (Yappu-Metrical-Scanner, scan_verse_best)",
            "audio": "Tamil audiobook per அதிகாரம் — CICT Tirukkural audio; per-kural recitation & commentary via on-device speech synthesis",
            "publisher": "செம்மொழித் தமிழாய்வு மத்திய நிறுவனம் · Central Institute of Classical Tamil, Chennai",
            "licence": "CC BY 4.0",
        },
        "manuscript": {"kurals": len(ms), "withImage": sum(1 for v in ms.values() if v.get("crop")),
                       "note": "CICT palm-leaf corpus, 133 specimens; images served by Zenodo IIIF (needs network), scribal readings bundled offline"},
        "scan": dict(stats),
    }
    dump(OUT / "meta.json", meta)

    size = sum(p.stat().st_size for p in OUT.rglob("*.json"))
    print(f"data bundle: {size/1e6:.1f} MB in {time.time()-t0:.1f}s → {OUT}")
    print("coverage:", {c: v["coverage"] for c, v in langs.items() if v["coverage"] < 1330} or "all 1330")

if __name__ == "__main__":
    main()
