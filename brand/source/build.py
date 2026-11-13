"""Generates the KeepReady brand kit: symbol, logos, app icons and social image.

Usage:
    python3 build.py [output_dir]          # default: ./out

Environment:
    OUTFIT_BOLD_TTF   path to a static Outfit Bold .ttf   (default: ./fonts/Outfit-Bold.ttf)
    INTER_MEDIUM_OTF  path to Inter Medium (.otf or .ttf)  (default: ./fonts/Inter-Medium.*,
                      then the usual system locations)

Requires: fonttools, uharfbuzz, shapely, rsvg-convert (librsvg) and ImageMagick (`convert`).
"""
import math, os, subprocess, sys, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from geom import rounded_polygon
from textpath import text_path, split_words

OUT = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(HERE, "out")
SVG = f"{OUT}/svg"
PNG = f"{OUT}/png"
for d in (SVG, PNG):
    os.makedirs(d, exist_ok=True)

# ---------- tokens ----------
C = dict(
    bg="#0D0C0B", s1="#151311", s2="#1D1A17", s3="#26221E", line="#2F2A25",
    text="#F5F1EA", muted="#A39A90", dim="#8A8176",
    o300="#FFB16B", o400="#FF9640", o500="#FF7A1A", o600="#E8620A", o700="#C2500A",
    ink="#0D0C0B", o_on_light="#C8480B",
)


def _find_font(env, candidates, name):
    paths = ([os.environ[env]] if os.environ.get(env) else []) + candidates
    for p in paths:
        if os.path.isfile(p):
            return p
    sys.exit(f"{name} not found. Set {env} or put the file in brand/source/fonts/ (see README).")


FONT_DISPLAY = _find_font("OUTFIT_BOLD_TTF", [os.path.join(HERE, "fonts", "Outfit-Bold.ttf")], "Outfit Bold")
FONT_UI = _find_font("INTER_MEDIUM_OTF", [
    os.path.join(HERE, "fonts", "Inter-Medium.otf"), os.path.join(HERE, "fonts", "Inter-Medium.ttf"),
    "/usr/share/fonts/opentype/inter/Inter-Medium.otf", "/usr/share/fonts/truetype/inter/Inter-Medium.ttf",
], "Inter Medium")
CAP = 0.706  # Outfit cap height (in em)


# ---------- symbol ----------
def _u(vx, vy):
    l = math.hypot(vx, vy)
    return vx / l, vy / l


def check_outline(A, B, Cc, w):
    """Closed outline of an A-B-C polyline with thickness w and round caps/joins.
    Returns a counter-clockwise path (so it becomes a hole under the nonzero rule)."""
    h = w / 2
    d1, d2 = _u(B[0] - A[0], B[1] - A[1]), _u(Cc[0] - B[0], Cc[1] - B[1])
    turn = d1[0] * d2[1] - d1[1] * d2[0]
    if turn < 0:  # make sure it turns right
        A, Cc = Cc, A
        d1, d2 = _u(B[0] - A[0], B[1] - A[1]), _u(Cc[0] - B[0], Cc[1] - B[1])
    nL = lambda d: (d[1], -d[0])
    nR = lambda d: (-d[1], d[0])
    add = lambda p, n: (p[0] + n[0] * h, p[1] + n[1] * h)
    # inner intersection (right-hand side)
    p1, p2 = add(B, nR(d1)), add(B, nR(d2))
    det = d1[0] * (-d2[1]) - d1[1] * (-d2[0])
    s = ((p2[0] - p1[0]) * (-d2[1]) - (p2[1] - p1[1]) * (-d2[0])) / det
    I = (p1[0] + s * d1[0], p1[1] + s * d1[1])
    nodes = [add(A, nL(d1)), add(B, nL(d1)), add(B, nL(d2)), add(Cc, nL(d2)),
             add(Cc, nR(d2)), I, add(A, nR(d1))]
    edges = ["L", "A", "L", "A", "L", "L", "A"]  # edge i: nodes[i] -> nodes[i+1]
    # reverse to counter-clockwise
    nodes_r = nodes[::-1]
    edges_r = edges[::-1]
    # after reversing, edge k joins nodes_r[k] -> nodes_r[k+1] and maps to edges[n-1-k-1 ...]
    n = len(nodes)
    seq = []
    for k in range(n):
        i_from = n - 1 - k
        i_to = (i_from - 1) % n
        e = edges[i_to]  # original edge i_to joins nodes[i_to] -> nodes[i_to+1] = nodes[i_from]
        seq.append((nodes[i_from], nodes[i_to], e))
    d = f"M{seq[0][0][0]:.2f} {seq[0][0][1]:.2f}"
    for (_, q, e) in seq:
        if e == "L":
            d += f"L{q[0]:.2f} {q[1]:.2f}"
        else:
            d += f"A{h:.2f} {h:.2f} 0 0 0 {q[0]:.2f} {q[1]:.2f}"
    return d + "Z"


DY = -5  # vertically centers the symbol in the 512 frame


