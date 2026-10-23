# Design system: the reading room

A warm, relaxed look: cozy library meets editorial magazine. Implemented in `src/warm.css`, loaded after the original `src/styles.css`; components are largely unchanged, so function, civic accuracy, privacy behavior and test hooks are preserved.

## Principles
- **Warm paper, not a dashboard.** Cream background (`--cream`), parchment and sage/clay/honey washes, deep pine for structure, terracotta for actions.
- **Real photographs with purpose.** Each part of the site has a "room" photograph (library reading room, Colorado aspens, state capitol, U.S. Capitol, an open book, a farmers market, wildflowers, a writing hand). Photos are warm-graded together, resized (1400 px and 720 px), and credited at `#/credits`.
- **Type for reading.** Fraunces (soft serif) for headings and DM Sans for everything else (two families only; Newsreader was removed in the evidence-first refocus). Fonts are bundled (open-licensed), no external requests.
- **Variety over identical cards.** The home page mixes a full-bleed hero, an arch-framed photo feature, photo and illustrated "rooms" of different sizes, a quote band, promises and a numbered journey.
- **Accessible by default.** Every color pair was contrast-checked (AA), links in running text are underlined, targets are at least 44 px, motion respects `prefers-reduced-motion`, and the audit (axe, WCAG 2.2 A/AA rules) runs on 30+ routes at three widths.

## Tokens (see `:root` in `warm.css`)
`--cream #f7f0e3`, `--paper #fbf7ef`, `--parchment #efe3cd`, `--ink #2e2721`, `--ink-soft #5b4d41`, `--terracotta #a8461f`, `--pine #2b5a4c`, `--honey #d79a2b`, plus sage, clay and honey washes.

## Page headers
`roomFor(section, parts)` in `common-ground.tsx` chooses a photograph; `main[data-room]` styles the first `.page-title` as a photo band with a dark gradient for legibility. The photo address is absolute (CSS custom properties resolve `url()` against the stylesheet).

## Adding or changing a photograph
1. Use only public-domain or freely licensed images (Wikimedia Commons is a good source). Record author, license and source in `src/lib/credits.ts`.
2. Add `<slug>.jpg` (about 1400 px wide) and `<slug>-sm.jpg` (about 720 px) to `public/images/`.
3. Run `npm test` (a test checks every photo is credited and total size stays under 3 MB).

## Illustrations
`src/components/art.tsx`: small line drawings (brand mark, book stack, scroll, speech bubbles, sprig). They are decorative and hidden from assistive technology.
