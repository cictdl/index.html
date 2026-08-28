# -*- coding: utf-8 -*-
"""make_icons.py — PWA icons from assets/cict-logo.png (plain + maskable + favicon)."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
logo = Image.open(ROOT / "assets" / "cict-logo.png").convert("RGBA")
out = ROOT / "assets"

def make(size, maskable=False):
    bg = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(bg)
    if maskable:
        d.rectangle([0, 0, size, size], fill=(250, 247, 242, 255))
        pad = int(size * 0.16)
    else:
        d.ellipse([0, 0, size - 1, size - 1], fill=(250, 247, 242, 255))
        pad = int(size * 0.06)
    inner = size - 2 * pad
    lg = logo.resize((inner, inner), Image.LANCZOS)
    bg.alpha_composite(lg, (pad, pad))
    return bg

for s in (192, 512):
    make(s).save(out / f"icon-{s}.png")
    make(s, maskable=True).save(out / f"icon-maskable-{s}.png")
make(64).save(out / "favicon.png")
make(180).save(out / "apple-touch-icon.png")
print("icons written to", out)
