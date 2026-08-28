# -*- coding: utf-8 -*-
"""fetch_fonts.py — self-host the Noto faces the app needs, so the 22 scripts
render correctly with no network at all.

Downloads woff2 subsets from Google Fonts (OFL) into assets/fonts/ and writes
assets/fonts.css with rewritten, relative @font-face URLs.

Run:  py build/fetch_fonts.py
"""
import re, sys, urllib.request, urllib.parse
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "fonts"
OUT.mkdir(parents=True, exist_ok=True)

# Chrome UA so the API serves woff2 rather than ttf.
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/126.0.0.0 Safari/537.36")

FAMILIES = [
    ("Noto Sans Tamil", "wght@400;500;700"),        # source language — needs the full range
    ("Noto Serif Tamil", "wght@500;700"),           # the couplet face
    ("Noto Sans Devanagari", "wght@400;700"),       # hi, mr, ne, sa, doi, bho, mai, sd, ks, brx, gom, sat
    ("Noto Sans Bengali", "wght@400;700"),          # bn, as, mni
    ("Noto Sans Gujarati", "wght@400"),
    ("Noto Sans Gurmukhi", "wght@400"),             # pa
    ("Noto Sans Kannada", "wght@400"),              # kn, kok
    ("Noto Sans Malayalam", "wght@400"),
    ("Noto Sans Oriya", "wght@400"),                # or
    ("Noto Sans Telugu", "wght@400"),
    ("Noto Sans Meetei Mayek", "wght@400"),         # mei
    ("Noto Naskh Arabic", "wght@400"),              # ur, ksn fallback
    ("Noto Nastaliq Urdu", "wght@400"),             # ur, ksn preferred
]

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def main():
    css_parts, seen, total = [], {}, 0
    for fam, axis in FAMILIES:
        q = urllib.parse.quote(fam).replace("%20", "+")
        url = f"https://fonts.googleapis.com/css2?family={q}:{axis}&display=swap"
        css = get(url).decode("utf-8")
        n_before = len(seen)
        def sub(m):
            nonlocal total
            src = m.group(1)
            name = src.rsplit("/", 1)[-1].split("?")[0]
            stem = re.sub(r"[^A-Za-z0-9._-]", "", fam.replace(" ", "")) + "-" + name
            if stem not in seen:
                data = get(src)
                (OUT / stem).write_bytes(data)
                seen[stem] = len(data)
                total += len(data)
            return f"url(fonts/{stem})"
        css = re.sub(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", sub, css)
        css_parts.append(f"/* {fam} */\n" + css.strip())
        print(f"{fam:26} {len(seen)-n_before:2} files")
    header = ("/* Self-hosted Noto subsets (SIL Open Font License 1.1) — fetched by\n"
              "   build/fetch_fonts.py so every one of the 22 scripts renders offline. */\n")
    (ROOT / "assets" / "fonts.css").write_text(header + "\n\n".join(css_parts) + "\n", encoding="utf-8")
    print(f"\n{len(seen)} files, {total/1024:.0f} KB → {OUT}")

if __name__ == "__main__":
    main()
