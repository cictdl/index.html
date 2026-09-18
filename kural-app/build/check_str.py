# -*- coding: utf-8 -*-
"""check_str.py — parity of the ex* / gx* STR keys between STR.ta and STR.en in app.js, plus every
literal t('ex…') / exF('ex…') / exE('ex…') key used in the code. Exit 1 on any gap.
Run:  py build/check_str.py"""
import re, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
src = (Path(__file__).resolve().parents[1] / 'app.js').read_text(encoding='utf-8')
i_ta = src.index('const STR = {\n  ta: {'); i_en = src.index('\n  en: {', i_ta); i_end = src.index('\n};', i_en)
KEY = re.compile(r"""(?:^|[\s,{])([A-Za-z_][\w]*|'[^'\n]+')\s*:\s*['"`]""", re.M)
def keys(block): return {k.strip("'") for k in KEY.findall(block)}
ta, en = keys(src[i_ta:i_en]), keys(src[i_en:i_end])
want = lambda s: {k for k in s if re.match(r'(ex|gx)[A-Z]', k)}
used = set(re.findall(r"""\b(?:t|exF|exE)\(\s*'((?:ex|gx)[A-Z][\w]*)'\s*[,)]""", src))   # 'exT_' + code prefixes are dynamic
miss_en, miss_ta = want(ta) - en, want(en) - ta
miss_use = used - (ta & en)
for k in sorted(miss_en): print('missing in STR.en:', k)
for k in sorted(miss_ta): print('missing in STR.ta:', k)
for k in sorted(miss_use): print('used but not defined in both:', k)
print(f'ex/gx keys: ta {len(want(ta))} · en {len(want(en))} · literal uses {len(used)} · missing {len(miss_en) + len(miss_ta) + len(miss_use)}')
sys.exit(1 if (miss_en or miss_ta or miss_use) else 0)
