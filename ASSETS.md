# ASSETS

## Policy

The reference website (https://www.comnyang.com/en) does **not** offer its cat
sprites, videos, SVGs, fonts, or other media for public download or reuse — no
license or download terms are published for them. Following the project brief,
**no asset was copied from the reference site**.

## What this project uses instead

| Asset | Source | License / Notes |
| --- | --- | --- |
| Pixel cats (all variants & poses) | Original procedural artwork, rendered at runtime by `src/animations/pixel-cat/sprite.ts` | Authored for this project; no external files |
| Brand cat-face logo | Original inline SVG, `src/components/ui/CatLogo.tsx` | Authored for this project |
| Bouncing paw loader | Original inline SVG, `src/components/ui/PawLoader.tsx` | Authored for this project |
| Particles (hearts, zzz, steam, notes, sparkles) | Drawn in-canvas by `src/animations/pixel-cat/engine.ts` | Authored for this project |
| VT323 font | Google Fonts via `next/font` | SIL Open Font License 1.1 |
| JetBrains Mono font | Google Fonts via `next/font` | SIL Open Font License 1.1 |
| DotGothic16 font | Google Fonts via `next/font` | SIL Open Font License 1.1 |
| Favicon | Original SVG in `src/app/icon.svg` | Authored for this project |

The reference site's custom display font ("Born2bSporty FS") was not
redistributable, so the visually similar open-licensed **VT323** is used for
pixel headings instead.

`public/assets/pets/` is intentionally empty except for a README: the pet
system is fully procedural, so there are no bitmap sprites to ship. If you
later add licensed sprite sheets, place them there and document them in this
file.

## Copy

All marketing copy (EN/KO) in `src/lib/i18n/` is original writing that
describes the same product features in this project's own words.
