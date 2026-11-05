# Contributing

The easiest contribution is a new building. Ask your AI for one you know (a childhood home, a
landmark, a game map), have it write the `.arch` source, compile it, and send a pull request.
Everything under a plan directory except the hand-written files is generated, so the diff is small.

1. Add `plans/<slug>/plan.arch` and a `README.md` story (see `plans/README.md` for the layout).
2. `npm install`, then `npm run render <slug>`; `npm run overlay <slug>` and `npm run social <slug>`
   if the plan has an `overlay.json` / `social.json`.
3. Capture the CLI output your story quotes (`lint`, `describe`, ...) with the version of
   `@chanmeng666/archlang` pinned in `package.json`, and name that version in the story.
4. Add the slug to a section in `scripts/gallery.mjs`, then `npm run links` and `npm run gallery`.

The checks below must be clean before you open the PR: `npm run links:check`, `npm run doors:check`.

## Reproduce

```bash
npm install
npm run render <slug>      # → plans/<slug>/plan.svg + plan.png
npm run render             # every plan in the repo
npm run permalink <slug>   # → a playground.archlang.uk link with the source in the URL
```

Each plan lives in `plans/<slug>/`: `plan.arch` is the source, everything beside it is generated.
A multi-storey plan also writes one `plan.L<n>.svg` / `plan.L<n>.png` per floor.

`npm run overlay <slug>` adds annotations — routes, numbered beats, highlighted places, a caption —
from an `overlay.json` next to the plan, and writes `plan-annotated.svg` / `.png`. The plan itself is
never modified; the annotation is a single `<g id="overlay">` appended to the SVG. Where a plan has
one, the gallery above shows the annotated drawing instead of the plain one.

## Social kit

Every plan can carry a set of images sized for posting. They are all generated, all deterministic,
and all built from the plan's own source — the drawing on a card is the compiled **vector** output,
framed in place, and the facts under the headline (`24 rooms · 1,568.98 m² · 1 warning`) come from
`describe()` and `lint()` rather than from anyone typing a number.

```bash
npm run social <slug>                 # → plans/<slug>/cover.png  (1600×900)
npm run social <slug> -- --mode code  # → plans/<slug>/code.png   (1600×900)
npm run overlay <slug>                # → plans/<slug>/plan-annotated.png
npm run gallery                       # rebuild the gallery section of this README
```

| Per-plan file | Produces | What it is |
|---|---|---|
| `social.json` | `cover.png` | Headline left, the drawing on a white sheet right, a dark chip of the source tucked into its corner |
| `social.json` with a `code` block | `code.png` | The source alone, set large — for plans where the source *is* the story |
| `overlay.json` | `plan-annotated.png` | The guided tour: routes, numbered beats, highlighted rooms, a caption |
| — | `plan.png` | The plain compiled drawing, from `npm run render` |

Both cards follow the family's light social grammar, the one
[`archcanvas-og.png`](https://archcanvas.uk) sets: warm paper ground, the lockup small in the
top-left, a short two-line headline in near-black, a quiet middot line of facts, the url in plum, and
a white rounded card on the right holding the artifact. The cover adds one thing that reference does
not have and this repository needs — a small dark chip of the actual source, tucked into the card's
bottom-right where the reference tucks its 3D render. That chip is the whole claim in one frame: the
drawing above it was compiled from the text inside it.

### `social.json`

```json
{
  "title": "The West Wing",
  "hook": "The most famous office in the world is an arc, not a polygon.",
  "headline": ["The Oval Office", "is an arc."],
  "features": "{rooms} · {area} · one arc clause · {lint}",
  "url": "archlang.uk/showcase",
  "codeLines": [48, 48],
  "planCrop": { "x": 0.62857, "y": 0.5226, "w": 0.19025, "h": 0.26936 }
}
```

`title`, `hook` and `url` are required; everything else is optional.

- **`headline`** — one or two lines, breaking where you choose. Without it the `hook` is wrapped to
  two lines automatically. Keep both **short**: the headline is set at up to 72px in a 734px column,
  so a line is about **twenty characters**, not eight words. A line that will not fit at the 48px
  floor is refused with the width it needed.
- **`features`** — the middot line. It interpolates `{rooms}` `{area}` `{doors}` `{windows}` `{lint}`
  from `describe()` and `lint()`, so the editorial half can be written by hand while the numbers stay
  derived and can never go stale. Absent, it defaults to `{rooms} · {area} · {lint}`.
- **`codeLines`** — a 1-based inclusive range of `plan.arch` for the chip. A line longer than the
  chip's ~60-character measure **wraps** (between tokens, with a hanging indent, so the highlighting
  survives), which is what lets the chip carry a statement like the West Wing's ninety-character
  `arc` clause. It is still a *teaser*: past twelve wrapped rows it stops being a chip in the corner
  of a card, and the script says so rather than growing.
