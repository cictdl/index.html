# -*- coding: utf-8 -*-
r"""build_exam.py: the build-time bank for தேர்வுப் பயிற்சி (exam practice).

Reads data/gr/*.json and data/ch/*.json (plus build/exam_block.json) and writes
data/ex.json. Every eligibility decision is made here; the JS only samples, renders and
grades. The contract is the v1 build spec (exam-spec.md, sections 0.1 A-C, 2, 4.1, 4.6,
5.1-5.4, 5.7, 6.3, 8).

Run:   py build/build_exam.py            build data/ex.json, print counts, run all asserts
       py build/build_exam.py --audit    also write build/exam_audit.tsv (25 seeded rows/drill)
Exit code is non-zero if any section 8 test-2 assertion (a)-(n) fails.

After every regeneration: bump DATA_REV in sw.js, rebuild single-file and Android.

=====================================================================================
data/ex.json  (compact JSON, ensure_ascii=False, separators=(',',':'))
=====================================================================================
{ "v":1, "rev":"<12 hex>", "built":"<ISO UTC>",
  "conf":{"lo":70,"hi":80,"floor":30,"skillMin":20},
  "sets":{...}, "items":{...}, "counts":{...}, "off":[codes],
  "doff":[drill codes], "corr":["n.w", ...] }

rev   sha1 (first 12 hex) over the bytes of data/gr/*.json, data/ch/*.json (sorted),
      build/exam_block.json and this script. Stored into S.ex.cur.rev.
off   item codes withdrawn through build/exam_block.json "items" (the JS treats them
      like S.ex.off). Codes that address a bank row directly are ALSO removed from items.
doff  (extension) drill codes withdrawn through exam_block.json "drills". For drills with
      their own items list the list is also emptied; for the metre forms that share "mt"
      (sa, sn, sf, th, al) and the td kinds this list is the only signal, so the JS must
      skip any drill form whose code is in doff.
corr  (extension) "n.w" (kural.wordIndex) of words named ONLY by clear (correction) flags,
      restricted to words used by some item. The JS shows exCorrNote for these. It is
      not in the spec schema; it saves the JS from re-implementing the flag classifier.

-------------------------------------------------------------------------------------
sets  (all "key" and "allow"/"twin" values below are INDEXES into these arrays; the
       strings are the raw data tags, which the JS maps to EXN display labels)
-------------------------------------------------------------------------------------
cat ["பெயர்","வினை","இடை","உரி"]                           (sv, fixed display order)
pv  ["பொருட்பெயர்","இடப்பெயர்","காலப்பெயர்","சினைப்பெயர்","பண்புப்பெயர்","தொழிற்பெயர்"]
ec  ["பெயரெச்சம்","வினையெச்சம்","எதிர்மறைபெயரெச்சம்","எதிர்மறைவினையெச்சம்"]
vm  ["தெரிநிலைவினைமுற்று","குறிப்புவினைமுற்று","எதிர்மறைவினைமுற்று",
     "வியங்கோள்வினைமுற்று","வினையாலணையும்பெயர்","தொழிற்பெயர்"]
ti  ["உயர்திணை","அஃறிணை"]          pa ["ஆண்பால்","பெண்பால்","பலர்பால்","ஒன்றன்பால்","பலவின்பால்"]
en  ["ஒருமை","பன்மை"]               id ["தன்மை","முன்னிலை","படர்க்கை"]
vt  [2,3,4,5,6,7]                   (case numbers; key/allow index into this)
ur  ["ஐ","ஆல்","ஆன்","ஒடு","ஓடு","கு","இன்","இல்","கண்","உள்"]   (the உருபு)
urw ["ை","ால்","ான்","ொடு","ோடு","கு","ின்","ில்","கண்","ுள்"]    (its written tail)
tg  ["வேற்றுமைத்தொகை","வினைத்தொகை","பண்புத்தொகை","உவமைத்தொகை","உம்மைத்தொகை"]
an  ["உவமை","எடுத்துக்காட்டுவமை","உருவகம்"]
vp  ["தேமா","புளிமா","கூவிளம்","கருவிளம்","தேமாங்காய்","புளிமாங்காய்","கூவிளங்காய்","கருவிளங்காய்"]
    (indexes 0-3 are the 2-அசை names, 4-7 the 3-அசை names: "size" for the sn option rule)
fn  ["நாள்","மலர்","காசு","பிறப்பு"]
th  ["இயற்சீர் வெண்டளை","வெண்சீர் வெண்டளை","நேரொன்றிய ஆசிரியத்தளை",
     "நிரையொன்றிய ஆசிரியத்தளை","கலித்தளை"]
    th near-miss by the FIRST foot's class: மா -> 2, விளம் -> 3, காய் -> 4.

Common field meanings
  n    kural number 1..1330
  w    word index in gr kurals[n].words (== printed token index over l1 tokens then l2
       tokens; every word item is in an aligned couplet)
  c    component index in words[w].c
  cf   Math.round(conf*100) (integer). Word-level items (vt two-part, tg, pr) use the
       minimum over the parts. Levels 1-3 ask cf >= 80, level 0 asks cf >= 70.
  fp   fnv1a(tWord(x)) & 0xffff, fnv1a over CODE POINTS (h=0x811c9dc5; h^=cp;
       h=Math.imul(h,0x01000193)>>>0). x = c.s for component items (sv pv ec vm tp sl),
       x = the printed token (gr words[w].w) for word-level items (vt tg pr),
       x = the printed line (ch l1 or l2, whole line) for td. Test vector printed by the
       build: fnv1a('அகர') & 0xffff.
  allow / twin / tgt / off   bitmasks: bit i set = element i of the named set / token i.

-------------------------------------------------------------------------------------
items (array positions; codes in section 4.1 format)
-------------------------------------------------------------------------------------
sv  [n, w, c, key, cf, fp]                    code sv:n.w.c   key -> sets.cat
    Options: all 4 of sets.cat always, fixed order. (Build guarantees the form carries no
    other cat anywhere in the corpus, at any conf.)
pv  [n, w, c, key, cf, fp, allow]             code pv:n.w.c   key/allow -> sets.pv
    Options: key + up to 3 picked (seeded) from allow, shown in set order. popcount(allow)>=2.
ec  [n, w, c, key, cf, fp, allow]             code ec:n.w.c   key/allow -> sets.ec
    allow already excludes the positive supertype of a negative key; popcount(allow)>=2,
    so 3 or 4 options: key + min(3, popcount) from allow, fixed order.
    Exam line: key==2 (எதிர்மறைபெயரெச்சம்) and form ends in "ா" -> "ஈறுகெட்ட ..." wording.
vm  [n, w, c, key, cf, fp, allow, twin]       code vm:n.w.c   key/allow/twin -> sets.vm
    Pool = allow | (cf >= 80 ? twin : 0). Options: key + 3 from pool (seeded), fixed order;
    popcount(allow) >= 2 always, so never fewer than 3 options.
fd  [n, set, key, cf, tgt, off]               code fd:n.<set><key>  e.g. fd:12.e1
    set "e" -> sets.ec, "v" -> sets.vm; key = ilk index. tgt = bitmask of target tokens
    (1 or 2 bits); off = bitmask of disabled/dashed tokens; every other token is a
    tappable non-target (>= 3 of them). cf = min over the targets.
tp  [n, w, c, ti, pa, en, id, cf, fp, vik]    code tp:n.w.c
    ti/pa/en/id -> sets.ti/pa/en/id (id is always 2 = படர்க்கை). vik = the விகுதி string
    for exR_tp (e.g. "அர்"), or "" for a demonstrative (DEM) form -> "சுட்டுப்பெயர் {w}".
    Rows show the full closed sets.
vt  [n, w, key, cf, fp, ur, allow]            code vt:n.w     key/allow -> sets.vt
    ur -> sets.ur / sets.urw (the ending; the token ends with urw[ur], bold it).
    popcount(allow) >= 3; options = key + 3 from allow (seeded), shown 2..7 order.
tg  [n, w, key, cf, fp, caseNo]               code tg:n.w     key -> sets.tg
    Options: key + 3 of the other 4 in sets.tg (seeded), fixed order; the token carries no
    other tokai anywhere. caseNo = 2..7 (show "{ordinal} வேற்றுமைத் தொகை" as information)
    or 0 (show exTgNoNum when key is வேற்றுமைத்தொகை).
pr  [n, w, cf, fp, A, B, stem, [d1, d2, ...], tail, nx]      code pr:n.w
    Answer "A + B". d* are decoy strings already formatted "X + Y", in preference order,
    >= 2 of them; use d1 and d2 (the first two). Shuffle the 3 options with the seeded rnd.
    stem = the asked form (printed token, stripped of a doubled final hard consonant when
    one was removed); tail = that removed consonant with pulli (e.g. "க்") or "";
    nx = the next printed token (stripPunct) when tail is set, else "".
an  [n, key, mark]                            code an:n       key -> sets.an
    Options: all 3, fixed order. mark = the token index (0..) holding the comparison word
    for உவமை, else -1.
mt  [n, vp, th, ai, cf]   metre-clean couplet (one row; generates sa, sn, sf, th, al)
    vp = 7-char digit string: chars 0-5 index sets.vp for feet 0-5, char 6 indexes sets.fn
         (the final foot, keyed from yappu.eetru).
    th = 6-char digit string, index into sets.th for junctions j=0..5: (0,1) (1,2) (2,3)
         in line 1, j=3 the line boundary (3,4), then (4,5) (5,6) in line 2.
    ai = bitmask over feet 0..6 of ஐ-sensitive feet: never an sa/sn/sf item; a non-zero
         ai bars the couplet from al.
    cf = Math.round(yappu.conf*100) (always >= 90).
    Codes: sa:n.s / sn:n.s (s = 0..5, bit s of ai clear; the form is chosen at session
    build from exEff(vp:X)), sf:n (bit 6 clear), th:n.j (j = 0..5), al:n (ai == 0).
    Feet, அசை segments and names are recomputed from ch yappu at render (stale guard).
td  [n, li, kind, tgt, off, fp]               code td:n.li.kind   e.g. td:1.0.m
    li = 0 or 1 (line l1 / l2); kind "m" (மோனை) or "e" (எதுகை); tgt / off are bitmasks
    over THAT LINE's printed tokens. Token 0 is the anchor: it is never in tgt or off
    (render it marked and disabled). off = D tokens (disabled, dashed). Others tappable.
sl  [n, w, c, cf, fp, [p1, p2, p3]]           code sl:n.w.c
    The key gloss is gr kurals[n].words[w].c[c].gloss, cleaned; each p is packed
    n*100 + w*10 + c pointing to a distractor component in the SAME chapter (so the same
    gr file). Clean every gloss exactly as the build does:
        g.replace(/\(.*?\)|\[.*?\]/g,'').replace(/\s+/g,' ') then trim spaces, commas
        and semicolons from both ends.
    Word-record key for S.ex.w: tWord(c.s) minus a trailing hard consonant+pulli
    ([கசடதபற]்).

counts  {"<drill>":{"lo":n,"hi":n}} book-wide, for sv pv ec vm fd tp vt tg pr sl; and
        for drills with no per-item confidence lo == hi: an, mt (couplets), sr (sa/sn
        feet), sf, th, al, td_m, td_e.
"""
import sys, json, re, glob, hashlib, collections, random, unicodedata, datetime, os
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
BUILD = ROOT / 'build'
BLOCK_FILE = BUILD / 'exam_block.json'
OUT = DATA / 'ex.json'
AUDIT = BUILD / 'exam_audit.tsv'

FAILS = []
def check(cond, msg):
    if not cond:
        FAILS.append(msg)
    return cond

# ------------------------------------------------------------------ text helpers
def fnv1a(s):
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xffffffff
    return h

