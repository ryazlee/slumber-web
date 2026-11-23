#!/usr/bin/env python3
"""Rasterise website/public/og-image.png (1200×630).

  python3 website/scripts/build-og-image.py

Moon art lives in website/scripts/og-moon-art.png. The lockup icon is
website/public/icon-512.png, published from assets/brand/icon/light.png by
media/scripts/sync_website_brand.py. Headless Firefox by default (same as
media/scripts/marketing-promo); --renderer chrome works too.
"""

from __future__ import annotations

import argparse
import base64
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
WEB = HERE.parent
ART = HERE / 'og-moon-art.png'
ICON = WEB / 'public' / 'icon-512.png'
OUT = WEB / 'public' / 'og-image.png'

FIREFOX = Path('/Applications/Firefox.app/Contents/MacOS/firefox')
CHROME = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')

CSS_W, CSS_H = 1200, 630
SCALE = 2
TIMEOUT_S = 60

# Same overnight as website/src/components/HomeHypnogram.tsx
SEGMENTS = [
    ('core', 28),
    ('deep', 42),
    ('core', 36),
    ('rem', 48),
    ('awake', 7),
    ('core', 40),
    ('deep', 32),
    ('core', 34),
    ('rem', 44),
    ('awake', 5),
    ('core', 46),
    ('deep', 14),
    ('core', 36),
    ('rem', 32),
]


def page_html(art_data: str, icon_data: str) -> str:
    segs = ''.join(
        f'<span class="seg {kind}" style="flex:{mins}"></span>'
        for kind, mins in SEGMENTS
    )
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{
  width: {CSS_W}px;
  height: {CSS_H}px;
  overflow: hidden;
  background: #050508;
}}
body {{
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #f4f4f5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}}
.canvas {{
  position: relative;
  width: {CSS_W}px;
  height: {CSS_H}px;
  overflow: hidden;
  background: #050508 url("data:image/png;base64,{art_data}") 86% 50% / cover no-repeat;
}}
.canvas::before {{
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    #050508 0%,
    rgba(5, 5, 8, 0.7) 24%,
    rgba(5, 5, 8, 0.15) 46%,
    transparent 60%
  );
}}
.copy {{
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 0 8px 72px;
  max-width: 620px;
}}
.lockup {{
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}}
.icon {{
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: block;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.10);
}}
.wordmark {{
  font-size: 64px;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.88;
}}
.tag {{
  font-size: 28px;
  font-weight: 500;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #e4e4e7;
}}
.tag em {{
  font-style: normal;
  font-weight: 700;
  color: #c084fc;
}}
.lead {{
  margin-top: 14px;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: #a1a1aa;
  max-width: 22em;
}}
.bar {{
  display: flex;
  width: 360px;
  height: 10px;
  margin-top: 22px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  box-shadow: 0 8px 24px rgba(168, 85, 199, 0.22);
}}
.seg {{ height: 100%; min-width: 0; }}
.seg.core {{ background: #5e9cf5; }}
.seg.deep {{ background: #8b5cf6; }}
.seg.rem {{ background: #ec4899; }}
.seg.awake {{ background: #636366; }}
.foot {{
  margin-top: 16px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #71717a;
}}
</style>
</head>
<body>
<div class="canvas">
  <div class="copy">
    <div class="lockup">
      <img class="icon" src="data:image/png;base64,{icon_data}" width="56" height="56" alt="">
      <div class="wordmark">Slumber</div>
    </div>
    <p class="tag">Sleep socially, <em>together.</em></p>
    <p class="lead">Post last night and see how your friends actually slept.</p>
    <div class="bar">{segs}</div>
    <p class="foot">Free on iOS &amp; Android</p>
  </div>
</div>
</body>
</html>'''


def render_firefox(html: str, dest: Path, tmp: Path) -> None:
    html = html.replace('<style>', f'<style>html {{ zoom:{SCALE}; }}', 1)
    src = tmp / 'og.html'
    src.write_text(html)
    shot = tmp / 'og.png'
    profile = tmp / 'firefox-profile'
    profile.mkdir(exist_ok=True)
    subprocess.run(
        [
            str(FIREFOX), '--headless', '--no-remote',
            '--profile', str(profile),
            '--screenshot', str(shot),
            f'--window-size={CSS_W * SCALE},{CSS_H * SCALE}',
            f'file://{src}',
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        timeout=TIMEOUT_S,
    )
    if not shot.exists():
        raise SystemExit('Firefox produced no screenshot')
    shutil.move(str(shot), str(dest))


def render_chrome(html: str, dest: Path, tmp: Path) -> None:
    src = tmp / 'og.html'
    src.write_text(html)
    shot = tmp / 'og.png'
    proc = subprocess.Popen(
        [
            str(CHROME), '--headless', '--disable-gpu', '--no-first-run',
            '--no-default-browser-check', '--hide-scrollbars',
            '--virtual-time-budget=4000',
            f'--force-device-scale-factor={SCALE}',
            f'--window-size={CSS_W},{CSS_H}',
            f'--screenshot={shot}',
            f'--user-data-dir={tmp / "chrome"}',
            f'file://{src}',
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    deadline = time.time() + TIMEOUT_S
    last = -1
    while time.time() < deadline:
        time.sleep(0.4)
        if shot.exists():
            size = shot.stat().st_size
            if size > 0 and size == last:
                break
            last = size
    proc.kill()
    proc.wait()
    if not shot.exists():
        raise SystemExit('Chrome produced no screenshot')
    shutil.move(str(shot), str(dest))


def downsample(src: Path, dest: Path) -> None:
    im = Image.open(src).convert('RGB')
    if im.size != (CSS_W, CSS_H):
        im = im.resize((CSS_W, CSS_H), Image.Resampling.LANCZOS)
    im.save(dest, 'PNG', optimize=True)


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--renderer', choices=('firefox', 'chrome'), default='firefox')
    ap.add_argument('--out', type=Path, default=OUT)
    args = ap.parse_args()

    browser = FIREFOX if args.renderer == 'firefox' else CHROME
    if not browser.exists():
        raise SystemExit(f'{args.renderer} not found at {browser}')
    if not ART.exists():
        raise SystemExit(f'missing moon art: {ART}')
    if not ICON.exists():
        raise SystemExit(f'missing app icon: {ICON}')

    art_data = base64.b64encode(ART.read_bytes()).decode()
    icon_data = base64.b64encode(ICON.read_bytes()).decode()
    html = page_html(art_data, icon_data)
    render = render_firefox if args.renderer == 'firefox' else render_chrome

    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td)
        raw = tmp / 'og-raw.png'
        render(html, raw, tmp)
        downsample(raw, args.out.resolve())

    print(f'wrote {args.out.resolve()}')


if __name__ == '__main__':
    main()
