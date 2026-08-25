/**
 * Shared SVG → PNG rasterizer.
 *
 * ArchLang's own PNG backend (`src/backends/png.ts` in the compiler repo) disables
 * system fonts and supplies ONE bundled font — Roboto — as resvg's default family,
 * so text rasterizes identically on every machine no matter what happens to be
 * installed. We mirror that exactly, reading the font out of the installed
 * `@chanmeng666/archlang` package rather than shipping a second copy of it.
 *
 * The one thing we add on top: a fixed output WIDTH and an opaque white ground,
 * because these renders are meant for README embeds and social cards, where a
 * transparent background reads as a hole on a dark page.
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { brandFontFiles } from "./fonts.mjs";

/** Pixel width every showcase PNG is rendered at. */
export const PNG_WIDTH = 1600;

/** resvg's default family — must match the bundled font file below. */
const BUNDLED_FONT_FAMILY = "Roboto";

let fontPathCache = null;

/**
 * Locate `Roboto-Regular.ttf` inside the installed compiler package.
 *
 * The package's `exports` map exposes only `.`, so `./package.json` is not
 * resolvable — we resolve the entry point instead and walk up from `dist/`.
 */
function fontPath() {
  if (fontPathCache) return fontPathCache;
  const entry = fileURLToPath(import.meta.resolve("@chanmeng666/archlang")); // …/dist/index.js
  const distDir = dirname(entry);
  const pkgRoot = dirname(distDir);
  const candidates = [
    join(distDir, "assets", "Roboto-Regular.ttf"), // published tarball layout
    join(pkgRoot, "assets", "fonts", "Roboto-Regular.ttf"), // source checkout layout
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      fontPathCache = p;
      return p;
    }
  }
  throw new Error(
    "Could not find the bundled Roboto-Regular.ttf inside @chanmeng666/archlang — is the package installed?",
  );
}

/**
 * Rasterize an SVG document to a PNG buffer at {@link PNG_WIDTH}, on white.
 * @param {string} svg
 * @param {{ width?: number, background?: string }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function svgToPng(svg, opts = {}) {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    background: opts.background ?? "#ffffff",
    fitTo: { mode: "width", value: opts.width ?? PNG_WIDTH },
    font: {
      fontFiles: [fontPath()],
      loadSystemFonts: false,
      defaultFontFamily: BUNDLED_FONT_FAMILY,
    },
  });
  return resvg.render().asPng();
}

/**
 * The bounding box of everything actually DRAWN in an SVG, in its own user
 * units — the ink, not the page.
 *
 * An ArchLang drawing is issued on a real sheet: an A1 at 1:100 is 84100 x 59400
 * units whatever size the building is, and a 50-metre plan leaves a third of
 * that as margin. Composing anything under such a sheet means composing under a
 * band of nothing, so this is what a tight composition measures against.
 *
 * The one subtlety is that the sheet's own opaque background rect is a visible
 * element, and it covers the whole page by definition — leaving it in would make
 * this function return the page every time. It is removed by VALUE (a white rect
 * whose geometry equals the viewBox) rather than by position, so a change in
 * emission order cannot silently turn the crop back into a no-op.
 *
 * Fonts are loaded because text is ink too: a room label or an annotation can be
 * the outermost thing on the page, and an unresolved glyph contributes nothing.
 *
 * @param {string} svg
 * @returns {Promise<{ x: number, y: number, w: number, h: number }>}
 */
export async function inkBox(svg) {
  const box = svg.match(/viewBox="([-\d.eE\s]+)"/);
  if (!box) throw new Error("Cannot measure an SVG with no viewBox.");
  const [vx, vy, vw, vh] = box[1].trim().split(/\s+/).map(Number);

  const same = (a, b) => Math.abs(a - b) < 0.51;
  const withoutGround = svg.replace(
    /<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="#ffffff"\/>/g,
    (whole, x, y, w, h) => (same(+x, vx) && same(+y, vy) && same(+w, vw) && same(+h, vh) ? "" : whole),
  );

  const { Resvg } = await import("@resvg/resvg-js");
  const measured = new Resvg(withoutGround, {
    font: {
      fontFiles: [fontPath(), ...brandFontFiles()],
      loadSystemFonts: false,
      defaultFontFamily: BUNDLED_FONT_FAMILY,
    },
  }).getBBox();

  // An SVG with nothing in it but its page is a legitimate answer; fall back to
  // the page rather than to a degenerate box.
  if (!measured || measured.width <= 0 || measured.height <= 0) return { x: vx, y: vy, w: vw, h: vh };
  return { x: measured.x, y: measured.y, w: measured.width, h: measured.height };
}

/**
 * Rasterize a social card — a plan drawing wrapped in brand chrome.
 *
 * Same rules as {@link svgToPng}, with the three brand faces added and a
 * transparent ground: a card paints every pixel of its own background, and
 * asking resvg for white underneath would only hide a hole rather than prevent
 * one. Roboto stays the DEFAULT family, so the nested plan's own labels
 * rasterize exactly as they do in `plan.png`; the chrome names its faces
 * explicitly.
 *
 * @param {string} svg
 * @param {{ width?: number }} [opts]
 * @returns {Promise<Buffer>}
 */
export async function renderCard(svg, opts = {}) {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: opts.width ?? PNG_WIDTH },
    font: {
      fontFiles: [fontPath(), ...brandFontFiles()],
      loadSystemFonts: false,
      defaultFontFamily: BUNDLED_FONT_FAMILY,
    },
  });
  return resvg.render().asPng();
}
