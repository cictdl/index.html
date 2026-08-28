# -*- coding: utf-8 -*-
"""make_single_file.py — bundle the whole app into one downloadable .html file.

Everything the reader needs is inside the file: all 1,330 kurals, the 30 translation
streams, the three Tamil உரை + English prose, the word-by-word இலக்கணக்குறிப்பு layer,
the யாப்பு scansion of every couplet, the tag concordance, the bilingual glossary, the
Noto faces for all 22 scripts, and the CICT mark. It works from `file://`, from a USB
stick, or as an email attachment — with no server, no network and no install.

The data is gzip-compressed and base64-embedded; the page inflates it in the browser with
DecompressionStream. Search indices are derived in-memory rather than embedded, so nothing
is stored twice.

Not included (and the app degrades cleanly, exactly as it does when a pack is absent):
the 444 MB of audio. Recitation and commentary fall back to the device's own speech voices.

Run:  py build/make_single_file.py [-o OUT.html]
"""
import argparse, base64, gzip, json, re, sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

def load(p):
    return json.loads(p.read_text(encoding="utf-8"))

def data_uri(p, mime):
    return f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()

def build_payload():
    """Everything the app reads, keyed by the same URL strings app.js uses."""
    pay = {
        "data/meta.json": load(DATA / "meta.json"),
        "data/glossary.json": load(DATA / "glossary.json"),
        "data/tags.json": load(DATA / "tags.json"),
        # scribal readings travel offline; the leaf images are fetched from Zenodo on demand
        "data/manuscript.json": load(DATA / "manuscript.json"),
        # no bundled audio in the single file — the app falls back to on-device speech
        "data/audio.json": {"chapters": [], "tts": {}},
    }
    for i in range(1, 134):
        pay[f"data/ch/{i:03d}.json"] = load(DATA / "ch" / f"{i:03d}.json")
        pay[f"data/gr/{i:03d}.json"] = load(DATA / "gr" / f"{i:03d}.json")
    return pay

def inline_fonts():
    """fonts.css with the script subsets embedded as data: URIs.

    The Latin/latin-ext subsets are dropped — the app sets system-ui for Latin text —
    which roughly halves the font weight without changing what the reader sees.
    """
    css = (ROOT / "assets" / "fonts.css").read_text(encoding="utf-8")
    blocks = re.split(r"(?=/\* [a-z-]+ \*/\s*@font-face)", css)
    out, kept, dropped, total = [], 0, 0, 0
    for b in blocks:
        m = re.match(r"/\* ([a-z-]+) \*/", b.strip())
        if not m:
            out.append(b)
            continue
        if m.group(1) in ("latin", "latin-ext"):
            dropped += 1
            continue
        def sub(mm):
            nonlocal total
            f = ROOT / "assets" / mm.group(1)
            total += f.stat().st_size
            return "url(" + data_uri(f, "font/woff2") + ")"
        out.append(re.sub(r"url\((fonts/[^)]+)\)", sub, b))
        kept += 1
    print(f"fonts: {kept} script subsets embedded ({total/1024:.0f} KB raw), {dropped} latin subsets dropped")
    return "".join(out)

RESOLVER = r"""
// ── embedded data source ─────────────────────────────────────────────────────
// Inflates the gzip payload below, then answers app.js's data reads from memory.
// Search indices are derived here rather than stored, so no text is duplicated.
window.__KURAL_SRC = (function () {
  let store = null;
  const derived = {};
  async function inflate() {
    const b64 = document.getElementById('kural-payload').textContent.trim();
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('This browser cannot decompress the embedded book (DecompressionStream is missing). Please use a current Chrome, Edge, Firefox or Safari.');
    }
    const ds = new DecompressionStream('gzip');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    return JSON.parse(await new Response(stream).text());
  }
  function allKurals() {
    const out = [];
    for (let i = 1; i <= 133; i++) out.push(...store['data/ch/' + String(i).padStart(3, '0') + '.json'].kurals);
    return out;
  }
  // Rebuild data/search/<code>.json on demand: [[n, line1, line2], …]
  function searchIndex(code) {
    if (derived[code]) return derived[code];
    const ks = allKurals();
    let arr;
    if (code === 'ta') arr = ks.map(k => [k.n, k.l1, k.l2]);
    else if (code === 'translit') arr = ks.map(k => [k.n, (k.tl || [])[0] || '', (k.tl || [])[1] || '']);
    else if (code === 'prose-ta') arr = ks.map(k => [k.n, k.prose.ta_mv || '', k.prose.ta_sp || '']);
    else if (code === 'prose-en') arr = ks.map(k => [k.n, k.prose.en || '', '']);
    else if (code.startsWith('prose-')) { const c = code.slice(6); arr = ks.filter(k => k.prose[c]).map(k => [k.n, k.prose[c], '']); }
    else arr = ks.filter(k => k.tr[code]).map(k => [k.n, k.tr[code][0], k.tr[code][1] || '']);
    return (derived[code] = arr);
  }
  return {
    json: async function (url) {
      if (!store) store = await inflate();
      const m = /^data\/search\/(.+)\.json$/.exec(url);
      if (m) return searchIndex(m[1]);
      if (url in store) return store[url];
      throw new Error('not in this file: ' + url);
    },
  };
})();
"""

