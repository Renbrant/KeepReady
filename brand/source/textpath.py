import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

_cache = {}
def _load(ttf):
    if ttf not in _cache:
        blob = hb.Blob.from_file_path(ttf)
        face = hb.Face(blob)
        font = hb.Font(face)
        tt = TTFont(ttf)
        _cache[ttf] = (font, tt, tt.getGlyphSet(), face.upem)
    return _cache[ttf]

def text_path(ttf, text, size, x=0, y=0, tracking=0.0, features=None):
    """Returns (d, width). y = baseline. tracking in em (e.g. -0.01)."""
    font, tt, gs, upem = _load(ttf)
    buf = hb.Buffer(); buf.add_str(text); buf.guess_segment_properties()
    hb.shape(font, buf, features or {"kern": True, "liga": False})
    order = tt.getGlyphOrder()
    scale = size / upem
    cx = 0.0
    ds = []
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
        tp = TransformPen(pen, (scale, 0, 0, -scale, x + (cx + pos.x_offset) * scale, y - pos.y_offset * scale))
        gs[name].draw(tp)
        ds.append(pen.getCommands())
        cx += pos.x_advance + tracking * upem
    return "".join(ds), (cx - tracking * upem) * scale

def split_words(ttf, a, b, size, x=0, y=0, tracking=0.0):
    """Lays out a+b with continuous kerning and returns (d_a, d_b, width). Splits at the advance of 'a'."""
    full, w = text_path(ttf, a + b, size, x, y, tracking)
    # go glyph by glyph to split the two parts
    font, tt, gs, upem = _load(ttf)
    buf = hb.Buffer(); buf.add_str(a + b); buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": False})
    order = tt.getGlyphOrder(); scale = size / upem
    cx = 0.0; da = []; db = []
    for i, (info, pos) in enumerate(zip(buf.glyph_infos, buf.glyph_positions)):
        name = order[info.codepoint]
        pen = SVGPathPen(gs, ntos=lambda v: f"{v:.2f}")
        tp = TransformPen(pen, (scale, 0, 0, -scale, x + (cx + pos.x_offset) * scale, y - pos.y_offset * scale))
        gs[name].draw(tp)
        (da if i < len(a) else db).append(pen.getCommands())
        cx += pos.x_advance + tracking * upem
    return "".join(da), "".join(db), (cx - tracking * upem) * scale