- **`planCrop`** — the region of the drawing to fit on the sheet, as fractions of `plan.svg`'s own
  `viewBox`. Fractions rather than millimetres, so the framing survives the plan being re-issued at
  another paper size. `null` (or absent) fits the whole sheet. The region is always *fitted*, never
  cropped to fill, so the region you write is exactly the region you get.
- **`code`** — its presence enables `--mode code`. `{ "full": true }` renders the whole source;
  `{ "lines": [from, to] }` renders a range. Absent above, because only `tweet-house` has a source
  short enough to put a whole plan on a card.

### `overlay.json`

`paths` draw routes, `markers` drop numbered beats, `highlights` box a place, and `note` writes a
caption in a strip added *below* the drawing so it never covers the title block. Coordinates are the
SVG's own user units — the millimetres you wrote in the `.arch` source.

```json
{
  "paths": [{ "points": [[x, y], [x, y]], "arrow": true, "label": "breach here" }],
  "markers": [{ "at": [x, y], "n": 1, "text": "01:00 helicopters insert" }],
  "highlights": [
    { "rect": [x, y, w, h], "n": 3, "label": "no windows, dead centre", "side": "above",
      "color": "#8052ff" }
  ],
  "note": "drawn in a caption box at the bottom"
}
```

Two accents, and they mean different things: **red** (`#c1121f`, the default) is the architect's
markup red and reads as *what happened here* — a route, a breach, a movement. **Plum** (`#8052ff`)
is the brand accent and reads as *look at this* — a place the drawing itself is pointing out. A tour
that uses one colour for both is a tour where the reader cannot tell a path from a place. The
caption box takes whichever accent most of the tour's elements carry, so it never argues with them.

The annotated image is **composed, not just annotated**: it crops to the drawing's own layers plus a
small margin, then puts the caption directly beneath. An ArchLang sheet is real paper — an A1 at
1:100 is 84100 × 59400 units whatever the building measures — so an uncropped annotation floats
under a band of nothing. Cropping moves the viewBox only, nothing is deleted, so page furniture
inside the drawing's extent (the north arrow) still draws while the title block out in the margin
does not. The full sheet is what `plan.png` is for.

### Brand and type

Token values are copied from the compiler repo's shared brand block with the token name they came
from noted beside each one. `assets/brand/archlang-wordmark-black.svg` is a byte copy of the shipped
asset; the plum mark is a **fill-swap only**, never edited path data — the lockup carries its mark
fill and its letter fill separately, so the first becomes the light-surface plum and the second
becomes `--ink`. The one dark surface on either card is the code, and that is the point: it is the
only element that is *source* rather than output.

Type is Archivo, Public Sans and IBM Plex Mono, loaded from `@fontsource/*` and rebuilt into
`assets/fonts/` on first run — `scripts/fonts.mjs` unwraps each WOFF back into the plain SFNT that
resvg's font database can read. No system font is ever used, so a card rasterizes identically
everywhere. Those are Latin subsets, so `assertGlyphs()` checks every string against the face's own
`cmap` before drawing it and refuses rather than shipping a tofu box.


## Keeping links and the front door fresh

```bash
npm run links         # rewrite stale playground #z= links in the plan stories from plan.arch
npm run links:check   # fail if any link is stale
npm run doors         # regenerate the README "Try it" block from data/doors.json
npm run doors:check   # fail if the block or the vendored copy drifted
```

`data/doors.json` is a vendored copy of ArchLang's `site-shared/doors.json`; refresh it with
`npm run doors -- --vendor <path to doors.json>`. When the ArchLang checkout sits next to this repo
(`../archlang`), `npm run doors` reads it directly and `doors:check` also compares the two.