def symbol_d():
    rim = rounded_polygon([(76, 172 + DY), (436, 172 + DY), (436, 226 + DY), (76, 226 + DY)], [27] * 4)
    body = rounded_polygon([(104, 200 + DY), (408, 200 + DY), (370, 456 + DY), (142, 456 + DY)], [0, 0, 40, 40])
    cy = 190 + DY
    handle = (f"M118 {cy}A138 124 0 0 1 394 {cy}L368 {cy}A112 98 0 0 0 144 {cy}Z")
    chk = check_outline((190, 330 + DY), (240, 380 + DY), (330, 286 + DY), 42)
    return rim + body + handle + chk


SYM = symbol_d()
SYM_BOX = (76, 66 + DY - 0, 360, 390)  # x, y, w, h (approx.; top of the handle = 66+DY)


def sym_group(x, y, height, fill):
    """Symbol placed with the visible box's top-left at (x, y) and the given 'height'."""
    s = height / SYM_BOX[3]
    tx = x - SYM_BOX[0] * s
    ty = y - SYM_BOX[1] * s
    return f'<path transform="translate({tx:.3f} {ty:.3f}) scale({s:.5f})" fill="{fill}" d="{SYM}"/>', SYM_BOX[2] * s


def svg_wrap(w, h, body, defs="", extra=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.0f}" height="{h:.0f}"{extra}>'
            f'{defs}{body}</svg>')


def write(path, content):
    with open(path, "w") as f:
        f.write(content)


def png(svg_path, out_path, width=None, height=None, bg=None):
    cmd = ["rsvg-convert", "-o", out_path]
    if width:
        cmd += ["-w", str(width)]
    if height:
        cmd += ["-h", str(height)]
    if bg:
        cmd += ["-b", bg]
    cmd.append(svg_path)
    subprocess.run(cmd, check=True)


GRAD = (f'<defs><linearGradient id="kr-g" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="#FFA855"/><stop offset="1" stop-color="#FF6A10"/></linearGradient></defs>')

# ---------- 1) symbol ----------
write(f"{SVG}/keepready-symbol.svg", svg_wrap(512, 512, f'<path fill="{C["o500"]}" d="{SYM}"/>'))
write(f"{SVG}/keepready-symbol-gradient.svg", svg_wrap(512, 512, f'<path fill="url(#kr-g)" d="{SYM}"/>', GRAD))
write(f"{SVG}/keepready-symbol-white.svg", svg_wrap(512, 512, f'<path fill="#FFFFFF" d="{SYM}"/>'))
write(f"{SVG}/keepready-symbol-black.svg", svg_wrap(512, 512, f'<path fill="#000000" d="{SYM}"/>'))

# ---------- 2) logos with text ----------
def lockup_h(c_sym, c_keep, c_ready, h_sym=140, tracking=-0.015):
    F = 100
    gap = 38
    g, sw = sym_group(0, 0, h_sym, c_sym)
    base = h_sym / 2 + F * CAP / 2
    da, db, w = split_words(FONT_DISPLAY, "Keep", "Ready", F, sw + gap, base, tracking)
    W = sw + gap + w
    body = g + f'<path fill="{c_keep}" d="{da}"/><path fill="{c_ready}" d="{db}"/>'
    return W, h_sym, body


def lockup_v(c_sym, c_keep, c_ready, h_sym=200, tracking=-0.015):
    F = 100
    gap = 46
    da, db, w = split_words(FONT_DISPLAY, "Keep", "Ready", F, 0, 0, tracking)
    W = max(w, 0)
    g, sw = sym_group((W - h_sym * SYM_BOX[2] / SYM_BOX[3]) / 2, 0, h_sym, c_sym)
    base = h_sym + gap + F * CAP
    da, db, w = split_words(FONT_DISPLAY, "Keep", "Ready", F, 0, base, tracking)
    H = base + F * 0.21
    body = g + f'<path fill="{c_keep}" d="{da}"/><path fill="{c_ready}" d="{db}"/>'
    return W, H, body


variants = {
    "dark": (C["o500"], C["text"], C["o500"]),            # dark background
    "light": (C["o_on_light"], C["ink"], C["o_on_light"]),  # light background
}
for name, (cs, ck, cr) in variants.items():
    W, H, b = lockup_h(cs, ck, cr)
    write(f"{SVG}/keepready-logo-horizontal-{name}.svg", svg_wrap(W, H, b))
    W, H, b = lockup_v(cs, ck, cr)
    write(f"{SVG}/keepready-logo-stacked-{name}.svg", svg_wrap(W, H, b))
    da, db, w = split_words(FONT_DISPLAY, "Keep", "Ready", 100, 0, 71, -0.015)
    write(f"{SVG}/keepready-wordmark-{name}.svg",
          svg_wrap(w, 92, f'<path fill="{ck}" d="{da}"/><path fill="{cr}" d="{db}"/>'))

