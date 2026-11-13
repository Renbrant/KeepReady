"""Geometry helpers for the KeepReady symbols (512x512 viewBox)."""
import math


def _unit(vx, vy):
    l = math.hypot(vx, vy)
    return vx / l, vy / l


def rounded_polygon(points, radii):
    """SVG path of a convex polygon (clockwise on screen) with rounded corners.
    radii: a single number or one per vertex (0 = sharp corner)."""
    n = len(points)
    if not isinstance(radii, (list, tuple)):
        radii = [radii] * n
    segs = []
    for i in range(n):
        p0 = points[(i - 1) % n]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        r = radii[i]
        if r <= 0:
            segs.append(("L", p1, p1, 0))
            continue
        u1 = _unit(p0[0] - p1[0], p0[1] - p1[1])
        u2 = _unit(p2[0] - p1[0], p2[1] - p1[1])
        cosang = max(-1, min(1, u1[0] * u2[0] + u1[1] * u2[1]))
        ang = math.acos(cosang)
        d = r / math.tan(ang / 2)
        a = (p1[0] + u1[0] * d, p1[1] + u1[1] * d)
        b = (p1[0] + u2[0] * d, p1[1] + u2[1] * d)
        segs.append(("A", a, b, r))
    out = []
    for i, (kind, a, b, r) in enumerate(segs):
        if i == 0:
            out.append(f"M{a[0]:.2f} {a[1]:.2f}")
        else:
            out.append(f"L{a[0]:.2f} {a[1]:.2f}")
        if kind == "A":
            out.append(f"A{r:.2f} {r:.2f} 0 0 1 {b[0]:.2f} {b[1]:.2f}")
    out.append("Z")
    return "".join(out)


def offset_polygon(points, t):
    """Offsets a clockwise (on screen) convex polygon inwards by t > 0."""
    n = len(points)
    lines = []
    for i in range(n):
        p = points[i]
        q = points[(i + 1) % n]
        dx, dy = _unit(q[0] - p[0], q[1] - p[1])
        # inward normal for a clockwise polygon on screen (y points down): (-dy, dx)
        nx, ny = -dy, dx
        lines.append(((p[0] + nx * t, p[1] + ny * t), (dx, dy)))
    out = []
    for i in range(n):
        (p1, d1) = lines[(i - 1) % n]
        (p2, d2) = lines[i]
        # intersection p1 + s*d1 = p2 + u*d2
        det = d1[0] * (-d2[1]) - d1[1] * (-d2[0])
        s = ((p2[0] - p1[0]) * (-d2[1]) - (p2[1] - p1[1]) * (-d2[0])) / det
        out.append((p1[0] + s * d1[0], p1[1] + s * d1[1]))
    return out
