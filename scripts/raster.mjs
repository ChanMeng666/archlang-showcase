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
