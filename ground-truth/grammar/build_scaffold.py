# -*- coding: utf-8 -*-
"""
Build the deterministic scaffold for Thirukkural இலக்கணக் குறிப்பு annotation.
Produces:
  scaffold/thirukkural-scaffold.json   - all 1330 kurals, metadata + tokens + graphemes (NO AI layer)
  scaffold/chapters-index.json         - 133 adhigaram index (pal/iyal/range)
  _src/ch-001.json ... ch-133.json     - per-chapter input packets for the workflow agents
Nothing here is AI-generated: pure data transform from tk.json + detail.json.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "_src")

kurals = json.load(open(os.path.join(SRC, "tk.json"), encoding="utf-8"))["kural"]
detail = json.load(open(os.path.join(SRC, "detail.json"), encoding="utf-8"))

# ---- Tamil grapheme (எழுத்து) segmentation -------------------------------
# A Tamil orthographic letter = independent vowel | aaydham/visarga |
#                               consonant + optional (vowel-sign | virama | au-mark)
VOWEL_SIGNS = "ாிீுூெேைொோௌ்ௗ"
LETTER_RE = re.compile(
    "[அ-ஔ]"            # independent vowels அ-ஔ
    "|[ஂஃ]"           # anusvara / visarga (ஃ aaydham)
    "|[க-ஹ][" + VOWEL_SIGNS + "]?"  # consonant + optional sign
)

# இன மோனை groups (consonant classes that alliterate)
INAM = {
    "க": "க/ங", "ங": "க/ங",
    "ச": "ச/ஞ", "ஞ": "ச/ஞ",
    "ட": "ட/ண", "ண": "ட/ண",
    "த": "த/ந", "ந": "த/ந",
    "ப": "ப/ம", "ம": "ப/ம",
    "ற": "ற/ன", "ன": "ற/ன",
    "ய": "ய", "ர": "ர", "ல": "ல", "வ": "வ", "ழ": "ழ", "ள": "ள",
}

def letters(word):
    return LETTER_RE.findall(word)

def base_consonant(letter):
    """Strip the vowel sign -> bare consonant char (for மோனை). Vowel-initial returns the vowel."""
    if not letter:
        return ""
    c0 = letter[0]
    return c0

def tokenize(line):
    return line.strip().rstrip(".").split()

# ---- Walk detail.json to map every kural -> pal / iyal / adhigaram --------
chapters = []   # ordered list of adhigaram dicts
book = detail[0]
for pal in book["section"]["detail"]:
    pal_name = pal["name"]; pal_en = pal["translation"]; pal_num = pal["number"]
    pal_tr = pal.get("transliteration", "")
    for iyal in pal["chapterGroup"]["detail"]:
        iyal_name = iyal["name"]; iyal_en = iyal["translation"]; iyal_num = iyal["number"]
        for ch in iyal["chapters"]["detail"]:
            chapters.append({
                "adhigaram": ch["number"],
                "name": ch["name"],
                "nameEn": ch["translation"],
                "transliteration": ch.get("transliteration", ""),
                "start": ch["start"], "end": ch["end"],
                "pal": pal_name, "palEn": pal_en, "palNum": pal_num, "palTr": pal_tr,
                "iyal": iyal_name, "iyalEn": iyal_en, "iyalNum": iyal_num,
            })

assert len(chapters) == 133, f"expected 133 adhigarams, got {len(chapters)}"

# Override பொருட்பால் இயல் to Parimēlaḻakar's 4-way division so the grammar layer's
# subsection scheme matches the GT specimen `subsection` field (see cictdl-tirukkural-iyals).
POL_IYALS = [
    (39,  63, "அரசியல்",   "Royalty",                1),
    (64,  73, "அமைச்சியல்", "Ministers of State",     2),
    (74,  96, "அங்கவியல்",  "Essentials of a State",  3),
    (97, 108, "ஒழிபியல்",   "Miscellaneous",          4),
]
for ch in chapters:
    if ch["pal"] == "பொருட்பால்":
        for lo, hi, nm, en, num in POL_IYALS:
            if lo <= ch["adhigaram"] <= hi:
                ch["iyal"], ch["iyalEn"], ch["iyalNum"] = nm, en, num
                break

# index kurals by number
by_num = {k["Number"]: k for k in kurals}
assert len(by_num) == 1330, f"expected 1330 kurals, got {len(by_num)}"

def kural_record(num, ch):
    k = by_num[num]
    l1 = k["Line1"].strip()
    l2 = k["Line2"].strip()
    s1 = tokenize(l1)
    s2 = tokenize(l2)
    words = []
    for w in s1 + s2:
        words.append({"word": w, "letters": letters(w)})
    return {
        "number": num,
        "adhigaram": ch["adhigaram"],
        "line1": l1,
        "line2": l2,
        "couplet": (l1 + " " + l2).strip(),
        "sirs_line1": s1,
        "sirs_line2": s2,
        "sirCount": [len(s1), len(s2)],
        "words": words,
        "urai_mv": k.get("mv", ""),
        "urai_sp": k.get("sp", ""),
        "urai_mk": k.get("mk", ""),
        "meaningEn": k.get("Translation", ""),
    }

scaffold = []
chapters_index = []
for ch in chapters:
    ch_kurals = [kural_record(n, ch) for n in range(ch["start"], ch["end"] + 1)]
    scaffold.extend(ch_kurals)
    chapters_index.append({k: ch[k] for k in
        ("adhigaram","name","nameEn","transliteration","start","end",
         "pal","palEn","palNum","iyal","iyalEn","iyalNum")})
    # per-chapter input packet for the workflow
    packet = {
        "adhigaram": ch["adhigaram"], "name": ch["name"], "nameEn": ch["nameEn"],
        "transliteration": ch["transliteration"],
        "pal": ch["pal"], "palEn": ch["palEn"],
        "iyal": ch["iyal"], "iyalEn": ch["iyalEn"],
        "kuralRange": [ch["start"], ch["end"]],
        "kurals": ch_kurals,
    }
    fn = os.path.join(SRC, f"ch-{ch['adhigaram']:03d}.json")
    json.dump(packet, open(fn, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

json.dump(scaffold, open(os.path.join(HERE, "scaffold", "thirukkural-scaffold.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
json.dump(chapters_index, open(os.path.join(HERE, "scaffold", "chapters-index.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)

# ---- Summary ------------------------------------------------------------
print("chapters:", len(chapters_index))
print("kurals in scaffold:", len(scaffold))
print("pals:", sorted({c['pal'] for c in chapters_index}))
nwords = sum(len(k["words"]) for k in scaffold)
print("total word tokens:", nwords)
# sample
import pprint
print("--- sample kural 1 ---")
pprint.pprint({x: scaffold[0][x] for x in ("number","adhigaram","sirs_line1","sirs_line2","sirCount")})
print("letters of சீர் 'எழுத்தெல்லாம்':", letters("எழுத்தெல்லாம்"))
print("--- chapters_index[0] & [-1] ---")
pprint.pprint(chapters_index[0]); pprint.pprint(chapters_index[-1])
