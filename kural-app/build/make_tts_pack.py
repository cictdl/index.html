# -*- coding: utf-8 -*-
"""make_tts_pack.py — pre-render an offline audio pack with Windows OneCore voices.

  py build/make_tts_pack.py ta        # Tamil recitation of the couplet (Microsoft Valluvar)
  py build/make_tts_pack.py en        # English couplet (en-IN voice)
  py build/make_tts_pack.py hi        # Hindi couplet (hi-IN voice)
  py build/make_tts_pack.py ta --prose   # Tamil உரை (மு.வ.) commentary
  py build/make_tts_pack.py en --prose   # English prose explanation

Writes audio/tts/<lang>[-prose]/NNNN.mp3 (22.05 kHz mono, 32 kb/s) — ~25 KB per clip.
The app uses these when present (cache-first) and falls back to on-device speech otherwise.
"""
import json, sys, subprocess, html
from pathlib import Path
import imageio_ffmpeg
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
VOICES = {"ta": "ta-IN", "en": "en-IN", "hi": "hi-IN"}
RATE = {"ta": 0.85, "en": 0.9, "hi": 0.9}

def main():
    lang = sys.argv[1]
    prose = "--prose" in sys.argv
    tag = f"{lang}-prose" if prose else lang
    out = ROOT / "audio" / "tts" / tag
    out.mkdir(parents=True, exist_ok=True)
    items = []
    for p in sorted((DATA / "ch").glob("*.json")):
        ch = json.load(open(p, encoding="utf-8"))
        for k in ch["kurals"]:
            if prose:
                text = k["prose"]["ta_mv"] if lang == "ta" else k["prose"].get(lang, "")
                if not text and lang in k["tr"]:
                    text = " ".join(k["tr"][lang])
                parts = [text]
            elif lang == "ta":
                parts = [k["l1"], k["l2"]]
            else:
                parts = k["tr"].get(lang, ["", ""])
            parts = [html.escape(x) for x in parts if x]
            if not parts:
                continue
            body = '<break time="450ms"/>'.join(parts)
            ssml = (f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="{VOICES[lang]}">'
                    f'{body}</speak>')
            items.append({"id": f"{k['n']:04d}", "ssml": ssml})
    man = ROOT / "build" / f"_tts_manifest_{tag}.json"
    json.dump(items, open(man, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"{len(items)} items → {out}")
    subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ROOT / "build" / "tts_pack.ps1"),
                    "-Manifest", str(man), "-Lang", VOICES[lang], "-OutDir", str(out), "-Rate", str(RATE[lang])], check=True)
    ff = imageio_ffmpeg.get_ffmpeg_exe()
    n = 0
    for wav in sorted(out.glob("*.wav")):
        mp3 = wav.with_suffix(".mp3")
        subprocess.run([ff, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
                        "-ac", "1", "-ar", "22050", "-b:a", "32k", str(mp3)], check=True)
        wav.unlink(); n += 1
    print(f"encoded {n} clips; total {len(list(out.glob('*.mp3')))} mp3 in {out}")

if __name__ == "__main__":
    main()