ZW = re.compile('[​-‍﻿]')
JS_PUNCT = re.compile(r"[.,;:!?'\"“”‘’()\[\]{}।॥|\-–—]")
def js_tword(s):
    """Python mirror of app.js tWord (norm -> stripPunct -> drop whitespace), Tamil text."""
    s = ZW.sub('', unicodedata.normalize('NFC', str(s or ''))).lower()
    s = JS_PUNCT.sub(' ', s)
    return re.sub(r'\s+', '', s)
def js_strip(s):
    s = ZW.sub('', unicodedata.normalize('NFC', str(s or ''))).lower()
    return re.sub(r'\s+', ' ', JS_PUNCT.sub(' ', s)).strip()

TA = re.compile(r'[஀-௿]+')
def tw(s): return ''.join(TA.findall(unicodedata.normalize('NFC', s or '')))
GRA = re.compile(r'[ஃஅ-ஹ][ா-்ௗ]*')
def gr_(s): return GRA.findall(tw(s))
def bare_cons(g): return len(g) == 1 and 'க' <= g <= 'ஹ'
def fp_of(x):
    t = js_tword(x)
    check(t == tw(x), f'fp input is not pure Tamil: {x!r}')
    return fnv1a(t) & 0xffff
def js_round100(x): return int((x * 100) + 0.5) if x >= 0 else round(x * 100)
def popcount(m): return bin(m).count('1')
def mask(idxs):
    m = 0
    for i in idxs: m |= 1 << i
    return m

VALL = 'கசடதபற'
BADINIT = set('டணரலழளறன')

# ------------------------------------------------------------------ load
GR, CH = {}, {}
for f in sorted(glob.glob(str(DATA / 'gr' / '*.json'))):
    for n, k in json.load(open(f, encoding='utf-8'))['kurals'].items(): GR[int(n)] = k
for f in sorted(glob.glob(str(DATA / 'ch' / '*.json'))):
    for k in json.load(open(f, encoding='utf-8'))['kurals']: CH[k['n']] = k
assert len(GR) == 1330 and len(CH) == 1330, (len(GR), len(CH))

if not BLOCK_FILE.exists():
    BLOCK_FILE.write_text(json.dumps({"drills": [], "items": [], "kurals": [412, 934, 1117]}, ensure_ascii=False) + '\n', encoding='utf-8')
BLOCK = json.load(open(BLOCK_FILE, encoding='utf-8'))
BLOCK_K = set(int(x) for x in BLOCK.get('kurals') or [])
BLOCK_D = set(BLOCK.get('drills') or [])
BLOCK_I = list(BLOCK.get('items') or [])

def chap(n): return (n - 1) // 10
TOK = {n: CH[n]['l1'].split() + CH[n]['l2'].split() for n in CH}
LINES = {n: (CH[n]['l1'].split(), CH[n]['l2'].split()) for n in CH}

# ------------------------------------------------------------------ 5.4 orthography lint
big = collections.Counter()
for k in CH.values():
    for m in re.finditer(r'([க-ஹ])்([க-ஹ])', k['l1'] + ' ' + k['l2']): big[m.group(1) + m.group(2)] += 1
ASSIGNED = set(chr(c) for c in list(range(0x0B82, 0x0B84)) + list(range(0x0B85, 0x0B8B)) + list(range(0x0B8E, 0x0B91)) + list(range(0x0B92, 0x0B96)) + [0x0B99, 0x0B9A, 0x0B9C, 0x0B9E, 0x0B9F, 0x0BA3, 0x0BA4, 0x0BA8, 0x0BA9, 0x0BAA] + list(range(0x0BAE, 0x0BBA)) + list(range(0x0BBE, 0x0BC3)) + list(range(0x0BC6, 0x0BC9)) + list(range(0x0BCA, 0x0BCE)) + [0x0BD7])
ORTHO = set()
for n, k in CH.items():
    t = k['l1'] + k['l2']
    if any('஀' <= ch <= '௿' and ch not in ASSIGNED for ch in t): ORTHO.add(n); continue
    if re.search(r'்[ா-ௌ]', t): ORTHO.add(n); continue
    if any(big[m.group(1) + m.group(2)] <= 2 for m in re.finditer(r'([க-ஹ])்([க-ஹ])', t)): ORTHO.add(n)
EXCL = ORTHO | BLOCK_K          # excluded from ALL drills

# ------------------------------------------------------------------ 5.3 alignment
ALIGNED = set()
for n, g in GR.items():
    T = TOK[n]; W = g['words']
    if len(T) == len(W) and all(tw(w['w']) == tw(T[i]) for i, w in enumerate(W)): ALIGNED.add(n)

# ------------------------------------------------------------------ 5.2 flags
HEDGE = re.compile(r'ஐயம்|ஐயத்|ஐயப்|ஊகம்|கொள்ளலாம்|கொள்ளக்கூடும்|கொள்வர்|என்பாரும்|எனவும்|சரிபார்|உறுதிசெய்|சாத்திய|வாதிட|விவாத|கருதலாம்|ஆகலாம்|பகுக்கலாம்|எனலாம்|அல்லது|மாற்று|மரபும்|சிலர்|தோராய|இருபொருள்|என்பர்|\bvs\b|\bor\b|\balt\b|could|possib|alternat|ambig|uncertain|unclear|tentativ|approx|debat|disput|contest|arguab|perhaps|probab|may be|might|either|confirm|check|scholar|review|moderate|\blow\b|\?', re.I)
CORR = re.compile(r're-?tagged|corrected|திருத்த|segmented out|now valid|changed (to|from)|was wrongly', re.I)
VOCAB = set()
for g in GR.values():
    for w in g['words']:
        for c in w['c']:
            for v in [c.get('ilk'), c.get('cat'), w.get('togai'), c.get('todar')] + list((c.get('feat') or {}).values()):
                if isinstance(v, str): VOCAB.add(tw(v))
    for a in g.get('ani') or []: VOCAB.add(tw(a['name']))
VOCAB |= set('என உரை குறள் சீர் சொல் வேற்றுமை எழுவாய் பெயர் வினை இடை உரி தொகை அணி இங்கு இது அது உம்மை ஏகாரம்'.split())
VOCAB.discard('')
def names(w):
    s = {tw(w['w']), re.sub(r'[கசதபஞங]்$', '', tw(w['w']))}
    for c in w['c']:
        if len(gr_(c['s'])) >= 2: s.add(tw(c['s']))
        head = re.split(r'[+( ]', c.get('split') or '')[0]
        if len(gr_(head)) >= 3: s.add(tw(head))
    return {x for x in s if len(gr_(x)) >= 2}
DOUBTW = collections.defaultdict(set); BLOCKED = set(); CLEARW = collections.defaultdict(set)
NFLAG = NBLOCKING = 0
for n, g in GR.items():
    W = g['words']; nm = [names(w) for w in W]
    for fl in g.get('flags') or []:
        NFLAG += 1
        blocking = bool(HEDGE.search(fl)) or not CORR.search(fl)
        NBLOCKING += blocking
        fws = [x for x in TA.findall(unicodedata.normalize('NFC', fl)) if x not in VOCAB]
        hit = set()
        for i, ns in enumerate(nm):
            for fw in fws:
                if fw in ns or any(len(gr_(min(fw, x, key=len))) >= 3 and (x.startswith(fw) or fw.startswith(x)) for x in ns):
                    hit.add(i); break
        if blocking:
            DOUBTW[n] |= hit
            if not hit: BLOCKED.add(n)
        else:
            CLEARW[n] |= hit

def couplet_ok(n): return n in ALIGNED and n not in BLOCKED and n not in EXCL
# A சீர் that only continues the word before it: that word's parts spell more than its printed சீர், and
# this one starts with the overflow ('பொருள்வைப் புழி' = பொருள் + வைப்பு + உழி, K226). The layer even glosses
# புழி as 'place', but it is not a word a learner can be asked about. 43 in the book.
CONT = set()
for _n, _g in GR.items():
    _W = _g['words']
    for _i in range(len(_W) - 1):
        _t = tw(_W[_i]['w']); _j = tw(''.join(c['s'] for c in _W[_i]['c']))
        if len(_j) > len(_t) and _j.startswith(_t) and tw(_W[_i + 1]['w']).startswith(_j[len(_t):]): CONT.add((_n, _i + 1))
def wordok(n, wi): return couplet_ok(n) and wi not in DOUBTW[n] and (n, wi) not in CONT

# ------------------------------------------------------------------ form indexes
FORM = collections.defaultdict(lambda: collections.defaultdict(set))      # conf >= 0.70
FORMALL = collections.defaultdict(lambda: collections.defaultdict(set))   # any conf
ALLFORMS = set()                                                            # every c.s form
for n, g in GR.items():
    for w in g['words']:
        tok = tw(w['w'])
        for c in w['c']:
            f = tw(c['s']); ALLFORMS.add(f)
            for F in ([FORM[f], FORMALL[f]] if c['conf'] >= 0.7 else [FORMALL[f]]):
                F['cat'].add(c['cat']); F['ilk'].add(c['ilk'])
                for kk in ('thinai', 'paal', 'eN'):
                    if (c.get('feat') or {}).get(kk): F[kk].add(c['feat'][kk])
            if w.get('togai') and len(w['c']) >= 2:
                FORMALL[tok]['togai'].add(w['togai'])
                if c['conf'] >= 0.7: FORM[tok]['togai'].add(w['togai'])
            v = c.get('vet') or {}
            if isinstance(v.get('number'), int): FORMALL[tok]['vet'].add(v['number'])

def fragment(c, tok):
    g0 = gr_(tok)
    if not g0 or g0[0][0] in BADINIT: return True
    sp = c.get('split') or ''
    if sp.startswith('('): return True
    head = tw(re.split(r'[+( ]', sp)[0])
    if len(head) > len(tw(c['s'])) and head.endswith(tw(c['s'])) and not head.startswith(tw(c['s'])): return True
    if re.search(r'[ஙஞநவ]்$', tw(c['s'])): return True
    hg = gr_(head)   # DH-10: the split starts with another letter than the printed சீர் (வற்றை, split அவை+ஐ)
    cg = gr_(c['s'])   # only the component that begins the printed சீர் (not the தாள் of நற்றாள்)
    if hg and cg and cg[0][0] == g0[0][0] and hg[0][0] != g0[0][0]: return True
    return False
def whole(n, wi):
    w = GR[n]['words'][wi]
    if len(w['c']) != 1: return None
    c = w['c'][0]
    if tw(c['s']) != tw(w['w']) or fragment(c, w['w']): return None
    return c
def lastword(n, wi): return wi == len(GR[n]['words']) - 1

