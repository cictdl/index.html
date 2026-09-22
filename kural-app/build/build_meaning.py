# -*- coding: utf-8 -*-
"""build_meaning.py — the பொருள் தேடல் (search by meaning) pack.

  py build/build_meaning.py prune   # once per model: vocabulary-pruned model + tokenizer → meaning/
  py build/build_meaning.py embed   # after any data/ch change: passage vectors → meaning/vectors.bin …
  py build/build_meaning.py pack    # rewrite the pack files from the saved vectors (no re-embedding)
  py build/build_meaning.py eval    # meaning vs word search on build/meaning_eval.json → build/meaning_eval.md

Model: intfloat/multilingual-e5-small (MIT), ONNX int8 export Xenova/multilingual-e5-small at a pinned
revision, downloaded to WORK (outside the app). The phone only encodes the reader's question; every passage
vector is computed here, with the very same pruned ONNX file and tokenizer the phone runs, so the two sides
agree bit for bit on tokens.

Pruning: XLM-R's 250k-piece vocabulary is half CJK / Cyrillic / Greek / Thai … that no reader of this app
types. We keep every piece made only of ASCII, the Indic scripts, Arabic (Urdu, Kashmiri, Sindhi), Meetei
Mayek and Ol Chiki, every single-character piece of any script, and every piece the full tokenizer uses on
the corpus. Viterbi over a subset that still contains the full-vocabulary optimum returns that same optimum,
so every passage tokenises identically — `prune` asserts it on all passages and the test questions.
"""
import hashlib, json, math, re, struct, sys, time
from pathlib import Path
import numpy as np
sys.stdout.reconfigure(encoding="utf-8")
APP = Path(__file__).resolve().parents[1]
WORK = Path(r"D:/DL file/kural-meaning-work/model")          # the full downloaded model (not shipped)
OUT = APP / "meaning"
MODEL_ID, MODEL_REV = "Xenova/multilingual-e5-small", "761b726dd34fb83930e26aab4e9ac3899aa1fa78"
DIM = 384

# ── the passages ───────────────────────────────────────────────────────────
def streams():
    meta = json.load(open(APP / "data/meta.json", encoding="utf-8"))
    # verse, the two Tamil prose commentaries, English prose, then every translation stream in the app's order
    return ["ta", "ta_mv", "tac", "en_p"] + [c for c in meta["langOrder"] if c not in ("ta", "tac")]

def passages():
    S = streams(); out = []
    for i in range(1, 134):
        ch = json.load(open(APP / f"data/ch/{i:03d}.json", encoding="utf-8"))
        for k in ch["kurals"]:
            n = k["n"]
            for si, s in enumerate(S):
                if s == "ta": txt = f"{k['l1']} {k['l2']}"
                elif s == "ta_mv": txt = k["prose"].get("ta_mv", "")
                elif s == "tac": txt = k["prose"].get("tac", "") or " ".join(k["tr"].get("tac", []))
                elif s == "en_p": txt = k["prose"].get("en", "")
                else: txt = " ".join(x for x in (k["tr"].get(s) or []) if x)
                txt = re.sub(r"\s+", " ", txt or "").strip()
                if txt: out.append((n, si, txt))
    return S, out

def eval_queries():
    p = APP / "build/meaning_eval.json"
    return json.load(open(p, encoding="utf-8")) if p.exists() else {"queries": []}

# ── pruning ────────────────────────────────────────────────────────────────
KEEP_RANGES = [(0x20, 0x7E), (0x0900, 0x0DFF), (0x0600, 0x06FF), (0x0750, 0x077F), (0xFB50, 0xFDFF), (0xFE70, 0xFEFF),
               (0xABC0, 0xABFF), (0x1C50, 0x1C7F), (0x200C, 0x200D), (0x2010, 0x2027), (0x2581, 0x2581), (0x0964, 0x0965)]
def keep_piece(p):
    body = p.replace("▁", "")
    if len(body) <= 1: return True
    return all(any(a <= ord(ch) <= b for a, b in KEEP_RANGES) for ch in body)

