"""lint_data.py — text-integrity checks over the generated data bundle, run on every build.

Reads data/meta.json + data/ch/*.json and looks, stream by stream, for the kinds of defect that
have actually reached readers: characters from the wrong script (a legacy-font conversion put
Malayalam digits where the anusvara belongs), footnote numbers left inside verse lines, joiners
in impossible places, dependent vowel signs with no consonant to sit on, empty or duplicated
lines, unbalanced quotes, and missing credits.

    py build/lint_data.py            # writes build/lint_report.md, prints a summary
    py build/lint_data.py --strict   # exit 1 when any error-severity finding exists

build_data.py calls run_lint() at the end of every build; findings never stop the build unless
--strict is used, so known source defects (the Sanskrit footnote digits) are reported, not hidden.
"""
import json, re, sys, unicodedata, collections
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / "data"

# Unicode blocks a stream is allowed to use, keyed by the `script` field in meta.languages.
BLOCKS = {
    "Tamil":        [(0x0B80, 0x0BFF)],
    "Latin":        [(0x0041, 0x005A), (0x0061, 0x007A), (0x00C0, 0x024F), (0x1E00, 0x1EFF), (0x02B0, 0x02FF), (0x0300, 0x036F)],
    "Bengali":      [(0x0980, 0x09FF)],
    "Devanagari":   [(0x0900, 0x097F), (0xA8E0, 0xA8FF), (0x1CD0, 0x1CFF)],
    "Gujarati":     [(0x0A80, 0x0AFF)],
    "Gurmukhi":     [(0x0A00, 0x0A7F)],
    "Kannada":      [(0x0C80, 0x0CFF)],
    "Malayalam":    [(0x0D00, 0x0D7F)],
    "Odia":         [(0x0B00, 0x0B7F)],
    "Telugu":       [(0x0C00, 0x0C7F)],
    "Arabic":       [(0x0600, 0x06FF), (0x0750, 0x077F), (0x08A0, 0x08FF), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF)],
    "Meetei Mayek": [(0xABC0, 0xABFF), (0xAAE0, 0xAAFF)],
}
# Characters any stream may carry: ASCII punctuation and digits, general punctuation, dandas, spaces.
COMMON = [(0x0020, 0x0040), (0x005B, 0x0060), (0x007B, 0x007E), (0x00A0, 0x00BF), (0x2000, 0x206F), (0x0964, 0x0965), (0x00D7, 0x00D7), (0x2190, 0x21FF), (0x2500, 0x25FF), (0x0300, 0x036F)]
VIRAMA = {0x0BCD, 0x094D, 0x09CD, 0x0ACD, 0x0A4D, 0x0CCD, 0x0D4D, 0x0B4D, 0x0C4D}
BAD_POINTS = {0xFFFD: "replacement character", 0x00AD: "soft hyphen", 0x200B: "zero-width space", 0xFEFF: "byte-order mark",
              0x0D44: "Malayalam vocalic RR sign", 0x0D60: "Malayalam letter vocalic RR", 0x0D71: "Malayalam number one hundred"}
SEVERITY = {"foreign-script": "error", "bad-codepoint": "error", "mark-order": "error", "latin-in-line": "warn", "joiner": "warn",
            "digit-in-line": "warn", "empty-line": "warn", "duplicate": "warn", "unbalanced": "warn",
            "whitespace": "info", "credit": "error", "coverage": "info"}
PAIRS = [("“", "”"), ("‘", "’"), ("(", ")"), ("[", "]")]


def in_ranges(cp, ranges):
    return any(a <= cp <= b for a, b in ranges)


def lint_text(text, script, findings, add):
    """Character-level checks on one line of one stream."""
    allowed = BLOCKS.get(script, []) + COMMON
    joiner_ok = script not in ("Arabic", "Latin")
    prev = ""
    for i, ch in enumerate(text):
        cp = ord(ch)
        if cp in BAD_POINTS:
            add("bad-codepoint", f"U+{cp:04X} {BAD_POINTS[cp]} at {i}")
        elif cp in (0x200C, 0x200D):
            if joiner_ok and ord(prev) not in VIRAMA if prev else True:
                add("joiner", f"{'ZWJ' if cp == 0x200D else 'ZWNJ'} not after a virama at {i}: …{text[max(0, i-6):i+4]}…")
        elif unicodedata.category(ch) == "Nd":
            add("digit-in-line", f"digit {ch!r} inside the line: …{text[max(0, i-8):i+6]}…")
        elif cp in (0x200E, 0x200F) or 0x202A <= cp <= 0x202E:
            if script != "Arabic":
                add("bad-codepoint", f"bidi mark U+{cp:04X} in a {script} line at {i}")
        elif unicodedata.category(ch) in ("Cc", "Cf", "Co") and ch not in "\n\t":
            add("bad-codepoint", f"U+{cp:04X} {unicodedata.name(ch, 'control/format')} at {i}")
        elif not in_ranges(cp, allowed) and unicodedata.category(ch)[0] in ("L", "M", "N"):
            if script != "Latin" and cp < 0x0250:   # an ASCII/Latin letter inside an Indic line: a gloss, a stray danda, an editor's note
                add("latin-in-line", f"{ch!r} in a {script} line: …{text[max(0, i-8):i+8]}…")
            else:
                add("foreign-script", f"{ch!r} U+{cp:04X} {unicodedata.name(ch, '?')} in a {script} line: …{text[max(0, i-8):i+8]}…")
        # a dependent sign (vowel sign / virama / anusvara) must sit on a letter or another sign
        if unicodedata.category(ch) in ("Mn", "Mc") and script not in ("Latin", "Arabic"):
            if not prev or unicodedata.category(prev)[0] not in ("L", "M") and prev not in ("‍", "‌"):
                add("mark-order", f"{unicodedata.name(ch, '?')} with no base letter at {i}: …{text[max(0, i-6):i+6]}…")
            elif ord(prev) in VIRAMA and ord(ch) in VIRAMA:
                add("mark-order", f"double virama at {i}: …{text[max(0, i-6):i+6]}…")
        prev = ch
    if "  " in text or text != text.strip() or " " in text or "\t" in text:
        add("whitespace", "double, leading/trailing, non-breaking or tab whitespace")
    for a, b in PAIRS:
        if text.count(a) != text.count(b):
            add("unbalanced", f"{a}{b} unbalanced")