# ------------------------------------------------------------------ sets
SETS = {
    'cat': ['பெயர்', 'வினை', 'இடை', 'உரி'],
    'pv': ['பொருட்பெயர்', 'இடப்பெயர்', 'காலப்பெயர்', 'சினைப்பெயர்', 'பண்புப்பெயர்', 'தொழிற்பெயர்'],
    'ec': ['பெயரெச்சம்', 'வினையெச்சம்', 'எதிர்மறைபெயரெச்சம்', 'எதிர்மறைவினையெச்சம்'],
    'vm': ['தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'வியங்கோள்வினைமுற்று', 'வினையாலணையும்பெயர்', 'தொழிற்பெயர்'],
    'ti': ['உயர்திணை', 'அஃறிணை'],
    'pa': ['ஆண்பால்', 'பெண்பால்', 'பலர்பால்', 'ஒன்றன்பால்', 'பலவின்பால்'],
    'en': ['ஒருமை', 'பன்மை'],
    'id': ['தன்மை', 'முன்னிலை', 'படர்க்கை'],
    'vt': [2, 3, 4, 5, 6, 7],
    'ur': ['ஐ', 'ஆல்', 'ஆன்', 'ஒடு', 'ஓடு', 'கு', 'இன்', 'இல்', 'கண்', 'உள்'],
    'urw': ['ை', 'ால்', 'ான்', 'ொடு', 'ோடு', 'கு', 'ின்', 'ில்', 'கண்', 'ுள்'],
    'tg': ['வேற்றுமைத்தொகை', 'வினைத்தொகை', 'பண்புத்தொகை', 'உவமைத்தொகை', 'உம்மைத்தொகை'],
    'an': ['உவமை', 'எடுத்துக்காட்டுவமை', 'உருவகம்'],
    'vp': ['தேமா', 'புளிமா', 'கூவிளம்', 'கருவிளம்', 'தேமாங்காய்', 'புளிமாங்காய்', 'கூவிளங்காய்', 'கருவிளங்காய்'],
    'fn': ['நாள்', 'மலர்', 'காசு', 'பிறப்பு'],
    'th': ['இயற்சீர் வெண்டளை', 'வெண்சீர் வெண்டளை', 'நேரொன்றிய ஆசிரியத்தளை', 'நிரையொன்றிய ஆசிரியத்தளை', 'கலித்தளை'],
}
IDX = {k: {v: i for i, v in enumerate(a)} for k, a in SETS.items()}
ITEMS = {k: [] for k in ('sv', 'pv', 'ec', 'vm', 'fd', 'tp', 'vt', 'tg', 'pr', 'an', 'mt', 'td', 'sl')}
META = {}   # code -> dict(conf=raw float, ...) for asserts / audit
USED_WORDS = set()
def add_word_item(drill, code, row, conf, n, wi):
    ITEMS[drill].append(row); META[code] = {'drill': drill, 'conf': conf, 'n': n, 'w': wi, 'row': row}
    USED_WORDS.add((n, wi))

QUOT = {'என', 'என்று', 'எனின்'}

# ------------------------------------------------------------------ 2.1 sv
URI_WL = {'சால', 'உறு', 'தவ', 'நனி', 'கூர்', 'கழி', 'கடி', 'மா', 'விழு', 'வியன்'}
for n, g in GR.items():
    for wi, w in enumerate(g['words']):
        if not wordok(n, wi): continue
        c = whole(n, wi)
        if not c or c['conf'] < 0.7: continue
        f = tw(c['s'])
        if c['ilk'] in ('எதிர்மறைஇடை', 'வினையாலணையும்பெயர்') or f in QUOT: continue
        if c['cat'] not in IDX['cat']: continue
        if len(FORM[f]['cat']) > 1: continue
        if FORMALL[f]['cat'] != {c['cat']}: continue          # conservative: all 4 are shown
        if c['cat'] == 'உரி' and f not in URI_WL: continue
        if c['cat'] == 'பெயர்' and bare_cons(gr_(f)[-1]): continue
        if lastword(n, wi) and f.endswith('ல்') and c['ilk'] in ('தொழிற்பெயர்', 'வியங்கோள்வினைமுற்று'): continue
        add_word_item('sv', f'sv:{n}.{wi}.0', [n, wi, 0, IDX['cat'][c['cat']], js_round100(c['conf']), fp_of(c['s'])], c['conf'], n, wi)

# ------------------------------------------------------------------ 2.2 pv
MAI_WL = set('நன்மை தீமை பெருமை சிறுமை வெண்மை இனிமை மென்மை வன்மை தூய்மை வாய்மை செம்மை கருமை புதுமை பழமை இளமை முதுமை கொடுமை மடமை சீர்மை தண்மை வெம்மை நுண்மை திண்மை பொய்மை மெய்மை அருமை எளிமை வறுமை பொறுமை கீழ்மை மேன்மை உண்மை வலிமை மெலிமை நொய்மை கடுமை நெடுமை குறுமை நேர்மை பசுமை தொன்மை'.split())
STOP_PV = set('முன் பின் மேல் கீழ் இடத்து அகத்து இன்று அன்று இனி ஈண்டு ஆங்கு அங்கு இங்கு உழி எல்லாம் எல்லார் எல்லாரும் பிற பிறர் பிறன் ஒருவன் ஒருவர் நின் நீ யான் யாம் என் தன் தாம் தம் நாம் நம் எவன் யாது'.split())
TWIN_PV = {'பொருட்பெயர்': {'இடப்பெயர்', 'சினைப்பெயர்', 'பண்புப்பெயர்'}, 'இடப்பெயர்': {'பொருட்பெயர்'}, 'சினைப்பெயர்': {'பொருட்பெயர்'}, 'பண்புப்பெயர்': {'பொருட்பெயர்', 'தொழிற்பெயர்'}, 'தொழிற்பெயர்': {'பண்புப்பெயர்'}, 'காலப்பெயர்': set()}
for n, g in GR.items():
    for wi, w in enumerate(g['words']):
        if not wordok(n, wi): continue
        c = whole(n, wi)
        if not c or c['conf'] < 0.7 or c['ilk'] not in IDX['pv']: continue
        f = tw(c['s'])
        if c.get('vet') and c['vet'].get('number') not in (1, None): continue
        if '+' in (c.get('split') or '') and c['ilk'] != 'தொழிற்பெயர்': continue
        if FORM[f]['ilk'] != {c['ilk']}: continue
        if c['ilk'] == 'பண்புப்பெயர்' and f not in MAI_WL: continue
        if f in STOP_PV: continue
        if lastword(n, wi) and f.endswith('ல்'): continue
        allow = [v for v in SETS['pv'] if v != c['ilk'] and v not in TWIN_PV[c['ilk']] and v not in FORMALL[f]['ilk']]
        if len(allow) < 2: continue
        add_word_item('pv', f'pv:{n}.{wi}.0', [n, wi, 0, IDX['pv'][c['ilk']], js_round100(c['conf']), fp_of(c['s']), mask(IDX['pv'][v] for v in allow)], c['conf'], n, wi)

# ------------------------------------------------------------------ 2.5 ec / 2.10 vm
EC, VM = SETS['ec'], SETS['vm']
VERBFAM = set(EC + VM + ['ஏவல்வினைமுற்று'])
EC_SUPER = {'எதிர்மறைபெயரெச்சம்': 'பெயரெச்சம்', 'எதிர்மறைவினையெச்சம்': 'வினையெச்சம்'}
TENSE = re.compile(r'\+(ப்ப்|ப்|வ்|த்த்|த்|ந்த்|ட்|ற்|ன்ற்|இன்|கிறு|கின்று|கிற்)(\+|$| )')
NEG = re.compile(r'எதிர்மறை|\bnot\b|\bno\b|without|never|less\b|(?:^|\+|\s)(?:இல|அல்)', re.I)   # DH-04 அன்பு+இலன் 'loveless'
VM_TWIN = {'வினையாலணையும்பெயர்': {'தெரிநிலைவினைமுற்று'}, 'தெரிநிலைவினைமுற்று': {'வினையாலணையும்பெயர்', 'குறிப்புவினைமுற்று'}, 'குறிப்புவினைமுற்று': {'தெரிநிலைவினைமுற்று'}}
def vm_never(key, f):
    s = set()
    if key == 'எதிர்மறைவினைமுற்று': s |= {'தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று'}
    if f.endswith('து'):
        if key == 'வினையாலணையும்பெயர்': s.add('தொழிற்பெயர்')
        if key == 'தொழிற்பெயர்': s.add('வினையாலணையும்பெயர்')
    g = gr_(f)
    al_ = len(g) >= 2 and g[-1] == 'ல்' and bare_cons(g[-2])
    ka = g and g[-1] == 'க'
    if al_ or ka:
        if key == 'வியங்கோள்வினைமுற்று': s.add('தொழிற்பெயர்')
        if key == 'தொழிற்பெயர்': s.add('வியங்கோள்வினைமுற்று')
    return s
ECVM_ITEM = {}   # (n, wi) -> (drill, ilk, conf)
def NEGOPT(f, sp, gl):   # DH-01 the prohibitive -அற்க (செய்யற்க = செய் + அல் + க): an எதிர்மறை வியங்கோள் வினைமுற்று
    return bool(re.search(r'ற்க$', f)) and bool(re.search(r'அல்|அற்க', sp or '') or re.search(r'\bnot\b', gl or '', re.I))
def headok(n, wi):   # the word a பெயரெச்சம் qualifies: a confident noun that is not a seer-cut fragment (K845 கல்லாத + 'மேற்கொண்')
    nw = GR[n]['words'][wi]; c0 = nw['c'][0]
    return c0['cat'] == 'பெயர்' and c0['conf'] >= 0.7 and not fragment(c0, nw['w'])
for n, g in GR.items():
    W = g['words']
    for wi, w in enumerate(W):
        if not wordok(n, wi): continue
        c = whole(n, wi)
        if not c or c['conf'] < 0.7 or c['ilk'] not in VERBFAM: continue
        f = tw(c['s'])
        if len(FORM[f]['ilk']) > 1: continue
        if c['ilk'] in EC:
            if 'பெயரெச்ச' in c['ilk'] and (lastword(n, wi) or not headok(n, wi + 1)): continue
            if 'பெயரெச்ச' in c['ilk'] and re.search(r'\bthings?\b', c.get('gloss') or '', re.I): continue   # DH-05 பயனில = useless things, a noun
            allow = [v for v in EC if v != c['ilk'] and v != EC_SUPER.get(c['ilk']) and v not in FORMALL[f]['ilk']]
            if len(allow) < 2: continue
            add_word_item('ec', f'ec:{n}.{wi}.0', [n, wi, 0, IDX['ec'][c['ilk']], js_round100(c['conf']), fp_of(c['s']), mask(IDX['ec'][v] for v in allow)], c['conf'], n, wi)
            ECVM_ITEM[(n, wi)] = ('ec', c['ilk'], c['conf'])
        elif c['ilk'] in VM:
            sp = c.get('split') or ''; ft = c.get('feat') or {}
            if c['ilk'] == 'குறிப்புவினைமுற்று' and (NEG.search(sp + ' ' + (c.get('gloss') or '')) or ft.get('ethirmarai') or ft.get('etirmarai') or TENSE.search(sp)): continue
            if f.endswith('ும்') and c['ilk'] == 'தெரிநிலைவினைமுற்று' and not lastword(n, wi): continue
            if lastword(n, wi) and f.endswith('ல்'): continue
            if c['ilk'] == 'தொழிற்பெயர்' and re.search(r'should|\blet |must|may one', c.get('gloss') or '', re.I): continue
            if c['ilk'] == 'தெரிநிலைவினைமுற்று' and re.search(r'\bwho\b', c.get('gloss') or '', re.I): continue   # DH-03 'he who stood' = வினையாலணையும் பெயர்
            negopt = NEGOPT(f, sp, c.get('gloss'))
            if negopt and c['ilk'] == 'எதிர்மறைவினைமுற்று': continue   # DH-01 the -அற்க forms keep one key: வியங்கோள்
            nev = vm_never(c['ilk'], f); tw_ = VM_TWIN.get(c['ilk'], set())
            if negopt: nev = set(nev) | {'எதிர்மறைவினைமுற்று'}
            allow = [v for v in VM if v != c['ilk'] and v not in nev and v not in tw_ and v not in FORMALL[f]['ilk']]
            twin = [v for v in VM if v in tw_ and v not in nev and v not in FORMALL[f]['ilk']]
            if len(allow) < 2: continue
            add_word_item('vm', f'vm:{n}.{wi}.0', [n, wi, 0, IDX['vm'][c['ilk']], js_round100(c['conf']), fp_of(c['s']), mask(IDX['vm'][v] for v in allow), mask(IDX['vm'][v] for v in twin)], c['conf'], n, wi)
            ECVM_ITEM[(n, wi)] = ('vm', c['ilk'], c['conf'])

# ------------------------------------------------------------------ fd (find mode)
SIB = {'வினையெச்சம்': {'எதிர்மறைவினையெச்சம்'}, 'எதிர்மறைவினையெச்சம்': {'வினையெச்சம்'},
       'பெயரெச்சம்': {'எதிர்மறைபெயரெச்சம்'}, 'எதிர்மறைபெயரெச்சம்': {'பெயரெச்சம்'},
       'தெரிநிலைவினைமுற்று': {'குறிப்புவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'வினையாலணையும்பெயர்'},
       'குறிப்புவினைமுற்று': {'தெரிநிலைவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'வினையாலணையும்பெயர்'},
       'எதிர்மறைவினைமுற்று': {'தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று', 'வினையாலணையும்பெயர்'},
       'வினையாலணையும்பெயர்': {'தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'தொழிற்பெயர்'},
       'தொழிற்பெயர்': {'வினையாலணையும்பெயர்', 'வியங்கோள்வினைமுற்று'},
       'வியங்கோள்வினைமுற்று': {'தொழிற்பெயர்', 'எதிர்மறைவினைமுற்று'}}   # DH-01 -அற்க
SIB['எதிர்மறைவினைமுற்று'] = SIB['எதிர்மறைவினைமுற்று'] | {'வியங்கோள்வினைமுற்று'}
def fd_tappable(n, wi, X):
    w = GR[n]['words'][wi]
    if not wordok(n, wi) or any(c['conf'] < 0.7 for c in w['c']) or any(fragment(c, w['w']) for c in w['c']): return False
    bad = {X} | SIB[X]
    return not any(FORMALL[tw(c['s'])]['ilk'] & bad or c['ilk'] in bad for c in w['c'])
for n, g in GR.items():
    if not couplet_ok(n): continue
    W = g['words']
    for X in EC + VM:
        setk = 'e' if X in EC else 'v'
        tg_ = [wi for wi, w in enumerate(W) if any(c['ilk'] == X for c in w['c'])]
        if not (1 <= len(tg_) <= 2): continue
        ok = True; mc = 1.0
        for wi in tg_:
            it = ECVM_ITEM.get((n, wi))       # conservative: every target is itself a valid ec/vm item
            c = whole(n, wi)
            if not it or it[1] != X or not c or tw(c['s']) in QUOT: ok = False; break
            mc = min(mc, c['conf'])
        if not ok or mc < 0.7: continue
        off = [wi for wi in range(len(W)) if wi not in tg_ and not fd_tappable(n, wi, X)]
        ntap = len(W) - len(tg_) - len(off)
        if ntap < 3: continue
        key = IDX['ec' if setk == 'e' else 'vm'][X]
        code = f'fd:{n}.{setk}{key}'
        row = [n, setk, key, js_round100(mc), mask(tg_), mask(off)]
        ITEMS['fd'].append(row); META[code] = {'drill': 'fd', 'conf': mc, 'n': n, 'row': row, 'X': X, 'tg': tg_, 'off': off}
        for wi in tg_: USED_WORDS.add((n, wi))

# ------------------------------------------------------------------ 2.6 tp
AGREE = {'ஆண்பால்': ('உயர்திணை', 'ஒருமை'), 'பெண்பால்': ('உயர்திணை', 'ஒருமை'), 'பலர்பால்': ('உயர்திணை', 'பன்மை'), 'ஒன்றன்பால்': ('அஃறிணை', 'ஒருமை')}
VIK = {'ஆண்பால்': ['அன்', 'ஆன்'], 'பெண்பால்': ['அள்', 'ஆள்'], 'பலர்பால்': ['அர்', 'ஆர்', 'ஓர்', 'மார்'], 'ஒன்றன்பால்': ['து', 'அது', 'று', 'டு']}
def surf_ends(f, v):
    g = gr_(f)
    if v in ('அன்', 'அள்', 'அர்'): return len(g) >= 2 and g[-1] == {'அன்': 'ன்', 'அள்': 'ள்', 'அர்': 'ர்'}[v] and bare_cons(g[-2])
    if v in ('ஆன்', 'ஆள்', 'ஆர்'): return f.endswith({'ஆன்': 'ான்', 'ஆள்': 'ாள்', 'ஆர்': 'ார்'}[v])
    if v == 'ஓர்': return f.endswith('ோர்')
    if v == 'மார்': return f.endswith('மார்')
    if v in ('து', 'அது'): return f.endswith('து')
    return f.endswith(v)
def last_morph(split):
    s = re.sub(r'\(.*?\)', '', split or '')
    if '+' not in s: return ''
    return tw(s.split('+')[-1].strip().split(' ')[0]) if s.split('+')[-1].strip() else ''
TPILK = {'தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று', 'எதிர்மறைவினைமுற்று', 'வினையாலணையும்பெயர்', 'சுட்டுப்பெயர்'}
DEM = set('அவன் அவள் அவர் அது அஃது அவை இவன் இவள் இவர் இது இஃது இவை'.split())
TPX = set('இல்லை இல் உண்டு வேண்டும் வேண்டா ஆம் யார் யாவர் எவன் தான் தாம் தன் தம்'.split())
for n, g in GR.items():
    for wi, w in enumerate(g['words']):
        if not wordok(n, wi): continue
        c = whole(n, wi)
        if not c or c['conf'] < 0.7 or c['ilk'] not in TPILK: continue
        ft = c.get('feat') or {}; paal = ft.get('paal'); f = tw(c['s'])
        if paal not in AGREE or (ft.get('thinai'), ft.get('eN')) != AGREE[paal]: continue
        if ft.get('idam') not in (None, 'படர்க்கை'): continue
        if c.get('vet') and c['vet'].get('number') not in (1, None): continue
        if f in TPX or (f.endswith('ும்') and c['cat'] == 'வினை'): continue
        if FORMALL[f]['ilk'] & {'வியங்கோள்வினைமுற்று', 'ஏவல்வினைமுற்று'}: continue
        if any(len(FORM[f][kk]) > 1 for kk in ('paal', 'thinai', 'eN')): continue
        # conservative: the rows show the full closed sets, so no other value anywhere
        if FORMALL[f]['paal'] != {paal} or FORMALL[f]['thinai'] != {AGREE[paal][0]} or FORMALL[f]['eN'] != {AGREE[paal][1]}: continue
        if c['ilk'] == 'சுட்டுப்பெயர்':
            if f not in DEM: continue
            vik = ''
        else:
            if f in DEM: continue
            vik = last_morph(c.get('split'))
            if vik not in VIK[paal] or not surf_ends(f, vik): continue
        row = [n, wi, 0, IDX['ti'][AGREE[paal][0]], IDX['pa'][paal], IDX['en'][AGREE[paal][1]], 2, js_round100(c['conf']), fp_of(c['s']), vik]
        add_word_item('tp', f'tp:{n}.{wi}.0', row, c['conf'], n, wi)

# ------------------------------------------------------------------ 2.7 vt
CANON = {2: {'ஐ'}, 3: {'ஆல்', 'ஆன்', 'ஒடு', 'ஓடு'}, 4: {'கு'}, 5: {'இன்', 'இல்'}, 7: {'கண்', 'இல்', 'உள்'}}
WRIT = dict(zip(SETS['ur'], SETS['urw']))
MORPH = {u: {u} for u in SETS['ur']}; MORPH['கு'] = {'கு', 'க்கு', 'உக்கு'}
def marks_of(u): return {k for k, v in CANON.items() if u in v}
for n, g in GR.items():
    for wi, w in enumerate(g['words']):
        if not wordok(n, wi) or w.get('togai'): continue
        tok = tw(w['w']); cs = w['c']
        if len(cs) == 1:
            c = cs[0]; v = c.get('vet') or {}; u = (v.get('urupu') or '').strip(); num = v.get('number')
            if c['conf'] < 0.7 or tw(c['s']) != tok or fragment(c, w['w']) or num not in CANON or u not in CANON[num]: continue
            morphs = {tw(x) for x in re.split(r'\+', re.sub(r'\(.*?\)', '', c.get('split') or ''))[1:]}
            if not (morphs & MORPH[u]) or not tok.endswith(WRIT[u]): continue
            conf = c['conf']; kind = 'a'
        elif len(cs) == 2 and cs[1]['ilk'] == 'வேற்றுமைஉருபு':
            v = cs[1].get('vet') or {}; u = (v.get('urupu') or tw(cs[1]['s'])).strip(); num = v.get('number')
            hv = (cs[0].get('vet') or {}).get('number')
            if num not in CANON or u not in CANON[num] or (hv and hv != num): continue
            if not tok.endswith(WRIT[u]) or fragment(cs[0], w['w']) or len(gr_(cs[0]['s'])) < 2: continue
            conf = min(x['conf'] for x in cs); kind = 'b'
            if conf < 0.7: continue
        else:
            continue
        base = tok[:-len(WRIT[u])]
        if len(gr_(base)) < 2: continue
        allow = [x for x in SETS['vt'] if x != num and x not in marks_of(u) and x not in FORMALL[tok]['vet']]
        if len(allow) < 3: continue
        row = [n, wi, IDX['vt'][num], js_round100(conf), fp_of(w['w']), IDX['ur'][u], mask(IDX['vt'][x] for x in allow)]
        code = f'vt:{n}.{wi}'
        add_word_item('vt', code, row, conf, n, wi); META[code]['kind'] = kind

# ------------------------------------------------------------------ 2.11 tg
PANBU_TG = set('நல் நன் தீ பெரு பெரும் பேர் சிறு சிற் செம் செந் வெண் கரு புது பழ இள முது கொடு மட சீர் தண் வெம் நுண் திண் பொய் மெய் அரு எளி இன் வன் மென் கடு கடும் கடுஞ் நெடு குறு நறு தொல் பசு வியன் நெடுந் பைந் செந்'.split())
POSTP = set('முன் முன்னர் பின் இடம் இடத்து வாய் கீழ் மேல் உள் அகம் அகத்து புறம் மிசை கண் கால் மாட்டு இடை'.split())
TG3 = ('வேற்றுமைத்தொகை', 'பண்புத்தொகை', 'உம்மைத்தொகை')
def hidden_urupu(u):
    if u is None: return True
    u = str(u).strip()
    return 'தொக்கது' in u or 'மறை' in u or u.startswith('(')
for n, g in GR.items():
    for wi, w in enumerate(g['words']):
        if not wordok(n, wi): continue
        tgv = w.get('togai'); cs = w['c']
        if tgv not in TG3: continue
        if len(cs) != 2 or any(c['cat'] == 'இடை' for c in cs): continue
        conf = min(c['conf'] for c in cs)
        if conf < 0.7: continue
        tok = tw(w['w'])
        if gr_(tok)[0] != gr_(cs[0]['s'])[0] or gr_(tok)[0][0] in BADINIT: continue
        if fragment(cs[0], w['w']): continue
        if tgv == 'வேற்றுமைத்தொகை' and (tw(cs[1]['s']) in POSTP or any(c['ilk'] == 'வேற்றுமைஉருபு' for c in cs)): continue
        if tgv == 'பண்புத்தொகை' and tw(cs[0]['s']) in ('மா', 'உறு'): continue
        if tgv == 'பண்புத்தொகை' and not (tw(cs[0]['s']) in PANBU_TG or cs[0]['cat'] == 'உரி'): continue   # EX-COPY-04 noun + noun (அருட்செல்வம்) or a number (ஒருநாள்) is not the quality compound the card describes
        if any(c['ilk'] == 'வினையாலணையும்பெயர்' for c in cs): continue
        if len(FORM[tok]['togai']) > 1: continue
        if (FORMALL[tok]['togai'] & set(SETS['tg'])) != {tgv}: continue   # no shown option is carried anywhere
        caseNo = 0
        if tgv == 'வேற்றுமைத்தொகை':
            v = cs[0].get('vet') or {}
            if isinstance(v.get('number'), int) and 2 <= v['number'] <= 7 and hidden_urupu(v.get('urupu')): caseNo = v['number']
        row = [n, wi, IDX['tg'][tgv], js_round100(conf), fp_of(w['w']), caseNo]
        add_word_item('tg', f'tg:{n}.{wi}', row, conf, n, wi)

# ------------------------------------------------------------------ 2.3 pr
PANBU = set('நல் நன் தீ பெரு பெரும் பேர் சிறு சிற் செம் செந் வெண் கரு புது பழ இள முது கொடு மட சீர் தண் வெம் நுண் திண் பொய் மெய் அரு எளி இன் வன் மென் கடு கடும் கடுஞ் நெடு குறு நறு தொல் பசு வியன் மா உறு'.split())
VALL_OTTU = re.compile('[' + VALL + ']்$')
def join_ok(A, B, stem):
    ga, gb, gs = gr_(A), gr_(B), gr_(stem)
    if len(ga) < 2 or len(gb) < 2: return False
    return gs[:len(ga) - 1] == ga[:-1] and gs[-(len(gb) - 1):] == gb[1:]
def fmt(a, b): return f'{a} + {b}'
def real_alt(l, r, stem): return l in ALLFORMS and r in ALLFORMS and l + r == stem
PR_DROP = collections.Counter()
for n, g in GR.items():
    W = g['words']
    for wi, w in enumerate(W):
        if not wordok(n, wi) or w.get('togai') == 'பண்புத்தொகை': continue
        cs = w['c']
        if len(cs) != 2 or any(c['cat'] == 'இடை' for c in cs): continue
        conf = min(c['conf'] for c in cs)
        if conf < 0.7: continue
        A, B = tw(cs[0]['s']), tw(cs[1]['s']); surface = tw(w['w']); stem = surface
        if A + B == surface: continue
        if cs[0]['ilk'] == 'பண்புப்பெயர்' or A in PANBU: continue
        tail, nx = '', ''
        m = VALL_OTTU.search(stem)
        if m and not B.endswith(m.group(0)):
            nxt = gr_(W[wi + 1]['w']) if wi + 1 < len(W) else []
            if nxt and nxt[0][0] == stem[-2]:
                tail = stem[-2:]; nx = js_strip(W[wi + 1]['w']); stem = stem[:-2]
            else: PR_DROP['tail'] += 1; continue
        if A + B == stem: continue
        if VALL_OTTU.search(B): continue
        if re.search(r'[ஙஞநவ]்$', A) or re.search(r'[ஙஞநவ]்$', B): continue
        if A in ('அவ்', 'இவ்', 'உவ்', 'எவ்') or B in ('அன்', 'அள்', 'அர்', 'ஆன்', 'ஆள்', 'ஆர்'): continue
        if A.endswith('ன்') and (A[:-2] + 'ம்') in ALLFORMS: continue
        if re.search(r'[ணனலள]ு$', A): continue
        gs = gr_(stem)
        if not gs or gs[0] != gr_(A)[0] or gs[0][0] in BADINIT: continue
        if not join_ok(A, B, stem): continue
        # decoys
        gb = gr_(B); j = len(gs) - len(gb)
        if j < 1 or j >= len(gs): PR_DROP['j'] += 1; continue
        L, R = ''.join(gs[:j]), ''.join(gs[j:])
        Lp = L[:-2] if re.search('[க-ஹ]்$', L) else L
        ans = fmt(A, B); dec = []
        for (l, r) in ((L, R), (A, R), (L, B), (Lp, B)):
            if not l or not r: continue
            d = fmt(l, r)
            if d == ans or d in dec or real_alt(l, r, stem): continue
            dec.append(d)
        if len(dec) < 2: PR_DROP['decoys'] += 1; continue
        row = [n, wi, js_round100(conf), fp_of(w['w']), A, B, stem, dec, tail, nx]
        add_word_item('pr', f'pr:{n}.{wi}', row, conf, n, wi)

# ------------------------------------------------------------------ 2.14 sl
def clean(gl): return re.sub(r'\s+', ' ', re.sub(r'\(.*?\)|\[.*?\]', '', gl or '')).strip(' ,;')
STOPW = set('the a an of to in on at by for with and or is are be being been his her its their this that one who which from as it he she they not no'.split())
def cw(gl): return {x for x in re.findall(r'[a-z]+', gl.lower()) if len(x) >= 3 and x not in STOPW}
def cs(gl): return {x[:5] for x in cw(gl)}   # stems: sloth/slothfulness and yields/yielding are the same meaning
EX_SYN = [set('suffering distress sorrow grief misery affliction trouble pain woe anguish hardship calamity'.split()),
          set('strength energy firmness resolve drive power might vigour vigor force'.split()), set('wisdom knowledge discernment understanding intelligence learning'.split()),
          set('maiden damsel girl'.split()), set('fear dread terror'.split()), set('anger wrath rage fury'.split()), set('love affection kindness grace compassion'.split()),
          set('shame modesty'.split()), set('greatness nobility eminence'.split()), set('honour honor dignity'.split()), set('death dying'.split()), set('fault blemish flaw defect'.split()),
          set('wealth prosperity fortune riches'.split()), set('fame glory renown'.split()),
          set('good noble excellent virtuous'.split()), set('world earth'.split()), set('woman women lady'.split()),
          set('mind heart'.split()), set('king ruler monarch'.split()), set('friend friendship'.split()),
          set('enemy foe hostility enmity'.split()), set('joy pleasure delight happiness'.split()),
          set('virtue righteousness'.split())]
def clusters(words):
    out = set()
    for x in words:
        for i, cl in enumerate(EX_SYN):
            if any(x == y or (x.startswith(y) and len(x) - len(y) <= 3) for y in cl): out.add(i)
    return out
SLFORMS = {}
for n, g in GR.items():
    for wi, w in enumerate(g['words']):
        if not wordok(n, wi): continue
        for ci, c in enumerate(w['c']):
            if c['cat'] not in ('பெயர்', 'வினை', 'உரி') or c['ilk'] in ('சுட்டுப்பெயர்', 'வினாப்பெயர்') or c['conf'] < 0.7: continue
            if fragment(c, w['w']): continue
            gl = clean(c.get('gloss'))
            if not gl or re.search(r'subject|object|acc\.|=|;|/', gl) or not cw(gl): continue
            if len(w['c']) > 1 and re.match(r'(in|on|for|to|by|from|with|of|among|at|into|upon|through|even|and|also|as)\b', gl, re.I): continue   # DH-15 the gloss carries the case ending too
            f = re.sub('[' + VALL + ']்$', '', tw(c['s']))
            if len(gr_(f)) < 2: continue
            if f not in SLFORMS or c['conf'] > SLFORMS[f][0]: SLFORMS[f] = (c['conf'], n, wi, ci, c['cat'], gl)
SL_BYCH = collections.defaultdict(list)
for f, v in SLFORMS.items(): SL_BYCH[chap(v[1])].append(f)
SL_PRE_SYN = 0
for f in sorted(SLFORMS, key=lambda x: (SLFORMS[x][1], SLFORMS[x][2], SLFORMS[x][3])):
    cf_, n, wi, ci, cat, gl = SLFORMS[f]
    kw = cw(gl); kcl = clusters(kw); ks = cs(gl)
    base = [x for x in SL_BYCH[chap(n)] if x != f and SLFORMS[x][4] == cat and not (cw(SLFORMS[x][5]) & kw) and not (cs(SLFORMS[x][5]) & ks)]
    SL_PRE_SYN += len(base) >= 3
    cand = [x for x in base if not (clusters(cw(SLFORMS[x][5])) & kcl)]
    rnd = random.Random(fnv1a(f'sl|{n}.{wi}.{ci}'))
    cand.sort(); rnd.shuffle(cand)
    pick, used, used_s = [], set(kw), set(ks)
    for x in cand:
        xw = cw(SLFORMS[x][5]); xs = cs(SLFORMS[x][5])
        if not xw or xw & used or xs & used_s: continue
        pick.append(x); used |= xw; used_s |= xs
        if len(pick) == 3: break
    if len(pick) < 3: continue
    ptr = []
    for x in pick:
        _, pn, pw, pc, _, _ = SLFORMS[x]
        check(pw < 10 and pc < 10 and wi < 10 and ci < 10, f'sl pointer overflow {x}')
        ptr.append(pn * 100 + pw * 10 + pc)
    c = GR[n]['words'][wi]['c'][ci]
    row = [n, wi, ci, js_round100(c['conf']), fp_of(c['s']), ptr]
    add_word_item('sl', f'sl:{n}.{wi}.{ci}', row, c['conf'], n, wi); META[f'sl:{n}.{wi}.{ci}'].update(form=f, pick=pick)

# ------------------------------------------------------------------ 2.12 an
MARK = re.compile(r'போல|போன்|அன்ன(?!ை)|அனைய|ஒப்ப|நிகர|புரைய|மான(?!ம்)|ஏய்ப்ப|அற்றே|அற்று|ஆங்கு|யாங்கு|கடுப்ப|உறழ')
AN_DENY = {10, 24, 129, 1117}
# The vowel-initial markers (அற்று, அற்றே, அனைய, ஆங்கு, அன்ன) fuse with a consonant-final word
# before them and are printed as that consonant: 'தளிர்த் தற்று', 'வட்டாடி யற்றே', 'வெள்ளத் தனைய',
# 'கொன் றாங்கு', 'கடலன்ன'. MARK cannot see those, so a couplet whose only உருபு is fused would pass
# as எடுத்துக்காட்டு உவமை or உருவகம். Per token, so முதற்றே (K1, முதல்+து+ஏ) is not one.
FC = 'கசடதபறஞஙணநமனயரலவழள'
FUSED = [re.compile(rf'^[{FC}]ற்(?:று|றே)$'), re.compile(rf'[{FC}]னைய(?![ா-ௌ்])'), re.compile(rf'[{FC}]ற்றா(?:ல்|கும்)$'),   # DH-02 கண்டற்றால், தற்றாகும்
         re.compile(rf'^[{FC}]ாங்கு$'), re.compile(rf'[{FC}]ன்ன(?:ார்|ர்|து|ன்|ள்|வை)?$')]
FUSED_NOT = {'மற்று', 'மற்றே', 'பற்று', 'பற்றே', 'மன்னன்', 'மன்னர்', 'கற்றால்', 'பற்றால்'}   # particle, 'attachment', 'king'
def is_mark(tok):
    t = re.sub(r'[^\u0B80-\u0BFF]', '', tok)
    return bool(MARK.search(t)) or (t not in FUSED_NOT and any(r.search(t) for r in FUSED))
for n, g in sorted(GR.items()):
    if n in EXCL or n in AN_DENY: continue
    nm = {('உருவகம்' if a['name'] == 'உருவகம' else a['name']) for a in g.get('ani') or []}
    if len(nm) != 1: continue
    a = next(iter(nm))
    if a not in IDX['an']: continue
    has = any(is_mark(t) for t in TOK[n])
    if (a == 'உவமை') != has: continue
    mark_i = -1
    if a == 'உவமை':
        mark_i = next((i for i, t in enumerate(TOK[n]) if is_mark(t)), -1)
        if mark_i < 0: continue
    row = [n, IDX['an'][a], mark_i]
    ITEMS['an'].append(row); META[f'an:{n}'] = {'drill': 'an', 'n': n, 'row': row}

# ------------------------------------------------------------------ 2.8 / 2.9 / 2.13 metre
VEN = {'இயற்சீர் வெண்டளை', 'வெண்சீர் வெண்டளை'}
NAME = {('N', 'N'): 'தேமா', ('I', 'N'): 'புளிமா', ('N', 'I'): 'கூவிளம்', ('I', 'I'): 'கருவிளம்', ('N', 'N', 'N'): 'தேமாங்காய்', ('I', 'N', 'N'): 'புளிமாங்காய்', ('N', 'I', 'N'): 'கூவிளங்காய்', ('I', 'I', 'N'): 'கருவிளங்காய்'}
def cls_of(pat):
    if len(pat) == 2: return 'மா' if pat[-1] == 'N' else 'விளம்'
    if len(pat) == 3 and pat[-1] == 'N': return 'காய்'
    return None
def thalai(prev_pat, nxt_first):
    c = cls_of(prev_pat)
    if (c == 'மா' and nxt_first == 'I') or (c == 'விளம்' and nxt_first == 'N'): return 'இயற்சீர் வெண்டளை'
    if c == 'காய்' and nxt_first == 'N': return 'வெண்சீர் வெண்டளை'
    return None
ALAB = re.compile(r'[ாஆ]அ|[ீஈ]இ|[ூஊ]உ|[ேஏ]எ|[ோஓ]ஒ|[ைஐ]இ|ௌஉ')
KU = re.compile(r'[கசடதபற]ு$')
LONGV = set('ஆஈஊஏஐஓஔ')
SIGNV = {'': 'அ', 'ா': 'ஆ', 'ி': 'இ', 'ீ': 'ஈ', 'ு': 'உ', 'ூ': 'ஊ', 'ெ': 'எ', 'ே': 'ஏ', 'ை': 'ஐ', 'ொ': 'ஒ', 'ோ': 'ஓ', 'ௌ': 'ஔ', '்': ''}
def cv(g):
    if 'அ' <= g[0] <= 'ஔ': return ('', g[0])
    return (g[0], SIGNV.get(g[1:], '?'))
def eetru_re(s):
    a = [x['k'] for x in s['asai']]; w = tw(s['w'])
    if len(a) == 2 and KU.search(w) and len(s['asai'][1]['u']) == 1: return 'காசு' if a[0] == 'N' else 'பிறப்பு'
    if len(a) == 1: return 'நாள்' if a[0] == 'N' else 'மலர்'
    return None
def seg(units):
    out = []; i = 0
    while i < len(units):
        k = units[i][0]
        if k == 'o' and out:
            out[-1][1].append(units[i]); i += 1; continue
        if k == 'k' and i + 1 < len(units) and units[i + 1][0] in 'kn':
            a = ['I', [units[i], units[i + 1]]]; i += 2
        else:
            a = ['N', [units[i]]]; i += 1
        while i < len(units) and units[i][0] == 'o': a[1].append(units[i]); i += 1
        out.append(a)
    return [x[0] for x in out]
def ai_sensitive(s):
    u = [x for a in s['asai'] for x in a['u']]
    u2 = [(('k' if (x[1].endswith('ை') and j > 0 and x[0] == 'n') else x[0]), x[1]) for j, x in enumerate(u)]
    return u2 != u and seg(u2) != seg(u)
def unelided_ku(S):
    for i in range(6):
        w = tw(S[i]['w']); g = gr_(w)
        if not KU.search(w): continue
        if len(g) == 2 and cv(g[0])[1] not in LONGV and cv(g[0])[1] != '?': continue   # lone short letter + ku (முற்றியலுகரம்)
        if re.match(r'[அ-ஔ]', tw(S[i + 1]['w'])): return True
    return False
MT_DROP = collections.Counter(); MT = {}
for n, k in sorted(CH.items()):
    y = k.get('yappu')
    if not y: MT_DROP['noy'] += 1; continue
    L = y['lines']
    if y.get('paa') != 'குறள் வெண்பா' or (y.get('conf') or 0) < 0.9 or y.get('reseg') or any(l.get('err') for l in L): MT_DROP['basic'] += 1; continue
    if [len(l['seers']) for l in L] != [4, 3]: MT_DROP['shape'] += 1; continue
    T = LINES[n]
    if any(len(T[i]) != len(L[i]['seers']) or any(tw(T[i][j]) != tw(s['w']) for j, s in enumerate(L[i]['seers'])) for i in range(2)): MT_DROP['align'] += 1; continue
    if n in EXCL: MT_DROP['ortho/block'] += 1; continue
    if ALAB.search(k['l1'] + k['l2']) or 'ஃ' in k['l1'] + k['l2']: MT_DROP['alab/aytham'] += 1; continue
    S = L[0]['seers'] + L[1]['seers']
    # units must spell the foot and re-segment to the stored asai
    if any(''.join(x[1] for a in s['asai'] for x in a['u']) != tw(s['w']) or seg([x for a in s['asai'] for x in a['u']]) != [a['k'] for a in s['asai']] for s in S):
        MT_DROP['units'] += 1; continue
    pats = [tuple(a['k'] for a in s['asai']) for s in S]
    th = L[0]['thalai'][:3] + [(y.get('boundary') or [None])[0]] + L[1]['thalai'][:2]
    if any(x not in VEN for x in th) or any(thalai(pats[i], pats[i + 1][0]) != th[i] for i in range(6)): MT_DROP['thalai'] += 1; continue
    if any(NAME.get(pats[i]) != S[i]['name'] for i in range(6)): MT_DROP['names'] += 1; continue
    if y.get('eetru') not in SETS['fn'] or eetru_re(S[6]) != y['eetru']: MT_DROP['eetru'] += 1; continue
    if unelided_ku(S): MT_DROP['ku-elision'] += 1; continue
    ai = mask(i for i in range(7) if ai_sensitive(S[i]))
    vp = ''.join(str(IDX['vp'][NAME[pats[i]]]) for i in range(6)) + str(IDX['fn'][y['eetru']])
    ths = ''.join(str(IDX['th'][x]) for x in th)
    row = [n, vp, ths, ai, js_round100(y['conf'])]
    ITEMS['mt'].append(row); MT[n] = {'row': row, 'S': S, 'pats': pats}

# ------------------------------------------------------------------ 2.4 td
GRP = [set('அஆஐஔ'), set('இஈஎஏ'), set('உஊஒஓ')]
def same_grp(a, b): return a != '?' and b != '?' and (a == b or any(a in s and b in s for s in GRP))
CP = [set('மவ'), set('தச'), set('ஞந')]
IE = [set('ணன'), set('ரற'), set('லளழ')]
def mon(a, b):
    ga, gb = gr_(a), gr_(b)
    if not ga or not gb: return 'D'
    (c1, v1), (c2, v2) = cv(ga[0]), cv(gb[0])
    if c1 == c2 and same_grp(v1, v2): return 'T'
    if c1 != c2 and any(c1 in p and c2 in p for p in CP) and same_grp(v1, v2): return 'D'
    return 'N'
def etu(a, b):
    ga, gb = gr_(a), gr_(b)
    if len(ga) < 2 or len(gb) < 2: return 'D'
    c1, c2 = cv(ga[1])[0], cv(gb[1])[0]
    if ga[1] == gb[1]: return 'T' if ((cv(ga[0])[1] in LONGV) == (cv(gb[0])[1] in LONGV)) else 'D'
    if c1 == c2 or any(c1 in p and c2 in p for p in IE): return 'D'
    return 'N'
TDFN = {'m': mon, 'e': etu}
def td_masks(toks, kind):
    r = [TDFN[kind](toks[0], toks[j]) for j in range(1, len(toks))]
    return mask(j for j in range(1, len(toks)) if r[j - 1] == 'T'), mask(j for j in range(1, len(toks)) if r[j - 1] == 'D'), r
for n, k in sorted(CH.items()):
    y = k.get('yappu')
    if not y or y.get('reseg') or any(l.get('err') for l in y['lines']) or n in EXCL: continue
    T = LINES[n]
    if len(y['lines']) != 2 or any(len(T[i]) != len(y['lines'][i]['seers']) or any(tw(T[i][j]) != tw(s['w']) for j, s in enumerate(y['lines'][i]['seers'])) for i in range(2)): continue
    for li in range(2):
        toks = T[li]
        if len(toks) < 3: continue
        for kind in ('m', 'e'):
            tgt, off, r = td_masks(toks, kind)
            if r.count('T') < 1 or r.count('N') < 1: continue
            row = [n, li, kind, tgt, off, fp_of((k['l1'], k['l2'])[li])]
            ITEMS['td'].append(row); META[f'td:{n}.{li}.{kind}'] = {'drill': 'td', 'n': n, 'row': row}

# ------------------------------------------------------------------ 5.7 withdrawals
KNOWN_D = {'sv', 'pv', 'ec', 'vm', 'fd', 'tp', 'vt', 'tg', 'pr', 'an', 'td', 'td_m', 'td_e', 'sa', 'sn', 'sf', 'th', 'al', 'sl', 'sr'}
check(not (BLOCK_D - KNOWN_D), f'INT-5 exam_block.json: unknown drills {sorted(BLOCK_D - KNOWN_D)}')
if 'sr' in BLOCK_D: BLOCK_D |= {'sa', 'sn'}   # the hub's topic code for a foot
OFF = sorted(set(BLOCK_I))
def row_code(d, r):
    if d in ('sv', 'pv', 'ec', 'vm', 'tp', 'sl'): return f'{d}:{r[0]}.{r[1]}.{r[2]}'
    if d in ('vt', 'tg', 'pr'): return f'{d}:{r[0]}.{r[1]}'
    if d == 'fd': return f'fd:{r[0]}.{r[1]}{r[2]}'
    if d == 'an': return f'an:{r[0]}'
    if d == 'td': return f'td:{r[0]}.{r[1]}.{r[2]}'
    return None
offset = set(OFF)
_all_codes = {row_code(d, r) for d in ITEMS for r in ITEMS[d]} - {None}
for _c in OFF:   # INT-5 a code that matches nothing is a typo that would leave the item live
    _d = _c.split(':')[0]
    check(_c in _all_codes or _d in ('sa', 'sn', 'sf', 'th', 'al'), f'INT-5 exam_block.json item matches nothing: {_c}')
for d in ITEMS:
    if d in BLOCK_D: ITEMS[d] = []
    ITEMS[d] = [r for r in ITEMS[d] if row_code(d, r) not in offset]
if {'sa', 'sn', 'sf', 'th', 'al'} <= BLOCK_D: ITEMS['mt'] = []
if {'td_m', 'td_e'} <= BLOCK_D or 'td' in BLOCK_D: ITEMS['td'] = []

# ------------------------------------------------------------------ 8 test 2: assertions
def dim_values(drill, f):
    return FORMALL[f]['cat'] if drill == 'sv' else FORMALL[f]['ilk']
# (a) + (b) word items
for d in ('sv', 'pv', 'ec', 'vm', 'tp', 'vt', 'tg', 'pr', 'sl'):
    for r in ITEMS[d]:
        code = row_code(d, r); m = META[code]; n, wi = r[0], r[1]
        cf = r[3] if d in ('vt', 'tg') else (r[2] if d == 'pr' else (r[7] if d == 'tp' else (r[3] if d == 'sl' else r[4])))
        check(m['conf'] >= 0.7 and cf == js_round100(m['conf']) and cf >= 70, f'(a) conf {code}')
        check((m['conf'] >= 0.8) == (cf >= 80), f'(a) threshold edge {code}')
        check(wi not in DOUBTW[n], f'(a) flag-named {code}')
        check(n != 1111 and n in ALIGNED and n not in BLOCKED and n not in ORTHO and n not in BLOCK_K, f'(b) couplet {code}')
for r in ITEMS['fd']:
    m = META[row_code('fd', r)]
    check(r[0] in ALIGNED and r[0] not in BLOCKED and r[0] not in EXCL and r[0] != 1111, f'(b) fd couplet {r}')
    for wi in m['tg']:
        check(wi not in DOUBTW[r[0]], f'(a) fd target named {r}')
    check(m['conf'] >= 0.7 and r[3] == js_round100(m['conf']), f'(a) fd conf {r}')
    check(1 <= popcount(r[4]) <= 2 and r[4] & r[5] == 0, f'fd masks {r}')
    ntok = len(GR[r[0]]['words'])
    check(ntok - popcount(r[4]) - popcount(r[5]) >= 3, f'fd tappable {r}')
    X = m['X']
    for wi in range(ntok):
        if (r[4] | r[5]) >> wi & 1: continue
        for c in GR[r[0]]['words'][wi]['c']:
            check(not (FORMALL[tw(c['s'])]['ilk'] & ({X} | SIB[X])), f'fd tappable carries X/sibling {r} w{wi}')
# (c) + (d) MCQ masks
def bits(m_, arr): return [arr[i] for i in range(len(arr)) if m_ >> i & 1]
for r in ITEMS['sv']:
    f = tw(GR[r[0]]['words'][r[1]]['c'][r[2]]['s'])
    check(FORMALL[f]['cat'] == {SETS['cat'][r[3]]}, f'(c) sv form carries another cat {r}')
for d, allow_i, twin_i in (('pv', 6, None), ('ec', 6, None), ('vm', 6, 7)):
    arr = SETS[d]
    for r in ITEMS[d]:
        f = tw(GR[r[0]]['words'][r[1]]['c'][r[2]]['s'])
        key = arr[r[3]]; al = bits(r[allow_i], arr); tw_ = bits(r[twin_i], arr) if twin_i else []
        check(key not in al and key not in tw_, f'(c) key in allow {d} {r}')
        check(not ((set(al) | set(tw_)) & FORMALL[f]['ilk']), f'(c) allowed value carried by form {d} {r}')
        check(len(al) >= 2, f'(c) fewer than 2 allowed {d} {r}')
        if d == 'pv': check(not (set(al) & TWIN_PV[key]), f'(d) pv twin allowed {r}')
        if d == 'ec' and key in EC_SUPER: check(EC_SUPER[key] not in al, f'(d) ec supertype allowed {r}')
        if d == 'vm' and key == 'எதிர்மறைவினைமுற்று': check(not ({'தெரிநிலைவினைமுற்று', 'குறிப்புவினைமுற்று'} & (set(al) | set(tw_))), f'(d) vm negative {r}')
        if d == 'vm': check(not (set(al) & VM_TWIN.get(key, set())), f'(c) vm twin in allow {r}')
# (e) vt
for r in ITEMS['vt']:
    w = GR[r[0]]['words'][r[1]]; tok = tw(w['w']); num = SETS['vt'][r[2]]; u = SETS['ur'][r[5]]; kind = META[row_code('vt', r)]['kind']
    check(tok.endswith(SETS['urw'][r[5]]), f'(e) ending {r}')
    if kind == 'a':
        morphs = {tw(x) for x in re.split(r'\+', re.sub(r'\(.*?\)', '', w['c'][0].get('split') or ''))[1:]}
        check(bool(morphs & MORPH[u]), f'(e) morpheme {r}')
    else:
        check(w['c'][1]['ilk'] == 'வேற்றுமைஉருபு', f'(e) uruபு component {r}')
    check(u in CANON.get(num, set()), f'(e) canon {r}')
    check(len(gr_(tok[:-len(SETS['urw'][r[5]])])) >= 2, f'(e) base {r}')
    al = bits(r[6], SETS['vt'])
    check(num not in al and not (set(al) & marks_of(u)) and len(al) >= 3 and not (set(al) & FORMALL[tok]['vet']), f'(e) allow {r}')
# (f) tp
for r in ITEMS['tp']:
    c = GR[r[0]]['words'][r[1]]['c'][r[2]]; f = tw(c['s']); paal = SETS['pa'][r[4]]
    check(paal != 'பலவின்பால்', f'(f) palavin {r}')
    check((SETS['ti'][r[3]], SETS['en'][r[5]]) == AGREE[paal] and r[6] == 2, f'(f) agreement {r}')
    if r[9]:
        check(last_morph(c.get('split')) == r[9] and r[9] in VIK[paal] and surf_ends(f, r[9]), f'(f) vikuti {r}')
    else:
        check(f in DEM and c['ilk'] == 'சுட்டுப்பெயர்', f'(f) DEM {r}')
# (g) tg
for r in ITEMS['tg']:
    w = GR[r[0]]['words'][r[1]]; cs = w['c']
    check(len(cs) == 2 and not any(c['cat'] == 'இடை' for c in cs), f'(g) parts {r}')
    check(not (SETS['tg'][r[2]] == 'வேற்றுமைத்தொகை' and tw(cs[1]['s']) in POSTP), f'(g) postp {r}')
    check(SETS['tg'][r[2]] != 'அன்மொழித்தொகை' and w.get('togai') == SETS['tg'][r[2]], f'(g) key {r}')
    check('மலர்மிசை' not in (CH[r[0]]['l1'] + CH[r[0]]['l2']), f'(17) tg in a மலர்மிசை couplet {r}')
# (h) pr
for r in ITEMS['pr']:
    _, _, _, _, A, B, stem, dec, tail, nx = r
    ga, gb, gs = gr_(A), gr_(B), gr_(stem)
    check(len(ga) >= 2 and len(gb) >= 2 and gs[:len(ga) - 1] == ga[:-1] and gs[len(gs) - (len(gb) - 1):] == gb[1:], f'(h) join {r}')
    check(not any(re.search(r'[ஙஞநவ' + VALL + r']்$', x) for x in (A, B)), f'(h) part ending {r}')
    check(len(dec) >= 2 and len(set(dec)) == len(dec) and fmt(A, B) not in dec, f'(h) decoys distinct {r}')
    for d_ in dec:
        l, rr = d_.split(' + ')
        check(not real_alt(l, rr, stem), f'(h) decoy is a real alternative {r}')
    check('சிற்றின்பம்' not in (stem, tw(GR[r[0]]['words'][r[1]]['w'])), f'(17) சிற்றின்பம் in pr {r}')
    check(bool(tail) == bool(nx), f'(h) tail/nx {r}')
# (i) an
for r in ITEMS['an']:
    n = r[0]; nm = {('உருவகம்' if a['name'] == 'உருவகம' else a['name']) for a in GR[n].get('ani') or []}
    check(nm == {SETS['an'][r[1]]}, f'(i) ani set {r}')
    has = any(is_mark(t) for t in TOK[n])
    check(has == (r[1] == 0), f'(i) marker {r}')
    check(n != 1 or r[1] == 1, f'(i) K1 must stay எடுத்துக்காட்டு உவமை {r}')
    check(n not in AN_DENY and n not in EXCL, f'(i) deny {r}')
    check((r[2] >= 0) == (r[1] == 0), f'(i) mark index {r}')
# (j) metre
for r in ITEMS['mt']:
    n, vp, ths, ai, cf = r; S = MT[n]['S']; y = CH[n]['yappu']
    check(len(vp) == 7 and len(ths) == 6, f'(j) lengths {r}')
    for i, s in enumerate(S):
        units = [x for a in s['asai'] for x in a['u']]
        check(seg(units) == [a['k'] for a in s['asai']], f'(j) asai re-segmentation {n} s{i}')
    for i in range(6):
        check(SETS['vp'][int(vp[i])] == NAME.get(tuple(a['k'] for a in S[i]['asai'])), f'(j) non-final key {n} s{i}')
    check(SETS['fn'][int(vp[6])] == y['eetru'] == eetru_re(S[6]), f'(j) final key {n}')
    for j in range(6):
        check(SETS['th'][int(ths[j])] == thalai(tuple(a['k'] for a in S[j]['asai']), S[j + 1]['asai'][0]['k']), f'(j) junction {n} j{j}')
    check(not unelided_ku(S), f'(j) unelided ku {n}')
    for i in range(7):
        check(bool(ai >> i & 1) == ai_sensitive(S[i]), f'(j) ai mask {n} s{i}')
    check(cf >= 90, f'(j) conf {n}')
# (k) Kural 1 row
def seg_str(s): return '/'.join(''.join(x[1] for x in a['u']) for a in s['asai'])
def asai_name(a): return {'N': 'நேர்', 'I': 'நிரை'}[a]
if check(1 in MT, '(k) kural 1 is not metre-clean'):
    S = MT[1]['S']; vp = MT[1]['row'][1]
    got = []
    for i in range(6):
        got.append(f"{seg_str(S[i])} {' '.join(asai_name(a['k']) for a in S[i]['asai'])} {SETS['vp'][int(vp[i])]}")
    fin = SETS['fn'][int(vp[6])]
    got.append(f"{tw(S[6]['w'])} {asai_name(S[6]['asai'][0]['k']) + ('பு' if fin in ('காசு', 'பிறப்பு') else '')} {fin}")
    want = ['அக/ர நிரை நேர் புளிமா', 'முத/ல நிரை நேர் புளிமா', 'எழுத்/தெல்/லாம் நிரை நேர் நேர் புளிமாங்காய்', 'ஆ/தி நேர் நேர் தேமா',
            'பக/வன் நிரை நேர் புளிமா', 'முதற்/றே நிரை நேர் புளிமா', 'உலகு நிரைபு பிறப்பு']
    check(got == want, f'(k) kural 1 row: {got}')
    check(MT[1]['row'][3] & (1 << 6) == 0 and fin == 'பிறப்பு', '(17) K1 sf keyed பிறப்பு')
# (l) td
for r in ITEMS['td']:
    n, li, kind, tgt, off, fp = r
    toks = [js_strip(x) for x in LINES[n][li]]
    t2, o2, rr = td_masks(toks, kind)
    check((t2, o2) == (tgt, off), f'(l) td recompute {r}')
    check(popcount(tgt) >= 1 and len(toks) - 1 - popcount(tgt) - popcount(off) >= 1 and not (tgt | off) & 1, f'(l) td counts {r}')
    check(fp == fnv1a(js_tword((CH[n]['l1'], CH[n]['l2'])[li])) & 0xffff, f'(l) td fp {r}')
# (m) sl
for r in ITEMS['sl']:
    m = META[row_code('sl', r)]; key = SLFORMS[m['form']]; kw = cw(key[5])
    seen = set(kw); check(bool(kw), f'(m) key content {r}')
    for p in r[5]:
        pn, pw, pc = p // 100, (p // 10) % 10, p % 10
        c = GR[pn]['words'][pw]['c'][pc]; gl = clean(c.get('gloss')); dw = cw(gl)
        f = re.sub('[' + VALL + ']்$', '', tw(c['s']))
        check(chap(pn) == chap(r[0]) and c['cat'] == key[4] and f != m['form'], f'(m) same chapter/cat/different form {r}')
        check(bool(dw) and not (dw & seen), f'(m) content overlap {r}')
        check(not (clusters(dw) & clusters(kw)), f'(m) synonym cluster {r}')
        seen |= dw
    check(len(r[5]) == 3 and len(set(r[5])) == 3, f'(m) three distractors {r}')
# (n) fnv1a vector (JS: fnv1a('அகர') & 0xffff)
FNV_VEC = fnv1a('அகர') & 0xffff
check(fnv1a('') == 0x811c9dc5 and fnv1a('a') == 0xe40c292c, '(n) fnv1a reference vectors')
# exclusions (17) and pointer packing
for d in ITEMS:
    for r in ITEMS[d]:
        check(r[0] not in EXCL, f'(17) excluded couplet in {d} {r}')
        if d in ('sv', 'pv', 'ec', 'vm', 'tp', 'sl'): check(r[1] < 10 and r[2] < 10, f'packing {d} {r}')
for r in ITEMS['an']: check(r[0] not in (10, 24, 129), f'(17) an deny {r}')

# ------------------------------------------------------------------ counts
def lohi(d, cfpos):
    rows = ITEMS[d]
    return {'lo': sum(1 for r in rows if r[cfpos] >= 70), 'hi': sum(1 for r in rows if r[cfpos] >= 80)}
counts = {'sv': lohi('sv', 4), 'pv': lohi('pv', 4), 'ec': lohi('ec', 4), 'vm': lohi('vm', 4), 'fd': lohi('fd', 3),
          'tp': lohi('tp', 7), 'vt': lohi('vt', 3), 'tg': lohi('tg', 3), 'pr': lohi('pr', 2), 'sl': lohi('sl', 3)}
def flat(x): return {'lo': x, 'hi': x}
nmt = len(ITEMS['mt'])
counts['an'] = flat(len(ITEMS['an']))
counts['mt'] = flat(nmt)
counts['sr'] = flat(sum(6 - popcount(r[3] & 0x3f) for r in ITEMS['mt']))
counts['sf'] = flat(sum(1 for r in ITEMS['mt'] if not r[3] >> 6 & 1))
counts['th'] = flat(6 * nmt)
counts['al'] = flat(sum(1 for r in ITEMS['mt'] if r[3] == 0))
counts['td_m'] = flat(sum(1 for r in ITEMS['td'] if r[2] == 'm'))
counts['td_e'] = flat(sum(1 for r in ITEMS['td'] if r[2] == 'e'))

# corr list: words named only by clear flags, used by some item
CORRW = sorted(f'{n}.{wi}' for (n, wi) in USED_WORDS if wi in CLEARW[n] and wi not in DOUBTW[n])

# ------------------------------------------------------------------ write
h = hashlib.sha1()
for f in sorted(glob.glob(str(DATA / 'gr' / '*.json'))) + sorted(glob.glob(str(DATA / 'ch' / '*.json'))) + [str(BLOCK_FILE), __file__]:
    h.update(Path(f).read_bytes())
bank = {'v': 1, 'rev': h.hexdigest()[:12], 'built': datetime.datetime.fromtimestamp(max(Path(f).stat().st_mtime for f in sorted(glob.glob(str(DATA / 'gr' / '*.json'))) + sorted(glob.glob(str(DATA / 'ch' / '*.json'))) + [str(BLOCK_FILE), __file__]), datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),   # INT-4: the newest input, not the clock
        'conf': {'lo': 70, 'hi': 80, 'floor': 30, 'skillMin': 20}, 'sets': SETS, 'items': ITEMS, 'counts': counts,
        'off': OFF, 'doff': sorted(BLOCK_D), 'corr': CORRW}
blob = json.dumps(bank, ensure_ascii=False, separators=(',', ':'))
size = len(blob.encode('utf-8'))
check(size < 400 * 1024, f'ex.json too large: {size}')

# ------------------------------------------------------------------ report
SPEC = {'sv': (1610, 892), 'pv': (277, 194), 'ec': (357, 193), 'vm': (563, 288), 'fd': (135, 85), 'tp': (93, 41), 'vt': (245, 116),
        'tg': (84, 18), 'pr': (153, 42), 'an': (151, 151), 'mt': (780, 780), 'sr': (4610, 4610), 'sf': (780, 780), 'th': (4680, 4680),
        'al': (718, 718), 'td_m': (1120, 1120), 'td_e': (513, 513), 'sl': (950, 950)}
print(f'flags {NFLAG}  blocking {NBLOCKING}  wordless-blocking couplets {len(BLOCKED)}  blocking-named words {sum(len(v) for v in DOUBTW.values())}')
print(f'aligned couplets {len(ALIGNED)}  (not aligned: {sorted(set(GR) - ALIGNED)})')
print(f'orthography-flagged couplets ({len(ORTHO)}) for CICT: {sorted(ORTHO)}')
print(f'exam_block.json: kurals {sorted(BLOCK_K)}  drills {sorted(BLOCK_D)}  items {len(BLOCK_I)}')
print(f'metre drops {dict(MT_DROP)}   pr drops {dict(PR_DROP)}   sl forms {len(SLFORMS)} (>=3 same-chapter before synonym filter: {SL_PRE_SYN})')
print(f'{"drill":6s} {"lo":>6s} {"hi":>6s}   {"spec lo":>7s} {"spec hi":>7s}   {"dlo%":>6s} {"dhi%":>6s}')
for d in SPEC:
    c = counts[d]; s = SPEC[d]
    dl = 100.0 * (c['lo'] - s[0]) / s[0]; dh = 100.0 * (c['hi'] - s[1]) / s[1]
    flag = '' if abs(dl) <= 5 and abs(dh) <= 5 else '  <-- outside 5%'
    print(f'{d:6s} {c["lo"]:6d} {c["hi"]:6d}   {s[0]:7d} {s[1]:7d}   {dl:+6.1f} {dh:+6.1f}{flag}')
print(f"fnv1a('அகர') & 0xffff = {FNV_VEC}  (full 32-bit {fnv1a('அகர')})")
print(f'ex.json {size} bytes ({size / 1024:.1f} KB), rev {bank["rev"]}, corr words {len(CORRW)}')

# ------------------------------------------------------------------ audit
if FAILS:   # INT-4 no audit rows from a bank that failed its checks
    print(f'\nASSERTION FAILURES ({len(FAILS)}):')
    for x in FAILS[:60]: print('  ' + x)
    sys.exit(1)
if '--audit' in sys.argv:
    def lab(arr, m_): return ' / '.join(str(x) for x in bits(m_, arr))
    rows = [['drill', 'code', 'kural', 'word', 'key', 'options', 'conf']]
    def sample(lst, d):
        rnd = random.Random(fnv1a('audit|' + d)); lst = list(lst)
        return rnd.sample(lst, min(25, len(lst)))
    for r in sample(ITEMS['sv'], 'sv'): rows.append(['sv', row_code('sv', r), r[0], GR[r[0]]['words'][r[1]]['w'], SETS['cat'][r[3]], ' / '.join(SETS['cat']), r[4] / 100])
    for d in ('pv', 'ec'):
        for r in sample(ITEMS[d], d): rows.append([d, row_code(d, r), r[0], GR[r[0]]['words'][r[1]]['w'], SETS[d][r[3]], 'allow: ' + lab(SETS[d], r[6]), r[4] / 100])
    for r in sample(ITEMS['vm'], 'vm'): rows.append(['vm', row_code('vm', r), r[0], GR[r[0]]['words'][r[1]]['w'], SETS['vm'][r[3]], 'allow: ' + lab(SETS['vm'], r[6]) + ' | twin(cf>=80): ' + lab(SETS['vm'], r[7]), r[4] / 100])
    for r in sample(ITEMS['fd'], 'fd'):
        W = GR[r[0]]['words']; X = (SETS['ec'] if r[1] == 'e' else SETS['vm'])[r[2]]
        rows.append(['fd', row_code('fd', r), r[0], ' '.join(('[' + w['w'] + ']') if r[4] >> i & 1 else (('~' + w['w']) if r[5] >> i & 1 else w['w']) for i, w in enumerate(W)), X, '[target] ~off', r[3] / 100])
    for r in sample(ITEMS['tp'], 'tp'): rows.append(['tp', row_code('tp', r), r[0], GR[r[0]]['words'][r[1]]['w'], f"{SETS['ti'][r[3]]} · {SETS['pa'][r[4]]} · {SETS['en'][r[5]]} · படர்க்கை", 'vik -' + (r[9] or '(சுட்டு)'), r[7] / 100])
    for r in sample(ITEMS['vt'], 'vt'): rows.append(['vt', row_code('vt', r), r[0], GR[r[0]]['words'][r[1]]['w'], f"{SETS['vt'][r[2]]} ({SETS['ur'][r[5]]})", 'allow: ' + lab(SETS['vt'], r[6]), r[3] / 100])
    for r in sample(ITEMS['tg'], 'tg'): rows.append(['tg', row_code('tg', r), r[0], GR[r[0]]['words'][r[1]]['w'], SETS['tg'][r[2]] + (f' ({r[5]})' if r[5] else ''), 'other 4 of: ' + ' / '.join(SETS['tg']), r[3] / 100])
    for r in sample(ITEMS['pr'], 'pr'): rows.append(['pr', row_code('pr', r), r[0], r[6] + (f' (+{r[8]} before {r[9]})' if r[8] else ''), fmt(r[4], r[5]), ' | '.join(r[7]), r[2] / 100])
    for r in sample(ITEMS['an'], 'an'): rows.append(['an', f'an:{r[0]}', r[0], CH[r[0]]['l1'] + ' / ' + CH[r[0]]['l2'], SETS['an'][r[1]], ' / '.join(SETS['an']) + (f' | marker token {TOK[r[0]][r[2]]}' if r[2] >= 0 else ''), ''])
    for r in sample([(r, s) for r in ITEMS['mt'] for s in range(6) if not r[3] >> s & 1], 'sr'):
        m_, s = r; S = MT[m_[0]]['S']; rows.append(['sa/sn', f'sn:{m_[0]}.{s}', m_[0], tw(S[s]['w']) + ' = ' + seg_str(S[s]), SETS['vp'][int(m_[1][s])], ' '.join(asai_name(a['k']) for a in S[s]['asai']), m_[4] / 100])
    for r in sample([r for r in ITEMS['mt'] if not r[3] >> 6 & 1], 'sf'):
        S = MT[r[0]]['S']; rows.append(['sf', f'sf:{r[0]}', r[0], tw(S[6]['w']), SETS['fn'][int(r[1][6])], ' / '.join(SETS['fn']), r[4] / 100])
    for r in sample([(r, j) for r in ITEMS['mt'] for j in range(6)], 'th'):
        m_, j = r; S = MT[m_[0]]['S']; rows.append(['th', f'th:{m_[0]}.{j}', m_[0], f"{tw(S[j]['w'])} — {tw(S[j + 1]['w'])}", SETS['th'][int(m_[2][j])], f"{cls_of(MT[m_[0]]['pats'][j])} before {asai_name(S[j + 1]['asai'][0]['k'])}", m_[4] / 100])
    for r in sample([r for r in ITEMS['mt'] if r[3] == 0], 'al'):
        S = MT[r[0]]['S']; rows.append(['al', f'al:{r[0]}', r[0], ' '.join(seg_str(s) for s in S), ' '.join([SETS['vp'][int(x)] for x in r[1][:6]] + [SETS['fn'][int(r[1][6])]]), '', r[4] / 100])
    for r in sample(ITEMS['td'], 'td'):
        toks = LINES[r[0]][r[1]]
        rows.append(['td', f'td:{r[0]}.{r[1]}.{r[2]}', r[0], ' '.join((('[' + t + ']') if r[3] >> i & 1 else (('~' + t) if r[4] >> i & 1 else t)) for i, t in enumerate(toks)), 'மோனை' if r[2] == 'm' else 'எதுகை', 'anchor=' + toks[0] + ' [target] ~disabled', ''])
    for r in sample(ITEMS['sl'], 'sl'):
        c = GR[r[0]]['words'][r[1]]['c'][r[2]]; ds = []
        for p in r[5]: ds.append(clean(GR[p // 100]['words'][(p // 10) % 10]['c'][p % 10].get('gloss')))
        rows.append(['sl', row_code('sl', r), r[0], c['s'], clean(c.get('gloss')), ' | '.join(ds), r[3] / 100])
    with open(AUDIT, 'w', encoding='utf-8', newline='') as fh:
        for row in rows: fh.write('\t'.join(str(x).replace('\t', ' ') for x in row) + '\n')
    print(f'audit: {len(rows) - 1} rows -> {AUDIT}')

if FAILS:
    print(f'\nASSERTION FAILURES ({len(FAILS)}):')
    for x in FAILS[:60]: print('  ' + x)
    sys.exit(1)
OUT.write_text(blob, encoding='utf-8')
print(f'wrote {OUT}')