for name, col in (("white", "#FFFFFF"), ("black", "#000000")):
    W, H, b = lockup_h(col, col, col)
    write(f"{SVG}/keepready-logo-horizontal-mono-{name}.svg", svg_wrap(W, H, b))

# ---------- 3) app icons ----------
def app_icon(size=1024, rounded=True, scale=1.0, glow=True):
    """Icon with a warm dark background, an ember glow and the symbol in an orange gradient."""
    S = size
    rx = S * 0.225 if rounded else 0
    sym_h = S * 0.56 * scale
    sym_w = sym_h * SYM_BOX[2] / SYM_BOX[3]
    g, _ = sym_group((S - sym_w) / 2, (S - sym_h) / 2 - S * 0.005, sym_h, "url(#kr-g)")
    defs = (f'<defs><linearGradient id="kr-g" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="#FFA855"/><stop offset="1" stop-color="#FF6A10"/></linearGradient>'
            f'<linearGradient id="kr-bg" x1="0" y1="0" x2="0" y2="1">'
            f'<stop offset="0" stop-color="#1B1714"/><stop offset="1" stop-color="#0D0C0B"/></linearGradient>'
            f'<radialGradient id="kr-glow" cx="0.5" cy="0.62" r="0.55">'
            f'<stop offset="0" stop-color="#FF7A1A" stop-opacity="0.28"/>'
            f'<stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient></defs>')
    body = (f'<rect width="{S}" height="{S}" rx="{rx:.1f}" fill="url(#kr-bg)"/>'
            + (f'<rect width="{S}" height="{S}" rx="{rx:.1f}" fill="url(#kr-glow)"/>' if glow else "")
            + g)
    return svg_wrap(S, S, body, defs)


write(f"{SVG}/keepready-app-icon.svg", app_icon(1024, True, 1.0))
write(f"{SVG}/keepready-app-icon-maskable.svg", app_icon(1024, False, 0.86))
write(f"{SVG}/favicon.svg", app_icon(512, True, 1.18, glow=False))

# ---------- 4) social image (OG 1200x630) ----------
def og_image():
    W, H = 1200, 630
    W_l, H_l, b = lockup_h(C["o500"], C["text"], C["o500"])
    # rescale the lockup to ~800px wide
    sc = 800 / W_l
    lx, ly = (W - 800) / 2, 205
    tag, tw = text_path(FONT_UI, "Keep ready for tomorrow.", 38, 0, 0, 0.0)
    tx = (W - tw) / 2
    defs = (f'<defs><radialGradient id="g" cx="0.5" cy="1.05" r="0.85">'
            f'<stop offset="0" stop-color="#FF7A1A" stop-opacity="0.30"/>'
            f'<stop offset="1" stop-color="#FF7A1A" stop-opacity="0"/></radialGradient></defs>')
    body = (f'<rect width="{W}" height="{H}" fill="{C["bg"]}"/><rect width="{W}" height="{H}" fill="url(#g)"/>'
            f'<g transform="translate({lx} {ly}) scale({sc:.4f})">{b}</g>'
            f'<path fill="{C["muted"]}" transform="translate({tx:.1f} 470)" d="{tag}"/>')
    return svg_wrap(W, H, body, defs)


write(f"{SVG}/keepready-og-image.svg", og_image())

# ---------- 5) PNGs ----------
png(f"{SVG}/keepready-app-icon.svg", f"{PNG}/icon-512.png", 512)
png(f"{SVG}/keepready-app-icon.svg", f"{PNG}/icon-192.png", 192)
png(f"{SVG}/keepready-app-icon.svg", f"{PNG}/icon-1024.png", 1024)
png(f"{SVG}/keepready-app-icon-maskable.svg", f"{PNG}/icon-maskable-512.png", 512)
png(f"{SVG}/keepready-app-icon-maskable.svg", f"{PNG}/icon-maskable-192.png", 192)
png(f"{SVG}/keepready-app-icon-maskable.svg", f"{PNG}/apple-touch-icon.png", 180)
png(f"{SVG}/favicon.svg", f"{PNG}/favicon-32.png", 32)
png(f"{SVG}/favicon.svg", f"{PNG}/favicon-16.png", 16)
png(f"{SVG}/favicon.svg", f"{PNG}/favicon-48.png", 48)
png(f"{SVG}/keepready-og-image.svg", f"{PNG}/og-image-1200x630.png", 1200)
for n in ("horizontal-dark", "stacked-dark"):
    png(f"{SVG}/keepready-logo-{n}.svg", f"{PNG}/keepready-logo-{n}.png", 1600)
for n in ("horizontal-light", "stacked-light"):
    png(f"{SVG}/keepready-logo-{n}.svg", f"{PNG}/keepready-logo-{n}.png", 1600)
png(f"{SVG}/keepready-symbol.svg", f"{PNG}/keepready-symbol-512.png", 512)
subprocess.run(["convert", f"{PNG}/favicon-16.png", f"{PNG}/favicon-32.png", f"{PNG}/favicon-48.png",
                f"{OUT}/favicon.ico"], check=True)
print("kit ok")
