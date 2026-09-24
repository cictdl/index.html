# -*- coding: utf-8 -*-
"""build_brahmi.py — the 1,330 couplets in தமிழி (Tamil-Brahmi, Unicode Brahmi block) → data/brahmi.json

  py build/build_brahmi.py             # write data/brahmi.json + build/brahmi_review.txt + the review text, run the checks
  py build/build_brahmi.py --e-virama  # the older convention instead: short e/o as the long letter + virama

Convention (default = the Old Tamil characters Unicode 11 added for exactly this script):
  short எ / ஒ  →  BRAHMI LETTER OLD TAMIL SHORT E / O   (U+11071, U+11072)
  short ெ / ொ  →  BRAHMI VOWEL SIGN OLD TAMIL SHORT E / O   (U+11073, U+11074)
  long  ஏ / ஓ, ே / ோ  →  the plain letter / sign
  puḷḷi ்  →  BRAHMI SIGN OLD TAMIL VIRAMA U+11070
  ழ ற ன  →  the OLD TAMIL letters LLLA / RRA / NNNA (U+11035–11037); ள → BRAHMI LETTER LLA
  ஃ  →  BRAHMI SIGN VISARGA (a placeholder: Tamil-Brahmi inscriptions do not attest the āytam — SCHOLAR DECISION)
  numbers  →  Brahmi digits (positional, U+11066…); Brahmi's own additive number signs cannot write 1330
  the closing full stop is dropped; a question mark is kept
--e-virama writes short e/o as the long letter or sign plus BRAHMI VIRAMA (𑀏𑁆, 𑁂𑁆) and the puḷḷi as U+11046 — the
convention of older converters. Measured in Chromium with Noto Sans Brahmi: "vowel sign + virama" is rejected by
the shaping engine and drawn with a dotted circle, so that convention is kept only for interchange with tools that
expect it, never for display.

This is a modern letter-for-letter spelling in Brahmi characters, not an epigraphic reconstruction: Tamil-Brahmi
inscriptions of the early centuries did not mark vowels or the puḷḷi the way modern Tamil does, and the app says so.
The mapping is lossless: the round-trip check below turns every couplet back into its exact Tamil text.
"""
import json, re, sys, unicodedata as ud
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")
APP = Path(__file__).resolve().parents[1]
OLD = "--e-virama" not in sys.argv
B = lambda name: ud.lookup("BRAHMI " + name)
VIRAMA = B("SIGN OLD TAMIL VIRAMA") if OLD else B("VIRAMA")
SHORT = "" if OLD else B("VIRAMA")   # what turns a long e/o into the short one in the default convention
VOWELS = {"அ": B("LETTER A"), "ஆ": B("LETTER AA"), "இ": B("LETTER I"), "ஈ": B("LETTER II"), "உ": B("LETTER U"), "ஊ": B("LETTER UU"),
          "எ": B("LETTER OLD TAMIL SHORT E") if OLD else B("LETTER E") + SHORT, "ஏ": B("LETTER E"), "ஐ": B("LETTER AI"),
          "ஒ": B("LETTER OLD TAMIL SHORT O") if OLD else B("LETTER O") + SHORT, "ஓ": B("LETTER O"), "ஔ": B("LETTER AU")}
CONS = {"க": "KA", "ங": "NGA", "ச": "CA", "ஞ": "NYA", "ட": "TTA", "ண": "NNA", "த": "TA", "ந": "NA", "ப": "PA", "ம": "MA",
        "ய": "YA", "ர": "RA", "ல": "LA", "வ": "VA", "ழ": "OLD TAMIL LLLA", "ள": "LLA", "ற": "OLD TAMIL RRA", "ன": "OLD TAMIL NNNA",
        "ஜ": "JA", "ஷ": "SSA", "ஸ": "SA", "ஹ": "HA"}
