#!/usr/bin/env node
/**
 * Annotate a rendered plan — routes, numbered beats, a caption.
 *
 *   node scripts/overlay.mjs <slug>
 *
 * Reads `plans/<slug>/plan.svg` + `plans/<slug>/overlay.json` and writes
 * `plans/<slug>/plan-annotated.svg` and `plan-annotated.png`. The plan itself is
 * never touched: the annotation is a single `<g id="overlay">` injected before
 * the closing `</svg>`, so re-rendering the plan and re-running this script is
 * always safe, and the overlay can be thrown away by deleting one element.
 *
 * ── overlay.json schema ───────────────────────────────────────────────────────
 * {
 *   "paths": [
 *     {
 *       "points": [[x, y], [x, y], …],   // 2+ points, SVG user units (millimetres)
 *       "color":  "#c1121f",             // optional; defaults to the accent
 *       "dash":   true,                  // optional; dashed line (default true)
 *       "arrow":  true,                  // optional; arrowhead on the last segment
 *       "label":  "breach here"          // optional; drawn at the path midpoint
 *     }
 *   ],
 *   "markers": [
 *     { "at": [x, y], "n": 1, "text": "01:00 helicopters insert" }
 *   ],
 *   "note": "text drawn in a caption box at the bottom"
 * }
 *
 * Every key is optional — an empty `{}` produces an untouched copy.
 *
 * COORDINATES are the SVG's own user units, which for an ArchLang drawing are
 * millimetres in plan space: the same numbers you wrote in the `.arch` source.
 * The generated SVG's `viewBox` tells you the visible extent — read it off the
 * top of `plan.svg` and pick coordinates inside it. Every size in the overlay
 * (stroke weight, type size, marker radius) is derived from that viewBox, so an
 * annotation reads the same on a 6-metre studio and a 60-metre aquarium.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";

import { svgToPng } from "./raster.mjs";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const PLANS = join(ROOT, "plans");

/** The one accent colour. Everything in the overlay is this, white, or ink. */
const ACCENT = "#c1121f";
const INK = "#1b1b1f";
const HALO = "#ffffff";

const xml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Trim floats so the output is stable and small. */
const n = (v) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? "0" : String(r);
};

function readViewBox(svg) {
  const m = svg.match(/viewBox="([-\d.eE\s]+)"/);
  if (!m) throw new Error("plan.svg has no viewBox — cannot scale the overlay to it.");
  const [x, y, w, h] = m[1].trim().split(/\s+/).map(Number);
  if (![x, y, w, h].every(Number.isFinite) || w <= 0 || h <= 0) throw new Error(`Unusable viewBox: "${m[1]}"`);
  return { x, y, w, h };
}

/**
 * A text run with a white halo behind it, so it stays readable over poché,
 * furniture and dimension lines alike. `paint-order` puts the stroke under the
 * fill, which is what turns a stroke into a halo rather than an outline.
 */
function haloText(text, x, y, size, { anchor = "start", color = INK, weight = "600" } = {}) {
  return (
    `<text x="${n(x)}" y="${n(y)}" font-size="${n(size)}" font-weight="${weight}" fill="${color}"` +
    ` text-anchor="${anchor}" dominant-baseline="central"` +
    ` stroke="${HALO}" stroke-width="${n(size * 0.28)}" stroke-linejoin="round" paint-order="stroke fill">` +
    `${xml(text)}</text>`
  );
}

/** Arrowhead polygon for the final segment of a polyline. */
function arrowHead(points, size, color) {
  const [px, py] = points[points.length - 2];
  const [qx, qy] = points[points.length - 1];
  const dx = qx - px;
  const dy = qy - py;
  const len = Math.hypot(dx, dy);
  if (len === 0) return "";
  const ux = dx / len;
  const uy = dy / len;
  // Back off along the shaft, then step out to each side.
  const bx = qx - ux * size;
  const by = qy - uy * size;
  const half = size * 0.42;
  const pts = [
    [qx, qy],
    [bx - uy * half, by + ux * half],
    [bx + uy * half, by - ux * half],
  ];
  return `<polygon points="${pts.map(([a, b]) => `${n(a)},${n(b)}`).join(" ")}" fill="${color}"/>`;
}

