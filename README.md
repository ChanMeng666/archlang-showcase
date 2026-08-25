# ArchLang Showcase

Every drawing in this repo is **compiled, not drawn** — each one is a few dozen lines of `.arch`
source. Change a line, recompile, get a new building. Famous buildings, TV homes and game maps,
written as text.

Built with [**ArchLang**](https://github.com/ChanMeng666/archlang), a small declarative language
that compiles floor-plan source to professional SVG.
[Docs](https://archlang.uk) · [Playground](https://playground.archlang.uk) ·
[`@chanmeng666/archlang` on npm](https://www.npmjs.com/package/@chanmeng666/archlang)

## Gallery

| Plan | Source | Try it |
| ---- | ------ | ------ |
|      |        |        |

## Reproduce

```bash
npm install
npm run render <slug>      # → plans/<slug>/plan.svg + plan.png
npm run render             # every plan in the repo
npm run permalink <slug>   # → a playground.archlang.uk link with the source in the URL
```

Each plan lives in `plans/<slug>/`: `plan.arch` is the source, everything beside it is generated.
A multi-storey plan also writes one `plan.L<n>.svg` / `plan.L<n>.png` per floor.

`npm run overlay <slug>` adds annotations — routes, numbered beats, a caption — from an
`overlay.json` next to the plan, and writes `plan-annotated.svg` / `.png`. The plan itself is never
modified; the annotation is a single `<g id="overlay">` appended to the SVG.

## Disclaimer

These are original fan-art and illustrative drawings based on publicly available information, made
for demonstration and educational purposes. They are approximations, not measured surveys. This
project is not affiliated with, endorsed by, or sponsored by any rights holder, and uses no official
logos or trademarks. See [LICENSE](LICENSE) for the full notice.
