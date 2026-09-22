# -*- coding: utf-8 -*-
"""check_str.py — every STR key exists in STR.ta, STR.en and STR.hi in app.js, and every literal
t('ex…') / exF('ex…') / exE('ex…') key used in the code is defined in all three. Exit 1 on any gap.
Run:  py build/check_str.py"""
import re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
src = (Path(__file__).resolve().parents[1] / 'app.js').read_text(encoding='utf-8')
i_ta = src.index('const STR = {\n  ta: {'); i_en = src.index('\n  en: {', i_ta); i_hi = src.index('\n  hi: {', i_en); i_end = src.index('\n};', i_hi)
KEY = re.compile(r"""(?:^|[\s,{])([A-Za-z_][\w]*|'[^'\n]+')\s*:\s*['"`]""", re.M)
def keys(block): return {k.strip("'") for k in KEY.findall(block)}
ta, en, hi = keys(src[i_ta:i_en]), keys(src[i_en:i_hi]), keys(src[i_hi:i_end])
allk = ta | en | hi
used = set(re.findall(r"""\b(?:t|exF|exE)\(\s*'((?:ex|gx)[A-Z][\w]*)'\s*[,)]""", src))
gaps = [(n, k) for n, s in (('ta', ta), ('en', en), ('hi', hi)) for k in sorted(allk - s)] + [('used', k) for k in sorted(used - (ta & en & hi))]
for n, k in gaps: print(f'missing in {n}:', k)
print(f'STR keys: ta {len(ta)} · en {len(en)} · hi {len(hi)} · literal ex/gx uses {len(used)} · gaps {len(gaps)}')
sys.exit(1 if gaps else 0)