/** Break `text` into lines of at most `max` characters, on word boundaries. */
function wrap(text, max) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function buildOverlay(svg, spec) {
  const vb = readViewBox(svg);
  const span = Math.max(vb.w, vb.h);

  const stroke = span * 0.0035;
  const size = span * 0.018; // body type
  const radius = size * 1.05; // numbered marker circle

  const out = [`<g id="overlay">`];

  for (const path of spec.paths ?? []) {
    const points = path.points ?? [];
    if (points.length < 2) continue;
    const color = path.color ?? ACCENT;
    const dashed = path.dash !== false;
    const d = points.map(([x, y]) => `${n(x)},${n(y)}`).join(" ");
    out.push(
      `<polyline points="${d}" fill="none" stroke="${color}" stroke-width="${n(stroke)}"` +
        ` stroke-linecap="round" stroke-linejoin="round" opacity="0.9"` +
        (dashed ? ` stroke-dasharray="${n(stroke * 4)} ${n(stroke * 3)}"` : "") +
        `/>`,
    );
    if (path.arrow !== false) out.push(arrowHead(points, stroke * 5, color));
    if (path.label) {
      const mid = points[Math.floor(points.length / 2)];
      out.push(haloText(path.label, mid[0], mid[1] - size * 0.9, size, { anchor: "middle", color }));
    }
  }

  for (const marker of spec.markers ?? []) {
    const [x, y] = marker.at ?? [0, 0];
    out.push(
      `<circle cx="${n(x)}" cy="${n(y)}" r="${n(radius)}" fill="${ACCENT}" stroke="${HALO}" stroke-width="${n(stroke * 0.9)}"/>`,
    );
    out.push(
      `<text x="${n(x)}" y="${n(y)}" font-size="${n(size * 0.95)}" font-weight="700" fill="${HALO}"` +
        ` text-anchor="middle" dominant-baseline="central">${xml(marker.n ?? "")}</text>`,
    );
    if (marker.text) out.push(haloText(marker.text, x + radius * 1.5, y, size));
  }

  // The note gets its own strip BELOW the drawing rather than a box on top of it:
  // an ArchLang sheet already uses its bottom edge for the scale bar and title
  // block, and a caption laid over those hides real information. We grow the
  // viewBox instead — the drawing is untouched, the caption always legible.
  let viewBox = vb;
  if (spec.note) {
    const pad = size * 0.7;
    const lines = wrap(spec.note, 96);
    const lineHeight = size * 1.45;
    const boxH = lines.length * lineHeight + pad * 2;
    const stripH = boxH + size * 1.4;
    viewBox = { ...vb, h: vb.h + stripH };

    const boxW = vb.w * 0.96;
    const boxX = vb.x + (vb.w - boxW) / 2;
    const boxY = vb.y + vb.h + size * 0.7;

    // Opaque ground for the new strip — the plan's own background rect only
    // covers the original box, so without this the strip is transparent.
    out.push(
      `<rect x="${n(vb.x)}" y="${n(vb.y + vb.h)}" width="${n(vb.w)}" height="${n(stripH)}" fill="${HALO}"/>`,
    );
    out.push(
      `<rect x="${n(boxX)}" y="${n(boxY)}" width="${n(boxW)}" height="${n(boxH)}" rx="${n(size * 0.35)}"` +
        ` fill="${HALO}" stroke="${ACCENT}" stroke-width="${n(stroke * 0.7)}"/>`,
    );
    lines.forEach((line, i) => {
      out.push(
        `<text x="${n(boxX + pad)}" y="${n(boxY + pad + lineHeight * (i + 0.5))}" font-size="${n(size * 0.8)}"` +
          ` fill="${INK}" dominant-baseline="central">${xml(line)}</text>`,
      );
    });
  }

  out.push(`</g>`);
  return { overlay: out.join("\n"), viewBox };
}

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/overlay.mjs <slug>");
  process.exit(1);
}

const dir = join(PLANS, slug);
const svgPath = join(dir, "plan.svg");
const specPath = join(dir, "overlay.json");

for (const p of [svgPath, specPath]) {
  if (!existsSync(p)) {
    console.error(`Missing ${p}${p === svgPath ? " — run `npm run render " + slug + "` first." : ""}`);
    process.exit(1);
  }
}

const svg = readFileSync(svgPath, "utf8");
const spec = JSON.parse(readFileSync(specPath, "utf8"));

const close = svg.lastIndexOf("</svg>");
if (close === -1) {
  console.error(`${svgPath} has no closing </svg> tag.`);
  process.exit(1);
}

const { overlay, viewBox } = buildOverlay(svg, spec);

// A note grows the canvas, so the root viewBox has to grow with it.
const withBox = svg.replace(
  /viewBox="[-\d.eE\s]+"/,
  `viewBox="${n(viewBox.x)} ${n(viewBox.y)} ${n(viewBox.w)} ${n(viewBox.h)}"`,
);

const at = withBox.lastIndexOf("</svg>");
const annotated = `${withBox.slice(0, at)}${overlay}\n${withBox.slice(at)}`;

writeFileSync(join(dir, "plan-annotated.svg"), annotated, "utf8");
writeFileSync(join(dir, "plan-annotated.png"), await svgToPng(annotated));

console.log(
  `ok ${slug} — plan-annotated.svg + plan-annotated.png` +
    ` (${(spec.paths ?? []).length} path(s), ${(spec.markers ?? []).length} marker(s)${spec.note ? ", note" : ""})`,
);
