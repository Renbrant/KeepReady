# Logo generator

Python scripts that generate every file in `../logos/`, `../app-icons/` and `../social/`.

| File | Purpose |
|---|---|
| `build.py` | Draws the symbol, logos, app icons and the Open Graph image, then exports the PNGs and `favicon.ico` |
| `geom.py` | Rounded and offset convex polygons (the bucket body) |
| `textpath.py` | Converts text to SVG outlines with HarfBuzz shaping and kerning, so the SVGs need no installed font |

## Requirements

- Python 3 with `fonttools`, `uharfbuzz` and `shapely`: `pip install fonttools uharfbuzz shapely`
- `rsvg-convert` (librsvg) and ImageMagick (`convert`) on the PATH
- Two fonts (both SIL Open Font License, not stored in this repo):
  - **Outfit Bold** as a static `.ttf`. Download `Outfit[wght].ttf` from [google/fonts](https://github.com/google/fonts/tree/main/ofl/outfit), then create the Bold instance:
    `fonttools varLib.instancer "Outfit[wght].ttf" wght=700 -o fonts/Outfit-Bold.ttf`
  - **Inter Medium** (`.otf` or `.ttf`). The script also looks in the usual system font folders.

## Run

```bash
cd brand/source
mkdir -p fonts          # put Outfit-Bold.ttf (and optionally Inter-Medium.otf) here
python3 build.py        # writes ./out/{svg,png,favicon.ico}
python3 build.py /tmp/kit   # or choose another output folder
```

You can point to fonts elsewhere with `OUTFIT_BOLD_TTF=/path/Outfit-Bold.ttf` and `INTER_MEDIUM_OTF=/path/Inter-Medium.otf`.

`out/` and `fonts/` are git-ignored. To publish a new version, copy the results into `../logos/`, `../app-icons/` and `../social/`:

| Generated | Goes to |
|---|---|
| `out/svg/keepready-*.svg` | `../logos/svg/` |
| `out/svg/keepready-app-icon.svg` | `../app-icons/icon.svg` |
| `out/png/icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | `../app-icons/` |
| `out/png/icon-maskable-512.png` | `../app-icons/maskable-512.png` |
| `out/favicon.ico` | `../app-icons/favicon.ico` |
| `out/png/og-image-1200x630.png` | `../social/` |
| the other `out/png/keepready-*.png` and `icon-1024.png` | `../logos/png/` |

## Editing the design

- Colors are in the `C` dictionary at the top of `build.py`. Keep them in sync with `../tokens/keepready-tokens.css`.
- The symbol is one compound SVG path: a rounded bucket body, a handle and a counter-clockwise check shape that becomes a hole under the nonzero fill rule. Its geometry is in the "symbol" section of `build.py`.
- The tagline on the social image is in `og_image()`.
