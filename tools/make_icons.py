"""Génère les icônes de l'app (PWA + Android) : ballon de football sur fond de stade."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "www" / "assets" / "icons"
ANDROID = ROOT / "resources" / "android"


def draw_icon(size, round_mask=False, pad=0.0):
    S = size * 4  # sur-échantillonnage pour l'anticrénelage
    im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    m = int(S * pad)
    box = (m, m, S - m, S - m)
    if round_mask:
        d.ellipse(box, fill=(11, 21, 48, 255))
    else:
        d.rounded_rectangle(box, radius=int(S * 0.22), fill=(11, 21, 48, 255))
    # terrain
    inner = S - 2 * m
    fy = m + int(inner * 0.62)
    field = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    fd = ImageDraw.Draw(field)
    for i in range(6):
        col = (47, 125, 50, 255) if i % 2 else (53, 138, 56, 255)
        fd.rectangle((0, fy + i * inner * 0.07, S, fy + (i + 1) * inner * 0.07), fill=col)
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    if round_mask:
        md.ellipse(box, fill=255)
    else:
        md.rounded_rectangle(box, radius=int(S * 0.22), fill=255)
    im.paste(field, (0, 0), Image.composite(field.split()[3], Image.new("L", (S, S), 0), mask))
    # anneau or
    w = int(inner * 0.035)
    if round_mask:
        d.ellipse((m + w, m + w, S - m - w, S - m - w), outline=(255, 198, 41, 255), width=w)
    else:
        d.rounded_rectangle((m + w, m + w, S - m - w, S - m - w), radius=int(S * 0.2), outline=(255, 198, 41, 255), width=w)
    # ballon incliné
    ball = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(ball)
    cx, cy = S / 2, S / 2 - inner * 0.04
    bw, bh = inner * 0.62, inner * 0.36
    bd.ellipse((cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), fill=(139, 69, 19, 255), outline=(70, 32, 8, 255), width=int(inner * 0.015))
    lw = int(inner * 0.022)
    bd.line((cx - bw * 0.2, cy, cx + bw * 0.2, cy), fill="white", width=lw)
    for i in range(-2, 3):
        x = cx + i * bw * 0.08
        bd.line((x, cy - bh * 0.14, x, cy + bh * 0.14), fill="white", width=lw)
    for sx in (-0.36, 0.36):
        bd.line((cx + sx * bw, cy - bh * 0.32, cx + sx * bw, cy + bh * 0.32), fill="white", width=lw)
    ball = ball.rotate(28, resample=Image.BICUBIC, center=(cx, cy))
    im.alpha_composite(ball)
    # flèches d'échange
    aw = int(inner * 0.03)
    y1, y2 = m + inner * 0.2, m + inner * 0.8
    d.line((m + inner * 0.3, y1, m + inner * 0.7, y1), fill=(255, 198, 41, 255), width=aw)
    d.polygon([(m + inner * 0.76, y1), (m + inner * 0.66, y1 - inner * 0.06), (m + inner * 0.66, y1 + inner * 0.06)], fill=(255, 198, 41, 255))
    d.line((m + inner * 0.3, y2, m + inner * 0.7, y2), fill="white", width=aw)
    d.polygon([(m + inner * 0.24, y2), (m + inner * 0.34, y2 - inner * 0.06), (m + inner * 0.34, y2 + inner * 0.06)], fill="white")
    return im.resize((size, size), Image.LANCZOS)


def main():
    WEB.mkdir(parents=True, exist_ok=True)
    for s in (192, 512):
        draw_icon(s).save(WEB / f"icon-{s}.png")
    draw_icon(512, pad=0.1).save(WEB / "icon-maskable-512.png")
    dens = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
    for name, s in dens.items():
        out = ANDROID / f"mipmap-{name}"
        out.mkdir(parents=True, exist_ok=True)
        draw_icon(s).save(out / "ic_launcher.png")
        draw_icon(s, round_mask=True).save(out / "ic_launcher_round.png")
        fg = int(s * 108 / 48)
        draw_icon(fg, pad=0.18).save(out / "ic_launcher_foreground.png")
    print("icônes OK")


if __name__ == "__main__":
    main()
