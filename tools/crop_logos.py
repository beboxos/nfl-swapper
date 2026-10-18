"""Découpe les 32 logos depuis tools/source-logos.png -> www/assets/logos/<id>.png (fond transparent)."""
import sys
from collections import deque
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "source-logos.png"
OUT = ROOT / "www" / "assets" / "logos"

COLS = [75, 163, 252, 340, 428, 516]
ROWS = [92, 180, 266, 352, 440, 525]
GRID = [
    ["den", "phi", "nyg", "was", "lv", "jax"],
    ["sea", "kc", "min", "ari", "buf", "no"],
    ["cin", "bal", None, None, "pit", "lac"],
    ["atl", "sf", None, None, "ten", "chi"],
    ["cle", "hou", "tb", "det", "ne", "mia"],
    ["car", "gb", "lar", "nyj", "dal", "ind"],
]
HALF = 46
SIZE = 160  # sortie carrée


def is_bg(p):
    r, g, b = p[:3]
    return min(r, g, b) > 222


def is_grey_overlay(p):
    # badge "EDITORIAL PHOTO" et rond gris : gris neutre clair/moyen
    r, g, b = p[:3]
    return max(r, g, b) - min(r, g, b) < 14 and 120 < (r + g + b) / 3 < 236


def is_badge(p):
    r, g, b = p[:3]
    return max(r, g, b) - min(r, g, b) < 24 and (r + g + b) / 3 > 85


def crop(im, team, cx, cy):
    box = (cx - HALF, cy - HALF, cx + HALF, cy + HALF)
    reg = im.crop(box).convert("RGBA")
    w, h = reg.size
    px = reg.load()
    for y in range(h):
        for x in range(w):
            ix, iy = box[0] + x, box[1] + y
            in_badge = 28 <= ix <= 178 and 52 <= iy <= 98
            if team == "ind" and is_grey_overlay(px[x, y]):
                px[x, y] = (255, 255, 255, 255)
            elif team in ("den", "phi") and in_badge and is_badge(px[x, y]):
                px[x, y] = (255, 255, 255, 255)
    # composantes non-fond
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or is_bg(px[x, y]):
                continue
            q = deque([(x, y)]); seen[y][x] = True; pts = []
            while q:
                a, b = q.popleft(); pts.append((a, b))
                for da, db in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    na, nb = a + da, b + db
                    if 0 <= na < w and 0 <= nb < h and not seen[nb][na] and not is_bg(px[na, nb]):
                        seen[nb][na] = True; q.append((na, nb))
            comps.append(pts)
    comps.sort(key=len, reverse=True)
    keep = set()
    for i, pts in enumerate(comps):
        if len(pts) < 6:
            continue
        mx = sum(p[0] for p in pts) / len(pts); my = sum(p[1] for p in pts) / len(pts)
        touches = any(p[0] in (0, w - 1) or p[1] in (0, h - 1) for p in pts)
        central = abs(mx - w / 2) < w * 0.36 and abs(my - h / 2) < h * 0.36
        if i == 0 or (central and not (touches and len(pts) < len(comps[0]) * 0.5)):
            keep.update(pts)
    # fond extérieur = flood fill depuis les bords sur pixels clairs ; intérieur blanc conservé
    outside = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        q.append((x, 0)); q.append((x, h - 1))
    for y in range(h):
        q.append((0, y)); q.append((w - 1, y))
    while q:
        a, b = q.popleft()
        if not (0 <= a < w and 0 <= b < h) or outside[b][a] or (a, b) in keep:
            continue
        outside[b][a] = True
        q.extend(((a + 1, b), (a - 1, b), (a, b + 1), (a, b - 1)))
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    xs, ys = [], []
    for y in range(h):
        for x in range(w):
            if not outside[y][x]:
                r, g, b, _ = px[x, y]
                # adoucit le liseré blanc anti-aliasé
                bright = min(r, g, b)
                a = 255 if (x, y) in keep else max(0, min(255, int((255 - bright) * 6)))
                if (x, y) not in keep and bright > 222:
                    a = 255  # blanc intérieur du logo
                op[x, y] = (r, g, b, a)
                xs.append(x); ys.append(y)
    bb = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    out = out.crop(bb)
    side = int(max(out.size) * 1.08)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(out, ((side - out.size[0]) // 2, (side - out.size[1]) // 2))
    return sq.resize((SIZE, SIZE), Image.LANCZOS)


def main():
    im = Image.open(SRC).convert("RGB")
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.new("RGBA", (SIZE * 8, SIZE * 4), (40, 90, 40, 255))
    n = 0
    for r, row in enumerate(GRID):
        for c, team in enumerate(row):
            if not team:
                continue
            img = crop(im, team, COLS[c], ROWS[r])
            img.save(OUT / f"{team}.png", optimize=True)
            sheet.alpha_composite(img, ((n % 8) * SIZE, (n // 8) * SIZE))
            n += 1
    if len(sys.argv) > 1:
        sheet.save(sys.argv[1])
    print("logos:", n)


if __name__ == "__main__":
    main()
