# KeepReady Brand Kit (v1)

Logos, app icons, social image and design tokens for KeepReady: a dark look with ember orange.

> Tagline: "Keep ready for tomorrow."

## Concept

- **Symbol:** a rotation bucket with a check cut out. Supplies stored and verified. The bucket is the central unit of the app (sealed buckets, one rotated at a time).
- **Wordmark:** "Keep" in a neutral tone plus "Ready" in orange, set in Outfit Bold. The text is converted to outlines in every SVG, so no font install is needed to use the logos.
- **Color:** ember orange on warm graphite. Orange is the brand and the action, never a status.

## What is in this folder

| Path | Contents |
|---|---|
| `logos/svg/` | Vector logos: horizontal, stacked, symbol, wordmark, in dark, light, white and black versions |
| `logos/png/` | PNG exports of the main logos, the symbol, and a 1024 px app icon |
| `app-icons/` | PWA icons using the same file names as `app/public/icons/`, plus `favicon.ico` |
| `social/` | Open Graph image, 1200x630 |
| `tokens/keepready-tokens.css` | CSS variables for colors, fonts and radii |

## Which logo to use

- Dark background: `keepready-logo-horizontal-dark.svg` (primary) or `keepready-logo-stacked-dark.svg`.
- Light background: the `-light` versions.
- One color only: `keepready-logo-horizontal-mono-white.svg` or `-mono-black.svg` (black works on orange).
- Minimum size: horizontal logo 96 px wide, icon 16 px.
- Clear space: keep a margin of 1/4 of the bucket width around the logo.

## Colors

| Role | Name | Hex |
|---|---|---|
| Brand and actions | Ember 500 (primary) | `#FF7A1A` |
| Highlight, orange text | Ember 400 | `#FF9640` |
| Light ember | Ember 300 | `#FFB16B` |
| Pressed | Ember 600 | `#E8620A` |
| Orange on light backgrounds | Ember 700 | `#C8480B` |
| Background | Graphite | `#0D0C0B` |
| Surface | | `#151311` |
| Card | | `#1D1A17` |
| Raised | | `#26221E` |
| Line | | `#2F2A25` |
| Text | | `#F5F1EA` |
| Secondary text | | `#A39A90` |
| Muted text | | `#8A8176` |
| Categories | Food / Water / Gas | `#FF7A1A` / `#38BDF8` / `#A78BFA` |
| Status | On track / Warning / Critical | `#3DD68C` / `#FACC15` / `#FB7185` |

Rules:

- Status always has an icon and text, never color alone.
- Text on orange is dark (`#0D0C0B`). White on orange is only 2.6:1.
- Contrast on the background: primary text 17.4:1, secondary 7.1:1, muted 5.1:1, orange 7.5:1.

## Typography

- **Outfit** 700/600: headings, large numbers, the brand name.
- **Inter** 400/500/600: body text, lists, labels.
- Scale: number 44/48, heading 24/30, body 16/24, caption 13/18.

Both fonts are open source (SIL Open Font License).

## App icons (PWA)

The files in `app-icons/` use the same names as the current icons in `app/public/icons/`, so they drop in without any code change:

```bash
cp brand/app-icons/{icon.svg,icon-192.png,icon-512.png,maskable-512.png,apple-touch-icon.png} app/public/icons/
```

- `maskable-512.png` fills the whole square and keeps the symbol inside the 80% safe zone.
- `favicon.ico` (16, 32 and 48 px) is optional. `index.html` currently uses `icons/icon.svg` as the favicon.
- `social/og-image-1200x630.png` can be wired with `<meta property="og:image" ...>` once the app has a public URL.

## Relationship to DESIGN_SYSTEM.md

This kit was designed independently of the tokens in [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) and the current app styles, and the two differ:

| | `DESIGN_SYSTEM.md` and current app | This kit |
|---|---|---|
| Brand color | Amber `#F59E0B` | Ember orange `#FF7A1A` |
| Background | Slate `#0B0E14` | Warm graphite `#0D0C0B` |
| Fonts | Inter and JetBrains Mono | Outfit (headings, wordmark) and Inter |
| Warning status | Same amber as the brand | Separate yellow `#FACC15` |

The current `icon.svg` is already a bucket with a check, in amber on slate. This kit keeps that concept and redraws it.

Before the new icons replace the current ones, pick one direction:

1. **Adopt this kit:** update `DESIGN_SYSTEM.md` and `app/src/styles.css` to the tokens above.
2. **Keep the existing palette:** recolor the logo files to amber and slate. All colors are plain `fill` values in the SVGs, so a find-and-replace of the hex codes is enough.