BOOT_NOTE = r"""
// Friendly failure if the payload cannot be read (very old browser, truncated download).
window.addEventListener('unhandledrejection', function (e) {
  const m = document.getElementById('main');
  if (m && !m.textContent.trim()) {
    m.innerHTML = '<div class="card"><h2>⚠️</h2><p>' +
      String((e.reason && e.reason.message) || e.reason).replace(/[<>&]/g, '') + '</p></div>';
  }
});
"""

def preflight():
    """Refuse to bundle source that will not parse in the browser."""
    sys.path.insert(0, str(ROOT / "build"))
    import lint_js
    bad = 0
    for f in ("app.js", "sw.js"):
        errs = lint_js.scan((ROOT / f).read_text(encoding="utf-8"), f)
        for e in errs:
            print("x " + e); bad += 1
    if bad:
        sys.exit("aborting: " + str(bad) + " syntax problem(s) — nothing written")
    print("preflight: app.js, sw.js parse cleanly")


def main():
    preflight()
    ap = argparse.ArgumentParser()
    ap.add_argument("-o", "--out", default=str(ROOT / "Tirukkural-22-Languages.html"))
    args = ap.parse_args()

    payload = build_payload()
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    gz = gzip.compress(raw, 9)
    b64 = base64.b64encode(gz).decode()
    print(f"payload: {len(raw)/1e6:.1f} MB JSON → {len(gz)/1e6:.1f} MB gzip → {len(b64)/1e6:.1f} MB base64")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    js = (ROOT / "app.js").read_text(encoding="utf-8")
    fonts = inline_fonts()
    logo = data_uri(ROOT / "assets" / "cict-logo.png", "image/png")
    icon = data_uri(ROOT / "assets" / "favicon.png", "image/png")

    # strip the external references — everything is inline from here on
    html = re.sub(r'\n<link rel="preload"[^>]*>', "", html)
    html = html.replace('<link rel="stylesheet" href="assets/fonts.css">', f"<style>\n{fonts}\n</style>")
    html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>\n{css}\n</style>")
    html = re.sub(r'\n<link rel="manifest"[^>]*>', "", html)
    html = html.replace('<link rel="icon" href="assets/favicon.png" type="image/png">',
                        f'<link rel="icon" href="{icon}" type="image/png">')
    html = re.sub(r'\n<link rel="apple-touch-icon"[^>]*>', "", html)
    html = html.replace('src="assets/cict-logo.png"', f'src="{logo}"')
    html = html.replace(
        '<script src="app.js" defer></script>',
        '<script type="application/octet-stream" id="kural-payload">' + b64 + "</script>\n"
        "<script>" + RESOLVER + BOOT_NOTE + "</script>\n"
        "<script>\n" + js + "\n</script>")
    # the single file has no icons/manifest to point at
    html = html.replace("icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', ", "")

    out = Path(args.out)
    out.write_text(html, encoding="utf-8")
    mb = out.stat().st_size / 1e6
    print(f"\n→ {out}  ({mb:.1f} MB)")
    # No markup may point outside the file. (Strings inside app.js are payload keys,
    # resolved from memory, so only real src/href/url attributes are checked.)
    markup = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.S)
    markup = re.sub(r"data:[a-z/+.-]+;base64,[A-Za-z0-9+/=]+", "DATAURI", markup)
    ext = (re.findall(r'(?:src|href)="(?!DATAURI|#)([^"]+)"', markup)
           + re.findall(r'https?://[^\s"\'()]+', markup))
    print("   external references in markup:", ext or "none")

if __name__ == "__main__":
    main()