CONS = {k: B("LETTER " + v) for k, v in CONS.items()}
SIGNS = {"ா": B("VOWEL SIGN AA"), "ி": B("VOWEL SIGN I"), "ீ": B("VOWEL SIGN II"), "ு": B("VOWEL SIGN U"), "ூ": B("VOWEL SIGN UU"),
         "ெ": B("VOWEL SIGN OLD TAMIL SHORT E") if OLD else B("VOWEL SIGN E") + SHORT, "ே": B("VOWEL SIGN E"), "ை": B("VOWEL SIGN AI"),
         "ொ": B("VOWEL SIGN OLD TAMIL SHORT O") if OLD else B("VOWEL SIGN O") + SHORT, "ோ": B("VOWEL SIGN O"), "ௌ": B("VOWEL SIGN AU"),
         "்": VIRAMA}
OTHER = {"ஃ": B("SIGN VISARGA")}
DIGITS = {str(d): B("DIGIT " + n) for d, n in enumerate(["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"])}
FWD = {**VOWELS, **CONS, **SIGNS, **OTHER, **DIGITS}

def to_brahmi(s):
    out = []
    for ch in ud.normalize("NFC", s):
        if ch in FWD: out.append(FWD[ch])
        elif ch in " \n?": out.append(ch)
        elif ch == ".": pass
        else: raise ValueError(f"no Brahmi for {ch!r} U+{ord(ch):04X} {ud.name(ch, '?')}")
    return "".join(out)

def to_tamil(b):
    # longest-match reverse: two-codepoint short vowels before the plain letter they contain
    rev = sorted(((v, k) for k, v in FWD.items()), key=lambda x: -len(x[0]))
    out, i = [], 0
    while i < len(b):
        for v, k in rev:
            if b.startswith(v, i): out.append(k); i += len(v); break
        else: out.append(b[i]); i += 1
    return "".join(out)

def main():
    rows, review, bad = {}, [], []
    for c in range(1, 134):
        for k in json.load(open(APP / f"data/ch/{c:03d}.json", encoding="utf-8"))["kurals"]:
            l1, l2 = to_brahmi(k["l1"]), to_brahmi(k["l2"])
            rows[k["n"]] = [l1, l2]
            back = (to_tamil(l1), to_tamil(l2))
            want = (k["l1"].rstrip("."), k["l2"].rstrip("."))
            if back != want: bad.append(k["n"])
            review.append(f"{k['n']}\n{k['l1']}\n{k['l2']}\n{l1}\n{l2}\n")
    assert not bad, f"round trip failed for {bad[:10]}"
    meta = {"script": "Tamil-Brahmi (தமிழி), Unicode Brahmi block", "convention": "unicode11-old-tamil" if OLD else "e-plus-virama",
            "note_ta": "தமிழி எழுத்துகளில் இன்றைய எழுத்துக்கூட்டலின் நேர்மாற்றம் — கல்வெட்டு மறுவாக்கம் அன்று. ஆய்தம் விசர்க்கக் குறியால் காட்டப்படுகிறது.",
            "note_en": "A letter-for-letter rendering of today's spelling in Tamil-Brahmi characters, not an epigraphic reconstruction: the early inscriptions did not mark vowels and the puḷḷi as modern Tamil does. The āytam is shown with the visarga sign.",
            "aytam": "visarga (placeholder, for scholarly decision)", "count": len(rows)}
    json.dump({"meta": meta, "k": {str(n): v for n, v in sorted(rows.items())}}, open(APP / "data/brahmi.json", "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    (APP / "build/brahmi_review.txt").write_text("\n".join(review), encoding="utf-8")
    used = sorted({ch for v in rows.values() for l in v for ch in l if ord(ch) > 0x10000})
    print(f"{len(rows)} couplets → data/brahmi.json ({(APP / 'data/brahmi.json').stat().st_size / 1024:.0f} KB) · round trip exact · {len(used)} Brahmi code points used")
    print("code points:", " ".join(f"U+{ord(c):05X}" for c in used))
    print("--- kural 1 ---"); print(rows[1][0]); print(rows[1][1])
    print("--- kural 5 (has ஃ) ---"); print(rows[5][0]); print(rows[5][1])

if __name__ == "__main__": main()