def prune():
    from tokenizers import Tokenizer
    import onnx
    from onnx import numpy_helper
    tj = json.load(open(WORK / "tokenizer.json", encoding="utf-8"))
    vocab = tj["model"]["vocab"]
    full = Tokenizer.from_file(str(WORK / "tokenizer.json"))
    S, P = passages()
    Q = [q["q"] for q in eval_queries()["queries"]]
    keep = {i for i, (p, _) in enumerate(vocab) if keep_piece(p)} | {0, 1, 2, 3, len(vocab) - 1}
    used = set()
    texts = ["passage: " + t for _, _, t in P] + ["query: " + q for q in Q]
    for b in range(0, len(texts), 2000):
        for e in full.encode_batch(texts[b:b + 2000]): used.update(e.ids)
    keep |= used
    order = sorted(keep); remap = {o: i for i, o in enumerate(order)}
    print(f"vocabulary {len(vocab)} → {len(order)} pieces ({len(used)} used by the corpus)")
    tj2 = json.loads(json.dumps(tj))
    tj2["model"]["vocab"] = [vocab[o] for o in order]
    tj2["model"]["unk_id"] = remap[tj["model"]["unk_id"]]
    for a in tj2["added_tokens"]: a["id"] = remap[a["id"]]
    for v in tj2["post_processor"]["special_tokens"].values(): v["ids"] = [remap[x] for x in v["ids"]]
    OUT.mkdir(exist_ok=True)
    (OUT / "tokenizer.json").write_text(json.dumps(tj2, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    cfg = json.load(open(WORK / "tokenizer_config.json", encoding="utf-8"))
    (OUT / "tokenizer_config.json").write_text(json.dumps(cfg, ensure_ascii=False), encoding="utf-8")
    # identical tokenisation, remapped
    small = Tokenizer.from_file(str(OUT / "tokenizer.json"))
    bad = 0
    for b in range(0, len(texts), 2000):
        A = full.encode_batch(texts[b:b + 2000]); B = small.encode_batch(texts[b:b + 2000])
        for a, bb in zip(A, B):
            if [remap[x] for x in a.ids] != bb.ids: bad += 1
    assert bad == 0, f"{bad} texts tokenise differently after pruning"
    print(f"tokenisation identical on {len(texts)} texts")
    m = onnx.load(str(WORK / "onnx/model_quantized.onnx"))
    for t in m.graph.initializer:
        if t.name == "embeddings.word_embeddings.weight_quantized":
            W = numpy_helper.to_array(t); W2 = W[np.array(order)]
            t.CopyFrom(numpy_helper.from_array(W2, t.name)); break
    else: raise SystemExit("embedding initializer not found")
    onnx.save(m, str(OUT / "model.onnx"))
    print("model.onnx", round((OUT / "model.onnx").stat().st_size / 1e6, 1), "MB")
    # same vectors: full vs pruned model on a sample
    a = Encoder(WORK / "onnx/model_quantized.onnx", WORK / "tokenizer.json"); b = Encoder(OUT / "model.onnx", OUT / "tokenizer.json")
    smp = texts[::400][:120]
    d = float(np.abs(a.encode(smp) - b.encode(smp)).max())
    assert d < 1e-5, d
    print(f"pruned model reproduces the full model on {len(smp)} samples (max |Δ| {d:.2e})")

# ── encoder (the phone does exactly this in JS) ─────────────────────────────
class Encoder:
    def __init__(self, model, tok):
        import onnxruntime as ort
        from tokenizers import Tokenizer
        so = ort.SessionOptions(); so.intra_op_num_threads = 0
        self.s = ort.InferenceSession(str(model), so, providers=["CPUExecutionProvider"])
        self.t = Tokenizer.from_file(str(tok)); self.t.enable_truncation(512)
    def encode(self, texts):
        encs = self.t.encode_batch(texts); L = max(len(e.ids) for e in encs)
        ids = np.ones((len(encs), L), np.int64); mask = np.zeros((len(encs), L), np.int64)
        for i, e in enumerate(encs): ids[i, :len(e.ids)] = e.ids; mask[i, :len(e.ids)] = 1
        h = self.s.run(None, {"input_ids": ids, "attention_mask": mask, "token_type_ids": np.zeros_like(ids)})[0]
        v = (h * mask[..., None]).sum(1) / mask.sum(1, keepdims=True)
        return v / np.linalg.norm(v, axis=1, keepdims=True)

def sha(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()[:16]

def embed():
    S, P = passages()
    enc = Encoder(OUT / "model.onnx", OUT / "tokenizer.json")
    order = sorted(range(len(P)), key=lambda i: len(P[i][2]))     # length-bucketed batches
    V = np.zeros((len(P), DIM), np.float32); t0 = time.time()
    for b in range(0, len(order), 64):
        idx = order[b:b + 64]
        V[idx] = enc.encode(["passage: " + P[i][2] for i in idx])
        if b % 6400 == 0: print(f"  {b}/{len(P)}  {time.time() - t0:.0f}s", flush=True)
    np.save(APP.parent / "kural-meaning-work/vectors_f32.npy", V)
    write_pack(S, P, V)

def repack():
    S, P = passages(); write_pack(S, P, np.load(APP.parent / "kural-meaning-work/vectors_f32.npy"))

def quant(V):
    s = np.abs(V).max(1) / 127.0
    return np.clip(np.round(V / s[:, None]), -127, 127).astype(np.int8), s.astype(np.float32)

def write_pack(S, P, V):
    import shutil
    shutil.copyfile(WORK.parent / "ort/ort-wasm-simd-threaded.wasm", OUT / "ort-wasm-simd-threaded.wasm")   # onnxruntime-web 1.23.2
    q, s = quant(V)
    (OUT / "vectors.bin").write_bytes(q.tobytes())
    units = np.zeros(len(P), dtype=[("n", "<u2"), ("s", "u1")]); units["n"] = [p[0] for p in P]; units["s"] = [p[1] for p in P]
    (OUT / "units.bin").write_bytes(units.tobytes() + s.tobytes())
    rev = sha(OUT / "vectors.bin") + sha(OUT / "units.bin")
    xp = APP / "build/meaning_xlingual.json"   # per-language hit@10 from `xlingual`; the app names the weak languages
    xl = json.load(open(xp, encoding="utf-8")) if xp.exists() else {}
    files = {f: {"bytes": (OUT / f).stat().st_size, "sha": sha(OUT / f)} for f in ("model.onnx", "tokenizer.json", "tokenizer_config.json", "vectors.bin", "units.bin", "ort-wasm-simd-threaded.wasm")}
    man = {"model": MODEL_ID, "revision": MODEL_REV, "license": "MIT (intfloat/multilingual-e5-small)", "dim": DIM,
           "count": len(P), "streams": S, "xlingual": xl, "prefix": {"query": "query: ", "passage": "passage: "}, "rev": rev, "files": files}
    (OUT / "meaning.json").write_text(json.dumps(man, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"pack: {len(P)} passages · {sum(f['bytes'] for f in files.values()) / 1e6:.1f} MB · rev {rev}")

# ── evaluation: meaning search against plain word search ────────────────────
def load_pack():
    man = json.load(open(OUT / "meaning.json", encoding="utf-8")); N = man["count"]
    q = np.frombuffer((OUT / "vectors.bin").read_bytes(), np.int8).reshape(N, DIM).astype(np.float32)
    ub = (OUT / "units.bin").read_bytes()
    units = np.frombuffer(ub[:N * 3], dtype=[("n", "<u2"), ("s", "u1")]); sc = np.frombuffer(ub[N * 3:], np.float32)
    return man, q * sc[:, None], units

MEAN_K = 5   # as in app.js meanRank: a kural's score is the mean of its five best passages
def rank_meaning(qv, M, units, k=10):
    sims = M @ qv; n = units["n"].astype(int); best = {}
    for i in np.argsort(-sims):
        b = best.setdefault(n[i], [])
        if len(b) < MEAN_K: b.append(float(sims[i]))
    return sorted(best, key=lambda x: -sum(best[x]) / MEAN_K)[:k]

def word_tokens(t): return [w for w in re.split(r"[^\w\u0B80-\u0BFF\u0900-\u0DFF]+", t.lower()) if len(w) > 1]

_KW = {}
def rank_words(q, P, k=10):
    # a fair keyword baseline (fairer than the app's own word search, which matches the whole phrase and so finds
    # nothing for a sentence-length question): kurals ranked by how many question words (≥ 3 letters, loose
    # suffix) occur in any of their texts
    if not _KW:
        for n, _, t in P: _KW.setdefault(n, set()).update(word_tokens(t))
    qs = [w for w in word_tokens(q) if len(w) >= 3]
    if not qs: return []
    sc = {}
    for n, ws in _KW.items():
        h = sum(any(w.startswith(x[:max(3, len(x) - 2)]) for w in ws) for x in qs)
        if h: sc[n] = h
    return [n for n, _ in sorted(sc.items(), key=lambda x: (-x[1], x[0]))][:k]

def evaluate():
    E = eval_queries()["queries"]
    S, P = passages(); man, M, units = load_pack()
    enc = Encoder(OUT / "model.onnx", OUT / "tokenizer.json")
    QV = enc.encode(["query: " + e["q"] for e in E])
    rows = []; agg = {}
    for e, qv in zip(E, QV):
        rel = set(e["kurals"]) | {n for c in e.get("chapters", []) for n in range((c - 1) * 10 + 1, c * 10 + 1)}
        mr = rank_meaning(qv, M, units); wr = rank_words(e["q"], P)
        hm = any(n in rel for n in mr[:10]); hw = any(n in rel for n in wr[:10])
        rrm = next((1 / (i + 1) for i, n in enumerate(mr) if n in rel), 0); rrw = next((1 / (i + 1) for i, n in enumerate(wr) if n in rel), 0)
        key = (e["lang"], e["kind"]); a = agg.setdefault(key, [0, 0, 0, 0.0, 0.0]); a[0] += 1; a[1] += hm; a[2] += hw; a[3] += rrm; a[4] += rrw
        rows.append((e, mr[:5], wr[:5], hm, hw))
    lines = ["# பொருள் தேடல் — evaluation", "", f"{len(E)} questions (machine-drafted, provisional until CICT teachers write theirs) · pack rev {man['rev']} · hit@10 = a relevant kural in the top ten · the app's own phrase search scores 0% on these sentence-length questions", "",
             "| language | kind | n | meaning hit@10 | keyword hit@10 | meaning MRR | keyword MRR |", "|---|---|---|---|---|---|---|"]
    tot = [0, 0, 0, 0.0, 0.0]
    for (l, kd), a in sorted(agg.items()):
        lines.append(f"| {l} | {kd} | {a[0]} | {a[1] / a[0]:.0%} | {a[2] / a[0]:.0%} | {a[3] / a[0]:.2f} | {a[4] / a[0]:.2f} |")
        for i in range(5): tot[i] += a[i]
    lines.append(f"| **all** | | {tot[0]} | **{tot[1] / tot[0]:.0%}** | **{tot[2] / tot[0]:.0%}** | {tot[3] / tot[0]:.2f} | {tot[4] / tot[0]:.2f} |")
    lines += ["", "## Every question", "", "| q | lang | expected | meaning top 5 | keyword top 5 |", "|---|---|---|---|---|"]
    for e, mr, wr, hm, hw in rows:
        exp = ",".join(map(str, e["kurals"])) + (" ch " + ",".join(map(str, e.get("chapters", []))) if e.get("chapters") else "")
        lines.append(f"| {e['q']} | {e['lang']} | {exp} | {'✓' if hm else '✗'} {mr} | {'✓' if hw else '✗'} {wr} |")
    (APP / "build/meaning_eval.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[:len(agg) + 7]))
    return tot

def xlingual():
    """Leave-one-language-out: each language's translation of a kural, used as the question, with that
    language's own passages removed — how well does the question reach the right kural through the others?"""
    S, P = passages(); man, M, units = load_pack()
    V = np.load(APP.parent / "kural-meaning-work/vectors_f32.npy")
    rng = np.random.default_rng(7); res = {}
    by = {}
    for i, (n, si, _) in enumerate(P): by.setdefault(si, []).append(i)
    for si, idx in by.items():
        pick = rng.choice(idx, size=min(150, len(idx)), replace=False); mask = units["s"] != si
        Mm = M[mask]; um = units[mask]; hit = 0
        for i in pick:
            sims = Mm @ V[i]; top = []
            for j in np.argsort(-sims)[:200]:
                n = int(um[j]["n"])
                if n not in top: top.append(n)
                if len(top) >= 10: break
            hit += P[i][0] in top
        res[S[si]] = round(hit / len(pick), 3)
    (APP / "build/meaning_xlingual.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(res, ensure_ascii=False))

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    {"prune": prune, "embed": embed, "pack": repack, "eval": evaluate, "xlingual": xlingual}.get(cmd, lambda: print(__doc__))()