def run_lint(out_dir=OUT, report_path=None, strict=False, examples=6):
    out_dir = Path(out_dir)
    meta = json.loads((out_dir / "meta.json").read_text(encoding="utf-8"))
    langs = meta["languages"]
    findings = []  # (code, kind, kural, detail)

    def adder(code, n):
        def add(kind, detail):
            findings.append((code, kind, n, detail))
        return add

    prev_lines = {}
    for p in sorted((out_dir / "ch").glob("*.json")):
        ch = json.loads(p.read_text(encoding="utf-8"))
        for k in ch["kurals"]:
            n = k["n"]
            # the Tamil original
            add = adder("ta", n)
            for line in (k["l1"], k["l2"]):
                lint_text(line, "Tamil", findings, add)
            if not k["l1"] or not k["l2"]:
                add("empty-line", "original has an empty line")
            # every translation stream
            for code, lines in k.get("tr", {}).items():
                add = adder(code, n)
                L = langs.get(code, {})
                script = L.get("script", "Latin")
                a, b = (lines + ["", ""])[:2]
                for line in (a, b):
                    if line:
                        lint_text(line, script, findings, add)
                if not a:
                    add("empty-line", "first line empty")
                elif L.get("kind") == "verse" and not b:
                    add("empty-line", "verse stream with an empty second line")
                if a and a == b:
                    add("duplicate", "both lines identical")
                key = (code, a)
                if a and prev_lines.get(code) == a:
                    add("duplicate", "first line identical to the previous kural's")
                prev_lines[code] = a
            # prose layers (Tamil உரை, English prose, retellings)
            for pcode, txt in (k.get("prose") or {}).items():
                if not txt:
                    continue
                script = "Tamil" if pcode.startswith("ta") else langs.get(pcode, {}).get("script", "Latin")
                lint_text(txt, script, findings, adder("prose:" + pcode, n))
    # credits and coverage
    for code, L in langs.items():
        if not (L.get("credit") or "").strip():
            findings.append((code, "credit", 0, "no credit line"))
        if L.get("coverage", 1330) < 1330:
            findings.append((code, "coverage", 0, f"{L['coverage']}/1330 kurals"))

    # summarise
    by = collections.defaultdict(lambda: collections.Counter())
    for code, kind, n, detail in findings:
        by[code][kind] += 1
    order = list(meta.get("langOrder", [])) + sorted(c for c in by if c not in meta.get("langOrder", []))
    lines = [f"# Data lint — build {meta.get('built')} · v{meta.get('version')}", "",
             f"{len(findings)} findings across {len(by)} streams. Severity: error = must fix, warn = check the source, info = cosmetic.", "",
             "| stream | " + " | ".join(SEVERITY) + " |", "|---|" + "---|" * len(SEVERITY)]
    for code in order:
        if code not in by:
            continue
        c = by[code]
        lines.append(f"| {code} | " + " | ".join(str(c.get(k, "")) for k in SEVERITY) + " |")
    lines += ["", "## Examples", ""]
    seen = collections.Counter()
    for code in order:
        for kind in SEVERITY:
            ex = [f for f in findings if f[0] == code and f[1] == kind][:examples]
            if not ex:
                continue
            lines.append(f"### {code} · {kind} ({SEVERITY[kind]}) · {by[code][kind]}")
            for _, _, n, detail in ex:
                lines.append(f"- K{n}: {detail}")
            lines.append("")
    report = "\n".join(lines)
    report_path = Path(report_path) if report_path else HERE / "lint_report.md"
    report_path.write_text(report, encoding="utf-8")
    errors = sum(1 for f in findings if SEVERITY.get(f[1]) == "error")
    warns = sum(1 for f in findings if SEVERITY.get(f[1]) == "warn")
    print(f"lint: {errors} errors, {warns} warnings, {len(findings) - errors - warns} info → {report_path}")
    for code in order:
        if code in by and any(SEVERITY.get(k) == "error" for k in by[code]):
            print("  " + code + ": " + ", ".join(f"{k}={v}" for k, v in by[code].items() if SEVERITY.get(k) == "error"))
    if strict and errors:
        sys.exit(1)
    return findings


if __name__ == "__main__":
    run_lint(strict="--strict" in sys.argv)
